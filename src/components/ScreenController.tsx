import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Anchor, ProductMount, Vec2 } from "../types";
import { useResizeObserver } from "../hooks/useResizeObserver";
import {
  computeHomography,
  homographyToCssMatrix3d,
  invert3x3,
} from "../utils/homography";
import { CrossfadeScreen } from "./CrossfadeScreen";
import { Hotspots } from "./Hotspots";
import ActionNotification from "./ActionNotification";
import { useSimStore } from "../stores/useSimStore";

/* -------------------------------------------------------------------------- */
/* --------------------------- Component types --------------------------------*/
/* -------------------------------------------------------------------------- */

type ProductData = {
  id: string;
  title: string;
  pdfID: string;
  p3dID?: string;
  img?: string;
  voiceover?: string;
};

type ScreenSetup = {
  pdfID: string;
  baseUrl: string;
  beautyLayerUrl: string;
  screenCorners: { x: number; y: number }[];
};

type ScreenOptionData = {
  id: string;     // page key (new)
  section: string;
  image: { url: string; targets?: string[] };
  anchors: Anchor[];
};

type ScreenDoc = {
  pdfID: string;
  docPath: string;
  id: string;
  label: string;
  screenOptions: ScreenOptionData[];
};

type Props = {
  product: ProductData;
  screenSetup: ScreenSetup;
  screenData: ScreenDoc; // single object now
  initial?: { page?: string; section?: string; id?: string };
};

/* -------------------------------------------------------------------------- */
/* --------------------------- Helpers --------------------------------------- */
/* -------------------------------------------------------------------------- */

function mulNorm(p: Vec2, w: number, h: number): Vec2 {
  return { x: p.x * w, y: p.y * h };
}

function applyHomographyPoint(H: number[][], x: number, y: number) {
  const a = H[0][0] * x + H[0][1] * y + H[0][2];
  const b = H[1][0] * x + H[1][1] * y + H[1][2];
  const c = H[2][0] * x + H[2][1] * y + H[2][2];
  return { x: a / c, y: b / c };
}

/* Resolve a target anchor to a flat screen index */
function findTargetScreenIndex(
  screenData: ScreenDoc,
  target: { section: string; id?: string } | undefined
): number {
  if (!target) return -1;

  // primary match
  for (let i = 0; i < screenData.screenOptions.length; i++) {
    const s = screenData.screenOptions[i];

    if (target.id && s.id === target.id && s.section === target.section) {
      return i;
    }
  }

  // fallback: section only
  const sectionIndex = screenData.screenOptions.findIndex(
    (s) => s.section === target.section
  );

  return sectionIndex;
}

/* -------------------------------------------------------------------------- */
/* --------------------------- Component ------------------------------------- */
/* -------------------------------------------------------------------------- */

