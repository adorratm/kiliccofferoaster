import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import {
  BRAND_LOGO_BASE64,
  BRAND_LOGO_CID,
  BRAND_LOGO_CONTENT_TYPE,
  BRAND_LOGO_FILENAME,
} from '@modules/notifications/brand-logo';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;
  private readonly logoAttachment = {
    filename: BRAND_LOGO_FILENAME,
    content: Buffer.from(BRAND_LOGO_BASE64, 'base64'),
    contentType: BRAND_LOGO_CONTENT_TYPE,
    cid: BRAND_LOGO_CID,
    contentDisposition: 'inline' as const,
  };

  constructor(private readonly config: ConfigService) {
    this.from =
      this.config.get<string>('mail.from') ||
      'Kılıç Coffee Roaster <info@kiliccoffeeroaster.com.tr>';

    const host = this.config.get<string>('mail.host') || '';
    const user = this.config.get<string>('mail.user') || '';
    const pass = this.config.get<string>('mail.pass') || '';
    const port = this.config.get<number>('mail.port') || 587;
    const secure = this.config.get<boolean>('mail.secure') === true;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      this.logger.log(
        `SMTP e-posta hazır: ${host}:${port} (from=${this.from})`,
      );
    } else {
      this.transporter = null;
      this.logger.warn(
        'SMTP ayarları yok (MAIL_HOST / MAIL_USER / MAIL_PASS) — e-postalar konsola yazılacak',
      );
    }
  }

  async send(input: SendEmailInput): Promise<{ id?: string }> {
    const wantsLogo =
      typeof input.html === 'string' &&
      input.html.includes(`cid:${BRAND_LOGO_CID}`);

    if (!this.transporter) {
      this.logger.log(
        `[console-email] to=${input.to} subject=${input.subject}\n${input.text || input.html}`,
      );
      return { id: `console-${Date.now()}` };
    }

    const info = await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      // Gmail uzak URL / data-URI’yi sık kırar; CID inline attachment güvenilir
      attachments: wantsLogo ? [this.logoAttachment] : undefined,
    });

    this.logger.log(`E-posta gönderildi: ${info.messageId} → ${input.to}`);
    return { id: info.messageId };
  }
}
