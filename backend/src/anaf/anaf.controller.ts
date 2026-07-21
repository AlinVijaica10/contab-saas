import {
  Controller,
  Get,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import type { Response } from 'express';
import { AnafService } from './anaf.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: { tenantId: number; sub: number; email: string; role: string };
}

@Controller('anaf')
export class AnafController {
  constructor(private readonly anafService: AnafService) {}

  /**
   * Returnează URL-ul de autorizare ca JSON (nu redirect server-side),
   * pentru ca frontend-ul (Angular) să poată face request-ul autentificat
   * (cu header Authorization prin interceptor) și abia apoi să navigheze
   * browser-ul cu window.location.href.
   */
  @UseGuards(JwtAuthGuard)
  @Get('authorize')
  authorize(@Request() req: AuthenticatedRequest) {
    const url = this.anafService.buildAuthorizeUrl(req.user.tenantId);
    return { url };
  }

  /** Callback apelat de ANAF - fără guard, ANAF nu trimite JWT-ul nostru, doar code + state. */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      return res.status(400).send('Lipsesc parametrii code/state de la ANAF.');
    }
    await this.anafService.handleCallback(code, state);
    return res.redirect(`${process.env.FRONTEND_URL}/invoices?anaf=connected`);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  status(@Request() req: AuthenticatedRequest) {
    return this.anafService.getStatus(req.user.tenantId);
  }
}
