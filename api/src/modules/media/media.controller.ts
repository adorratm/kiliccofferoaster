import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { MediaService } from '@modules/media/media.service';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@entities/user.entity';

@ApiTags('media')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
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
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('alt') alt?: string,
    @Body('folder') folder?: string,
  ) {
    return this.mediaService.upload(file, alt, folder);
  }

  @Get()
  @ApiOperation({ summary: 'Admin: medya kütüphanesi' })
  list() {
    return this.mediaService.listAll();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: medya sil' })
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
