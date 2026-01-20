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

    img.src = src;

    img.onload = () => {
      // Natural size callback
      onNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });

      // Only commit if this is still the requested src
      if (img.src === src) {
        setIncoming({
          key: src,
          src,
        });
      }
    };
    

    return () => {
      preloadRef.current = null;
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
