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

type ProductData = { id: string; title: string; pdfID: string; p3dID?: string; img?: string; voiceover?: string; };
type ScreenSetup = { pdfID: string; baseUrl: string; beautyLayerUrl: string; screenCorners: { x: number; y: number }[]; };
type ScreenOptionData = { id: string; section: string; image: { url: string; targets?: string[] }; anchors: Anchor[]; };
type ScreenDoc = { pdfID: string; docPath: string; id: string; label: string; screenOptions: ScreenOptionData[]; };
type Props = { product: ProductData; screenSetup: ScreenSetup; screenData: ScreenDoc; initial?: { page?: string; section?: string; id?: string }; debug:boolean; };

function mulNorm(p: Vec2, w: number, h: number): Vec2 { return { x: p.x * w, y: p.y * h }; }

function findTargetScreenIndex(screenData: ScreenDoc, target: { section: string; id?: string } | undefined): number {
  if (!target) return -1;
  for (let i = 0; i < screenData.screenOptions.length; i++) {
    const s = screenData.screenOptions[i];
    if (target.id && s.id === target.id && s.section === target.section) return i;
  }
  return screenData.screenOptions.findIndex((s) => s.section === target.section);
}

function box2dToBox(box2d: [number, number, number, number]): [number, number, number, number] {
  const [yMin, xMin, yMax, xMax] = box2d;
  return [xMin, yMin, xMax - xMin, yMax - yMin];
}

