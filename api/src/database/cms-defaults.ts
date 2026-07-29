export const DEFAULT_SITE_SETTINGS: Record<
  string,
  Record<string, unknown>
> = {
  brand: {
    name: 'Kılıç Coffee Roaster',
    slogan: 'Engineered Precision. Artisanal Depth.',
    tagline:
      'Engineered Precision. Artisanal Depth. Seçkin profesyoneller için yüksek teknolojili kavrum.',
    established: 'EST. 2026',
    location: 'Torbalı · İzmir',
  },
  contact: {
    address:
      'AYRANCILAR MAHALLESİ DEĞİRMEN CAD. NO:55A AYRANCILAR, 35870 Torbalı/İzmir',
    email: 'info@kiliccoffeeroaster.com.tr',
    phone: '+90 541 214 79 63',
    hours: 'Pzt — Paz / 09:00 — 22:00',
    locationLabel: 'Torbalı / İzmir',
  },
  seo: {
    title: 'Kılıç Coffee Roaster',
    description:
      'Engineered Precision. Artisanal Depth. Torbalı / İzmir özel kahve kavurucusu.',
    keywords: [
      'kahve',
      'kavurma',
      'specialty coffee',
      'Torbalı',
      'İzmir',
      'Kılıç Coffee Roaster',
    ],
    ogImage:
      '',
  },
  navigation: {
    header: [
      { href: '/urunler', label: 'Kavrumlar' },
      { href: '/hakkimizda', label: 'Hakkımızda' },
      { href: '/blog', label: 'Blog' },
      { href: '/iletisim', label: 'İletişim' },
      { href: '/takip', label: 'Takip' },
      { href: '/siparis-sorgula', label: 'Sipariş' },
    ],
    footerNav: [
      { href: '/urunler', label: 'Kavrumlar' },
      { href: '/hakkimizda', label: 'Hakkımızda' },
      { href: '/blog', label: 'Blog' },
      { href: '/iletisim', label: 'İletişim' },
      { href: '/siparis-sorgula', label: 'Sipariş Sorgula' },
      { href: '/takip', label: 'Kargo Takip' },
      { href: '/sepet', label: 'Sepet' },
      { href: '/hesabim', label: 'Hesabım' },
    ],
    footerLegal: [
      { href: '/kvkk', label: 'KVKK' },
      { href: '/gizlilik', label: 'Gizlilik' },
      { href: '/cerez-politikasi', label: 'Çerez Kullanımı' },
      { href: '/mesafeli-satis', label: 'Mesafeli Satış' },
      { href: '/on-bilgilendirme', label: 'Ön Bilgilendirme' },
      { href: '/iptal-iade', label: 'İade Politikası' },
      { href: '/musteri-memnuniyeti', label: 'Müşteri Memnuniyeti' },
      { href: '/guvenli-alisveris', label: 'Güvenli Alışveriş' },
      { href: '/aydinlatma-metni', label: 'Aydınlatma Metni' },
    ],
  },
  social: {
    instagram: '',
    facebook: '',
    googleMaps: '',
  },
  footer: {
    description:
      'Ampirik veri ve zanaat sezgisiyle mükemmel kavrum profilini mühendislik seviyesinde üretir. Torbalı / İzmir.',
    copyrightSuffix: 'Engineered Precision.',
  },
};

