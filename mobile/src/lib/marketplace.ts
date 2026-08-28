const PLATFORM_LABELS: Record<string, string> = {
  trendyol: 'Trendyol',
  trendyol_go_market: 'Trendyol Go Market',
  hepsiburada: 'Hepsiburada',
  n11: 'N11',
};

export function marketplacePlatformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] || platform;
}
