import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@entities/user.entity';
import {
  CreateWholesaleCatalogDto,
  UpdateWholesaleCatalogDto,
  WholesaleCatalogQueryDto,
} from '@modules/catalog/dto/wholesale-catalog.dto';
import { WholesaleCatalogService } from '@modules/catalog/wholesale-catalog.service';

@ApiTags('wholesale-catalog')
@Controller('wholesale-catalog')
export class WholesaleCatalogController {
  constructor(private readonly service: WholesaleCatalogService) {}

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get('admin')
  @ApiOperation({ summary: 'Admin: toptan katalog listesi (işletme arama)' })
  listAdmin(@Query() query: WholesaleCatalogQueryDto) {
    return this.service.listAdmin(query);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Post('admin')
  @ApiOperation({ summary: 'Admin: işletmeye özel katalog oluştur' })
  create(@Body() dto: CreateWholesaleCatalogDto) {
    return this.service.create(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get('admin/:id')
  @ApiOperation({ summary: 'Admin: katalog detay + fiyat matrisi' })
  getAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getAdminDetail(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Patch('admin/:id')
  @ApiOperation({ summary: 'Admin: katalog / özel fiyatları güncelle' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWholesaleCatalogDto,
  ) {
    return this.service.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Post('admin/:id/regenerate')
  @ApiOperation({
    summary: 'Admin: paylaşım tokenını yenile (eski link geçersiz olur)',
  })
  regenerate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.regenerateToken(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete('admin/:id')
  @ApiOperation({ summary: 'Admin: katalogu sil' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Public()
  @Get(':token')
  @ApiOperation({ summary: 'Token ile toptan kahve kataloğu' })
  getPublic(@Param('token') token: string) {
    return this.service.getPublicCatalog(token);
  }
}