export const DEFAULT_HOME_SECTIONS = [
  {
    page: 'home',
    sectionKey: 'hero',
    title: 'Hero',
    sortOrder: 1,
    content: {
      imageUrl:
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=2000&q=80',
      eyebrow: 'EST. 2026 / TORBALI · İZMİR',
      titleLine1: 'Kılıç Coffee',
      titleLine2: 'Roaster',
      description:
        'Engineered Precision. Artisanal Depth. Seçkin profesyoneller için yüksek teknolojili kavrum.',
      ctaPrimary: { label: 'Koleksiyonu Keşfet', href: '/urunler' },
      ctaSecondary: { label: 'Ethos', href: '#ethos' },
      sidebar: [
        { label: 'System_Status', value: 'Optimal' },
        { label: 'Latency', value: '14ms' },
        { label: 'Grid', value: 'Torbalı / İzmir' },
      ],
    },
  },
  {
    page: 'home',
    sectionKey: 'ethos',
    title: 'Ethos',
    sortOrder: 2,
    content: {
      titleLines: ['The', 'Roasting', 'Ethos'],
      description:
        'Metodolojimiz veriye dayanır. Her batch için termal eğri boyunca tutarlılığı garanti etmek üzere onlarca değişken izleriz.',
      stats: [
        { label: 'Drum Speed', value: '54 RPM' },
        { label: 'Airflow', value: '82%' },
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1600&q=80',
      telemetry: {
        profile: 'KRC-74-Alpha',
        feed: 'Live_Feed: Active',
        metrics: [
          { label: 'Temp_Internal', value: '204.5°C' },
          { label: 'RoR_Phase', value: '+8.2' },
          { label: 'Exhaust_Temp', value: '188.1°C' },
          { label: 'Fuel_Stability', value: '99.8%' },
        ],
      },
    },
  },
  {
    page: 'home',
    sectionKey: 'products',
    title: 'Featured Products',
    sortOrder: 3,
    content: {
      title: 'Curated Specimens',
      subtitle: 'Seçilmiş hasat // veriye göre filtrele',
      ctaLabel: 'Tümünü Gör',
      ctaHref: '/urunler',
    },
  },
  {
    page: 'home',
    sectionKey: 'workshop',
    title: 'Workshop',
    sortOrder: 4,
    content: {
      subtitle: 'Physical Node',
      titleLines: ['Visit The', 'Workshop'],
      description:
        'Hassasiyeti deneyimleyin. Torbalı merkezimizde tadım laboratuvarı ve endüstriyel kavrum hattı bir arada.',
      imageUrl:
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80',
      ctaLabel: 'İletişime Geç',
      ctaHref: '/iletisim',
    },
  },
  {
    page: 'home',
    sectionKey: 'newsletter',
    title: 'Newsletter',
    sortOrder: 5,
    content: {
      title: 'System Notifications',
      description: 'Drop uyarıları ve teknik loglar için ağa katılın',
    },
  },
  {
    page: 'home',
    sectionKey: 'faq',
    title: 'SSS',
    sortOrder: 6,
    content: {
      title: 'Sıkça Sorulan Sorular',
      items: [
        {
          question: 'Kahveler ne sıklıkla kavruluyor?',
          answer:
            'Sipariş ve taze stok dengesi için batch bazlı kavrum yapıyoruz. Çekirdekler mümkün olduğunca taze kavrulmuş olarak gönderilir.',
        },
        {
          question: 'Öğütülmüş kahve sipariş edebilir miyim?',
          answer:
            'Varsayılan ürünlerimiz çekirdek olarak sunulur. Öğütme tercihinizi sipariş notunda belirtirseniz uygun öğütmeye göre hazırlarız.',
        },
        {
          question: 'Kargo süresi ne kadar?',
          answer:
            'Ödeme onayı sonrası siparişler genellikle 1–3 iş günü içinde kargoya verilir. Takip kodunu sipariş bildirimiyle paylaşıyoruz.',
        },
        {
          question: 'Atölyeyi ziyaret edebilir miyim?',
          answer:
            'Torbalı / İzmir atölyemizi ziyaret etmek için iletişim formundan veya telefonla randevu alabilirsiniz.',
        },
      ],
    },
  },
  {
    page: 'contact',
    sectionKey: 'header',
    title: 'İletişim Başlık',
    sortOrder: 1,
    content: {
      title: 'İletişim',
      subtitle: 'Protokol mesajı gönderin veya atölyemizi ziyaret edin.',
    },
  },
];
