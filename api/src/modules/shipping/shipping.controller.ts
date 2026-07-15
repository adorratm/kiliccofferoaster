import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShippingService } from '@modules/shipping/shipping.service';
import {
  CreateShipmentDto,
  TrackShipmentDto,
  UpdateShippingProviderConfigDto,
} from '@modules/shipping/dto/shipping.dto';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@entities/user.entity';
import { ShippingProviderCode } from '@entities/shipment.entity';

@ApiTags('shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Roles(UserRole.ADMIN)
  @Post('shipments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: kargo oluştur' })
  createShipment(@Body() dto: CreateShipmentDto) {
    return this.shippingService.createShipment(dto);
  }

  @Public()
  @Post('track')
  @ApiOperation({ summary: 'Kargo takip (body)' })
  track(@Body() dto: TrackShipmentDto) {
    return this.shippingService.trackShipment(dto);
  }

  @Public()
  @Get('track/:code')
  @ApiOperation({ summary: 'Kargo takip (tracking no)' })
  trackByCode(@Param('code') code: string) {
    return this.shippingService.trackByCode(code);
  }

  @Public()
  @Get('providers/public')
  @ApiOperation({ summary: 'Açık kargo firmaları (checkout)' })
  listPublicProviders() {
    return this.shippingService.listEnabledProvidersPublic();
  }

  @Roles(UserRole.ADMIN)
  @Get('providers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: kargo sağlayıcı listesi' })
  listProviders() {
    return this.shippingService.listProviderConfigs();
  }

  @Roles(UserRole.ADMIN)
  @Patch('providers/:provider')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: kargo sağlayıcı güncelle' })
  updateProvider(
    @Param('provider') provider: ShippingProviderCode,
    @Body() dto: UpdateShippingProviderConfigDto,
  ) {
    return this.shippingService.updateProviderConfig(provider, dto);
  }
}
