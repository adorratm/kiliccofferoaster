import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@entities/user.entity';
import { GalleryService } from '@modules/gallery/gallery.service';
import {
  CreateGalleryItemDto,
  UpdateGalleryItemDto,
} from '@modules/gallery/dto/gallery.dto';

@ApiTags('gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Vitrin medya galerisi (Instagram + yüklemeler)' })
  listPublic() {
    return this.galleryService.findPublic();
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/items')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: tüm galeri öğeleri' })
  listAdmin() {
    return this.galleryService.findAllAdmin();
  }

  @Roles(UserRole.ADMIN)
  @Post('admin/items')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: galeriye görsel ekle (S3 URL)' })
  create(@Body() dto: CreateGalleryItemDto) {
    return this.galleryService.createUpload(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch('admin/items/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: galeri öğesi güncelle' })
  update(@Param('id') id: string, @Body() dto: UpdateGalleryItemDto) {
    return this.galleryService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete('admin/items/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: galeri öğesi sil' })
  remove(@Param('id') id: string) {
    return this.galleryService.remove(id);
  }

  @Roles(UserRole.ADMIN)
  @Post('admin/sync-instagram')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Instagram gönderilerini senkronize et' })
  syncInstagram() {
    return this.galleryService.syncInstagram();
  }
}
