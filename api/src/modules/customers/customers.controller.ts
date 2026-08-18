import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomersService } from '@modules/customers/customers.service';
import {
  CustomerQueryDto,
  UpdateCustomerDto,
} from '@modules/customers/dto/customers.dto';
import { Roles } from '@common/decorators/roles.decorator';
import { OPS_ROLES } from '@entities/user.entity';

@ApiTags('customers')
@ApiBearerAuth()
@Roles(...OPS_ROLES)
@Controller('admin/customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Kayıtlı mağaza müşterileri' })
  list(@Query() query: CustomerQueryDto) {
    return this.customers.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Müşteri 360°: profil, adres, sipariş, kargo, iade' })
  getById(@Param('id') id: string) {
    return this.customers.getById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Müşteri hesabını aktif/pasif yap' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customers.update(id, dto);
  }
}
