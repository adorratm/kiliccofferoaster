import { Module, forwardRef } from '@nestjs/common';
import { IyzicoService } from '@modules/payments/iyzico.service';
import { PaytrService } from '@modules/payments/paytr.service';
import { RevenuecatService } from '@modules/payments/revenuecat.service';
import { PaymentsService } from '@modules/payments/payments.service';
import { PaymentFulfillmentService } from '@modules/payments/payment-fulfillment.service';
import { PaymentsController } from '@modules/payments/payments.controller';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { CatalogModule } from '@modules/catalog/catalog.module';
import { CartModule } from '@modules/cart/cart.module';
import { CouponsModule } from '@modules/coupons/coupons.module';
import { AccountingModule } from '@modules/accounting/accounting.module';

@Module({
  imports: [
    NotificationsModule,
    CatalogModule,
    CartModule,
    CouponsModule,
    forwardRef(() => AccountingModule),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentFulfillmentService,
    IyzicoService,
    PaytrService,
    RevenuecatService,
    PaymentsService,
  ],
  exports: [PaymentsService, IyzicoService, PaytrService, RevenuecatService],
})
export class PaymentsModule {}
