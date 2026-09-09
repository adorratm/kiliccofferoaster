import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class WholesaleCatalogQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

/** Ortak iletişim alanları (oluştur / güncelle) */
export class WholesaleCatalogContactFieldsDto {
  @ApiPropertyOptional({ description: 'Yetkili kişi' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactPerson?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && String(v).trim() !== '')
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(400)
  address?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  website?: string | null;

  @ApiPropertyOptional({ description: "Instagram kullanıcı adı veya URL" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  instagram?: string | null;
}

export class CreateWholesaleCatalogDto extends WholesaleCatalogContactFieldsDto {
  @ApiPropertyOptional({ description: 'Cari (parties) id' })
  @IsOptional()
  @IsUUID()
  partyId?: string;

  @ApiProperty({ description: 'İşletme adı (cari seçilirse otomatik doldurulabilir)' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  businessName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class WholesaleCatalogPriceInputDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  /** ₺/kg; null veya boş = bu ürün katalogdan çıkarılır */
  @ApiPropertyOptional({
    description: 'Kilogram fiyatı; boşsa satır silinir',
    nullable: true,
  })
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsNumberString()
  price?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  originCountry?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  originRegion?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Tadım notaları; null = ürün notalarını kullan',
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  flavorNotes?: string[] | null;
}

export class UpdateWholesaleCatalogDto extends WholesaleCatalogContactFieldsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  partyId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  businessName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ type: [WholesaleCatalogPriceInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => WholesaleCatalogPriceInputDto)
  prices?: WholesaleCatalogPriceInputDto[];
}
