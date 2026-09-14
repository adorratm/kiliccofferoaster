import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { MarketplaceService } from '@modules/marketplace/marketplace.service';

/**
 * Hepsiburada merchant webhook alıcısı.
 *
 * Developer portalde merchant base URL olarak şunu verin:
 *   `{API_PUBLIC_URL}/marketplace/webhooks/hepsiburada`
 *
 * HB şu path'leri çağırır:
 *   PUT .../packages/{packageNumber}/intransit
 *   PUT .../packages/{packageNumber}/deliver
 *   PUT .../packages/{packageNumber}/undeliver
 *
 * Opsiyonel: `HEPSIBURADA_WEBHOOK_SECRET` → query `?secret=` veya header `x-webhook-secret`
 */
@ApiTags('marketplace-webhooks')
@Controller('marketplace/webhooks/hepsiburada')
export class MarketplaceWebhookController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Public()
  @Put('packages/:packageNumber/:event')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Hepsiburada paket durumu webhook (intransit/deliver/undeliver)',
  })
  async packageEvent(
    @Param('packageNumber') packageNumber: string,
    @Param('event') event: string,
    @Body() body: Record<string, unknown>,
    @Query('secret') secretQuery?: string,
    @Headers('x-webhook-secret') secretHeader?: string,
  ) {
    await this.marketplaceService.handleHepsiburadaPackageWebhook(
      packageNumber,
      event,
      body || {},
      secretHeader || secretQuery,
    );
  }
}
