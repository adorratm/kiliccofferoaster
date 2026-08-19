export function isInAppShell(): boolean {
  if (typeof navigator === "undefined") return false;
  return /KilicCoffee\//i.test(navigator.userAgent);
}

export function isDesktopApp(): boolean {
  if (typeof navigator === "undefined") return false;
  return /KilicCoffee\/.*Desktop/i.test(navigator.userAgent);
}

export const OPS_PROTOCOL = "kilic://ops";

export const DOWNLOADS = {
  windows:
    process.env.NEXT_PUBLIC_DOWNLOAD_WINDOWS ||
    "/downloads/KilicCoffee-Setup.exe",
  mac: process.env.NEXT_PUBLIC_DOWNLOAD_MAC || "",
  linux: process.env.NEXT_PUBLIC_DOWNLOAD_LINUX || "",
  androidApk: process.env.NEXT_PUBLIC_DOWNLOAD_ANDROID || "",
  playStore: process.env.NEXT_PUBLIC_PLAY_STORE_URL || "",
  appStore: process.env.NEXT_PUBLIC_APP_STORE_URL || "",
};

export function hasAnyDownloadLink(): boolean {
  return Boolean(
    DOWNLOADS.windows ||
      DOWNLOADS.mac ||
      DOWNLOADS.linux ||
      DOWNLOADS.androidApk ||
      DOWNLOADS.playStore ||
      DOWNLOADS.appStore,
  );
}
