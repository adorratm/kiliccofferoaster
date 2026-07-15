import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchService } from '@modules/search/search.service';
import { GlobalSearchDto } from '@modules/search/dto/search.dto';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@entities/user.entity';

@ApiTags('search')
@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Genel arama (ürün, içerik, yasal)' })
  searchPublic(@Query() query: GlobalSearchDto) {
    return this.searchService.searchPublic(query.q || '', query.limit ?? 8);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @Get('admin/search')
  @ApiOperation({ summary: 'Admin global arama' })
  searchAdmin(@Query() query: GlobalSearchDto) {
    return this.searchService.searchAdmin(query.q || '', query.limit ?? 8);
  }
}
