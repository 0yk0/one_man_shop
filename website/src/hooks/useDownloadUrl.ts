import { useMemo } from "react";

const BASE = "https://github.com/0yk0/one_man_shop/releases/latest/download";

type OsType = "macos" | "windows" | "android";

interface AltLink {
  url: string;
  label: string;
}

interface DownloadInfo {
  url: string;
  label: string;
  alts: AltLink[];
}

function detectOs(): OsType {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/macintosh|mac os x/i.test(ua)) return "macos";
  if (/windows/i.test(ua)) return "windows";
  return "macos";
}

export function useDownloadUrl(): DownloadInfo {
  return useMemo(() => {
    const os = detectOs();

    if (os === "android") {
      return {
        url: `${BASE}/one_man_shop_android.zip`,
        label: "Get Android APK",
        alts: [
          { url: `${BASE}/one_man_shop_macos_arm64.zip`, label: "macOS" },
          { url: `${BASE}/one_man_shop_windows_amd64.zip`, label: "Windows" },
        ],
      };
    }

    if (os === "windows") {
      return {
        url: `${BASE}/one_man_shop_windows_amd64.zip`,
        label: "Download for Windows",
        alts: [
          { url: `${BASE}/one_man_shop_macos_arm64.zip`, label: "macOS" },
          { url: `${BASE}/one_man_shop_android.zip`, label: "Android" },
        ],
      };
    }

    return {
      url: `${BASE}/one_man_shop_macos_arm64.zip`,
      label: "Download for macOS",
      alts: [
        { url: `${BASE}/one_man_shop_windows_amd64.zip`, label: "Windows" },
        { url: `${BASE}/one_man_shop_android.zip`, label: "Android" },
      ],
    };
  }, []);
}
