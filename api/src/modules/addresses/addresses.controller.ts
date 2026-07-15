import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AddressesService } from '@modules/addresses/addresses.service';
import {
  CreateAddressDto,
  UpdateAddressDto,
} from '@modules/addresses/dto/addresses.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { User } from '@entities/user.entity';

@ApiTags('addresses')
@ApiBearerAuth()
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'Kullanıcı adresleri' })
  list(@CurrentUser() user: User) {
    return this.addressesService.listForUser(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Adres oluştur' })
  create(@CurrentUser() user: User, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Adres güncelle' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Adres sil' })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.addressesService.remove(id, user.id);
  }
}
