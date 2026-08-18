import { Module } from '@nestjs/common';
import { ContactService } from '@modules/contact/contact.service';
import { ContactController } from '@modules/contact/contact.controller';
import { NotificationsModule } from '@modules/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
