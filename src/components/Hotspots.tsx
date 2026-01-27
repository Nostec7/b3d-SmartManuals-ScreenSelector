import { useEffect, useMemo, useRef, useState } from "react";
import type { Anchor } from "../types";
import { motion } from "framer-motion";
type Box2D = [number, number, number, number]; // [yMin,xMin,yMax,xMax] 0..1000
type Pt = { x: number; y: number };
type Handle = "move" | "nw" | "ne" | "se" | "sw";

type Props = {
  anchors: Anchor[];
  editing: boolean;
  selectedKey: string | null;
  className: string;

  /** Convert pointer client coords to screen coords in 0..1000 space */
  clientToScreen1000: (clientX: number, clientY: number) => Pt | null;

  onBoxChange: (anchorKey: string, box: Box2D) => void;
  onBoxChangeStopped: (anchorKey: string, box: Box2D) => void;
  onHotspotClick: (anchor: Anchor) => void;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function normalizeBox(box: Box2D, minSize = 6): Box2D {
  let [y0, x0, y1, x1] = box;

  if (x1 < x0) [x0, x1] = [x1, x0];
  if (y1 < y0) [y0, y1] = [y1, y0];

  x0 = clamp(x0, 0, 1000);
  x1 = clamp(x1, 0, 1000);
  y0 = clamp(y0, 0, 1000);
  y1 = clamp(y1, 0, 1000);

  if (x1 - x0 < minSize) x1 = clamp(x0 + minSize, 0, 1000);
  if (y1 - y0 < minSize) y1 = clamp(y0 + minSize, 0, 1000);

  return [y0, x0, y1, x1];
}

export function Hotspots({
  anchors,
  editing,
  selectedKey,
  className,
  clientToScreen1000,
  onBoxChange,
  onBoxChangeStopped,
  onHotspotClick,
}: Props) {
  // Active drag state
  const dragRef = useRef<{
    key: string;
    handle: Handle;
    pointerId: number;
    lastPt: Pt; // last pointer pos in screen 0..1000
    lastBox: Box2D; // last computed box in 0..1000
    capturedElement?: Element | null;
  } | null>(null);

  const moveListenerRef = useRef<(ev: PointerEvent) => void>();
  const upListenerRef = useRef<(ev: PointerEvent) => void>();

  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const anchorMap = useMemo(() => {
    const m = new Map<string, Anchor>();
    anchors.forEach((a) => m.set(a.key, a));
    return m;
  }, [anchors]);

  function getBox(a: Anchor): Box2D {
    const [yMin, xMin, yMax, xMax] = a.box_2d;
    return [yMin, xMin, yMax, xMax];
  }

  // Apply an incremental drag from a native PointerEvent (clientX/clientY)
  function applyDragFromNative(ev: PointerEvent, commit = false) {
    const d = dragRef.current;
    if (!d || ev.pointerId !== d.pointerId) return;

    const pt = clientToScreen1000(ev.clientX, ev.clientY);
    if (!pt) return;

    const dx = pt.x - d.lastPt.x;
    const dy = pt.y - d.lastPt.y;

    let [y0, x0, y1, x1] = d.lastBox;

    switch (d.handle) {
      case "move":
        x0 += dx;
        x1 += dx;
        y0 += dy;
        y1 += dy;
        break;
      case "nw":
        x0 += dx;
        y0 += dy;
        break;
      case "ne":
        x1 += dx;
        y0 += dy;
        break;
      case "se":
        x1 += dx;
        y1 += dy;
        break;
      case "sw":
        x0 += dx;
        y1 += dy;
        break;
    }

    if (d.handle === "move") {
      const w = x1 - x0;
      const h = y1 - y0;
      x0 = clamp(x0, 0, 1000 - w);
      y0 = clamp(y0, 0, 1000 - h);
      x1 = x0 + w;
      y1 = y0 + h;
    }

    const nextBox = normalizeBox([y0, x0, y1, x1], 8);

    // update last state
    d.lastPt = pt;
    d.lastBox = nextBox;

    if (commit) {
      onBoxChangeStopped(d.key, nextBox);
      // cleanup handled in endDragFromNative
    } else {
      onBoxChange(d.key, nextBox);
    }
  }

  // End drag and cleanup. If ev provided, commit that final event; otherwise commit lastBox.
  function endDragFromNative(ev?: PointerEvent) {
    const d = dragRef.current;
    if (!d) return;

    try {
      if (ev && ev.pointerId === d.pointerId) {
        applyDragFromNative(ev, true);
      } else {
        onBoxChangeStopped(d.key, d.lastBox);
      }
    } catch {
      // ignore any errors but still cleanup
    } finally {
      try {
        if (d.capturedElement && "releasePointerCapture" in d.capturedElement) {
          (d.capturedElement as Element).releasePointerCapture(d.pointerId);
        }
      } catch {
        // ignore
      }

      if (moveListenerRef.current) {
        window.removeEventListener("pointermove", moveListenerRef.current);
      }
      if (upListenerRef.current) {
        window.removeEventListener("pointerup", upListenerRef.current);
        window.removeEventListener("pointercancel", upListenerRef.current);
      }

      dragRef.current = null;
    }
  }

  // Start a drag: initialize state and attach single global listeners
  function startDrag(e: React.PointerEvent, a: Anchor, handle: Handle) {
    if (!editing) return;

    const pt = clientToScreen1000(e.clientX, e.clientY);
    if (!pt) return;

    e.preventDefault();
    e.stopPropagation();

    const el = e.currentTarget as Element;
    try {
      if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    dragRef.current = {
      key: a.key,
      handle,
      pointerId: e.pointerId,
      lastPt: pt,
      lastBox: getBox(a),
      capturedElement: el,
    };

    const onMoveNative = (ev: PointerEvent) => {
      if (!dragRef.current || ev.pointerId !== dragRef.current.pointerId) return;
      try {
        if (ev.cancelable) ev.preventDefault();
      } catch {}
      applyDragFromNative(ev, false);
    };

    const onUpNative = (ev: PointerEvent) => {
      if (!dragRef.current || ev.pointerId !== dragRef.current.pointerId) return;
      endDragFromNative(ev);
    };

    moveListenerRef.current = onMoveNative;
    upListenerRef.current = onUpNative;

    window.addEventListener("pointermove", onMoveNative, { passive: false });
    window.addEventListener("pointerup", onUpNative);
    window.addEventListener("pointercancel", onUpNative);
  }

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (moveListenerRef.current) {
        window.removeEventListener("pointermove", moveListenerRef.current);
      }
      if (upListenerRef.current) {
        window.removeEventListener("pointerup", upListenerRef.current);
        window.removeEventListener("pointercancel", upListenerRef.current);
      }
      dragRef.current = null;
    };
  }, []);


  const startDragAction = (ev: PointerEvent<HTMLDivElement>) => {
    ev.preventDefault();
  }


  return (
    <>
      {anchors.map((a) => {
        const [yMin, xMin, yMax, xMax] = a.box_2d;
        const x = xMin / 1000;
        const y = yMin / 1000;
        const w = (xMax - xMin) / 1000;
        const h = (yMax - yMin) / 1000;

        const selected = selectedKey === a.key;
        const isHovered = hoveredKey === a.key;
        const isActive = activeKey === a.key;
        const othersHovered = hoveredKey && !isHovered;

        const border = editing
          ? selected
            ? "border-2 border-sky-400"
            : "border-2 border-emerald-400/70"
          : "border-0";

        const scaleClass = isActive
          ? "scale-100 opacity-100 blur-[2px] animate-[ping_0.33s_ease-out_infinite]"
          : hoveredKey
          ? isHovered
            ? "scale-110 opacity-60"
            : "scale-100 opacity-50"
          : "scale-100 opacity-50";

        return (
          <motion.div
            key={a.key}
            className={`
              absolute
              ${border}
              ${className}
              ${scaleClass}
            `}
            style={{
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              width: `${w * 100}%`,
              height: `${h * 100}%`,
              transformOrigin: "center",
            }}
            
            initial={{ y: 0, opacity: 0 }}
            animate={{
              y: [0, 0, a.interactionStyle === "swipe-up" ? -100 : a.interactionStyle === "swipe-down" ? 100 : 0],
              x: [0, 0, a.interactionStyle === "swipe-left" ? -100 : a.interactionStyle === "swipe-right" ? 100 : 0],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 1.5,
              times: [0, 0.2, 0.8, 1],
              ease: "easeIn",
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
            onPointerEnter={() => setHoveredKey(a.key)} 
            onPointerLeave={() => setHoveredKey(null)} 
            onPointerDown={(e) => editing ? startDrag(e, a, "move") : startDragAction(e)} // no per-element pointermove/up — global listeners handle it during drag 
            onClick={(e) => {
               if (editing) {
                e.preventDefault(); 
                e.stopPropagation(); 
                return; 
               } 
               setActiveKey(a.key); 
               setTimeout(() => setActiveKey(null), 300); 
               onHotspotClick(a); 
              }
            }
          >
            {/* Indicator */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                className={`
                  relative w-full aspect-square
                  transition-transform duration-200 animate-pulse
                  ${isHovered ? "scale-110" : "scale-100"}
                `}
              >
                <span
                  aria-hidden
                  className="absolute inset-1/8 rounded-full border-[3px] border-[#00bcff] bg-[#00bcff]/50"
                />
                <span
                  aria-hidden
                  className={`absolute inset-1/8 rounded-full border-2 ${
                    isHovered ? "border-sky-400/60" : "border-sky-400/70"
                  } animate-[ping_1.8s_ease-in-out_infinite]`}
                />
              </div>
            </div>

            {editing && (
              <>
                {(
                  [
                    ["nw", "left-0 top-0 -translate-x-1/2 -translate-y-1/2"],
                    ["ne", "right-0 top-0 translate-x-1/2 -translate-y-1/2"],
                    ["se", "right-0 bottom-0 translate-x-1/2 translate-y-1/2"],
                    ["sw", "left-0 bottom-0 -translate-x-1/2 translate-y-1/2"],
                  ] as const
                ).map(([handle, pos]) => (
                  <div
                    key={handle}
                    className={`absolute h-3 w-3 rounded-full bg-white shadow ring-2 ring-black/30 ${pos} translate-x-10`}
                    style={{ cursor: `${handle}-resize`, touchAction: "none" }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      startDrag(e, a, handle as Handle);
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>
        );
      })}
    </>
  );
}
