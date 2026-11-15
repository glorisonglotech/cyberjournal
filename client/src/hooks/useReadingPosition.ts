import { useEffect, useState } from "react";

/** Percentage of the article element that has been scrolled past. */
export function useReadingProgress(targetId: string) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const compute = () => {
      const element = document.getElementById(targetId);
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const total = Math.max(1, element.offsetHeight - window.innerHeight * 0.6);
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress(Math.round((scrolled / total) * 100));
    };

    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [targetId]);

  return Math.min(100, Math.max(0, progress));
}

/** Tracks which heading is currently in view. */
export function useActiveHeading(ids: string[]) {
  const [activeId, setActiveId] = useState(ids[0] || "");
  const key = ids.join("|");

  useEffect(() => {
    const compute = () => {
      let current = ids[0] || "";
      for (const id of ids) {
        const element = document.getElementById(id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= 140) current = id;
      }
      setActiveId(current);
    };

    compute();
    window.addEventListener("scroll", compute, { passive: true });
    return () => window.removeEventListener("scroll", compute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return activeId;
}
