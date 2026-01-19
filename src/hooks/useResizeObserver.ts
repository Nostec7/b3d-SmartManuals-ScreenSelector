import { useEffect, useState } from "react";

export function useResizeObserver<T extends HTMLElement>(
  ref: React.RefObject<T | null>
) {
  const [rect, setRect] = useState<DOMRectReadOnly | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setRect(entry.contentRect);
    });

    ro.observe(el, { box: "content-box" });
    return () => ro.disconnect();
  }, [ref]);

  return rect;
}
