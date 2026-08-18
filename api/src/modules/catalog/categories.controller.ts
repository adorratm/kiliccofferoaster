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
import { CategoriesService } from '@modules/catalog/categories.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '@modules/catalog/dto/catalog.dto';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { OPS_ROLES } from '@entities/user.entity';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Aktif kategoriler' })
  findAll() {
    return this.categoriesService.findAllPublic();
  }

  @ApiBearerAuth()
  @Roles(...OPS_ROLES)
  @Get('admin/all')
  @ApiOperation({ summary: 'Admin: tüm kategoriler' })
  findAllAdmin() {
    return this.categoriesService.findAllAdmin();
  }

  @ApiBearerAuth()
  @Roles(...OPS_ROLES)
  @Post()
  @ApiOperation({ summary: 'Admin: kategori oluştur' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @ApiBearerAuth()
  @Roles(...OPS_ROLES)
  @Patch(':id')
  @ApiOperation({ summary: 'Admin: kategori güncelle' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(...OPS_ROLES)
  @Delete(':id')
  @ApiOperation({ summary: 'Admin: kategori sil' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Kategori detay (slug)' })
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }
}
