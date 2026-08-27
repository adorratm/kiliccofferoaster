import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({ example: 'ornek@email.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;
}

export class AppleLoginDto {
  @ApiProperty({ description: 'Apple identityToken (JWT)' })
  @IsString()
  @MinLength(20)
  identityToken!: string;

  /** Apple yalnızca ilk girişte verir; token’da yoksa istemci e-postası kullanılır */
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'ornek@email.com' })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  password!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'ornek@email.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'E-postadaki sıfırlama token’ı' })
  @IsString()
  @MinLength(20)
  @MaxLength(128)
  token!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class ChangePasswordDto {
  /** Yerel şifre yoksa (yalnızca Google) boş bırakılabilir */
  @ApiPropertyOptional({
    description: 'Mevcut şifre — yalnızca hesabında zaten şifre varsa zorunlu',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword?: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}

export class CreateOpsUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string;

  @ApiProperty({ enum: ['staff', 'accountant', 'admin'] })
  @IsIn(['staff', 'accountant', 'admin'])
  role!: 'staff' | 'accountant' | 'admin';
}

export class ListUsersQueryDto {
  @ApiPropertyOptional({
    enum: ['customer', 'staff', 'accountant', 'admin', 'ops'],
  })
  @IsOptional()
  @IsIn(['customer', 'staff', 'accountant', 'admin', 'ops'])
  role?: 'customer' | 'staff' | 'accountant' | 'admin' | 'ops';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  active?: 'true' | 'false';

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class UpdateManagedUserDto {
  @ApiPropertyOptional({
    enum: ['customer', 'staff', 'accountant', 'admin'],
  })
  @IsOptional()
  @IsIn(['customer', 'staff', 'accountant', 'admin'])
  role?: 'customer' | 'staff' | 'accountant' | 'admin';

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

export class CreateAllowlistDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;

  @ApiPropertyOptional({
    description: 'true ise mevcut kullanıcıyı admin yapar',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  promoteUser?: boolean;
}

export class UpdateAllowlistDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
