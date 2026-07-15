import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IyzicoService } from '@modules/payments/iyzico.service';
import {
  InitializePaymentDto,
  PaymentCallbackDto,
} from '@modules/payments/dto/payments.dto';
import { Public } from '@common/decorators/public.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly iyzicoService: IyzicoService) {}

  @Post('initialize')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'iyzico checkout form başlat' })
  initialize(@Body() dto: InitializePaymentDto) {
    return this.iyzicoService.initializeCheckout(dto);
  }

  @Public()
  @Post('callback')
  @ApiOperation({ summary: 'iyzico ödeme callback / webhook' })
  callback(@Body() dto: PaymentCallbackDto) {
    return this.iyzicoService.handleCallback(dto);
  }
}
