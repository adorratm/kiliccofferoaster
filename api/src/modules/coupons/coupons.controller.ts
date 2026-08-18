import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CouponsService } from '@modules/coupons/coupons.service';
import {
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponDto,
} from '@modules/coupons/dto/coupons.dto';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { OPS_ROLES, User } from '@entities/user.entity';

@ApiTags('coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Public()
  @Get('validate')
  @ApiOperation({ summary: 'Kupon kodunu doğrula ve indirim tutarını hesapla' })
  validate(
    @Query() query: ValidateCouponDto,
    @CurrentUser() user?: User,
  ) {
    return this.couponsService.validate(query, user?.id);
  }

  @Roles(...OPS_ROLES)
  @Get('admin/all')
  @ApiBearerAuth()
  listAdmin() {
    return this.couponsService.listAdmin();
  }

  @Roles(...OPS_ROLES)
  @Post()
  @ApiBearerAuth()
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Roles(...OPS_ROLES)
  @Patch(':id')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto);
  }

  @Roles(...OPS_ROLES)
  @Delete(':id')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }
}
