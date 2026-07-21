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
    private readonly anafService: AnafService,
  ) {}

  @Get('status')
  async status(@Request() req: AuthenticatedRequest) {
    const anaf = await this.anafService.getStatus(req.user.tenantId);

    return {
      anaf,
      email: {
        configured: Boolean(
          process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL,
        ),
        senderEmail: process.env.BREVO_SENDER_EMAIL ?? null,
        senderName: process.env.BREVO_SENDER_NAME ?? null,
      },
      // adaugi aici alte integrări viitoare (ex: whatsapp, sms) urmând același format
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
