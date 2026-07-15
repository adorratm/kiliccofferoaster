import { Module } from '@nestjs/common';
import { CmsController } from '@modules/cms/cms.controller';
import { CmsService } from '@modules/cms/cms.service';
import { MediaService } from '@modules/media/media.service';

@Module({
  controllers: [CmsController],
  providers: [CmsService, MediaService],
  exports: [CmsService, MediaService],
})
export class CmsModule {}
