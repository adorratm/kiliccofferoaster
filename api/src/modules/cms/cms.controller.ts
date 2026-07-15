import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CmsService } from '@modules/cms/cms.service';
import { MediaService } from '@modules/media/media.service';
import {
  BulkSiteSettingsDto,
  CreateContentSectionDto,
  UpdateContentSectionDto,
} from '@modules/cms/dto/cms.dto';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@entities/user.entity';

@ApiTags('cms')
@Controller('cms')
export class CmsController {
  constructor(
    private readonly cmsService: CmsService,
    private readonly mediaService: MediaService,
  ) {}

  @Public()
  @Get('settings')
  @ApiOperation({ summary: 'Yayımlanmış site ayarları' })
  getPublicSettings() {
    return this.cmsService.getPublicSettings();
  }

  @Public()
  @Get('sections')
  @ApiOperation({ summary: 'Yayımlanmış içerik bölümleri' })
  getPublicSections(@Query('page') page?: string) {
    return this.cmsService.getPublicSections(page);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get('admin/settings')
  @ApiOperation({ summary: 'Admin: site ayarları' })
  listSettingsAdmin() {
    return this.cmsService.listSettingsAdmin();
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Patch('admin/settings')
  @ApiOperation({ summary: 'Admin: site ayarlarını toplu güncelle' })
  upsertSettings(@Body() dto: BulkSiteSettingsDto) {
    return this.cmsService.upsertSettings(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get('admin/sections')
  @ApiOperation({ summary: 'Admin: içerik bölümleri' })
  listSectionsAdmin(@Query('page') page?: string) {
    return this.cmsService.listSectionsAdmin(page);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Post('admin/sections')
  @ApiOperation({ summary: 'Admin: içerik bölümü oluştur' })
  createSection(@Body() dto: CreateContentSectionDto) {
    return this.cmsService.createSection(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Patch('admin/sections/:id')
  @ApiOperation({ summary: 'Admin: içerik bölümü güncelle' })
  updateSection(
    @Param('id') id: string,
    @Body() dto: UpdateContentSectionDto,
  ) {
    return this.cmsService.updateSection(id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete('admin/sections/:id')
  @ApiOperation({ summary: 'Admin: içerik bölümü sil' })
  removeSection(@Param('id') id: string) {
    return this.cmsService.removeSection(id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Post('admin/media/upload')
  @ApiOperation({ summary: 'Admin: görsel yükle (S3 veya yerel)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        alt: { type: 'string' },
        folder: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body('alt') alt?: string,
    @Body('folder') folder?: string,
  ) {
    return this.mediaService.upload(file, alt, folder);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get('admin/media')
  @ApiOperation({ summary: 'Admin: medya kütüphanesi' })
  listMedia() {
    return this.mediaService.listAll();
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Delete('admin/media/:id')
  @ApiOperation({ summary: 'Admin: medya sil' })
  removeMedia(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
