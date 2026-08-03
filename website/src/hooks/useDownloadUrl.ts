import { useMemo } from "react";

const BASE = "https://github.com/0yk0/one_man_shop/releases/latest/download";

type OsType = "macos" | "windows";

interface DownloadInfo {
  url: string;
  label: string;
  otherUrl: string;
  otherLabel: string;
}

function detectOs(): OsType {
  const ua = navigator.userAgent;
  if (/macintosh|mac os x/i.test(ua)) return "macos";
  if (/windows/i.test(ua)) return "windows";
  return "macos";
}

export function useDownloadUrl(): DownloadInfo {
  return useMemo(() => {
    const os = detectOs();

    if (os === "windows") {
      return {
        url: `${BASE}/one_man_shop_windows_amd64.zip`,
        label: "Download for Windows",
        otherUrl: `${BASE}/one_man_shop_macos_arm64.zip`,
        otherLabel: "macOS",
      };
    }

    return {
      url: `${BASE}/one_man_shop_macos_arm64.zip`,
      label: "Download for macOS",
      otherUrl: `${BASE}/one_man_shop_windows_amd64.zip`,
      otherLabel: "Windows",
    };
  }, []);
}
