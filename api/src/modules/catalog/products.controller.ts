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
import { ProductsService } from '@modules/catalog/products.service';
import {
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from '@modules/catalog/dto/catalog.dto';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { OPS_ROLES } from '@entities/user.entity';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Ürün listesi (filtre, sıralama, sayfalama)' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAllPublic(query);
  }

  @ApiBearerAuth()
  @Roles(...OPS_ROLES)
  @Get('admin/all')
  @ApiOperation({ summary: 'Admin: ürün listesi' })
  findAllAdmin(@Query() query: ProductQueryDto) {
    return this.productsService.findAllAdmin({
      ...query,
      limit: query.limit ?? 50,
      includeInactive: query.includeInactive ?? true,
    });
  }

  @ApiBearerAuth()
  @Roles(...OPS_ROLES)
  @Get('admin/:id')
  @ApiOperation({ summary: 'Admin: ürün detay (varyantlar dahil)' })
  findOneAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findById(id);
  }

  @ApiBearerAuth()
  @Roles(...OPS_ROLES)
  @Post()
  @ApiOperation({ summary: 'Admin: ürün oluştur' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @ApiBearerAuth()
  @Roles(...OPS_ROLES)
  @Patch(':id')
  @ApiOperation({ summary: 'Admin: ürün güncelle' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(...OPS_ROLES)
  @Delete(':id')
  @ApiOperation({ summary: 'Admin: ürün sil' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Ürün detay (slug)' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}
