import {
  Body,
  Controller,
  Headers,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { OrdersService } from '@modules/orders/orders.service';
import { IyzicoService } from '@modules/payments/iyzico.service';
import { CreateOrderDto } from '@modules/orders/dto/orders.dto';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { User } from '@entities/user.entity';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly iyzicoService: IyzicoService,
  ) {}

  @Public()
  @Post()
  @ApiBearerAuth()
  @ApiHeader({ name: 'X-Session-Id', required: false })
  @ApiOperation({ summary: 'Sepetten sipariş + iyzico ödeme başlat' })
  async checkout(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: User | undefined,
    @Headers('x-session-id') sessionId?: string,
  ) {
    const order = await this.ordersService.createFromCart(
      dto,
      user?.id,
      sessionId,
    );
    const payment = await this.iyzicoService.initializeCheckout({
      orderId: order.id,
    });
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      token: payment.token,
      paymentPageUrl: payment.paymentPageUrl,
      checkoutFormContent: payment.checkoutFormContent,
      mock: payment.mock ?? false,
    };
  }
}
