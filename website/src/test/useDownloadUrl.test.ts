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

  it("returns macOS arm64 download for macOS user", () => {
    setUA("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15");
    const { result } = renderHook(() => useDownloadUrl());

    expect(result.current.url).toBe(`${BASE}/one_man_shop_macos_arm64.zip`);
    expect(result.current.label).toBe("Download for macOS");
    expect(result.current.otherUrl).toBe(`${BASE}/one_man_shop_windows_amd64.zip`);
    expect(result.current.otherLabel).toBe("Windows");
  });

  it("returns Windows download for Windows user", () => {
    setUA("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
    const { result } = renderHook(() => useDownloadUrl());

    expect(result.current.url).toBe(`${BASE}/one_man_shop_windows_amd64.zip`);
    expect(result.current.label).toBe("Download for Windows");
    expect(result.current.otherUrl).toBe(`${BASE}/one_man_shop_macos_arm64.zip`);
    expect(result.current.otherLabel).toBe("macOS");
  });

  it("falls back to macOS for unknown OS", () => {
    setUA("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36");
    const { result } = renderHook(() => useDownloadUrl());

    expect(result.current.url).toBe(`${BASE}/one_man_shop_macos_arm64.zip`);
    expect(result.current.label).toBe("Download for macOS");
    expect(result.current.otherLabel).toBe("Windows");
  });

  it("detects macOS from 'Macintosh' in user agent", () => {
    setUA("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");
    const { result } = renderHook(() => useDownloadUrl());

    expect(result.current.url).toContain("macos_arm64");
  });

  it("detects Windows from 'Windows' in user agent", () => {
    setUA("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    const { result } = renderHook(() => useDownloadUrl());

    expect(result.current.url).toContain("windows_amd64");
  });
});
