const BUNDLE_ID = "tr.kiliccoffeeroaster.ops";

export async function GET() {
  const teamId = (
    process.env.APPLE_TEAM_ID ||
    process.env.NEXT_PUBLIC_APPLE_TEAM_ID ||
    ""
  ).trim();
  const paths = [
    "/",
    "/urunler",
    "/urunler/*",
    "/sepet",
    "/odeme",
    "/hesabim",
    "/hesabim/*",
    "/giris",
    "/kayit",
    "/sifre-sifirla",
    "/hakkimizda",
    "/sss",
    "/blog",
    "/blog/*",
    "/iletisim",
    "/takip",
    "/takip/*",
    "/siparis-sorgula",
    "/oner",
    "/toptan",
    "/kvkk",
    "/gizlilik",
    "/cerez-politikasi",
    "/mesafeli-satis",
    "/on-bilgilendirme",
    "/iptal-iade",
    "/musteri-memnuniyeti",
    "/guvenli-alisveris",
    "/aydinlatma-metni",
  ];

  const details = teamId
    ? [
        {
          appIDs: [`${teamId}.${BUNDLE_ID}`],
          components: [{ "/": "/urunler/*" }, { "/": "/*" }],
          paths,
        },
      ]
    : [
        {
          appID: BUNDLE_ID,
          paths,
        },
      ];

  const body = {
    applinks: {
      apps: [],
      details,
    },
    webcredentials: teamId
      ? { apps: [`${teamId}.${BUNDLE_ID}`] }
      : undefined,
  };

  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export const dynamic = "force-dynamic";
