import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { EmailService } from '../email/email.service';
import { AnafService } from '../anaf/anaf.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsEmail } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedRequest extends ExpressRequest {
  user: { tenantId: number; sub: number; email: string; role: string };
}

class TestEmailDto {
  @IsEmail()
  to: string;
}

/**
 * Punct central pentru starea integrărilor externe (ANAF, email, și ce se
 * adaugă în viitor). Cheile API rămân în .env, pe server - aici doar
 * raportăm status și oferim acțiuni sigure (conectare OAuth, test trimitere).
 */
@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
    private readonly anafService: AnafService,
  ) {}

  @Get('status')
  async status(@Request() req: AuthenticatedRequest) {
    const anaf = await this.anafService.getStatus(req.user.tenantId);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
    });

    const senderEmail =
      tenant?.brevoSenderEmail || process.env.BREVO_SENDER_EMAIL;
    const senderName = tenant?.brevoSenderName || process.env.BREVO_SENDER_NAME;

    return {
      anaf,
      email: {
        configured: Boolean(
          (tenant?.brevoApiKey || process.env.BREVO_API_KEY) && senderEmail,
        ),
        senderEmail: senderEmail ?? null,
        senderName: senderName ?? null,
      },
    };
  }

  @Post('email/test')
  async testEmail(@Body() dto: TestEmailDto) {
    const sent = await this.emailService.sendEmail(
      dto.to,
      'Email de test - VJA Conta',
      '<p>Acesta este un email de test trimis din pagina de Integrări. Dacă îl vezi, configurarea Brevo funcționează corect.</p>',
    );
    if (!sent) {
      throw new BadRequestException(
        'Trimiterea a eșuat. Verifică BREVO_API_KEY și BREVO_SENDER_EMAIL în .env, apoi consultă log-urile serverului.',
      );
    }
    return { success: true };
  }
}
