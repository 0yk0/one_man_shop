import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hero } from "../sections/Hero";

const BASE = "https://github.com/0yk0/one_man_shop/releases/latest/download";

vi.mock("../hooks/useDownloadUrl", () => ({
  useDownloadUrl: vi.fn(() => ({
    url: `${BASE}/one_man_shop_macos_arm64.zip`,
    label: "Download for macOS",
    alts: [
      { url: `${BASE}/one_man_shop_windows_amd64.zip`, label: "Windows" },
      { url: `${BASE}/one_man_shop_android.zip`, label: "Android" },
    ],
  })),
}));

describe("Hero", () => {
  it("renders the heading", () => {
    render(<Hero />);
    expect(screen.getByText("One Man Shop")).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(<Hero />);
    expect(screen.getByText("The only POS that costs nothing.")).toBeInTheDocument();
  });

  it("renders the download button with correct label", () => {
    render(<Hero />);
    expect(screen.getByText("Download for macOS")).toBeInTheDocument();
  });

  it("download button links to direct zip URL", () => {
    render(<Hero />);
    const link = screen.getByText("Download for macOS").closest("a");
    expect(link).toHaveAttribute("href", `${BASE}/one_man_shop_macos_arm64.zip`);
  });

  it("download button does not open in new tab", () => {
    render(<Hero />);
    const link = screen.getByText("Download for macOS").closest("a");
    expect(link).not.toHaveAttribute("target");
  });

  it("renders 'Also available for' with both alternatives", () => {
    render(<Hero />);
    const winLink = screen.getByText("Windows");
    const androidLink = screen.getByText("Android");
    expect(winLink).toBeInTheDocument();
    expect(androidLink).toBeInTheDocument();
    expect(winLink).toHaveAttribute("href", `${BASE}/one_man_shop_windows_amd64.zip`);
    expect(androidLink).toHaveAttribute("href", `${BASE}/one_man_shop_android.zip`);
  });

  it("renders the app icon image", () => {
    render(<Hero />);
    const img = screen.getByAltText("One Man Shop");
    expect(img).toHaveAttribute("src", "/appicon.png");
  });

  it("renders the screenshot image", () => {
    render(<Hero />);
    const img = screen.getByAltText("One Man Shop POS Screen");
    expect(img).toHaveAttribute("src", "/screenshots/screenshot-06.png");
  });
});
