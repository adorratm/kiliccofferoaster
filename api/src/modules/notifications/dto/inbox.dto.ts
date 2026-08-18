import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PushPlatform } from '@entities/device-push-token.entity';

export class InboxQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 30))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class UpdateNotificationPrefsDto {
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  ordersEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  shippingEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  returnsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  accountEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  opsOrdersEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  opsReturnsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  opsMessagesEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  opsReviewsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  opsStockEnabled?: boolean;
}

export class RegisterDeviceDto {
  @IsString()
  @MaxLength(400)
  token!: string;

  @IsOptional()
  @IsEnum(PushPlatform)
  platform?: PushPlatform;
}

export class UnregisterDeviceDto {
  @IsString()
  @MaxLength(400)
  token!: string;
}
