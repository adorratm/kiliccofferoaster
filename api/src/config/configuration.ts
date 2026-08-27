import { existsSync } from 'fs';

/** Compose içindeki `redis` hostname'ini host'ta localhost'a çevir. */
function resolveRedisUrl(): string {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  if (existsSync('/.dockerenv')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'redis') {
      parsed.hostname = 'localhost';
      return parsed.href;
    }
  } catch {
    /* geçersiz URL — olduğu gibi bırak */
  }
  return url;
}

export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPort: parseInt(process.env.API_PORT || '4000', 10),
  apiUrl: process.env.API_URL || 'http://localhost:4000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:3001',
  opsMobileCallbackUrl:
    process.env.OPS_MOBILE_CALLBACK_URL || 'kilicops://auth/callback',
  opsWebUrl: process.env.OPS_WEB_URL || 'http://localhost:8081',
  /**
   * @deprecated Auth/yetki için kullanılmaz — `admin_allowlist` tablosu + Kullanıcılar UI.
   * Yalnızca `yarn seed` ilk bootstrap’ta DB’ye yazmak için okunur.
   */
  adminAllowlist: (process.env.ADMIN_ALLOWLIST || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'kilic',
    password: process.env.POSTGRES_PASSWORD || 'kilic_secret',
    name: process.env.POSTGRES_DB || 'kiliccoffeeroaster',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:4000/auth/google/callback',
    adminCallbackUrl:
      process.env.GOOGLE_ADMIN_CALLBACK_URL ||
      'http://localhost:4000/auth/google/admin/callback',
  },
  apple: {
    /** Virgülle: iOS bundle id ve isteğe bağlı Services ID */
    clientIds: process.env.APPLE_CLIENT_ID || 'tr.kiliccoffeeroaster.ops',
  },
  payment: {
    /** paytr | iyzico — boşsa PayTR bilgileri varsa paytr, değilse iyzico */
    provider: process.env.PAYMENT_PROVIDER || '',
  },
  paytr: {
    merchantId: process.env.PAYTR_MERCHANT_ID || '',
    merchantKey: process.env.PAYTR_MERCHANT_KEY || '',
    merchantSalt: process.env.PAYTR_MERCHANT_SALT || '',
    /** 1 = test modu */
    testMode: process.env.PAYTR_TEST_MODE || '1',
    debugOn: process.env.PAYTR_DEBUG_ON || '1',
    noInstallment: process.env.PAYTR_NO_INSTALLMENT || '0',
    maxInstallment: process.env.PAYTR_MAX_INSTALLMENT || '0',
    /** Yerel geliştirmede dış IP yoksa kullanılır */
    fallbackIp: process.env.PAYTR_FALLBACK_IP || '1.1.1.1',
  },
  iyzico: {
    apiKey: process.env.IYZICO_API_KEY || '',
    secretKey: process.env.IYZICO_SECRET_KEY || '',
    baseUrl:
      process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
  },
  aws: {
    region: process.env.AWS_REGION || 'eu-central-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.AWS_S3_BUCKET || '',
    cdnUrl: process.env.AWS_CDN_URL || '',
  },
  redis: {
    url: resolveRedisUrl(),
  },
  mail: {
    from:
      process.env.MAIL_FROM ||
      'Kılıç Coffee Roaster <info@kiliccoffeeroaster.com.tr>',
    host: process.env.MAIL_HOST || '',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    /** true = 465 SSL; false = 587 STARTTLS */
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
    /**
     * Yeni sipariş / ödeme admin e-postaları.
     * Boşsa aktif `admin_allowlist` kayıtları; o da yoksa info@ kullanılır.
     */
    orderAlertEmails: (process.env.ORDER_ALERT_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  },
  whatsapp: {
    /** console | meta — otomatik sipariş WhatsApp’ı için Meta Cloud API */
    provider: process.env.WHATSAPP_PROVIDER || 'console',
    /** İş / WhatsApp Business numarası */
    from: process.env.WHATSAPP_FROM || '+905412147963',
    metaToken: process.env.META_WA_TOKEN || '',
    metaPhoneNumberId: process.env.META_WA_PHONE_NUMBER_ID || '',
  },
  /** @deprecated SMS kaldırıldı */
  sms: {
    provider: process.env.SMS_PROVIDER || 'console',
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
    twilioFrom: process.env.TWILIO_FROM || '',
    netgsmUsercode: process.env.NETGSM_USERCODE || '',
    netgsmPassword: process.env.NETGSM_PASSWORD || '',
    netgsmMsgHeader: process.env.NETGSM_MSGHEADER || '',
  },
  bullBoard: {
    path: process.env.BULL_BOARD_PATH || '/admin/queues',
  },
  tax: {
    /** Türkiye B2C için varsayılan KDV % */
    ratePercent: parseFloat(process.env.TAX_RATE_PERCENT || '20'),
    /** true: fiyatlar KDV dahil; taxAmount içinden ayrıştırılır */
    included: process.env.TAX_INCLUDED !== 'false',
  },
  shipping: {
    freeOver: parseFloat(process.env.FREE_SHIPPING_OVER || '0'),
    defaultFee: parseFloat(process.env.DEFAULT_SHIPPING_FEE || '89.90'),
    /**
     * Credentials yokken mock kargo oluşturulsun mu?
     * production’da yalnızca SHIPPING_ALLOW_MOCK=true ile açılır.
     */
    allowMock:
      process.env.NODE_ENV === 'production'
        ? process.env.SHIPPING_ALLOW_MOCK === 'true'
        : process.env.SHIPPING_ALLOW_MOCK !== 'false',
  },
  abandonedCart: {
    /** Sepet güncellenmeden kaç saat sonra 1. hatırlatma (varsayılan 4) */
    hours: parseInt(process.env.ABANDONED_CART_HOURS || '4', 10),
    /** 1. hatırlatmadan kaç saat sonra 2. hatırlatma (varsayılan 24) */
    secondHours: parseInt(process.env.ABANDONED_CART_SECOND_HOURS || '24', 10),
  },
  marketplaceSync: {
    enabled: process.env.MARKETPLACE_SYNC_ENABLED !== 'false',
    /** Saatlik varsayılan; en az 5 dk */
    intervalMinutes: parseInt(
      process.env.MARKETPLACE_SYNC_INTERVAL_MINUTES || '60',
      10,
    ),
  },
  marketplace: {
    trendyol: {
      baseUrl:
        process.env.TRENDYOL_API_BASE_URL ||
        'https://apigw.trendyol.com/integration',
    },
    hepsiburada: {
      listingBaseUrl:
        process.env.HEPSIBURADA_LISTING_BASE_URL ||
        'https://listing-external.hepsiburada.com',
      omsBaseUrl:
        process.env.HEPSIBURADA_OMS_BASE_URL ||
        'https://oms-external.hepsiburada.com',
    },
    n11: {
      baseUrl: process.env.N11_API_BASE_URL || 'https://api.n11.com',
      integrator: process.env.N11_INTEGRATOR_NAME || 'KilicCoffeeRoaster',
    },
  },
  lowStock: {
    threshold: parseInt(process.env.LOW_STOCK_THRESHOLD || '10', 10),
    /** Virgülle ayrılmış ekstra alıcılar; boşsa admin allowlist + DB allowlist */
    alertEmails: (process.env.LOW_STOCK_ALERT_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
    scanIntervalHours: parseInt(
      process.env.LOW_STOCK_SCAN_INTERVAL_HOURS || '24',
      10,
    ),
  },
  desktopUrl: process.env.DESKTOP_DEV_URL || 'http://localhost:5173',
  instagram: {
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
    userId: process.env.INSTAGRAM_USER_ID || '',
    username: process.env.INSTAGRAM_USERNAME || 'kiliccoffeeroaster',
  },
  einvoice: {
    mock:
      process.env.TURKCELL_ESIRKET_MOCK === 'true'
        ? true
        : process.env.TURKCELL_ESIRKET_MOCK === 'false'
          ? false
          : !process.env.TURKCELL_ESIRKET_API_KEY,
    turkcell: {
      apiKey: process.env.TURKCELL_ESIRKET_API_KEY || '',
      baseUrl:
        process.env.TURKCELL_ESIRKET_BASE_URL ||
        'https://api.turkcellesirket.com',
    },
  },
});
