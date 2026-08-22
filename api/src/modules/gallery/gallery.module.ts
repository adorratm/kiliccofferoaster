import { Module } from '@nestjs/common';
import { GalleryService } from '@modules/gallery/gallery.service';
import { GalleryController } from '@modules/gallery/gallery.controller';
import { InstagramService } from '@modules/gallery/instagram.service';

@Module({
  controllers: [GalleryController],
  providers: [GalleryService, InstagramService],
  exports: [GalleryService],
})
export class GalleryModule {}
