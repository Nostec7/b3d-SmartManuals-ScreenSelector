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
type Props = { product: ProductData; screenSetup: ScreenSetup; screenData: ScreenDoc; initial?: { page?: string; section?: string; id?: string }; debug:boolean; className };

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

export default function ScreenController({ screenSetup, screenData, initial, debug, className }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const wrapRect = useResizeObserver(wrapRef);
  const showController = useSimStore((s) => s.showController);
  const setShowController = useSimStore((s) => s.setShowController);

  const [baseSize, setBaseSize] = useState<{ w: number; h: number } | null>(null);
  const [screenSize, setScreenSize] = useState<{ w: number; h: number } | null>(null);
  const [actionMsg, setActionMsg] = useState<{ title: string; message: string; notificationOnly?: boolean } | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const [editedAnchors, setEditedAnchors] = useState<Record<string, Anchor>>({});
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const flatScreens = useMemo(() => screenData.screenOptions, [screenData]);

  const getStartingIndex = () => {
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
  }
  const [currentIndex, setCurrentIndex] = useState(() => getStartingIndex());
  
  // Get current screen with safety check
  const current = useMemo(() => {
    // Clamp currentIndex to valid range
    const clampedIndex = Math.max(0, Math.min(currentIndex, flatScreens.length - 1));
    
    // Only adjust currentIndex if it's out of bounds
    if (currentIndex !== clampedIndex && flatScreens.length > 0) {
      // Use setTimeout to avoid state update during render
      setTimeout(() => setCurrentIndex(clampedIndex), 0);
    }
    
    return flatScreens[clampedIndex] ?? null;
  }, [currentIndex, flatScreens]);

  const imageCache = useMemo(() => new Map<string, HTMLImageElement>(), []);
  function preloadImage(url: string) {
    if (imageCache.has(url)) return imageCache.get(url)!;
    const img = new Image();
    img.src = url;
    img.decode?.().catch(() => {});
    imageCache.set(url, img);
    return img;
  }

  useEffect(() => {
    preloadImage(screenSetup.baseUrl);
    preloadImage(screenSetup.beautyLayerUrl);
    screenData.screenOptions.forEach((s) => {
      preloadImage(s.image.url);
      s.anchors.forEach((a) => {
        if (a.targetImage) {
          a.targetImage.urls.forEach((u) => preloadImage(u));
        }
      });
    });
  }, [screenSetup, screenData]);

  const productMount: ProductMount = useMemo(
    () => ({
      baseUrl: screenSetup.baseUrl,
      beautyLayerUrl: screenSetup.beautyLayerUrl,
      screenCorners: screenSetup.screenCorners,
    }),
    [screenSetup]
  );

  const aspect = baseSize ? baseSize.w / baseSize.h : 16 / 9;

  // HOMOGRAPHY: compute using a real source size (prefer screenSize, then baseSize).
  // Do not use a soft fallback transform — if no real size is known yet, don't render the mapped area.
  const hom = useMemo(() => {
    if (!wrapRect || wrapRect.width <= 1 || wrapRect.height <= 1) return null;
    if (!productMount?.screenCorners || productMount.screenCorners.length !== 4) return null;

    // prefer the actual image natural size (screenSize), fall back to baseSize if necessary
    const srcW = screenSize?.w ?? baseSize?.w;
    const srcH = screenSize?.h ?? baseSize?.h;

    if (!srcW || !srcH) {
      // can't compute reliably yet
      return null;
    }

    try {
      const dst = productMount.screenCorners.map((p) => mulNorm(p, wrapRect.width, wrapRect.height)) as [
        Vec2,
        Vec2,
        Vec2,
        Vec2
      ];

      const src: [Vec2, Vec2, Vec2, Vec2] = [
        { x: 0, y: 0 },
        { x: srcW, y: 0 },
        { x: srcW, y: srcH },
        { x: 0, y: srcH },
      ];

      const Hm = computeHomography(src, dst);
      const invHm = invert3x3(Hm);
      const m = homographyToCssMatrix3d(Hm);

      return { css: `matrix3d(${m.join(",")})`, invHm, screenW: srcW, screenH: srcH } as const;
    } catch (err) {
      // If homography fails, log once and return null — we'll recompute when sizes change.
      console.warn("Homography computation failed", err);
      return null;
    }
  }, [wrapRect?.width, wrapRect?.height, productMount, screenSize?.w, screenSize?.h, baseSize?.w, baseSize?.h]);

  const onScreenNaturalSize = useCallback((size: { w: number; h: number }) => {
    if (size.w > 1 && size.h > 1) setScreenSize((p) => (p?.w === size.w && p?.h === size.h ? p : size));
  }, []);

  const clientToScreen1000 = useCallback(
    (clientX: number, clientY: number) => {
      if (!wrapRef.current || !screenSize) return null;
      const r = wrapRef.current.getBoundingClientRect();
      const xPx = clientX - r.left;
      const yPx = clientY - r.top;
      return { x: (xPx / screenSize.w) * 500, y: (yPx / screenSize.h) * 500 };
    },
    [screenSize]
  );

  const anchorsForHotspots = useMemo(() => {
    if (!current?.anchors) return current?.anchors;
    if (!debug) return current.anchors;
    return current.anchors.map((a) => editedAnchors[a.key ?? ""] ?? a);
  }, [current, debug, editedAnchors]);

  function getNextImageUrl(currentUrl: string, targetImage: { direction: "forward" | "backwards" | "forward-backwards"; urls: string[] }) {
    const { urls, direction } = targetImage;
    if (urls.length === 0) return currentUrl;
    const idx = urls.indexOf(currentUrl);
    if (idx === -1) return urls[0];
    if (direction === "forward") return urls[Math.min(idx + 1, urls.length - 1)];
    if (direction === "forward-backwards") return urls[idx === 0 ? 1 : 0];
    return urls[Math.max(idx - 1, 0)];
  }

  // When feature (screenData) changes: clamp index, set image and clear editors.
  useEffect(() => {
    const maxIndex = Math.max(0, screenData.screenOptions.length - 1);
    const currentIndexClamped = Math.min(Math.max(0, getStartingIndex()), maxIndex);
    
    setCurrentIndex(currentIndexClamped);
    const nextScreen = screenData.screenOptions[currentIndexClamped];
    setCurrentImageUrl(nextScreen?.image?.url ?? null);
    
    // Reset homography-related state
    setScreenSize(null);
    setEditedAnchors({});
    setSelectedKey(null);
    setActionMsg(null);
  }, [screenData]);

  // when current changes: reload image and force measurement
  useEffect(() => {
    if (!current) return;
    setCurrentImageUrl(null);
    setScreenSize(null);
    const t = window.setTimeout(() => setCurrentImageUrl(current.image.url), 0);
    return () => window.clearTimeout(t);
  }, [current]);

  const onHotspotClick = useCallback((anchor: Anchor) => {
    if (debug) {
      const key = anchor.key ?? null;
      setSelectedKey(key);
      if (key && !editedAnchors[key]) {
        const copy: Anchor = { ...anchor };
        if ((!copy.box || copy.box.length !== 4) && copy.box_2d?.length === 4) copy.box = box2dToBox(copy.box_2d as [number, number, number, number]);
        else if ((!copy.box_2d || copy.box_2d.length !== 4) && copy.box?.length === 4) {
          const [x, y, w, h] = copy.box as [number, number, number, number];
          copy.box_2d = [y, x, y + h, x + w];
        }
        setEditedAnchors((prev) => ({ ...prev, [key]: copy }));
      }
      return;
    }

    if (anchor.actionMsg) setActionMsg(anchor.actionMsg);
    else setActionMsg(null);

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
    }
  }, [debug, screenData, editedAnchors, currentImageUrl]);

  const onBoxChange = useCallback((key: string, box_2d: [number, number, number, number]) => {
    if (debug && key) {
      const original = current?.anchors?.find((a) => a.key === key);
      const prevEdited = editedAnchors[key];
      const updated: Anchor = { ...(prevEdited ?? original ?? {} as Anchor), box_2d, box: box2dToBox(box_2d) };
      setEditedAnchors((prev) => ({ ...prev, [key]: updated }));
    } else {
      console.log("box changed", key, box_2d);
    }
  }, [debug, current, editedAnchors]);

  const prevIndexRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      prevIndexRef.current = currentIndex;
      const t = window.setTimeout(() => { setEditedAnchors({}); setSelectedKey(null); }, 0);
      return () => window.clearTimeout(t);
    }
  }, [currentIndex]);

  if (!current) return <div className="p-6 text-sm">Loading…</div>;

  // source size used for rendering container when hom exists
  const srcW = (screenSize?.w ?? baseSize?.w) ?? 0;
  const srcH = (screenSize?.h ?? baseSize?.h) ?? 0;

  return (
    <div className={`mx-0 w-full max-w-245 p-3 relative ${className}`}>
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
              onLoad={(e) => { const img = e.currentTarget; setBaseSize({ w: img.naturalWidth, h: img.naturalHeight }); }}
            />

            {/* measure screen natural size */}
            {!screenSize && currentImageUrl && (
              <img
                src={currentImageUrl}
                className="pointer-events-none absolute h-px w-px opacity-0"
                onLoad={(e) => onScreenNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              />
            )}

            {/* Render mapped screen only when homography is available (no soft fallback) */}
            {hom && srcW > 0 && srcH > 0 && (
              <div>
                <div
                  className="absolute left-0 top-0 will-change-transform"
                  style={{
                    width: srcW,
                    height: srcH,
                    transformOrigin: "0 0",
                    transform: hom.css,
                  }}
                >
                  {currentImageUrl && (
                    <CrossfadeScreen
                      src={currentImageUrl}
                      durationMs={150}
                      className="absolute inset-0 z-20 w-full h-full"
                      onNaturalSize={onScreenNaturalSize}
                    />
                  )}
                </div>

                <img
                  src={productMount.beautyLayerUrl}
                  alt="Base beauty"
                  draggable={false}
                  className="absolute inset-0 h-full w-full select-none object-cover pointer-events-none z-2"
                  onLoad={(e) => setBaseSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                />

                <ActionNotification
                  isOpen={actionMsg !== null}
                  title={actionMsg?.title ?? ""}
                  message={actionMsg?.message ?? ""}
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
              </div>
            )}

          </motion.div>
        </div>
      </AnimatePresence>
    </div>
  );
}