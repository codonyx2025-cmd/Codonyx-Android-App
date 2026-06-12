import { useState, useEffect, useRef } from "react";

export function useCountUp(end: number, duration = 2000, start = 0, enabled = false) {
  const [count, setCount] = useState(start);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (!enabled) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(start + (end - start) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [end, duration, start, enabled]);

  return count;
}
