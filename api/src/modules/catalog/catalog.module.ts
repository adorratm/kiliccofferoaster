import { Module } from '@nestjs/common';
import { CategoriesService } from '@modules/catalog/categories.service';
import { ProductsService } from '@modules/catalog/products.service';
import { CategoriesController } from '@modules/catalog/categories.controller';
import { ProductsController } from '@modules/catalog/products.controller';

@Module({
  controllers: [CategoriesController, ProductsController],
  providers: [CategoriesService, ProductsService],
  exports: [CategoriesService, ProductsService],
})
export class CatalogModule {}
