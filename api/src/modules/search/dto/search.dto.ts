import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GlobalSearchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({ default: 8 })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 8))
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}
