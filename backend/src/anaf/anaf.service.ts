import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';
import * as qs from 'querystring';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnafService {
  private readonly logger = new Logger(AnafService.name);

  constructor(
    private readonly http: HttpService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  buildAuthorizeUrl(tenantId: number): string {
    const state = this.jwt.sign({ tenantId }, { expiresIn: '10m' });

    const params = qs.stringify({
      response_type: 'code',
      client_id: process.env.ANAF_CLIENT_ID,
      redirect_uri: process.env.ANAF_REDIRECT_URI,
      state,
      token_content_type: 'jwt',
    });

    return `${process.env.ANAF_AUTH_URL}?${params}`;
  }

  async handleCallback(code: string, state: string) {
    let payload: { tenantId: number };
    try {
      payload = this.jwt.verify(state);
    } catch {
      throw new BadRequestException('State invalid sau expirat.');
    }

    const tokenResponse = await this.exchangeCodeForToken(code);
    const { access_token, refresh_token, expires_in } = tokenResponse;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    await this.prisma.anafCredential.upsert({
      where: { tenantId: payload.tenantId },
      create: {
        tenantId: payload.tenantId,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
      },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
      },
    });

    return { tenantId: payload.tenantId, expiresAt };
  }

  private async exchangeCodeForToken(code: string) {
    const basicAuth = Buffer.from(
      `${process.env.ANAF_CLIENT_ID}:${process.env.ANAF_CLIENT_SECRET}`,
    ).toString('base64');

    const body = qs.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.ANAF_REDIRECT_URI,
      token_content_type: 'jwt',
    });

    try {
      const response = await firstValueFrom(
        this.http.post(process.env.ANAF_TOKEN_URL as string, body, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`,
          },
        }),
      );
      return response.data;
    } catch (err: any) {
      this.logger.error(
        'Eroare la schimbul code -> token ANAF',
        err?.response?.data || err.message,
      );
      throw new BadRequestException('Nu s-a putut obține token-ul de la ANAF.');
    }
  }

  private async refreshAccessToken(tenantId: number, refreshToken: string) {
    const basicAuth = Buffer.from(
      `${process.env.ANAF_CLIENT_ID}:${process.env.ANAF_CLIENT_SECRET}`,
    ).toString('base64');

    const body = qs.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const response = await firstValueFrom(
      this.http.post(process.env.ANAF_TOKEN_URL as string, body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
      }),
    );

    const { access_token, refresh_token, expires_in } = response.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    return this.prisma.anafCredential.update({
      where: { tenantId },
      data: {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
      },
    });
  }

  /**
   * Returnează un access token valid pentru tenant, reînnoindu-l automat
   * dacă a expirat sau expiră în curând (< 5 minute).
   */
  async getValidAccessToken(tenantId: number): Promise<string> {
    const credential = await this.prisma.anafCredential.findUnique({
      where: { tenantId },
    });

    if (!credential) {
      throw new BadRequestException(
        'Tenant-ul nu are conectat un cont ANAF. Accesează /anaf/authorize pentru a autoriza.',
      );
    }

    const expiresInMs = credential.expiresAt.getTime() - Date.now();
    if (expiresInMs > 5 * 60 * 1000) {
      return credential.accessToken;
    }

    const refreshed = await this.refreshAccessToken(
      tenantId,
      credential.refreshToken,
    );
    return refreshed.accessToken;
  }

  async getStatus(tenantId: number) {
    const credential = await this.prisma.anafCredential.findUnique({
      where: { tenantId },
    });
    if (!credential) return { connected: false };
    return { connected: true, expiresAt: credential.expiresAt };
  }
}
