import { Module } from '@nestjs/common';
import { SearchService } from '@modules/search/search.service';
import { SearchController } from '@modules/search/search.controller';

@Module({
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
