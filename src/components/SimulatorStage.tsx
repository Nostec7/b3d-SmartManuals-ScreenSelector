import { useMemo, useRef, useState, useCallback } from "react";
import type { Anchor, ProductMount, Vec2 } from "../types";
import { useResizeObserver } from "../hooks/useResizeObserver";
import {
  computeHomography,
  homographyToCssMatrix3d,
  cssMatrix3dString,
  invert3x3,
  //applyHomography,
} from "../utils/homography";
import { Hotspots } from "./Hotspots";
import { CrossfadeScreen } from "./CrossfadeScreen";
import ActionNotification from "./ActionNotification";
import { useSimStore } from "../stores/useSimStore";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  product: ProductMount;
  screenUrl: string;
  anchors: Anchor[];
  debug?: boolean;
  selectedKey: string | null;
  className: string;
  onHotspotClick: (anchor: Anchor) => void;

  /** Editing callbacks */
  onBoxChange: (
    anchorKey: string,
    box: [number, number, number, number]
  ) => void;
};

function mulNorm(p: Vec2, w: number, h: number): Vec2 {
  return { x: p.x * w, y: p.y * h };
}

export function SimulatorStage({
  product,
  screenUrl,
  anchors,
  debug,
  selectedKey,
  className,
  onHotspotClick,
  onBoxChange,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const wrapRect = useResizeObserver(wrapRef);

  const [baseSize, setBaseSize] = useState<{ w: number; h: number } | null>(
    null
  );

  const [screenSize, setScreenSize] = useState<{ w: number; h: number } | null>(
    null
  );

  const actionMsg = useSimStore((s) => s.actionMsg);
  const setActionMsg = useSimStore((s) => s.setActionMsg);
  const showController = useSimStore((s) => s.showController);

  const onScreenNaturalSize = useCallback((size: { w: number; h: number }) => {
    // Avoid noisy rerenders if identical
    setScreenSize((prev) => {
      if (prev?.w === size.w && prev?.h === size.h) return prev;
      return size;
    });
  }, []);

  const aspect = baseSize ? baseSize.w / baseSize.h : 16 / 9;
  const [showCorners] = useState(false);

  const hom = useMemo(() => {
    if (!wrapRect || !screenSize) return null;

    const W = wrapRect.width;
    const H = wrapRect.height;

    const dst = product.screenCorners.map((p) => mulNorm(p, W, H)) as [
      Vec2,
      Vec2,
      Vec2,
      Vec2
    ];

    const src: [Vec2, Vec2, Vec2, Vec2] = [
      { x: 0, y: 0 },
      { x: screenSize.w, y: 0 },
      { x: screenSize.w, y: screenSize.h },
      { x: 0, y: screenSize.h },
    ];

    const Hm = computeHomography(src, dst); // screenPx -> wrapperPx
    const invHm = invert3x3(Hm); // wrapperPx -> screenPx
    const m = homographyToCssMatrix3d(Hm);
    const css = cssMatrix3dString(m);

    return { css, invHm, screenW: screenSize.w, screenH: screenSize.h };
  }, [wrapRect, screenSize, product.screenCorners]);

  const clientToScreen1000 = useCallback(
    (clientX: number, clientY: number) => {
      // if (!wrapRef.current || !hom) return null;
      // const r = wrapRef.current.getBoundingClientRect();
      // const x = clientX - r.left;
      // const y = clientY - r.top;

      // const p = applyHomography(hom.invHm, x, y); // -> screenPx
      // const sx = (p.x / hom.screenW) * 1000;
      // const sy = (p.y / hom.screenH) * 1000;

      // return { x: sx, y: sy };
      return {x: clientX, y: clientY}
    },
    [hom]
  );

  return (
    <div className={`mx-auto w-full max-w-245 p-3 ${showController ? 'pointer-events-auto' : 'pointer-events-none'} ${className}`}>

      {/* <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-extrabold tracking-tight">
            {product.name ?? "Simulator"}
          </div>
          <div className="text-xs text-black/60">
            Base + warped screen + hotspots
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-black/80">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={showCorners}
            onChange={(e) => setShowCorners(e.target.checked)}
          />
          Show screen corners
        </label>
      </div> */}

        {/* {showController && ( */}
          <AnimatePresence mode="wait">
          <div className={`relative mt-3 w-full overflow-hidden rounded-2xl`}>
            <motion.div
              initial={{ opacity: 0, scale: 0.85, filter: "blur(10px)" }}
              animate={
                showController
                  ? {
                      opacity: 1,
                      scale: 1,
                      filter: "blur(0px)",
                      pointerEvents: "auto",
                    }
                  : {
                      opacity: 0,
                      scale: 0.85,
                      filter: "blur(10px)",
                      pointerEvents: "none",
                    }
              }
              exit={{ opacity: 0, scale: 0.85, filter: "blur(10px)" }}
              
              
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
  
              ref={wrapRef}
              className="relative mt-3 w-full overflow-hidden rounded-2xl bg-black/5"
              style={{ aspectRatio: `${aspect}` }}
            >
              
              <img
                src={product.baseUrl}
                alt="Base render"
                draggable={false}
                className="absolute inset-0 h-full w-full select-none object-cover z-0"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setBaseSize({ w: img.naturalWidth, h: img.naturalHeight });
                }}
              />
  
              {/* PROBE: seed screenSize so hom can be computed (breaks the circular dependency) */}
              {!screenSize && (
                <img
                  src={screenUrl}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute h-px w-px opacity-0"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    onScreenNaturalSize({
                      w: img.naturalWidth,
                      h: img.naturalHeight,
                    });
                  }}
                />
              )}
  
              {hom && screenSize && (
                <div
                  className="absolute left-0 top-0 will-change-transform"
                  style={{
                    width: screenSize.w,
                    height: screenSize.h,
                    transformOrigin: "0 0",
                    transform: hom.css,
                    pointerEvents: showController ? 'auto' : 'none',
                  }}
                >
                  <CrossfadeScreen
                    src={screenUrl}
                    durationMs={150}
                    incomingDelayMs={0}
                    className="absolute inset-0"
                    imgClassName="absolute inset-0 h-full w-full select-none z-1 pointer-events-none"
                    imgStyle={{ objectFit: "fill" }}
                    disableInteractionUntilReady
                    onNaturalSize={onScreenNaturalSize}
                  >
                  </CrossfadeScreen>
                </div>
              )}
  
              <img
                src={product.beautyLayerUrl}
                alt="Base render"
                draggable={false}
                className="absolute inset-0 h-full w-full select-none object-cover pointer-events-none z-2"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setBaseSize({ w: img.naturalWidth, h: img.naturalHeight });
                }}
              />
              <ActionNotification
                isOpen={actionMsg !== null}
                title={actionMsg != null ? actionMsg.title: ""}
                message={actionMsg != null ? actionMsg.message: ""}
                onClose={() => setActionMsg(null)}
              />
  
  
              {hom && screenSize && (
                <div
                  className="absolute left-0 top-0 will-change-transform inset-0"
                  style={{
                    width: screenSize.w,
                    height: screenSize.h,
                    transformOrigin: "0 0",
                    transform: hom.css,
                    pointerEvents: showController ? 'auto' : 'none',
                  }}
                >
                  
                </div>
              )}
              <Hotspots
                    anchors={anchors}
                    editing={!!debug}
                    selectedKey={selectedKey}
                    clientToScreen1000={clientToScreen1000}
                    onBoxChange={onBoxChange}
                    onHotspotClick={onHotspotClick}
                    className="cursor-pointer z-10"
                  />
  
              {showCorners && wrapRect && (
                <div className="pointer-events-none absolute inset-0">
                  {product.screenCorners.map((p, idx) => (
                    <div
                      key={idx}
                      className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/80"
                      style={{
                        left: p.x * wrapRect.width,
                        top: p.y * wrapRect.height,
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </AnimatePresence>
        {/* )} */}
      

    </div>
  );
}
