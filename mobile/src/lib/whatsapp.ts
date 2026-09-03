import { Linking } from 'react-native';
import { DEFAULT_CONTACT, type SiteSettings } from './cms';

/** WhatsApp wa.me URL; telefon yoksa null. */
export function buildShopWhatsAppUrl(
  settings: SiteSettings | null | undefined,
  message: string,
): string | null {
  const wa = settings?.whatsapp;
  if (wa && wa.enabled === false) return null;
  const raw =
    wa?.phone?.trim() ||
    settings?.contact?.phone?.trim() ||
    DEFAULT_CONTACT.phone;
  const digits = raw.replace(/\D/g, '').replace(/^0/, '90');
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function openShopWhatsApp(
  settings: SiteSettings | null | undefined,
  message: string,
) {
  const url = buildShopWhatsAppUrl(settings, message);
  if (url) void Linking.openURL(url);
}
