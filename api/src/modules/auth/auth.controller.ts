import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '@modules/auth/auth.service';
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  CreateOpsUserDto,
  AppleLoginDto,
} from '@modules/auth/dto/auth.dto';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { User, UserRole } from '@entities/user.entity';
import { Roles } from '@common/decorators/roles.decorator';
import { GoogleAdminOauthFilter } from '@modules/auth/filters/google-admin-oauth.filter';
import { GoogleOauthFilter } from '@modules/auth/filters/google-oauth.filter';
import {
  oauthSuccessUrl,
  parseCustomerOauthClient,
  parseOauthClient,
} from '@modules/auth/oauth-redirect';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'E-posta/şifre ile kayıt' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'E-posta/şifre ile giriş' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('ops-login')
  @ApiOperation({ summary: 'Masaüstü / ops e-posta girişi (staff, accountant, admin)' })
  opsLogin(@Body() dto: LoginDto) {
    return this.authService.opsLogin(dto);
  }

  @Public()
  @Post('ops-register')
  @ApiOperation({
    summary:
      'Masaüstü kayıt: müşteri hesabı + personel talebi (allowlist → admin)',
  })
  opsRegister(@Body() dto: RegisterDto) {
    return this.authService.opsRegister(dto);
  }

  @Get('ops-access-requests')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: bekleyen personel erişim talepleri' })
  listOpsAccessRequests() {
    return this.authService.listOpsAccessRequests();
  }

  @Post('ops-access-requests/:id/approve')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: personel erişimini onayla (staff)' })
  approveOpsAccess(
    @Param('id') id: string,
    @Body() body: { role?: 'staff' | 'accountant' } = {},
  ) {
    const role =
      body?.role === 'accountant' ? UserRole.ACCOUNTANT : UserRole.STAFF;
    return this.authService.approveOpsAccess(id, role);
  }

  @Post('ops-access-requests/:id/reject')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: personel erişim talebini reddet' })
  rejectOpsAccess(@Param('id') id: string) {
    return this.authService.rejectOpsAccess(id);
  }

  @Post('ops-users')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: staff / accountant hesabı oluştur' })
  createOpsUser(@Body() dto: CreateOpsUserDto) {
    return this.authService.createOpsUser({
      ...dto,
      role: dto.role === 'accountant' ? UserRole.ACCOUNTANT : UserRole.STAFF,
    });
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({
    summary:
      'Şifre sıfırlama / belirleme e-postası (Google hesapları dahil)',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Token ile yeni şifre belirle' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Oturum açıkken şifre değiştir' })
  changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Oturumdaki kullanıcı' })
  me(@CurrentUser() user: User) {
    return this.authService.me(user.id);
  }

  @Delete('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Müşteri hesabını kapat (KVKK / mağaza şartı)' })
  deleteMe(@CurrentUser() user: User) {
    return this.authService.deleteAccount(user.id);
  }

  @Public()
  @Post('apple')
  @ApiOperation({ summary: 'Sign in with Apple (iOS identity token)' })
  appleLogin(@Body() dto: AppleLoginDto) {
    return this.authService.loginWithApple(dto);
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth başlat' })
  googleAuth() {
    return;
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @UseFilters(GoogleOauthFilter)
  @ApiOperation({ summary: 'Google OAuth callback' })
  googleCallback(@Req() req: Request, @Res() res: Response) {
    const client = parseCustomerOauthClient(req.query?.state);
    this.redirectWithToken(req.user as User, res, client);
  }

  @Public()
  @Get('google/admin')
  @UseGuards(AuthGuard('google-admin'))
  @ApiOperation({ summary: 'Admin Google OAuth başlat' })
  googleAdminAuth() {
    return;
  }

  @Public()
  @Get('google/admin/callback')
  @UseGuards(AuthGuard('google-admin'))
  @UseFilters(GoogleAdminOauthFilter)
  @ApiOperation({ summary: 'Admin Google OAuth callback' })
  googleAdminCallback(@Req() req: Request, @Res() res: Response) {
    if (res.headersSent) {
      return;
    }
    const client = parseOauthClient(req.query?.state);
    this.redirectWithToken(req.user as User, res, client === 'admin' ? 'admin' : client);
  }

  private redirectWithToken(
    user: User,
    res: Response,
    target: 'frontend' | 'admin' | 'mobile' | 'web',
  ): void {
    if (res.headersSent) {
      return;
    }
    const { accessToken } = this.authService.buildAuthResponse(user);
    if (target === 'mobile' || target === 'web') {
      res.redirect(oauthSuccessUrl(this.config, target, accessToken));
      return;
    }
    const base =
      target === 'admin'
        ? this.config.get<string>('adminUrl') || 'http://localhost:3001'
        : this.config.get<string>('frontendUrl') || 'http://localhost:3000';
    const url = `${base}/auth/callback?token=${encodeURIComponent(accessToken)}`;
    res.redirect(url);
  }
}
