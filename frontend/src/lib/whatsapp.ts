/** Varsayılan iş hattı (kurumsal WA yokken / contact.phone boşken). */
export const DEFAULT_WHATSAPP_PHONE = "+90 541 214 79 63";

export type WhatsAppPreset = {
  label: string;
  message: string;
};

export type WhatsAppSettings = {
  enabled: boolean;
  /** Boşsa contact.phone kullanılır */
  phone: string;
  greeting: string;
  presets: WhatsAppPreset[];
};

export const DEFAULT_WHATSAPP_SETTINGS: WhatsAppSettings = {
  enabled: true,
  phone: "",
  greeting:
    "Merhaba — Kılıç Coffee Roaster. Size nasıl yardımcı olabiliriz?",
  presets: [
    {
      label: "Sipariş durumu",
      message:
        "Merhaba, sipariş durumum hakkında bilgi almak istiyorum.",
    },
    {
      label: "Kavrum önerisi",
      message:
        "Merhaba, damak zevkime / demleme yöntemime uygun kavrum önerisi alabilir miyim?",
    },
    {
      label: "Toptan / işletme",
      message:
        "Merhaba, toptan / işletme siparişi hakkında bilgi almak istiyorum.",
    },
    {
      label: "Kargo & teslimat",
      message:
        "Merhaba, kargo süresi ve teslimat seçenekleri hakkında yazıyorum.",
    },
    {
      label: "Başka bir konu",
      message: "Merhaba, Kılıç Coffee Roaster hakkında yazıyorum.",
    },
  ],
};

export function normalizeWhatsAppPresets(
  value: unknown,
): WhatsAppPreset[] {
  if (!Array.isArray(value)) return DEFAULT_WHATSAPP_SETTINGS.presets;
  const items = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { label?: unknown; message?: unknown };
      const label = typeof row.label === "string" ? row.label.trim() : "";
      const message =
        typeof row.message === "string" ? row.message.trim() : "";
      if (!label || !message) return null;
      return { label, message };
    })
    .filter((item): item is WhatsAppPreset => item !== null);
  return items.length ? items : DEFAULT_WHATSAPP_SETTINGS.presets;
}

export function mergeWhatsAppSettings(
  raw: unknown,
): WhatsAppSettings {
  const base = DEFAULT_WHATSAPP_SETTINGS;
  if (!raw || typeof raw !== "object") return { ...base, presets: [...base.presets] };
  const row = raw as Record<string, unknown>;
  return {
    enabled: typeof row.enabled === "boolean" ? row.enabled : base.enabled,
    phone: typeof row.phone === "string" ? row.phone : base.phone,
    greeting:
      typeof row.greeting === "string" && row.greeting.trim()
        ? row.greeting.trim()
        : base.greeting,
    presets: normalizeWhatsAppPresets(row.presets),
  };
}

/** Öncelik: whatsapp.phone → contact.phone → varsayılan */
export function resolveWhatsAppPhone(opts: {
  whatsappPhone?: string | null;
  contactPhone?: string | null;
}): string {
  const dedicated = opts.whatsappPhone?.trim();
  if (dedicated) return dedicated;
  const contact = opts.contactPhone?.trim();
  if (contact) return contact;
  return DEFAULT_WHATSAPP_PHONE;
}

/** E.164 digits only (no +), e.g. 905412147963 */
export function toWhatsAppDigits(phone: string | null | undefined): string {
  const raw = (phone || DEFAULT_WHATSAPP_PHONE).trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) {
    return `90${digits.slice(1)}`;
  }
  if (digits.length === 10 && digits.startsWith("5")) {
    return `90${digits}`;
  }
  return digits || "905412147963";
}

export function buildWhatsAppUrl(
  phone: string | null | undefined,
  text?: string,
): string {
  const digits = toWhatsAppDigits(phone);
  const base = `https://wa.me/${digits}`;
  const trimmed = text?.trim();
  if (!trimmed) return base;
  return `${base}?text=${encodeURIComponent(trimmed)}`;
}

export function productWhatsAppMessage(
  productName: string,
  productUrl: string,
): string {
  return `Merhaba, "${productName}" ürünü hakkında bilgi almak istiyorum.\n${productUrl}`;
}
