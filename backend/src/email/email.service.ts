import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey = process.env.BREVO_API_KEY;
  private readonly senderEmail = process.env.BREVO_SENDER_EMAIL;
  private readonly senderName = process.env.BREVO_SENDER_NAME ?? 'ContaSaaS';

  async sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.error('BREVO_API_KEY nu este configurat.');
      return false;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          sender: { name: this.senderName, email: this.senderEmail },
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
