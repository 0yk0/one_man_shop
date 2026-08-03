import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DownloadCTA } from "../sections/DownloadCTA";

const BASE = "https://github.com/0yk0/one_man_shop/releases/latest/download";

vi.mock("../hooks/useDownloadUrl", () => ({
  useDownloadUrl: vi.fn(() => ({
    url: `${BASE}/one_man_shop_windows_amd64.zip`,
    label: "Download for Windows",
    otherUrl: `${BASE}/one_man_shop_macos_arm64.zip`,
    otherLabel: "macOS",
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

  it("renders 'Also available for' link to other OS", () => {
    render(<DownloadCTA />);
    const otherLink = screen.getByText("macOS");
    expect(otherLink).toBeInTheDocument();
    expect(otherLink).toHaveAttribute("href", `${BASE}/one_man_shop_macos_arm64.zip`);
  });

  it("renders platform compatibility text", () => {
    render(<DownloadCTA />);
    expect(screen.getByText(/macOS 12\+ and Windows 10\+/)).toBeInTheDocument();
  });

  it("has the download section id", () => {
    render(<DownloadCTA />);
    const section = screen.getByText("Ready to simplify your shop?").closest("section");
    expect(section).toHaveAttribute("id", "download");
  });
});
