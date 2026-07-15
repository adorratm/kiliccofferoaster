import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('mail.resendApiKey') || '';
    this.from =
      this.config.get<string>('mail.from') ||
      'Kılıç Coffee <onboarding@resend.dev>';
    this.resend = apiKey ? new Resend(apiKey) : null;
    if (!this.resend) {
      this.logger.warn(
        'RESEND_API_KEY yok — e-postalar konsola yazılacak (ücretsiz fallback)',
      );
    }
  }

  async send(input: SendEmailInput): Promise<{ id?: string }> {
    if (!this.resend) {
      this.logger.log(
        `[console-email] to=${input.to} subject=${input.subject}\n${input.text || input.html}`,
      );
      return { id: `console-${Date.now()}` };
    }

    const result = await this.resend.emails.send({
      from: this.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return { id: result.data?.id };
  }
}
