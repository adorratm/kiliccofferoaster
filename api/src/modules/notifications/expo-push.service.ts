import { Injectable, Logger } from '@nestjs/common';

export type ExpoPushMessage = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);

  async send(tokens: string[], message: ExpoPushMessage): Promise<void> {
    if (!tokens.length) return;
    const messages = tokens.map((to) => ({
      to,
      sound: 'default',
      title: message.title,
      body: message.body,
      data: message.data || {},
      channelId: 'default',
    }));
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.warn(`Expo push HTTP ${res.status}: ${text.slice(0, 300)}`);
    }
  }
}
