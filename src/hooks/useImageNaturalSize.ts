import { useEffect, useState } from "react";

export function useImageNaturalSize(url: string | null) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      setSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => {
      if (cancelled) return;
      //   setSize(null);
    };
    img.src = url;

    return () => {
      cancelled = true;
    };
  }, [url]);

  return size;
}
