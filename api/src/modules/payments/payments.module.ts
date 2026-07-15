import { Module } from '@nestjs/common';
import { IyzicoService } from '@modules/payments/iyzico.service';
import { PaymentsController } from '@modules/payments/payments.controller';
import { NotificationsModule } from '@modules/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PaymentsController],
  providers: [IyzicoService],
  exports: [IyzicoService],
})
export class PaymentsModule {}
