import { useMemo, useRef } from "react";
import type { Anchor } from "../types";

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
  onHotspotClick: (anchor: Anchor) => void;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function normalizeBox(box: Box2D, minSize = 6): Box2D {
  let [y0, x0, y1, x1] = box;

  // Ensure ordering
  if (x1 < x0) [x0, x1] = [x1, x0];
  if (y1 < y0) [y0, y1] = [y1, y0];

  // Clamp
  x0 = clamp(x0, 0, 1000);
  x1 = clamp(x1, 0, 1000);
  y0 = clamp(y0, 0, 1000);
  y1 = clamp(y1, 0, 1000);

  // Enforce minimum size
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
  onHotspotClick,
}: Props) {
  // Drag state stored in a ref to avoid rerenders on every pointermove
  const dragRef = useRef<{
    key: string;
    handle: Handle;
    startPt: Pt;
    startBox: Box2D;
    pointerId: number;
  } | null>(null);

  const anchorMap = useMemo(() => {
    const m = new Map<string, Anchor>();
    anchors.forEach((a) => m.set(a.key, a));
    return m;
  }, [anchors]);

  function getBox(a: Anchor): Box2D {
    // Your format: [yMin,xMin,yMax,xMax] in 0..1000
    const [yMin, xMin, yMax, xMax] = a.box_2d;
    return [yMin, xMin, yMax, xMax];
  }

  function startDrag(e: React.PointerEvent, a: Anchor, handle: Handle) {
    if (!editing) return;
    const pt = clientToScreen1000(e.clientX, e.clientY);
    if (!pt) return;

    e.preventDefault();
    e.stopPropagation();

    (e.currentTarget as Element).setPointerCapture(e.pointerId);

    dragRef.current = {
      key: a.key,
      handle,
      startPt: pt,
      startBox: getBox(a),
      pointerId: e.pointerId,
    };
  }

  function onMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    if (e.pointerId !== d.pointerId) return;

    const pt = clientToScreen1000(e.clientX, e.clientY);
    if (!pt) return;

    const dx = pt.x - d.startPt.x;
    const dy = pt.y - d.startPt.y;

    let [y0, x0, y1, x1] = d.startBox;

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

    // If moving, keep size while clamping within bounds
    if (d.handle === "move") {
      const w = x1 - x0;
      const h = y1 - y0;

      x0 = clamp(x0, 0, 1000 - w);
      y0 = clamp(y0, 0, 1000 - h);
      x1 = x0 + w;
      y1 = y0 + h;
    }

    const next = normalizeBox([y0, x0, y1, x1], 8);
    onBoxChange(d.key, next);
  }

  function endDrag(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    if (e.pointerId !== d.pointerId) return;
    dragRef.current = null;
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
        const border = editing
          ? selected
            ? "border-2 border-sky-400"
            : "border-2 border-emerald-400/70"
          : "border-0";

        return (
          <div
            key={a.key}
            className={`absolute ${border} ${
              editing ? "bg-transparent" : "bg-transparent"
            } ${className}`}
            style={{
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              width: `${w * 100}%`,
              height: `${h * 100}%`,
              pointerEvents: "auto",
              touchAction: "none",
              userSelect: "none",
            }}
            onPointerDown={(e) => {
              if (editing) startDrag(e, a, "move");
            }}
            onPointerMove={onMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClick={(e) => {
              // In edit mode, don’t treat click as navigation.
              if (editing) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              onHotspotClick(a);
            }}
            title={a.label ?? a.key}
          >
            {/* Indicator (always visible, centered, non-interactive) */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative w-full aspect-square">
                <span
                  aria-hidden
                  className="absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/40 animate-pulse shadow-[0_0_0_6px_rgba(56,189,248,0.12)]"
                />
                <span
                  aria-hidden
                  className="absolute left-1/2 top-1/2 h-3/4 w-3/4  -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sky-400/60 animate-[ping_1.8s_ease-in-out_infinite]"
                />
              </div>
            </div>

            {/* Resize handles (only in editing mode) */}
            {editing && (
              <>
                {[
                  [
                    "nw",
                    "left-0 top-0 -translate-x-1/2 -translate-y-1/2",
                  ] as const,
                  [
                    "ne",
                    "right-0 top-0 translate-x-1/2 -translate-y-1/2",
                  ] as const,
                  [
                    "se",
                    "right-0 bottom-0 translate-x-1/2 translate-y-1/2",
                  ] as const,
                  [
                    "sw",
                    "left-0 bottom-0 -translate-x-1/2 translate-y-1/2",
                  ] as const,
                ].map(([handle, pos]) => (
                  <div
                    key={handle}
                    className={`absolute h-3 w-3 rounded-full bg-white shadow ring-2 ring-black/30 ${pos}`}
                    style={{ cursor: `${handle}-resize`, touchAction: "none" }}
                    onPointerDown={(e) => {
                      // prevent starting "move" drag from the parent
                      e.stopPropagation();
                      const anchor = anchorMap.get(a.key);
                      if (anchor) startDrag(e, anchor, handle);
                    }}
                    onPointerMove={onMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                  />
                ))}
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
