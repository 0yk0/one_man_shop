import { useEffect, useState } from "react";

interface GitHubStats {
  stars: number;
  downloads: number;
  loading: boolean;
}

const REPO = "0yk0/one_man_shop";

export function useGitHubStats(): GitHubStats {
  const [stats, setStats] = useState<GitHubStats>({
    stars: 0,
    downloads: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const res = await fetch(`https://api.github.com/repos/${REPO}`);
        if (!res.ok) throw new Error("Failed to fetch repo");
        const repo = await res.json();

        const releasesRes = await fetch(
          `https://api.github.com/repos/${REPO}/releases`
        );
        let downloads = 0;
        if (releasesRes.ok) {
          const releases = await releasesRes.json();
          for (const release of releases) {
            for (const asset of release.assets || []) {
              downloads += asset.download_count || 0;
            }
          }
        }

        if (!cancelled) {
          setStats({
            stars: repo.stargazers_count || 0,
            downloads,
            loading: false,
          });
        }
      } catch {
        if (!cancelled) setStats((s) => ({ ...s, loading: false }));
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  return stats;
}
