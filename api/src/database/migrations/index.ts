import { InitialSchema1770000000000 } from './1770000000000-InitialSchema';
import { AddOrderStockDecremented1774000000000 } from './1774000000000-AddOrderStockDecremented';
import { NotificationChannelWhatsapp1775000000000 } from './1775000000000-NotificationChannelWhatsapp';
import { PasswordResetAndReturnRequests1776000000000 } from './1776000000000-PasswordResetAndReturnRequests';
import { GuestCartDeliveredAtReminders1777000000000 } from './1777000000000-GuestCartDeliveredAtReminders';
import { CampaignsAndRefundAmount1778000000000 } from './1778000000000-CampaignsAndRefundAmount';
import { ProductSeoAndHomeFaq1779000000000 } from './1779000000000-ProductSeoAndHomeFaq';
import { ReplaceUnsplashWithStock1780000000000 } from './1780000000000-ReplaceUnsplashWithStock';

/**
 * Webpack Nest build migration glob'larını dist'e kopyalamaz.
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
];
