import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { Navbar } from "../sections/Navbar";

vi.mock("../hooks/useGitHubStats", () => ({
  useGitHubStats: vi.fn(() => ({
    stars: 42,
    downloads: 1500,
    loading: false,
  })),
}));

describe("Navbar", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the brand name", () => {
    render(<Navbar />);
    expect(screen.getByText("One Man Shop")).toBeInTheDocument();
  });

  it("renders the app icon", () => {
    render(<Navbar />);
    const img = document.querySelector('img[src="/appicon.png"]');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/appicon.png");
  });

  it("renders desktop nav links", () => {
    render(<Navbar />);
    expect(screen.getByText("Features")).toBeInTheDocument();
    expect(screen.getByText("Screenshots")).toBeInTheDocument();
    expect(screen.getByText("FAQ")).toBeInTheDocument();
  });

  it("renders the Download button", () => {
    render(<Navbar />);
    const downloadLinks = screen.getAllByText("Download");
    expect(downloadLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("renders GitHub link", () => {
    render(<Navbar />);
    const githubLinks = screen.getAllByRole("link").filter(
      (el) => el.getAttribute("href") === "https://github.com/0yk0/one_man_shop"
    );
    expect(githubLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("renders star count", () => {
    render(<Navbar />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders download count", () => {
    render(<Navbar />);
    expect(screen.getByText("1.5k")).toBeInTheDocument();
  });

  it("shows loading state for stats", async () => {
    const { useGitHubStats } = await import("../hooks/useGitHubStats");
    vi.mocked(useGitHubStats).mockReturnValue({
      stars: 0,
      downloads: 0,
      loading: true,
    });

    render(<Navbar />);
    const loadingTexts = screen.getAllByText("...");
    expect(loadingTexts.length).toBeGreaterThanOrEqual(1);
  });

  it("renders hamburger button on mobile", () => {
    render(<Navbar />);
    const hamburger = screen.getByRole("button");
    expect(hamburger).toBeInTheDocument();
  });
});
