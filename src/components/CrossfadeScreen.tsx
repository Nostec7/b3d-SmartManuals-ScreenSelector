import { useEffect, useRef, useState } from "react";
//import { useSimStore } from "../stores/useSimStore";

type Props = {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  imgClassName?: string;
  imgStyle?: React.CSSProperties;

  /** Duration for both fade-out and fade-in */
  durationMs?: number;

  /** Delay BEFORE the new screen starts fading in (old starts fading out immediately) */
  incomingDelayMs?: number;

  disableInteractionUntilReady?: boolean;
  children?: React.ReactNode;

  onNaturalSize: (size: { w: number; h: number }) => void;
};

type Layer = {
  key: string;
  src: string;
  opacity: number;
  transition: string;
};

type State = {
  layers: [Layer] | [Layer, Layer];
  prevSrc: string;
  contentVisible: boolean;
  pendingTransition: boolean;
};

export function CrossfadeScreen({
  src,
  className,
  style,
  imgClassName = "absolute inset-0 h-full w-full select-none",
  imgStyle,
  durationMs = 150,
  incomingDelayMs = 0,
  //disableInteractionUntilReady = true,
  children,
  onNaturalSize,
}: Props) {
  const [state, setState] = useState<State>({
    layers: [
      {
        key: src,
        src,
        opacity: 1,
        transition: `opacity ${durationMs}ms ease-in-out`,
      },
    ],
    prevSrc: src,
    contentVisible: false,
    pendingTransition: false,
  });

  // getDerivedStateFromProps pattern - update state during render if src changed
  if (src !== state.prevSrc) {
    const current = state.layers[state.layers.length - 1];
    const newLayer: Layer = {
      key: src,
      src,
      opacity: 0,
      transition: `opacity ${durationMs}ms ease-in-out ${incomingDelayMs}ms`,
    };
    // Keep old layer at opacity 1 so it's visible during transition
    const old = {
      ...current,
      opacity: 1,
      transition: `opacity ${durationMs}ms ease-in-out 0ms`,
    };

    setState({
      layers: [old, newLayer],
      prevSrc: src,
      contentVisible: false,
      pendingTransition: true,
    });
  }

  //const showController = useSimStore((s) => s.showController);

  const { layers, contentVisible } = state;
  const timerRef = useRef<number | null>(null);

  // Kick off the crossfade as soon as we have a pending transition,
  // without waiting for the image load event (images are preloaded).
  useEffect(() => {
    if (!state.pendingTransition) return;

    const start = () => {
      setState((prev) => {
        const newLayers = [...prev.layers];

        if (newLayers.length > 1) {
          // Fade out the old layer (first)
          newLayers[0] = { ...newLayers[0], opacity: 0 };
          // Fade in the new layer (last)
          const last = newLayers[newLayers.length - 1];
          newLayers[newLayers.length - 1] = { ...last, opacity: 1 };
        }

        return {
          ...prev,
          layers: newLayers as [Layer] | [Layer, Layer],
          pendingTransition: false,
        };
      });

      timerRef.current = window.setTimeout(() => {
        setState((prev) => {
          if (prev.layers.length > 1) {
            return {
              ...prev,
              layers: [prev.layers[prev.layers.length - 1]],
              contentVisible: true,
            };
          }
          return prev.contentVisible ? prev : { ...prev, contentVisible: true };
        });
        timerRef.current = null;
      }, durationMs + incomingDelayMs);
    };

    const id = requestAnimationFrame(start);
    return () => {
      cancelAnimationFrame(id);
      // Do not clear the timeout here; it must complete to reveal content
    };
  }, [
    state.pendingTransition,
    durationMs,
    incomingDelayMs,
    state.layers.length,
  ]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const onImageLoad = (
    e: React.SyntheticEvent<HTMLImageElement>,
    layer: Layer
  ) => {
    const img = e.currentTarget;
    onNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });

    if (layer.opacity === 0) {
      // Nothing to do here; transition starts immediately via pendingTransition effect
    } else {
      // Initial image load (single layer, already current) -> show children
      if (state.layers.length === 1 && state.layers[0].key === layer.key) {
        if (!state.contentVisible) {
          setState((prev) => ({ ...prev, contentVisible: true }));
        }
      }
    }
  };

  //const isTransitioning = layers.length > 1;

  return (
    <div className={className} style={style}>
      {layers.map((layer) => (
        <img
          key={layer.key}
          src={layer.src}
          alt=""
          draggable={false}
          onLoad={(e) => {
            const img = e.currentTarget;
            // If image was already cached, it loads synchronously
            // Check if it's complete to handle cached images
            if (img.complete && img.naturalWidth > 0) {
              onImageLoad(e, layer);
            } else {
              onImageLoad(e, layer);
            }
          }}
          className={imgClassName}
          style={{
            ...imgStyle,
            position: "absolute",
            inset: 0,
            opacity: layer.opacity,
            transition: layer.transition,
            pointerEvents: "none",
          }}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{
          opacity: contentVisible ? 1 : 0,
          pointerEvents:
            //(disableInteractionUntilReady && isTransitioning) || showController ? "none" : "auto",
            "none"
        }}
      >
        {children}
      </div>
    </div>
  );
}
