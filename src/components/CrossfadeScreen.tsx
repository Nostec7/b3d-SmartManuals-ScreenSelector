import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  imgClassName?: string;
  imgStyle?: React.CSSProperties;

  /** Duration of the crossfade (ms) */
  durationMs?: number;

  children?: React.ReactNode;

  onNaturalSize: (size: { w: number; h: number }) => void;
};

type ImageLayer = {
  key: string;
  src: string;
};

export function CrossfadeScreen({
  src,
  className,
  style,
  imgClassName = "absolute inset-0 h-full w-full select-none",
  imgStyle,
  durationMs = 150,
  children,
  onNaturalSize,
}: Props) {
  const [current, setCurrent] = useState<ImageLayer>({
    key: src,
    src,
  });

  const [incoming, setIncoming] = useState<ImageLayer | null>(null);
  const [contentVisible, setContentVisible] = useState(false);

  const preloadRef = useRef<HTMLImageElement | null>(null);

  /**
   * Preload next image whenever src changes
   */
  useEffect(() => {
    if (src === current.src) return;
  
    const img = new Image();
    preloadRef.current = img;

  
    const requested = src; // stable for this run
    let cancelled = false;
  
    const handleLoad = () => {
      if (cancelled) return;
      // natural size (decode ensures dimensions are available even for cached images)
      try {
        // use decode if available — safer for cached images
        const maybeDecode = img.decode?.();
        if (maybeDecode) {
          maybeDecode
            .then(() => {
              if (cancelled) return;
              onNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
              if (requested === src) {
                setIncoming({ key: requested, src: requested });
              }
            })
            .catch(() => {
              if (cancelled) return;
              onNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
              if (requested === src) {
                setIncoming({ key: requested, src: requested });
              }
            });
          return;
        }
      } catch (e) {
        /* fall through to immediate handler below */
      }
  
      // fallback if decode not available
      onNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      if (requested === src) {
        setIncoming({ key: requested, src: requested });
      }
    };
  
    const handleError = (ev?: Event | string) => {
      if (cancelled) return;
      // optional: you can surface the error or silently ignore
      console.warn("CrossfadeScreen image preload failed", requested, ev);
    };
  
    img.addEventListener("load", handleLoad);
    img.addEventListener("error", handleError);
  
    // Attach handlers first, then set src (prevents missed load for cached images)
    img.src = requested;
  
    return () => {
      cancelled = true;
      preloadRef.current = null;
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
      // try to help GC
      try { (img as any).src = ""; } catch {}
    };
  }, [src, current.src, onNaturalSize]);
  

  /**
   * Once incoming is present, swap it to current
   * after the crossfade finishes
   */
  const handleFadeComplete = () => {
    if (incoming) {
      setCurrent(incoming);
      setIncoming(null);
      setContentVisible(true);
    }
  };

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <AnimatePresence initial={false}>
        {/* Current image */}
        <motion.img
          key={current.key}
          src={current.src}
          draggable={false}
          className={imgClassName}
          style={{
            ...imgStyle,
            pointerEvents: "none",
          }}
          initial={{ opacity: 1 }}
          //animate={{ opacity: incoming ? 0 : 1 }}
          //exit={{ opacity: 0 }}
          transition={{ duration: durationMs / 1000, ease: "easeInOut" }}
        />

        {/* Incoming image (only mounted AFTER load) */}
        {incoming && (
          <motion.img
            key={incoming.key}
            src={incoming.src}
            draggable={false}
            className={imgClassName}
            style={{
              ...imgStyle,
              pointerEvents: "none",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: durationMs / 1000, ease: "easeInOut" }}
            onAnimationComplete={handleFadeComplete}
          />
        )}
      </AnimatePresence>

      {/* Overlay content */}
      <div
        className="absolute inset-0"
        style={{
          opacity: contentVisible ? 1 : 0,
          pointerEvents: "none",
          transition: `opacity ${durationMs}ms ease-in-out`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
