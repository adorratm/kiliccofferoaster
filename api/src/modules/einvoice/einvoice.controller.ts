import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { OPS_ROLES } from '@entities/user.entity';
import { EinvoiceService } from '@modules/einvoice/einvoice.service';

@ApiTags('einvoice')
@ApiBearerAuth()
@Roles(...OPS_ROLES)
@Controller('einvoice')
export class EinvoiceController {
  constructor(private readonly einvoice: EinvoiceService) {}

  @Get('taxpayer/:vkn')
  @ApiOperation({ summary: 'VKN e-fatura mükellefi sorgusu' })
  check(@Param('vkn') vkn: string) {
    return this.einvoice.checkTaxpayer(vkn);
  }

  @Get('inbox')
  @ApiOperation({ summary: 'Gelen e-fatura kutusu' })
  inbox() {
    return this.einvoice.listInbox();
  }

  @Get('status/:ettn')
  @ApiOperation({ summary: 'e-belge durum sorgusu' })
  status(@Param('ettn') ettn: string) {
    return this.einvoice.fetchStatus(ettn);
  }
}
