import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMobileClientEventDto {
  @IsString()
  @MaxLength(64)
  event!: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  appVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  runtimeVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  updateChannel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  orderNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sessionId?: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}
