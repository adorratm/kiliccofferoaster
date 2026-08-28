import { InitialSchema1770000000000 } from './1770000000000-InitialSchema';
import { AddOrderStockDecremented1774000000000 } from './1774000000000-AddOrderStockDecremented';
import { NotificationChannelWhatsapp1775000000000 } from './1775000000000-NotificationChannelWhatsapp';
import { PasswordResetAndReturnRequests1776000000000 } from './1776000000000-PasswordResetAndReturnRequests';
import { GuestCartDeliveredAtReminders1777000000000 } from './1777000000000-GuestCartDeliveredAtReminders';
import { CampaignsAndRefundAmount1778000000000 } from './1778000000000-CampaignsAndRefundAmount';
import { ProductSeoAndHomeFaq1779000000000 } from './1779000000000-ProductSeoAndHomeFaq';
import { ReplaceUnsplashWithStock1780000000000 } from './1780000000000-ReplaceUnsplashWithStock';
import { AboutPageSections1781000000000 } from './1781000000000-AboutPageSections';
import { AccountingAndCatalog1782000000000 } from './1782000000000-AccountingAndCatalog';
import { InAppNotifications1783000000000 } from './1783000000000-InAppNotifications';
import { FoodRetailCatalog1784000000000 } from './1784000000000-FoodRetailCatalog';
import { CategorySeo1785000000000 } from './1785000000000-CategorySeo';
import { UserIdentities1786000000000 } from './1786000000000-UserIdentities';
import { OpsAccessRequest1787000000000 } from './1787000000000-OpsAccessRequest';
import { GalleryItems1788000000000 } from './1788000000000-GalleryItems';
import { GalleryUrlText1789000000000 } from './1789000000000-GalleryUrlText';
import { ProductGrindAvailability1790000000000 } from './1790000000000-ProductGrindAvailability';
import { LocalSeoWhatsappBlogProducts1791000000000 } from './1791000000000-LocalSeoWhatsappBlogProducts';
import { TurkishCoffeeBlogPosts1792000000000 } from './1792000000000-TurkishCoffeeBlogPosts';
import { MarketplaceTrendyolGoMarket1793000000000 } from './1793000000000-MarketplaceTrendyolGoMarket';

/**
 * Nest rspack build migration glob'larını dist'e kopyalamaz.
 * Sınıfları açıkça bağlayarak bundle'a dahil ederiz (prod migrationsRun için zorunlu).
 */
export const ALL_MIGRATIONS = [
  InitialSchema1770000000000,
  AddOrderStockDecremented1774000000000,
  NotificationChannelWhatsapp1775000000000,
  PasswordResetAndReturnRequests1776000000000,
  GuestCartDeliveredAtReminders1777000000000,
  CampaignsAndRefundAmount1778000000000,
  ProductSeoAndHomeFaq1779000000000,
  ReplaceUnsplashWithStock1780000000000,
  AboutPageSections1781000000000,
  AccountingAndCatalog1782000000000,
  InAppNotifications1783000000000,
  FoodRetailCatalog1784000000000,
  CategorySeo1785000000000,
  UserIdentities1786000000000,
  OpsAccessRequest1787000000000,
  GalleryItems1788000000000,
  GalleryUrlText1789000000000,
  ProductGrindAvailability1790000000000,
  LocalSeoWhatsappBlogProducts1791000000000,
  TurkishCoffeeBlogPosts1792000000000,
  MarketplaceTrendyolGoMarket1793000000000,
];
