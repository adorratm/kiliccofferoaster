import {
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsNumber,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@entities/order.entity';
import {
  ReturnRequestStatus,
  ReturnRequestType,
} from '@entities/return-request.entity';
import { STORE_PICKUP_CODE } from '@common/constants/shipping';

function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

/** En az 10 rakam (TR cep / sabit hat); boş veya sadece boşluk reddedilir. */
const PHONE_DIGITS = /^(?=.*\d.*\d.*\d.*\d.*\d.*\d.*\d.*\d.*\d.*\d)/;

export class AddressPayloadDto {
  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'Ad soyad zorunludur' })
  fullName!: string;

  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'Telefon zorunludur' })
  @MinLength(10, { message: 'Geçerli bir telefon numarası girin' })
  @MaxLength(40)
  @Matches(PHONE_DIGITS, {
    message: 'Geçerli bir telefon numarası girin',
  })
  phone!: string;

  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'İl zorunludur' })
  city!: string;

  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'İlçe zorunludur' })
  district!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimString)
  @IsString()
  neighborhood?: string;

  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'Adres zorunludur' })
  addressLine!: string;

  @ApiProperty()
  @Transform(trimString)
  @IsString()
  postalCode!: string;
}

export class CreateOrderDto {
  @ApiProperty()
  @Transform(trimString)
  @IsEmail({}, { message: 'Geçerli bir e-posta girin' })
  customerEmail!: string;

  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'Ad soyad zorunludur' })
  @MaxLength(160)
  customerName!: string;

  @ApiProperty()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'Telefon zorunludur' })
  @MinLength(10, { message: 'Geçerli bir telefon numarası girin' })
  @MaxLength(40)
  @Matches(PHONE_DIGITS, {
    message: 'Geçerli bir telefon numarası girin',
  })
  customerPhone!: string;

  @ApiPropertyOptional({
    type: AddressPayloadDto,
    description: 'Kargo teslimatı için zorunlu; mağaza tesliminde opsiyonel',
  })
  @ValidateIf((o: CreateOrderDto) => o.shippingProvider !== STORE_PICKUP_CODE)
  @ValidateNested()
  @Type(() => AddressPayloadDto)
  shippingAddress?: AddressPayloadDto;

  @ApiPropertyOptional({ type: AddressPayloadDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressPayloadDto)
  billingAddress?: AddressPayloadDto;

  @ApiPropertyOptional({
    description: `Kargo firması kodu veya "${STORE_PICKUP_CODE}" (mağazadan teslim)`,
  })
  @IsOptional()
  @IsString()
  shippingProvider?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  legalAcceptances?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Kupon kodu' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  couponCode?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsString()
  status!: OrderStatus;
}

export class OrderQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 20))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class GuestOrderLookupDto {
  @ApiProperty({ example: 'KLC-20260716-ABCD' })
  @IsString()
  @MaxLength(40)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  orderNumber!: string;

  @ApiProperty()
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;
}

export class CreateReturnRequestDto {
  @ApiProperty({ enum: ReturnRequestType })
  @IsEnum(ReturnRequestType)
  type!: ReturnRequestType;

  @ApiProperty({ minLength: 10, maxLength: 2000 })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  reason!: string;
}

export class ReviewReturnRequestDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsIn([ReturnRequestStatus.APPROVED, ReturnRequestStatus.REJECTED])
  status!: ReturnRequestStatus.APPROVED | ReturnRequestStatus.REJECTED;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNote?: string;

  /** Kısmi iade tutarı (TRY). Boşsa sipariş toplamı */
  @ApiPropertyOptional({ example: 199.9 })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined
      ? undefined
      : Number(value),
  )
  @IsNumber()
  @Min(0.01)
  refundAmount?: number;
}
