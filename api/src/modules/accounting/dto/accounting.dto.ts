import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PartyType } from '@entities/party.entity';
import {
  EDocumentType,
  InvoiceDirection,
  InvoiceStatus,
} from '@entities/invoice.entity';
import { CashAccountKind } from '@entities/cash-account.entity';
import { CashEntryType } from '@entities/cash-entry.entity';
import { StockMovementType } from '@entities/stock-movement.entity';

export class AccountingQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 50))
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class CreatePartyDto {
  @ApiProperty({ enum: PartyType })
  @IsEnum(PartyType)
  type!: PartyType;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(11)
  taxNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  taxOffice?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEinvoice?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  clientId?: string;
}

export class UpdatePartyDto extends PartialType(CreatePartyDto) {}

export class PartyQueryDto extends AccountingQueryDto {
  @ApiPropertyOptional({ enum: PartyType })
  @IsOptional()
  @IsEnum(PartyType)
  type?: PartyType;
}

export class InvoiceLineInputDto {
  @ApiProperty()
  @IsString()
  @MaxLength(300)
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @ApiPropertyOptional({ example: 'adet' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @ApiProperty({ example: 250 })
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vatRate?: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ enum: InvoiceDirection })
  @IsEnum(InvoiceDirection)
  direction!: InvoiceDirection;

  @ApiPropertyOptional({ enum: EDocumentType })
  @IsOptional()
  @IsEnum(EDocumentType)
  edocumentType?: EDocumentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  partyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiProperty({ example: '2026-08-18' })
  @IsDateString()
  issueDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [InvoiceLineInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineInputDto)
  lines!: InvoiceLineInputDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  clientId?: string;
}

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {}

export class InvoiceQueryDto extends AccountingQueryDto {
  @ApiPropertyOptional({ enum: InvoiceDirection })
  @IsOptional()
  @IsEnum(InvoiceDirection)
  direction?: InvoiceDirection;

  @ApiPropertyOptional({ enum: InvoiceStatus })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  partyId?: string;
}

export class CreateCashAccountDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: CashAccountKind })
  @IsEnum(CashAccountKind)
  kind!: CashAccountKind;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  openingBalance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  clientId?: string;
}

export class UpdateCashAccountDto extends PartialType(CreateCashAccountDto) {}

export class CreateCashEntryDto {
  @ApiProperty()
  @IsUUID()
  accountId!: string;

  @ApiProperty({ enum: CashEntryType })
  @IsEnum(CashEntryType)
  type!: CashEntryType;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: '2026-08-18' })
  @IsDateString()
  entryDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  partyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  clientId?: string;
}

export class CashEntryQueryDto extends AccountingQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class CreateStockMovementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiProperty({ enum: StockMovementType })
  @IsEnum(StockMovementType)
  type!: StockMovementType;

  @ApiProperty()
  @IsInt()
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  clientId?: string;
}

export class StockMovementQueryDto extends AccountingQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  variantId?: string;
}

export class OkcSaleRowDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  externalKey!: string;

  @ApiProperty()
  @IsDateString()
  saleDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiptNo?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  total!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cashAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cardAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  itemCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class ImportOkcDto {
  @ApiProperty({ type: [OkcSaleRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OkcSaleRowDto)
  @ArrayMaxSize(2000)
  rows!: OkcSaleRowDto[];
}

export class SyncMutationDto {
  @ApiProperty()
  @IsString()
  clientId!: string;

  @ApiProperty()
  @IsIn([
    'parties',
    'invoices',
    'cash_accounts',
    'cash_entries',
    'stock_movements',
    'okc_sales',
  ])
  collection!:
    | 'parties'
    | 'invoices'
    | 'cash_accounts'
    | 'cash_entries'
    | 'stock_movements'
    | 'okc_sales';

  @ApiProperty()
  @IsIn(['upsert', 'delete'])
  action!: 'upsert' | 'delete';

  @ApiProperty()
  @IsObject()
  payload!: Record<string, unknown>;

  @ApiProperty()
  @IsString()
  updatedAt!: string;
}

export class SyncPushDto {
  @ApiProperty()
  @IsString()
  deviceId!: string;

  @ApiProperty({ type: [SyncMutationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncMutationDto)
  mutations!: SyncMutationDto[];
}

export class SyncPullDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  since?: string;
}

export class UpdateAccountingSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  companyTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(11)
  vkn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  taxOffice?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8)
  earchivePrefix?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8)
  einvoicePrefix?: string;
}

export class ReportsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  partyId?: string;
}
