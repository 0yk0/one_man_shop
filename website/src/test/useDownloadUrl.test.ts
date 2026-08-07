import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDownloadUrl } from "../hooks/useDownloadUrl";

const BASE = "https://github.com/0yk0/one_man_shop/releases/latest/download";

function setUA(ua: string) {
  Object.defineProperty(navigator, "userAgent", {
    value: ua,
    configurable: true,
  });
}

describe("useDownloadUrl", () => {
  const originalUA = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(navigator, "userAgent", {
      value: originalUA,
      configurable: true,
    });
  });

  it("returns Android APK download for Android user", () => {
    setUA("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36");
    const { result } = renderHook(() => useDownloadUrl());

    expect(result.current.url).toBe(`${BASE}/one_man_shop_android.zip`);
    expect(result.current.label).toBe("Get Android APK");
    expect(result.current.alts).toHaveLength(2);
    expect(result.current.alts[0]).toEqual({ url: `${BASE}/one_man_shop_macos_arm64.zip`, label: "macOS" });
    expect(result.current.alts[1]).toEqual({ url: `${BASE}/one_man_shop_windows_amd64.zip`, label: "Windows" });
  });

  it("returns macOS arm64 download for macOS user", () => {
    setUA("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15");
    const { result } = renderHook(() => useDownloadUrl());

    expect(result.current.url).toBe(`${BASE}/one_man_shop_macos_arm64.zip`);
    expect(result.current.label).toBe("Download for macOS");
    expect(result.current.alts).toHaveLength(2);
    expect(result.current.alts[0]).toEqual({ url: `${BASE}/one_man_shop_windows_amd64.zip`, label: "Windows" });
    expect(result.current.alts[1]).toEqual({ url: `${BASE}/one_man_shop_android.zip`, label: "Android" });
  });

  it("returns Windows download for Windows user", () => {
    setUA("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
    const { result } = renderHook(() => useDownloadUrl());

    expect(result.current.url).toBe(`${BASE}/one_man_shop_windows_amd64.zip`);
    expect(result.current.label).toBe("Download for Windows");
    expect(result.current.alts).toHaveLength(2);
    expect(result.current.alts[0]).toEqual({ url: `${BASE}/one_man_shop_macos_arm64.zip`, label: "macOS" });
    expect(result.current.alts[1]).toEqual({ url: `${BASE}/one_man_shop_android.zip`, label: "Android" });
  });

  it("falls back to macOS for unknown OS", () => {
    setUA("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36");
    const { result } = renderHook(() => useDownloadUrl());

    expect(result.current.url).toBe(`${BASE}/one_man_shop_macos_arm64.zip`);
    expect(result.current.label).toBe("Download for macOS");
    expect(result.current.alts[0].label).toBe("Windows");
  });

  it("detects Android from 'Android' in user agent", () => {
    setUA("Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36");
    const { result } = renderHook(() => useDownloadUrl());

    expect(result.current.url).toContain("one_man_shop_android.zip");
    expect(result.current.label).toBe("Get Android APK");
  });

  it("detects Android tablet user agent", () => {
    setUA("Mozilla/5.0 (Linux; Android 14; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    const { result } = renderHook(() => useDownloadUrl());

    expect(result.current.url).toBe(`${BASE}/one_man_shop_android.zip`);
    expect(result.current.label).toBe("Get Android APK");
    expect(result.current.alts[0].label).toBe("macOS");
    expect(result.current.alts[1].label).toBe("Windows");
  });
});
