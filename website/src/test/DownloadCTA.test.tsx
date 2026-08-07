import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DownloadCTA } from "../sections/DownloadCTA";

const BASE = "https://github.com/0yk0/one_man_shop/releases/latest/download";

vi.mock("../hooks/useDownloadUrl", () => ({
  useDownloadUrl: vi.fn(() => ({
    url: `${BASE}/one_man_shop_windows_amd64.zip`,
    label: "Download for Windows",
    alts: [
      { url: `${BASE}/one_man_shop_macos_arm64.zip`, label: "macOS" },
      { url: `${BASE}/one_man_shop_android.zip`, label: "Android" },
    ],
  })),
}));

describe("DownloadCTA", () => {
  it("renders the heading", () => {
    render(<DownloadCTA />);
    expect(screen.getByText("Ready to simplify your shop?")).toBeInTheDocument();
  });

  it("renders the download button with correct label", () => {
    render(<DownloadCTA />);
    expect(screen.getByText("Download for Windows")).toBeInTheDocument();
  });

  it("download button links to direct zip URL", () => {
    render(<DownloadCTA />);
    const link = screen.getByText("Download for Windows").closest("a");
    expect(link).toHaveAttribute("href", `${BASE}/one_man_shop_windows_amd64.zip`);
  });

  it("download button does not open in new tab", () => {
    render(<DownloadCTA />);
    const link = screen.getByText("Download for Windows").closest("a");
    expect(link).not.toHaveAttribute("target");
  });

  it("renders 'Also available for' with both alternatives", () => {
    render(<DownloadCTA />);
    const macLink = screen.getByText("macOS");
    const androidLink = screen.getByText("Android");
    expect(macLink).toBeInTheDocument();
    expect(androidLink).toBeInTheDocument();
    expect(macLink).toHaveAttribute("href", `${BASE}/one_man_shop_macos_arm64.zip`);
    expect(androidLink).toHaveAttribute("href", `${BASE}/one_man_shop_android.zip`);
  });

  it("renders platform compatibility text", () => {
    render(<DownloadCTA />);
    expect(screen.getByText(/macOS 12\+.*Windows 10\+.*Android 5\.0\+/)).toBeInTheDocument();
  });

  it("has the download section id", () => {
    render(<DownloadCTA />);
    const section = screen.getByText("Ready to simplify your shop?").closest("section");
    expect(section).toHaveAttribute("id", "download");
  });
});
