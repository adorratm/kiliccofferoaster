import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IyzicoService } from '@modules/payments/iyzico.service';
import { PaytrService } from '@modules/payments/paytr.service';
import { RevenuecatService } from '@modules/payments/revenuecat.service';
import {
  InitializePaymentDto,
  RetryPaymentDto,
  RevenuecatConfirmDto,
} from '@modules/payments/dto/payments.dto';
import { User } from '@entities/user.entity';

export type PaymentProviderName = 'paytr' | 'iyzico' | 'revenuecat';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly config: ConfigService,
    private readonly paytr: PaytrService,
    private readonly iyzico: IyzicoService,
    private readonly revenuecat: RevenuecatService,
  ) {}

  activeProvider(): PaymentProviderName {
    const configured = (
      this.config.get<string>('payment.provider') || ''
    ).toLowerCase();
    if (configured === 'iyzico') return 'iyzico';
    if (configured === 'paytr') return 'paytr';
    // Otomatik: PayTR bilgileri varsa PayTR, yoksa iyzico
    if (this.paytr.isConfigured()) return 'paytr';
    return 'iyzico';
  }

  initializeCheckout(dto: InitializePaymentDto, userIp?: string) {
    if (this.activeProvider() === 'paytr') {
      return this.paytr.initializeCheckout(dto, userIp);
    }
    return this.iyzico.initializeCheckout(dto);
  }

  retryCheckout(dto: RetryPaymentDto, user?: User | null, userIp?: string) {
    if (this.activeProvider() === 'paytr') {
      return this.paytr.retryCheckout(dto, user, userIp);
    }
    return this.iyzico.retryCheckout(dto, user);
  }

  initializeRevenuecatCheckout(dto: InitializePaymentDto) {
    return this.revenuecat.initializeCheckout(dto);
  }

  confirmRevenuecatPurchase(dto: RevenuecatConfirmDto) {
    return this.revenuecat.confirmPurchase(dto);
  }

  handleRevenuecatWebhook(body: Record<string, unknown>, authHeader?: string) {
    return this.revenuecat.handleWebhook(body, authHeader);
  }

  revenuecatClientStatus() {
    return this.revenuecat.clientStatus();
  }

  abandonRevenuecatOrder(orderId: string) {
    return this.revenuecat.abandonOrder(orderId);
  }
}
