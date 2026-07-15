import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContactMessageDto {
  @ApiProperty()
  @IsString()
  @MaxLength(160)
  senderName!: string;

  @ApiProperty()
  @IsEmail()
  senderEmail!: string;

  @ApiProperty({ example: 'bilgi' })
  @IsString()
  @MaxLength(60)
  protocolType!: string;

  @ApiProperty()
  @IsString()
  message!: string;
}

export class MarkContactReadDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}

export class NewsletterSubscribeDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  source?: string;
}