export default function ScreenController({
  screenSetup,
  screenData,
  initial,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const wrapRect = useResizeObserver(wrapRef);
  const showController = useSimStore((s) => s.showController);
  const setShowController = useSimStore((s) => s.setShowController);

  const [baseSize, setBaseSize] = useState<{ w: number; h: number } | null>(null);
  const [screenSize, setScreenSize] = useState<{ w: number; h: number } | null>(null);
  const [actionMsg, setActionMsg] = useState<{ title: string; message: string } | null>(null);
  const [selectedKey, ] = useState<string | null>(null);
  const [debug] = useState(false);

  /* ----------------------- flatten screens once ---------------------------- */

  const flatScreens = useMemo(() => {
    return screenData.screenOptions;
  }, [screenData]);

  /* -------------------------- initial routing ------------------------------ */

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!initial) return 0;

    if (initial.page && initial.section) {
      const i = flatScreens.findIndex(
        (s) => s.id === initial.page && s.section === initial.section
      );
      if (i !== -1) return i;
    }

    if (initial.id && initial.section) {
      const i = flatScreens.findIndex(
        (s) => s.id === initial.id && s.section === initial.section
      );
      if (i !== -1) return i;
    }

    return 0;
  });

  const current = flatScreens[currentIndex];

  /* ----------------------------- preload ---------------------------------- */
  
  function preloadImage(url: string) {
    if (imageCache.has(url)) return imageCache.get(url)!;

    const img = new Image();
    img.src = url;

    img.decode?.().catch(() => {});
    imageCache.set(url, img);

    return img;
  }
  const imageCache = new Map<string, HTMLImageElement>();


  useEffect(() => {
    preloadImage(screenSetup.baseUrl);
    preloadImage(screenSetup.beautyLayerUrl);
  
    screenData.screenOptions.forEach(s =>
      preloadImage(s.image.url)
    );
  
    flatScreens.forEach(s =>
      preloadImage(s.image.url)
    );
  }, [screenSetup, flatScreens, screenData]);
  

 
  /* ---------------------------- mount ------------------------------------- */

  const productMount: ProductMount = useMemo(
    () => ({
      baseUrl: screenSetup.baseUrl,
      beautyLayerUrl: screenSetup.beautyLayerUrl,
      screenCorners: screenSetup.screenCorners,
    }),
    [screenSetup]
  );

  const aspect = baseSize ? baseSize.w / baseSize.h : 16 / 9;

  /* --------------------------- homography --------------------------------- */

  const hom = useMemo(() => {
    if (!wrapRect || !screenSize) return null;

    const dst = productMount.screenCorners.map((p) =>
      mulNorm(p, wrapRect.width, wrapRect.height)
    ) as [Vec2, Vec2, Vec2, Vec2];

    const src: [Vec2, Vec2, Vec2, Vec2] = [
      { x: 0, y: 0 },
      { x: screenSize.w, y: 0 },
      { x: screenSize.w, y: screenSize.h },
      { x: 0, y: screenSize.h },
    ];

    const Hm = computeHomography(src, dst);
    const invHm = invert3x3(Hm);
    const m = homographyToCssMatrix3d(Hm);

    return {
      css: `matrix3d(${m.join(",")})`,
      invHm,
      screenW: screenSize.w,
      screenH: screenSize.h,
    } as const;
  }, [wrapRect, screenSize, productMount]);



  const onScreenNaturalSize = useCallback((size: { w: number; h: number }) => {
    setScreenSize((p) => (p?.w === size.w && p?.h === size.h ? p : size));
  }, []);

  const clientToScreen1000 = useCallback(
    (clientX: number, clientY: number) => {
      if (!wrapRef.current || !hom) return null;
      const r = wrapRef.current.getBoundingClientRect();
      const p = applyHomographyPoint(
        hom.invHm,
        clientX - r.left,
        clientY - r.top
      );
      return {
        x: (p.x / hom.screenW) * 1000,
        y: (p.y / hom.screenH) * 1000,
      };
    },
    [hom]
  );

  const onHotspotClick = useCallback(
    (anchor: Anchor) => {
      if (anchor.targetScreen) {
        const idx = findTargetScreenIndex(screenData, anchor.targetScreen);
        if (idx !== -1) {
          setCurrentIndex(idx);
          return;
        }
      }
      if (anchor.actionMsg) setActionMsg(anchor.actionMsg);
    },
    [screenData]
  );

  const onBoxChange = useCallback((key: string, box: [number, number, number, number]) => {
    console.log("box changed", key, box);
  }, []);

  if (!current) return <div className="p-6 text-sm">Loading…</div>;



  return (
    <div className="mx-auto w-full max-w-245 p-3 relative">
      <AnimatePresence mode="wait">
        <div className={`relative mt-3 w-full overflow-hidden rounded-2xl transition-opacity duration-1000 ${showController ? 'opacity-100' : 'opacity-0'}`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.45 }}
            ref={wrapRef}
            className="relative mt-2 w-full overflow-hidden rounded-2xl bg-black/5"
            style={{ aspectRatio: `${aspect}` }}
          >
            {/* Base layer */}
            <img
              src={productMount.baseUrl}
              alt="Base render"
              draggable={false}
              className="absolute inset-0 h-full w-full select-none object-cover z-0"
              onLoad={(e) => {
                const img = e.currentTarget;
                setBaseSize({ w: img.naturalWidth, h: img.naturalHeight });
              }}
            />

            {/* Seed screen natural size (hidden) */}
            {!screenSize && (
              <img
                src={current.image.url}
                alt=""
                draggable={false}
                className="pointer-events-none absolute h-px w-px opacity-0"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  onScreenNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
                }}
              />
            )}

            {/* Warped screen (when homography available) */}
            {hom && screenSize && (
              <div>
                <div
                  className="absolute left-0 top-0 will-change-transform"
                  style={{
                    width: screenSize.w,
                    height: screenSize.h,
                    transformOrigin: "0 0",
                    transform: hom.css,
                  }}
                >
                  <CrossfadeScreen
                    src={current.image.url}
                    durationMs={0}
                    className="absolute inset-0 z-20 w-full h-full"
                    onNaturalSize={({ w, h }) => {
                      console.log("Natural size:", w, h);
                    }}
                  />
                </div>

                {/* Beauty layer */}
                <img
                  src={productMount.beautyLayerUrl}
                  alt="Base beauty"
                  draggable={false}
                  className="absolute inset-0 h-full w-full select-none object-cover pointer-events-none z-2"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    setBaseSize({ w: img.naturalWidth, h: img.naturalHeight });
                  }}
                />

                <ActionNotification
                  isOpen={actionMsg !== null}
                  title={actionMsg != null ? actionMsg.title : ""}
                  message={actionMsg != null ? actionMsg.message : ""}
                  onClose={() => setActionMsg(null)}
                />

                {/* Invisible overlay for the hotspots */}
                {hom && screenSize && (
                  <div
                    className="absolute left-0 top-0 inset-0"
                    style={{
                      width: screenSize.w,
                      height: screenSize.h,
                      transformOrigin: "0 0",
                      transform: hom.css,
                      pointerEvents: "none",
                    }}
                  />
                )}

                <Hotspots
                  anchors={current.anchors}
                  editing={!!debug}
                  selectedKey={selectedKey}
                  clientToScreen1000={clientToScreen1000}
                  onBoxChange={onBoxChange}
                  onHotspotClick={onHotspotClick}
                  className="cursor-pointer z-10"
                />
                <button className="relative bg-white z-12 m-2 px-4 py-4 font-bold rounded-lg hover:opacity-50 cursor-pointer opacity-80" onClick={() => {
                  setShowController(false);
                }}>
                  Back
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </AnimatePresence>
    </div>
  );
}
