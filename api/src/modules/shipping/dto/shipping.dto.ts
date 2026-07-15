import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingProviderCode } from '@entities/shipment.entity';

export class CreateShipmentDto {
  @ApiProperty()
  @IsUUID()
  orderId!: string;

  @ApiProperty({ enum: ShippingProviderCode })
  @IsEnum(ShippingProviderCode)
  provider!: ShippingProviderCode;
}

export class TrackShipmentDto {
  @ApiProperty({ enum: ShippingProviderCode })
  @IsEnum(ShippingProviderCode)
  provider!: ShippingProviderCode;

  @ApiProperty()
  @IsString()
  trackingNumber!: string;
}

export class UpdateShippingProviderConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  credentials?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
