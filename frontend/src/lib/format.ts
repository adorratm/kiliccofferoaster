export function formatMoney(
  amount: string | number | null | undefined,
  currency = "TRY",
) {
  const value = Number(amount ?? 0);
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function productImage(url: string | null | undefined, seed = "coffee") {
  if (url && !url.includes("aida-public") && !url.includes("lh3.googleusercontent.com/aida")) {
    return url;
  }
  const images = [
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1610889556528-9a7707953b38?auto=format&fit=crop&w=1200&q=80",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % images.length;
  }
  return images[hash];
}

export const WORKSHOP_ADDRESS =
  "AYRANCILAR MAHALLESİ DEĞİRMEN CAD. NO:55A AYRANCILAR, 35870 Torbalı/İzmir";

export const BRAND_NAME = "Kılıç Coffee Roasters";
