import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService,
  ) {}

  private async getCredentials() {
    const tenantId = this.cls.get('tenantId');
    const tenant = tenantId
      ? await this.prisma.tenant.findUnique({ where: { id: tenantId } })
      : null;

    return {
      apiKey: tenant?.brevoApiKey || process.env.BREVO_API_KEY,
      senderEmail: tenant?.brevoSenderEmail || process.env.BREVO_SENDER_EMAIL,
      senderName:
        tenant?.brevoSenderName || process.env.BREVO_SENDER_NAME || 'VJA Conta',
    };
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
  ): Promise<boolean> {
    const { apiKey, senderEmail, senderName } = await this.getCredentials();

    if (!apiKey || !senderEmail) {
      this.logger.error(
        'Brevo API key sau sender email lipsă pentru acest tenant.',
      );
      return false;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Eroare trimitere email către ${to}: ${errorBody}`);
        return false;
      }

      return true;
    } catch (err) {
      this.logger.error(`Excepție la trimiterea email-ului către ${to}`, err);
      return false;
    }
  }
}