export default function ScreenController({ screenSetup, screenData, initial, debug }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const wrapRect = useResizeObserver(wrapRef);
  const showController = useSimStore((s) => s.showController);
  const setShowController = useSimStore((s) => s.setShowController);

  const [baseSize, setBaseSize] = useState<{ w: number; h: number } | null>(null);
  const [screenSize, setScreenSize] = useState<{ w: number; h: number } | null>(null);
  const [actionMsg, setActionMsg] = useState<{ title: string; message: string; notificationOnly?: boolean } | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const [editedAnchors, setEditedAnchors] = useState<Record<string, Anchor>>({});

  const flatScreens = useMemo(() => screenData.screenOptions, [screenData]);

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!initial) return 0;
    if (initial.page && initial.section) {
      const i = flatScreens.findIndex((s) => s.id === initial.page && s.section === initial.section);
      if (i !== -1) return i;
    }
    if (initial.id && initial.section) {
      const i = flatScreens.findIndex((s) => s.id === initial.id && s.section === initial.section);
      if (i !== -1) return i;
    }
    return 0;
  });

  const current = flatScreens[currentIndex];

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
    screenData.screenOptions.forEach((s) => {
      preloadImage(s.image.url)
      s.anchors.forEach((a) => {
        if(a.targetImage){
          a.targetImage.urls.forEach((u) => {
            preloadImage(u);
          })
        }
      })
    });
    flatScreens.forEach((s) => preloadImage(s.image.url));
  }, [screenSetup, flatScreens, screenData]);

  const productMount: ProductMount = useMemo(
    () => ({
      baseUrl: screenSetup.baseUrl,
      beautyLayerUrl: screenSetup.beautyLayerUrl,
      screenCorners: screenSetup.screenCorners,
    }),
    [screenSetup]
  );

  const aspect = baseSize ? baseSize.w / baseSize.h : 16 / 9;

  const hom = useMemo(() => {
    if (!wrapRect || !screenSize) return null;
    const dst = productMount.screenCorners.map((p) => mulNorm(p, wrapRect.width, wrapRect.height)) as [Vec2, Vec2, Vec2, Vec2];
    const src: [Vec2, Vec2, Vec2, Vec2] = [
      { x: 0, y: 0 },
      { x: screenSize.w, y: 0 },
      { x: screenSize.w, y: screenSize.h },
      { x: 0, y: screenSize.h },
    ];
    const Hm = computeHomography(src, dst);
    const invHm = invert3x3(Hm);
    const m = homographyToCssMatrix3d(Hm);
    return { css: `matrix3d(${m.join(",")})`, invHm, screenW: screenSize.w, screenH: screenSize.h } as const;
  }, [wrapRect, screenSize, productMount]);

  const onScreenNaturalSize = useCallback((size: { w: number; h: number }) => {
    setScreenSize((p) => (p?.w === size.w && p?.h === size.h ? p : size));
  }, []);

  const clientToScreen1000 = useCallback(
    (clientX: number, clientY: number) => {
      if (!wrapRef.current || !screenSize) return null;

      const r = wrapRef.current.getBoundingClientRect();

      const xPx = clientX - r.left;
      const yPx = clientY - r.top;

      return {
        x: (xPx / screenSize.w) * 500,
        y: (yPx / screenSize.h) * 500,
      };
    },
    [screenSize]
  );

  const anchorsForHotspots = useMemo(() => {
    if (!current?.anchors) return current?.anchors;
    if (!debug) return current.anchors;

    return current.anchors.map((a) => {
      if (!a.key) return a;
      if (editedAnchors[a.key]) return editedAnchors[a.key];
      return a;
    });
  }, [current, debug, editedAnchors]);

  // NEW: state for current screen image (supports targetImage)
  const [currentImageUrl, setCurrentImageUrl] = useState<string>(current.image.url);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentImageUrl(current.image.url);
  }, [current.image.url]);

  function getNextImageUrl(
    currentUrl: string,
    targetImage: { direction: "forward" | "backwards" | "forward-backwards"; urls: string[] }
  ): string {
    const { urls, direction } = targetImage;
    if (urls.length === 0) return currentUrl;
  
    const currentIndex = urls.indexOf(currentUrl);
  
    // 1. Current image not in urls → use first
    if (currentIndex === -1) {
      return urls[0];
    }
  
    // 2 & 3. Move forward or backward (clamped)
    if (direction == "forward") {
      return urls[Math.min(currentIndex + 1, urls.length - 1)];
    } else if(direction == "forward-backwards"){

      const nextIndex = currentIndex === 0 ? 1 : 0;

      return urls[nextIndex];
    }
  
    return urls[Math.max(currentIndex - 1, 0)];
  }

  
  const onHotspotClick = useCallback(
    (anchor: Anchor) => {
      if (debug) {
        const key = anchor.key ?? null;
        setSelectedKey(key);

        if (key && !editedAnchors[key]) {
          const copy: Anchor = { ...anchor };
          if ((!copy.box || copy.box.length !== 4) && copy.box_2d && copy.box_2d.length === 4) {
            copy.box = box2dToBox(copy.box_2d as [number, number, number, number]);
          } else if ((!copy.box_2d || copy.box_2d.length !== 4) && copy.box && copy.box.length === 4) {
            const [x, y, w, h] = copy.box as [number, number, number, number];
            copy.box_2d = [y, x, y + h, x + w];
          }
          setEditedAnchors((prev) => ({ ...prev, [key]: copy }));
        }
        console.log("Selected anchor (debug):", anchor);
        return;
      }

      if (anchor.actionMsg) setActionMsg(anchor.actionMsg);

      if (anchor.targetScreen) {
        const idx = findTargetScreenIndex(screenData, anchor.targetScreen);
        if (idx !== -1) {
          setCurrentIndex(idx);
          return;
        }
      }


      if (anchor.targetImage) {
        const nextUrl = getNextImageUrl(currentImageUrl, anchor.targetImage);
        if (nextUrl !== currentImageUrl) {
          preloadImage(nextUrl);
          setCurrentImageUrl(nextUrl);
        }
        return;
      }
    },
    [debug, screenData, editedAnchors, currentImageUrl]
  );

  const onBoxChange = useCallback(
    (key: string, box_2d: [number, number, number, number]) => {
      if (debug && key) {
        const original = current?.anchors?.find((a) => a.key === key);
        const prevEdited = editedAnchors[key];
        const computedBox = box2dToBox(box_2d);

        const updated: Anchor = {
          ...(prevEdited ?? original ?? ({} as Anchor)),
          box_2d,
          box: computedBox,
        };

        setEditedAnchors((prev) => ({ ...prev, [key]: updated }));
        console.log("Anchor moved", key, box_2d);
        return;
      }

      console.log("box changed", key, box_2d);
    },
    [debug, current, editedAnchors]
  );

  const prevIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      prevIndexRef.current = currentIndex;

      const t = window.setTimeout(() => {
        setEditedAnchors({});
        setSelectedKey(null);
      }, 0);

      return () => window.clearTimeout(t);
    }
  }, [currentIndex]);

  if (!current) return <div className="p-6 text-sm">Loading…</div>;

  return (
    <div className="mx-0 w-full max-w-245 p-3 relative">
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

            {!screenSize && (
              <img
                src={currentImageUrl}
                alt=""
                draggable={false}
                className="pointer-events-none absolute h-px w-px opacity-0"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  onScreenNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
                }}
              />
            )}

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
                    src={currentImageUrl}
                    durationMs={150}
                    className="absolute inset-0 z-20 w-full h-full"
                    onNaturalSize={({ w, h }) => {
                      console.log("Natural size:", w, h);
                    }}
                  />
                </div>

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
                  notificationOnly={actionMsg?.notificationOnly}
                  onClose={() => setActionMsg(null)}
                />

                <Hotspots
                  anchors={anchorsForHotspots ?? current.anchors}
                  editing={!!debug}
                  selectedKey={selectedKey}
                  clientToScreen1000={clientToScreen1000}
                  onBoxChange={onBoxChange}
                  onHotspotClick={onHotspotClick}
                  className="cursor-pointer z-10"
                />

                {/* <button
                  className="relative bg-white z-12 m-2 px-4 py-4 font-bold rounded-lg hover:opacity-50 cursor-pointer opacity-80"
                  onClick={() => setShowController(false)}
                >
                  Back
                </button> */}
              </div>
            )}
          </motion.div>
        </div>
      </AnimatePresence>
    </div>
  );
}
