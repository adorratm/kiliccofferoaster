import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { OPS_ROLES } from '@entities/user.entity';
import { DiagnosticsService } from '@modules/diagnostics/diagnostics.service';
import { CreateMobileClientEventDto } from '@modules/diagnostics/dto/diagnostics.dto';

@ApiTags('diagnostics')
@Controller()
export class DiagnosticsController {
  constructor(private readonly diagnostics: DiagnosticsService) {}

  @Public()
  @Post('mobile/client-events')
  @ApiOperation({
    summary: 'Mobil istemci olayları (PayTR breadcrumb / crash sonrası)',
  })
  create(@Body() dto: CreateMobileClientEventDto) {
    return this.diagnostics.record(dto);
  }

  @Roles(...OPS_ROLES)
  @Get('mobile/client-events')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ops: son mobil istemci olayları' })
  list(@Query('limit') limit?: string) {
    const n = limit ? Number(limit) : 100;
    return this.diagnostics.listRecent(Number.isFinite(n) ? n : 100);
  }
}
