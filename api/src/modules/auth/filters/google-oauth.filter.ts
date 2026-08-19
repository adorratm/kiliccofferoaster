import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import {
  customerOauthErrorUrl,
  parseCustomerOauthClient,
} from '@modules/auth/oauth-redirect';

@Catch(UnauthorizedException, ForbiddenException)
export class GoogleOauthFilter implements ExceptionFilter {
  constructor(private readonly config: ConfigService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    if (res.headersSent) {
      return;
    }

    const responseBody = exception.getResponse();
    const fromBody =
      typeof responseBody === 'string'
        ? responseBody
        : typeof responseBody === 'object' &&
            responseBody &&
            'message' in responseBody
          ? String(
              Array.isArray((responseBody as { message: unknown }).message)
                ? (responseBody as { message: string[] }).message[0]
                : (responseBody as { message: string }).message,
            )
          : exception.message || 'Google girişi reddedildi';

    const client = parseCustomerOauthClient(req.query?.state);
    res.redirect(customerOauthErrorUrl(this.config, client, fromBody));
  }
}
