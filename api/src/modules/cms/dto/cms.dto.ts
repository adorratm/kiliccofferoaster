import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UploadMediaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  alt?: string;

  @ApiPropertyOptional({ default: 'media' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  folder?: string;
}

export class UpsertSiteSettingDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  key!: string;

  @ApiProperty()
  @IsObject()
  value!: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class BulkSiteSettingsDto {
  @ApiProperty({ type: [UpsertSiteSettingDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertSiteSettingDto)
  settings!: UpsertSiteSettingDto[];
}

export class CreateContentSectionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(80)
  page!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  sectionKey!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty()
  @IsObject()
  content!: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateContentSectionDto extends PartialType(
  CreateContentSectionDto,
) {}
