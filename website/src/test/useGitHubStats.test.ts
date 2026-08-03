import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useGitHubStats } from "../hooks/useGitHubStats";

const MOCK_REPO = {
  stargazers_count: 42,
};

const MOCK_RELEASES = [
  {
    assets: [
      { download_count: 100 },
      { download_count: 50 },
    ],
  },
  {
    assets: [
      { download_count: 30 },
    ],
  },
];

describe("useGitHubStats", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches stars and downloads on mount", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_REPO))
    );
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_RELEASES))
    );

    const { result } = renderHook(() => useGitHubStats());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stars).toBe(42);
    expect(result.current.downloads).toBe(180);
  });

  it("handles fetch errors gracefully", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useGitHubStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stars).toBe(0);
    expect(result.current.downloads).toBe(0);
  });

  it("handles non-ok repo response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 404 })
    );

    const { result } = renderHook(() => useGitHubStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stars).toBe(0);
    expect(result.current.downloads).toBe(0);
  });

  it("handles releases with no assets", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ stargazers_count: 10 }))
    );
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify([{ assets: [] }]))
    );

    const { result } = renderHook(() => useGitHubStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stars).toBe(10);
    expect(result.current.downloads).toBe(0);
  });

  it("handles releases with missing assets field", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ stargazers_count: 5 }))
    );
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify([{ noAssets: true }]))
    );

    const { result } = renderHook(() => useGitHubStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stars).toBe(5);
    expect(result.current.downloads).toBe(0);
  });

  it("sums downloads across multiple releases and assets", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ stargazers_count: 100 }))
    );
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify([
        { assets: [{ download_count: 1000 }, { download_count: 500 }] },
        { assets: [{ download_count: 200 }] },
        { assets: [] },
      ]))
    );

    const { result } = renderHook(() => useGitHubStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.downloads).toBe(1700);
  });
});
