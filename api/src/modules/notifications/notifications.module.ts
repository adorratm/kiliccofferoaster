import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NOTIFICATIONS } from '@modules/queues/queue.constants';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { NotificationsController } from '@modules/notifications/notifications.controller';
import { EmailProvider } from '@modules/notifications/providers/email.provider';
import {
  ConsoleWhatsAppProvider,
  MetaWhatsAppProvider,
  WhatsAppProviderRouter,
} from '@modules/notifications/providers/whatsapp.provider';
import { InboxService } from '@modules/notifications/inbox.service';
import { NotifyGateway } from '@modules/notifications/notify.gateway';
import { ExpoPushService } from '@modules/notifications/expo-push.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NOTIFICATIONS }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret') || 'change-me-in-production',
      }),
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    InboxService,
    NotifyGateway,
    ExpoPushService,
    EmailProvider,
    ConsoleWhatsAppProvider,
    MetaWhatsAppProvider,
    WhatsAppProviderRouter,
  ],
  exports: [NotificationsService, InboxService, BullModule],
})
export class NotificationsModule {}
