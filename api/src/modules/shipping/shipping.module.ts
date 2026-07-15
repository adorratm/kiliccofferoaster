import { Module, forwardRef } from '@nestjs/common';
import { ShippingService } from '@modules/shipping/shipping.service';
import { ShippingController } from '@modules/shipping/shipping.controller';
import {
  YurticiAdapter,
  KolayGelsinAdapter,
  DhlAdapter,
  SuratAdapter,
  PttAdapter,
  HepsijetAdapter,
  TrendyolExpressAdapter,
} from '@modules/shipping/adapters/providers';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { TrackingModule } from '@modules/tracking/tracking.module';

@Module({
  imports: [forwardRef(() => NotificationsModule), TrackingModule],
  controllers: [ShippingController],
  providers: [
    ShippingService,
    YurticiAdapter,
    KolayGelsinAdapter,
    DhlAdapter,
    SuratAdapter,
    PttAdapter,
    HepsijetAdapter,
    TrendyolExpressAdapter,
  ],
  exports: [ShippingService],
})
export class ShippingModule {}
