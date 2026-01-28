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
  // Active drag state (editing/resizing)
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

  // --- NEW: gesture (click-and-drag / swipe) handling for non-edit mode ---
  // No change to rendering; this captures pointer events on the element only and
  // will call onHotspotClick when a swipe direction matches or when a tap occurs.
  const gestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startTime: number;
    moved: boolean;
    anchorKey: string;
    capturedElement?: Element | null;
  } | null>(null);

  // If gesture triggers, suppress the subsequent click event (which fires after pointerup)
  const suppressClickRef = useRef(false);

  const SWIPE_DISTANCE_PX = 40; // how far to move to count as swipe
  const SWIPE_MAX_TIME_MS = 700; // swipe should be relatively quick

  function startGesture(e: React.PointerEvent, a: Anchor) {
    if (editing) return;

    // Prevent native touch behaviour (scroll/pinch) — required on mobile to get pointermove
    try {
      e.preventDefault();
    } catch {}

    try {
      e.stopPropagation();
    } catch {}

    // Save initial touch/mouse state
    gestureRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTime: performance.now(),
      moved: false,
      anchorKey: a.key,
      capturedElement: e.currentTarget as Element,
    };

    // try to capture pointer on the element so subsequent pointermove/up land on it
    try {
      const el = e.currentTarget as Element;
      if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
      gestureRef.current.capturedElement = el;
    } catch {
      gestureRef.current.capturedElement = null;
    }
  }

  function moveGesture(e: React.PointerEvent) {
    const g = gestureRef.current;
    if (!g || e.pointerId !== g.pointerId) return;

    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;

    // small movement doesn't count as "moved" to avoid jitter
    if (!g.moved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      g.moved = true;
    }

    // while moving, prevent default to stop scrolling (mobile)
    try {
      if (e.cancelable) e.preventDefault();
    } catch {}
  }

  function endGesture(e: React.PointerEvent, a: Anchor) {
    const g = gestureRef.current;
    if (!g || e.pointerId !== g.pointerId || g.anchorKey !== a.key) {
      // nothing to do
      // release pointer capture if we unexpectedly have it
      try {
        const el = e.currentTarget as Element;
        if (el && (el as any).releasePointerCapture) {
          (el as any).releasePointerCapture(e.pointerId);
        }
      } catch {}
      return;
    }

    // release pointer capture
    try {
      if (g.capturedElement && "releasePointerCapture" in g.capturedElement) {
        (g.capturedElement as Element).releasePointerCapture(g.pointerId);
      }
    } catch {}

    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    const dt = performance.now() - g.startTime;

    gestureRef.current = null;

    // If not moved much, count as a regular click/tap (allow normal onClick)
    if (!g.moved) {
      // do nothing special — the onClick handler will run
      return;
    }

    // If moved but too slow, treat like a drag/cancel -> treat as click
    if (dt > SWIPE_MAX_TIME_MS && Math.abs(dx) < SWIPE_DISTANCE_PX && Math.abs(dy) < SWIPE_DISTANCE_PX) {
      // allow click
      return;
    }

    // If movement is large enough, determine swipe direction
    if (Math.abs(dx) < SWIPE_DISTANCE_PX && Math.abs(dy) < SWIPE_DISTANCE_PX) {
      // movement not large enough -> allow click
      return;
    }

    const horizontal = Math.abs(dx) > Math.abs(dy);
    const dir =
      horizontal ? (dx > 0 ? "swipe-right" : "swipe-left") : dy > 0 ? "swipe-down" : "swipe-up";

    const matched = a.interactionStyle === dir;

    // suppress the following click event since we handled gesture
    suppressClickRef.current = true;
    // keep suppression short — just enough for the click event to be ignored
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);

    if (matched) {
      // call hotspot action when swipe direction matches expected interactionStyle
      onHotspotClick(a);
    } else {
      // If desired, you could call onHotspotClick for any swipe; keeping behavior
      // to only trigger when it matches to match your earlier description.
    }
  }

  const startDragAction = (ev: React.PointerEvent<HTMLDivElement>) => {
    // keep this the same behavior you had: just prevent default in non-edit mode down
    // (we now use pointer handlers to detect gestures)
    ev.preventDefault();
  };

  // ---- render ----
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
              // Important: allow pointer events to receive move/up on mobile.
              // 'none' prevents native scroll/pinch from hijacking pointer events.
              // If you prefer the element to allow scrolling outside it, you can
              // use 'pan-x pan-y' — but 'none' gives most reliable gesture capture.
              touchAction: "none",
            }}
            initial={{ y: 0, opacity: 0 }}
            animate={{
              y: [0, 0, a.interactionStyle === "swipe-up" ? -window.innerWidth/25 : a.interactionStyle === "swipe-down" ? window.innerWidth/25 : 0],
              x: [0, 0, a.interactionStyle === "swipe-left" ? -window.innerWidth/25 : a.interactionStyle === "swipe-right" ? window.innerWidth/25 : 0],
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
            onPointerDown={(e) =>
              editing ? startDrag(e, a, "move") : startGesture(e, a)
            } // no per-element pointermove/up — global listeners handle it during edit drag
            onPointerMove={(e) => {
              // route move events to both edit-drag logic (if editing) and gesture logic (if not)
              if (editing) {
                // do nothing here — editing drag uses global pointermove listeners added in startDrag
              } else {
                moveGesture(e);
              }
            }}
            onPointerUp={(e) => {
              // if editing, edit logic will handle it via global pointerup
              if (!editing) {
                endGesture(e, a);
              }
            }}
            onClick={(e) => {
              // suppress click if we handled a gesture
              if (suppressClickRef.current) {
                suppressClickRef.current = false;
                e.preventDefault();
                e.stopPropagation();
                return;
              }

              if (editing) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              setActiveKey(a.key);
              setTimeout(() => setActiveKey(null), 300);
              onHotspotClick(a);
            }}
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
                {/* <span
                className="
                  absolute -right-[5%] -top-[5%]
                  w-[40%] aspect-square
                  flex items-center justify-center
                  bg-[#00000033] text-white font-bold
                  border-2 rounded-full
                "
              >
                <span className="text-[60%] leading-none">
                  2
                </span>
              </span> */}

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
