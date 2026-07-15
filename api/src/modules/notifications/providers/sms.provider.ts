import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type SendSmsInput = {
  to: string;
  body: string;
};

export interface ISmsProvider {
  send(input: SendSmsInput): Promise<{ id?: string }>;
}

@Injectable()
export class ConsoleSmsProvider implements ISmsProvider {
  private readonly logger = new Logger(ConsoleSmsProvider.name);

  async send(input: SendSmsInput): Promise<{ id?: string }> {
    this.logger.log(`[console-sms] to=${input.to} body=${input.body}`);
    return { id: `console-sms-${Date.now()}` };
  }
}

@Injectable()
export class TwilioSmsProvider implements ISmsProvider {
  private readonly logger = new Logger(TwilioSmsProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(input: SendSmsInput): Promise<{ id?: string }> {
    const accountSid = this.config.get<string>('sms.twilioAccountSid');
    const authToken = this.config.get<string>('sms.twilioAuthToken');
    const from = this.config.get<string>('sms.twilioFrom');
    if (!accountSid || !authToken || !from) {
      throw new Error('Twilio credentials eksik');
    }

    // Dynamic import avoids hard failure when unused
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);
    const message = await client.messages.create({
      to: input.to,
      from,
      body: input.body,
    });
    this.logger.log(`Twilio SMS sent: ${message.sid}`);
    return { id: message.sid };
  }
}

@Injectable()
export class NetgsmSmsProvider implements ISmsProvider {
  private readonly logger = new Logger(NetgsmSmsProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(input: SendSmsInput): Promise<{ id?: string }> {
    const usercode = this.config.get<string>('sms.netgsmUsercode');
    const password = this.config.get<string>('sms.netgsmPassword');
    const msgheader = this.config.get<string>('sms.netgsmMsgHeader');
    if (!usercode || !password || !msgheader) {
      throw new Error('Netgsm credentials eksik');
    }

    const phone = input.to.replace(/\D/g, '');
    const params = new URLSearchParams({
      usercode,
      password,
      gsmno: phone,
      message: input.body,
      msgheader,
      dil: 'TR',
    });

    const res = await fetch(
      `https://api.netgsm.com.tr/sms/send/get/?${params.toString()}`,
    );
    const text = await res.text();
    if (!text.startsWith('00') && !text.startsWith('01') && !text.startsWith('02')) {
      throw new Error(`Netgsm hata: ${text}`);
    }
    this.logger.log(`Netgsm SMS ok: ${text}`);
    return { id: text.trim() };
  }
}

@Injectable()
export class SmsProviderRouter implements ISmsProvider {
  private readonly logger = new Logger(SmsProviderRouter.name);
  private readonly provider: ISmsProvider;

  constructor(
    config: ConfigService,
    consoleSms: ConsoleSmsProvider,
    twilioSms: TwilioSmsProvider,
    netgsmSms: NetgsmSmsProvider,
  ) {
    const name = (config.get<string>('sms.provider') || 'console').toLowerCase();
    if (name === 'twilio') {
      this.provider = twilioSms;
    } else if (name === 'netgsm') {
      this.provider = netgsmSms;
    } else {
      this.provider = consoleSms;
    }
    this.logger.log(`SMS provider: ${name}`);
  }

  send(input: SendSmsInput) {
    return this.provider.send(input);
  }
}
