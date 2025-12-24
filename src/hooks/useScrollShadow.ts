// src/hooks/useScrollShadow.ts
import { useEffect, useRef, useState } from "react";

export function useScrollShadow() {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { rootMargin: "0px 0px 0px 0px", threshold: [1] }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, []);

  return { sentinelRef, scrolled };
}
