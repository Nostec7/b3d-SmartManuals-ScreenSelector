import { useEffect, useState } from "react";
import { fullDataJSON } from "../data/screenData";

/* =======================
   Types (JSON-aligned)
====================== */

type Vec2 = { x: number; y: number };

type AnchorState = {
  uid: string; // stable unique id for React keys
  key: string;
  label: string;
  box_2d: [number, number, number, number];
  targetScreen?: { id: string };
  actionMsg?: {
    message: string;
    title?: string;
    notificationOnly?: boolean;
  };
  targetImage?: {
    direction: "forward" | "backwards" | "forward-backwards";
    urls: string[];
  };
};

type ScreenOptionState = {
  id: string;
  image: { url: string };
  anchors: AnchorState[];
};

type FeatureState = {
  pdfID: string;
  pdf_id: string;
  productID: string;
  product_id: string;
  caption: string;
  section: string;
  tags: string[];
  type: "interactiveP3DModel";
  interactiveP3DModel: {
    type: "screenController";
    p3dID: string;
    productMount: {
      baseUrl: string;
      beautyLayerUrl: string;
      screenCorners: Vec2[];
    };
    screenOptions: ScreenOptionState[];
  };
};

/* =======================
   Helpers
====================== */

function createEmptyAnchor(): AnchorState {
  return {
    uid: crypto.randomUUID(),
    key: crypto.randomUUID(),
    label: "",
    box_2d: [250, 250, 300, 300],
  };
}

/** Ensure every anchor has a stable uid; deep clone to avoid mutating the original. */
function injectAnchorUIDs(feature: any): FeatureState {
  const copy = JSON.parse(JSON.stringify(feature)) as FeatureState;

  copy.interactiveP3DModel = copy.interactiveP3DModel || {
    type: "screenController",
    p3dID: "",
    productMount: { baseUrl: "", beautyLayerUrl: "", screenCorners: [] },
    screenOptions: [],
  };

  copy.interactiveP3DModel.screenOptions =
    (copy.interactiveP3DModel.screenOptions || []).map((s: any) => ({
      id: s.id ?? "",
      image: s.image ?? { url: "" },
      anchors: (s.anchors || []).map((a: any) => ({
        ...a,
        uid: a.uid || crypto.randomUUID(),
        // ensure arrays exist and types correct
        key: a.key ?? "",
        label: a.label ?? "",
        box_2d: a.box_2d ?? [0, 0, 0, 0],
      })),
    })) || [];

  return copy;
}

function isValidBox2D(v: unknown): v is [number, number, number, number] {
  return (
    Array.isArray(v) &&
    v.length === 4 &&
    v.every((n) => typeof n === "number" && Number.isFinite(n))
  );
}

function normalizeBox([y0, x0, y1, x1]: [
  number,
  number,
  number,
  number
]): [number, number, number, number] {
  const ymin = Math.min(y0, y1);
  const xmin = Math.min(x0, x1);
  const ymax = Math.max(y0, y1);
  const xmax = Math.max(x0, x1);
  return [ymin, xmin, ymax, xmax];
}

/* =======================
   Initial Feature
====================== */

const initialFeatureState: FeatureState = {
  pdfID: "",
  pdf_id: "",
  productID: "",
  product_id: "",
  caption: "",
  section: "",
  tags: [],
  type: "interactiveP3DModel",
  interactiveP3DModel: {
    type: "screenController",
    p3dID: "",
    productMount: {
      baseUrl: "",
      beautyLayerUrl: "",
      screenCorners: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ],
    },
    screenOptions: [],
  },
};

/* =======================
   Component
====================== */

export default function FeatureBuilder({ onPreview }: {
  onPreview?: (feature: FeatureState) => void;
}) {
  const [feature, setFeature] = useState<FeatureState>(() =>
    injectAnchorUIDs(initialFeatureState)
  );
  const [preloadKey, setPreloadKey] = useState<string>("");

  // New state: duplicates entries (each entry contains product_id and p3dID)
  const [duplicates, setDuplicates] = useState<Array<{ product_id: string; p3dID: string }>>([]);

  const screens = feature.interactiveP3DModel.screenOptions;

  // --- PRELOAD ADDED: per-screen selection state ---
  // stores selections per screen index: { featureKey, screenIdx }
  const [screenPreloadSelection, setScreenPreloadSelection] = useState<Record<number, { featureKey?: string; screenIdx?: number }>>({});

  // Helper to create a stable key for features (used in dropdown values)
  function featureSelectorKey(f: any) {
    return `${f.pdf_id ?? f.pdfID ?? ""}||${f.product_id ?? f.productID ?? ""}||${f.caption ?? ""}`;
  }

  // Helper to copy one screen object (with fresh anchor uids) into the target index
  function copyScreenIntoIndex(sourceFeature: any, sourceScreenIdx: number, targetIndex: number) {
    if (!sourceFeature || !sourceFeature.interactiveP3DModel) return;
    const sourceScreens = sourceFeature.interactiveP3DModel.screenOptions || [];
    const screenToCopy = sourceScreens[sourceScreenIdx];
    if (!screenToCopy) return;

    // Build a temp feature to use injectAnchorUIDs (so anchors get uids)
    const tempFeature = {
      ...initialFeatureState,
      interactiveP3DModel: {
        ...initialFeatureState.interactiveP3DModel,
        screenOptions: [screenToCopy],
      },
    };

    const injected = injectAnchorUIDs(tempFeature);
    const newScreen: ScreenOptionState = injected.interactiveP3DModel.screenOptions[0];

    // Insert into screens copy
    const copy = [...screens];
    copy[targetIndex] = newScreen;
    setFeature({
      ...feature,
      interactiveP3DModel: {
        ...feature.interactiveP3DModel,
        screenOptions: copy,
      },
    });
  }
  // --- END PRELOAD ADDED ---

  /* =======================
     Duplication helpers
  ======================= */

  function duplicateScreenAt(index: number) {
    const copyScreens = JSON.parse(JSON.stringify(screens)) as ScreenOptionState[];
    const toDup = copyScreens[index];
    if (!toDup) return;

    const newScreen: ScreenOptionState = JSON.parse(JSON.stringify(toDup));
    // regenerate uids / keys for anchors to avoid duplicates
    newScreen.anchors = (newScreen.anchors || []).map((a) => ({
      ...a,
      uid: crypto.randomUUID(),
      key: crypto.randomUUID(),
    }));

    copyScreens.splice(index + 1, 0, newScreen);
    setFeature({
      ...feature,
      interactiveP3DModel: {
        ...feature.interactiveP3DModel,
        screenOptions: copyScreens,
      },
    });
  }

  function duplicateAnchorAt(screenIndex: number, anchorIndex: number) {
    const copyScreens = JSON.parse(JSON.stringify(screens)) as ScreenOptionState[];
    const anchors = copyScreens[screenIndex]?.anchors || [];
    const toDup = anchors[anchorIndex];
    if (!toDup) return;

    const newAnchor: AnchorState = {
      ...JSON.parse(JSON.stringify(toDup)),
      uid: crypto.randomUUID(),
      key: crypto.randomUUID(),
    };

    anchors.splice(anchorIndex + 1, 0, newAnchor);
    copyScreens[screenIndex] = {
      ...copyScreens[screenIndex],
      anchors,
    };

    setFeature({
      ...feature,
      interactiveP3DModel: {
        ...feature.interactiveP3DModel,
        screenOptions: copyScreens,
      },
    });
  }

  /* =======================
     Export
  ======================= */

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + S → Save
      if (ctrlOrCmd && !e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();

        localStorage.setItem(
          'lastSavedVersion',
          JSON.stringify(feature, null, 2)
        );
        console.log("Export data saved");
        handlePreview();
      }

      // Ctrl/Cmd + L → Load last saved into editor (previously logged only)
      if (ctrlOrCmd && e.key.toLowerCase() === "l") {
        e.preventDefault();

        const saved = localStorage.getItem('lastSavedVersion');

        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            // inject anchor UIDs and set into editor
            const withUIDs = injectAnchorUIDs(parsed);
            setFeature(withUIDs);
            console.log("Last saved export loaded into editor:", parsed);
          } catch (err) {
            console.error("Failed to parse saved export:", err);
            // still print raw string for debugging
            console.log("Last saved export (raw):", saved);
          }
        } else {
          console.log("No saved export found");
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [feature])


  useEffect(() => {
    const onKeyDownControls = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Shift + s - add screen
      if (!ctrlOrCmd && e.shiftKey && e.key.toLowerCase() === "s") {
        setFeature({
          ...feature,
          interactiveP3DModel: {
            ...feature.interactiveP3DModel,
            screenOptions: [
              ...screens,
              { id: "", image: { url: "" }, anchors: [] },
            ],
          },
        })
      }
    }
    window.addEventListener("keydown", onKeyDownControls);
    return () => window.removeEventListener("keydown", onKeyDownControls);
  })

  const exportJSON = () => {
    // If there are no duplicates, behave as before (single object)
    if (!duplicates || duplicates.length === 0) {
      const json = JSON.stringify(feature, null, 2);
      console.log(json);
      return;
    }

    // Build an array: editor object + all duplicates (each with overridden product_id/productID and p3dID)
    const outputs: FeatureState[] = [];

    const baseFeature = injectAnchorUIDs(JSON.parse(JSON.stringify(feature)));

    outputs.push(baseFeature);

    for (const d of duplicates) {
      // deep clone base
      const cloned = JSON.parse(JSON.stringify(baseFeature)) as FeatureState;
      // set product ids
      cloned.product_id = d.product_id ?? cloned.product_id;
      cloned.productID = d.product_id ?? cloned.productID;
      // set p3dID inside interactiveP3DModel
      cloned.interactiveP3DModel = {
        ...(cloned.interactiveP3DModel || {}),
        p3dID: d.p3dID ?? cloned.interactiveP3DModel.p3dID,
      };
      // ensure anchors UIDs exist
      outputs.push(injectAnchorUIDs(cloned));
    }

    // Print single JSON array containing all objects
    const joinedArrayJson = JSON.stringify(outputs, null, 2);
    console.log(joinedArrayJson);
  };

  /* =======================
     Preview (dispatches a global event with the small set of plugin variables
     that App.tsx expects). App can listen for 'featureBuilderPreview' and call
     its internal setter to load the edited JSON into the preview.
  ======================= */

  function handlePreview() {
    // App.tsx (your example) expects PLUG_IN_VARIABLES shaped like:
    // { tags, pdfID, productID, caption, section } where pdfID/productID correspond to pdf_id/product_id values.
    const detail = feature

    // Dispatch a CustomEvent so the parent App can listen and update its state.
    // In your App, add:
    // window.addEventListener('featureBuilderPreview', (ev:any) => setPLUG_IN_VARIABLES(ev.detail))
    const ev = new CustomEvent("featureBuilderPreview", { detail });
    window.dispatchEvent(ev);
    // Optionally log
    //console.log("Preview dispatched:", detail);
  }

  /* =======================
     Render
  ======================= */

  return (
    <div className="p-1 space-y-1 max-w-5xl mx-auto relative">
      <div className="fixed right-4 flex items-center justify-between bg-[#333] rounded-xl drop-shadow-md gap-x-2 px-4 py-3 z-10">

        {/* PREVIEW button placed at top-right */}
        <div className="flex gap-2">
          <button
            className="rounded px-4 py-1 font-bold text-sm bg-blue-500 text-white hover:opacity-90"
            onClick={handlePreview}

            title="Preview current edited JSON in the app (dispatches 'featureBuilderPreview')"
          >
            PREVIEW
          </button>

          <button
            className="rounded px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 font-bold"
            onClick={() => {
              // quick reset of editor to an empty initial state (with uids)
              setFeature(injectAnchorUIDs(initialFeatureState));
              setPreloadKey("");
            }}
            title="Reset editor"
          >
            Reset Editor
          </button>
        </div>
      </div>

      {/* =======================
          PRELOAD EXISTING FEATURE
      ======================= */}
      <h1 className="font-black text-2xl mt-5">FEATURE</h1>
      <section className="bg-[#333]  text-white border space-y-1 rounded-lg p-2">

        <label className="block text-xs font-semibold">
          Preload from existing feature
        </label>

        <div className="flex gap-2 items-center ">
          <select
            className="w-full rounded  px-2 py-1 text-sm bg-[#666] drop-shadow-md text"
            value={preloadKey}
            onChange={(e) => {
              const selectedKey = e.target.value;

              // reset first
              setPreloadKey(selectedKey);
              setFeature(injectAnchorUIDs(initialFeatureState));

              if (!selectedKey) return;

              const selectedFeature = fullDataJSON.find((f: any) => {
                const key = [
                  f.pdfID ?? f.pdf_id ?? "",
                  f.pdf_id ?? f.pdfID ?? "",
                  f.productID ?? f.product_id ?? "",
                  f.product_id ?? f.productID ?? "",
                  f.caption ?? "",
                  f.section ?? "",
                  (f.tags || []).join(","),
                  f.type ?? "",
                ].join("||");

                return key === selectedKey;
              });

              if (selectedFeature) {
                setFeature(
                  injectAnchorUIDs({
                    ...selectedFeature,
                    pdfID: selectedFeature.pdfID ?? selectedFeature.pdf_id ?? "",
                    pdf_id:
                      selectedFeature.pdf_id ?? selectedFeature.pdfID ?? "",
                    productID:
                      selectedFeature.productID ?? selectedFeature.product_id ?? "",
                    product_id:
                      selectedFeature.product_id ?? selectedFeature.productID ?? "",
                  })
                );
              }
            }}
          >
            <option value="">Select feature…</option>
            {fullDataJSON.map((f: any) => {
              const key = [
                f.pdfID ?? f.pdf_id ?? "",
                f.pdf_id ?? f.pdfID ?? "",
                f.productID ?? f.product_id ?? "",
                f.product_id ?? f.productID ?? "",
                f.caption ?? "",
                f.section ?? "",
                (f.tags || []).join(","),
                f.type ?? "",
              ].join("||");

              return (
                <option key={key} value={key}>
                  {`${f.pdf_id}_${f.product_id}_${f.caption}`}
                </option>
              );
            })}
          </select>

          <button
            className="rounded px-2 py-1 text-sm bg-[#666] drop-shadow-md"
            onClick={() => {
              setPreloadKey("");
              setFeature(injectAnchorUIDs(initialFeatureState));
            }}
          >
            Reset
          </button>
        </div>
      </section>

      {/* FEATURE INFO */}
      <section className=" rounded-lg space-y-1 bg-[#333] text-white p-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="pdfID"
            className="w-full rounded px-2 -mb-1 py-1 text-sm bg-[#666] drop-shadow-md"
            value={feature.pdfID}
            onChange={(e) =>
              setFeature({ ...feature, pdfID: e.target.value })
            }
          />

          <input
            placeholder="pdf_id"
            className="w-full rounded px-2 -mb-1 py-1 text-sm bg-[#666] drop-shadow-md"
            value={feature.pdf_id}
            onChange={(e) =>
              setFeature({ ...feature, pdf_id: e.target.value })
            }
          />

          <input
            placeholder="productID"
            className="w-full rounded px-2 py-1 text-sm bg-[#666] drop-shadow-md"
            value={feature.productID}
            onChange={(e) =>
              setFeature({ ...feature, productID: e.target.value })
            }
          />

          <input
            placeholder="product_id"
            className="w-full rounded px-2 py-1 text-sm bg-[#666] drop-shadow-md"
            value={feature.product_id}
            onChange={(e) =>
              setFeature({ ...feature, product_id: e.target.value })
            }
          />
        </div>

        <input
          placeholder="Feature caption"
          className="w-full rounded px-2 py-1 text-sm bg-[#666] drop-shadow-md"
          value={feature.caption}
          onChange={(e) => setFeature({ ...feature, caption: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Section"
            className="w-full rounded px-2 py-1 text-sm bg-[#666] drop-shadow-md"
            value={feature.section}
            onChange={(e) => setFeature({ ...feature, section: e.target.value })}
          />

          <input
            placeholder="Tags (comma separated)"
            className="w-full rounded px-2 py-1 text-sm bg-[#666] drop-shadow-md"
            value={feature.tags.join(",")}
            onChange={(e) =>
              setFeature({
                ...feature,
                tags: e.target.value.split(",").map((t) => t.trim()),
              })
            }
          />
        </div>

        {/* p3dID and productMount */}
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="p3dID"
            className="w-full rounded px-2 py-1 text-sm bg-[#666] drop-shadow-md"
            value={feature.interactiveP3DModel.p3dID}
            onChange={(e) =>
              setFeature({
                ...feature,
                interactiveP3DModel: {
                  ...feature.interactiveP3DModel,
                  p3dID: e.target.value,
                },
              })
            }
          />

          <input
            placeholder="productMount.baseUrl"
            className="w-full rounded px-2 py-1 text-sm bg-[#666] drop-shadow-md"
            value={feature.interactiveP3DModel.productMount.baseUrl}
            onChange={(e) =>
              setFeature({
                ...feature,
                interactiveP3DModel: {
                  ...feature.interactiveP3DModel,
                  productMount: {
                    ...feature.interactiveP3DModel.productMount,
                    baseUrl: e.target.value,
                  },
                },
              })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="productMount.beautyLayerUrl"
            className="w-full rounded px-2 py-1 text-sm bg-[#666] drop-shadow-md"
            value={feature.interactiveP3DModel.productMount.beautyLayerUrl}
            onChange={(e) =>
              setFeature({
                ...feature,
                interactiveP3DModel: {
                  ...feature.interactiveP3DModel,
                  productMount: {
                    ...feature.interactiveP3DModel.productMount,
                    beautyLayerUrl: e.target.value,
                  },
                },
              })
            }
          />

          {/* screenCorners editor (compact single-line JSON) */}
          <input
            placeholder='screenCorners JSON (4 objects) e.g. [{"x":0.3,"y":0.3},...]'
            className="w-full rounded px-2 py-1 text-sm font-mono bg-[#666] drop-shadow-md"
            value={JSON.stringify(feature.interactiveP3DModel.productMount.screenCorners)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                if (Array.isArray(parsed)) {
                  setFeature({
                    ...feature,
                    interactiveP3DModel: {
                      ...feature.interactiveP3DModel,
                      productMount: {
                        ...feature.interactiveP3DModel.productMount,
                        screenCorners: parsed,
                      },
                    },
                  });
                }
              } catch {
                // ignore invalid JSON while typing
              }
            }}
          />
        </div>
      </section>

      {/* SCREENS */}
      <section className="space-y-3 mt-2">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black">SCREENS</h2>

          <div className="flex gap-2">
            <button
              className="rounded px-2 py-1 text-sm bg-[#888] text-white cursor-pointer"
              onClick={() =>
                setFeature({
                  ...feature,
                  interactiveP3DModel: {
                    ...feature.interactiveP3DModel,
                    screenOptions: [
                      ...screens,
                      { id: "", image: { url: "" }, anchors: [] },
                    ],
                  },
                })
              }
            >
              + Add Screen
            </button>

            <button
              className="rounded px-2 py-1 border text-sm bg-[#888] text-white cursor-pointer"
              onClick={() => {
                // clear screens
                setFeature({
                  ...feature,
                  interactiveP3DModel: {
                    ...feature.interactiveP3DModel,
                    screenOptions: [],
                  },
                });
              }}
            >
              Clear Screens
            </button>
          </div>
        </div>

        {screens.map((screen, sIdx) => (
          <div
            key={`${feature.productID || feature.product_id}-${sIdx}`}
            className="bg-[#333] text-[#eee] border-0 p-2 rounded-xl space-y-2"
          >
            <div className="relative grid grid-cols-7 justify-between items-center">
              <strong className="text-lg flex  col-span-4">🎞️ Screen: {screen.id}</strong>

              {/* --- PRELOAD ADDED: feature + screen selectors for copying --- */}
              <div className="grid grid-cols-2 gap-2 col-span-2 items-center -mr-10">
                <select
                  className="text-xs bg-[#555] drop-shadow-md rounded px-2 py-1 col-span-1"
                  value={screenPreloadSelection[sIdx]?.featureKey ?? ""}
                  onChange={(e) => {
                    const featureKey = e.target.value || undefined;
                    setScreenPreloadSelection((prev) => ({
                      ...prev,
                      [sIdx]: { featureKey, screenIdx: undefined },
                    }));
                  }}
                >
                  <option value="">Preload feature</option>
                  {fullDataJSON.map((f: any) => (
                    <option key={featureSelectorKey(f)} value={featureSelectorKey(f)}>
                      {`${f.pdf_id}_${f.product_id}_${f.caption}`}
                    </option>
                  ))}
                </select>

                <select
                  className="relative text-xs bg-[#555] drop-shadow-md rounded px-2 py-1 w-full col-span-1"
                  value={
                    screenPreloadSelection[sIdx]?.screenIdx !== undefined
                      ? String(screenPreloadSelection[sIdx]?.screenIdx)
                      : ""
                  }
                  onChange={(e) => {
                    const screenIdx = e.target.value === "" ? undefined : Number(e.target.value);
                    setScreenPreloadSelection((prev) => ({
                      ...prev,
                      [sIdx]: {
                        ...prev[sIdx],
                        screenIdx,
                      },
                    }));

                    try {
                      const container = (e.currentTarget as HTMLSelectElement).parentElement;
                      const featSelect = container?.querySelectorAll("select")?.[0] as HTMLSelectElement | undefined;
                      const featKey = featSelect?.value;
                      if (featKey && screenIdx !== undefined) {
                        const src = fullDataJSON.find((f: any) => featureSelectorKey(f) === featKey);
                        if (src) {
                          copyScreenIntoIndex(src, screenIdx, sIdx);
                        }
                      }
                    } catch (err) {
                      // ignore
                    }
                  }}
                  disabled={!screenPreloadSelection[sIdx]?.featureKey}
                >
                  <option value="">Preload screen</option>
                  {screenPreloadSelection[sIdx]?.featureKey &&
                    (fullDataJSON.find((f: any) => featureSelectorKey(f) === screenPreloadSelection[sIdx]?.featureKey)
                      ?.interactiveP3DModel?.screenOptions || []
                    ).map((_, idx: number) => (
                      <option key={idx} value={idx} className="px-2">
                        Screen: {_.id}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-2 items-center min-w-12.5 absolute right-1">
                <button
                  className="text-md text-green-400 font-bold cursor-pointer hover:opacity-50 mr-2"
                  onClick={() => duplicateScreenAt(sIdx)}
                  title="Duplicate screen"
                >
                  ➕
                </button>

                <button
                  className="text-md text-red-600 font-bold cursor-pointer hover:opacity-50 "
                  onClick={() => {
                    const copy = [...screens];
                    copy.splice(sIdx, 1);
                    setFeature({
                      ...feature,
                      interactiveP3DModel: {
                        ...feature.interactiveP3DModel,
                        screenOptions: copy,
                      },
                    });
                  }}
                >
                  ❌
                </button>
              </div>
            </div>

            <input
              placeholder="Screen ID"
              className="w-full rounded px-2 py-1 text-sm bg-[#555] drop-shadow-md border-0"
              value={screen.id}
              onChange={(e) => {
                const copy = [...screens];
                copy[sIdx] = { ...screen, id: e.target.value };
                setFeature({
                  ...feature,
                  interactiveP3DModel: {
                    ...feature.interactiveP3DModel,
                    screenOptions: copy,
                  },
                });
              }}
            />

            <input
              placeholder="Image URL"
              className="w-full rounded px-2 py-1 text-sm bg-[#555] drop-shadow-md border-0"
              value={screen.image.url}
              onChange={(e) => {
                const copy = [...screens];
                copy[sIdx] = {
                  ...screen,
                  image: { url: e.target.value },
                };
                setFeature({
                  ...feature,
                  interactiveP3DModel: {
                    ...feature.interactiveP3DModel,
                    screenOptions: copy,
                  },
                });
              }}
            />

            {/* ANCHORS */}
            <div className="space-y-2 pb-1">
              <div className="flex justify-between items-center">
                <strong className="text-sm">⚓ ANCHORS</strong>
                <div className="flex gap-2">
                  <button
                    className="rounded px-2 py-1 text-sm bg-[#777] border-0"
                    onClick={() => {
                      const copy = [...screens];
                      copy[sIdx] = {
                        ...screen,
                        anchors: [...(screen.anchors || []), createEmptyAnchor()],
                      };
                      setFeature({
                        ...feature,
                        interactiveP3DModel: {
                          ...feature.interactiveP3DModel,
                          screenOptions: copy,
                        },
                      });
                    }}
                  >
                    + Add Anchor
                  </button>

                  <button
                    className="rounded px-2 py-1 text-sm bg-[#777] border-0"
                    onClick={() => {
                      // clear anchors for this screen
                      const copy = [...screens];
                      copy[sIdx] = { ...screen, anchors: [] };
                      setFeature({
                        ...feature,
                        interactiveP3DModel: {
                          ...feature.interactiveP3DModel,
                          screenOptions: copy,
                        },
                      });
                    }}
                  >
                    Clear Anchors
                  </button>
                </div>
              </div>

              {(screen.anchors || []).map((anchor, aIdx) => (
                <div
                  key={`${feature.productID || feature.product_id}-${anchor.uid}`}
                  className=" p-1 rounded space-y-2 bg-[#eee] text-black font-semibold py-2  border-0"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-black text-lg">⚓ Anchor: {anchor.key}</span>
                    <div className="flex gap-2">
                      <button
                        className="text-sm text-green-600 font-bold cursor-pointer hover:opacity-50 drop-shadow-md bg-[#333] p-2 rounded-md"
                        onClick={() => duplicateAnchorAt(sIdx, aIdx)}
                        title="Duplicate anchor"
                      >
                        ➕
                      </button>

                      <button
                        className="text-sm text-red-600 font-bold cursor-pointer hover:opacity-50 drop-shadow-md bg-[#333] p-2 rounded-md"
                        onClick={() => {
                          const copy = [...screens];
                          copy[sIdx].anchors.splice(aIdx, 1);
                          setFeature({
                            ...feature,
                            interactiveP3DModel: {
                              ...feature.interactiveP3DModel,
                              screenOptions: copy,
                            },
                          });
                        }}
                      >
                        ❌
                      </button>
                    </div>
                  </div>

                  <input
                    placeholder="Key"
                    className="w-full rounded px-2 py-1 text-sm bg-[#fefefe] drop-shadow-md font-bold"
                    value={anchor.key}
                    onChange={(e) => {
                      const copy = [...screens];
                      copy[sIdx].anchors[aIdx] = {
                        ...anchor,
                        key: e.target.value,
                      };
                      setFeature({
                        ...feature,
                        interactiveP3DModel: {
                          ...feature.interactiveP3DModel,
                          screenOptions: copy,
                        },
                      });
                    }}
                  />

                  <input
                    placeholder="Label"
                    className="w-full rounded px-2 py-1 text-sm bg-[#fefefe] drop-shadow-md font-bold"
                    value={anchor.label}
                    onChange={(e) => {
                      const copy = [...screens];
                      copy[sIdx].anchors[aIdx] = {
                        ...anchor,
                        label: e.target.value,
                      };
                      setFeature({
                        ...feature,
                        interactiveP3DModel: {
                          ...feature.interactiveP3DModel,
                          screenOptions: copy,
                        },
                      });
                    }}
                  />

                  {/* box_2d */}
                  <textarea
                    rows={3}
                    className="w-full rounded px-2 py-1 text-xs font-mono bg-[#fefefe] drop-shadow-md"
                    defaultValue={JSON.stringify(anchor.box_2d, null, 2)}
                    onBlur={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        if (!isValidBox2D(parsed)) {
                          throw new Error(
                            "box_2d must be [yMin, xMin, yMax, xMax]"
                          );
                        }
                        const normalized = normalizeBox(parsed);

                        const copy = [...screens];
                        copy[sIdx].anchors[aIdx] = {
                          ...anchor,
                          box_2d: normalized,
                        };
                        setFeature({
                          ...feature,
                          interactiveP3DModel: {
                            ...feature.interactiveP3DModel,
                            screenOptions: copy,
                          },
                        });
                      } catch (err) {
                        console.warn("Invalid box_2d input:", err);
                      }
                    }}
                  />
                  <p className="text-[10px] text-gray-500 -mt-2">
                    Paste JSON array: [yMin, xMin, yMax, xMax]
                  </p>

                  {/* ACTION TOGGLES */}
                  <div className="flex gap-2 flex-wrap">
                    {/* TARGET SCREEN */}
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={!!anchor.targetScreen}
                        onChange={(e) => {
                          const copy = [...screens];
                          copy[sIdx].anchors[aIdx] = {
                            ...anchor,
                            targetScreen: e.target.checked ? { id: "" } : undefined,
                          };
                          setFeature({
                            ...feature,
                            interactiveP3DModel: {
                              ...feature.interactiveP3DModel,
                              screenOptions: copy,
                            },
                          });
                        }}
                      />
                      TargetScreen
                    </label>

                    {/* ACTION MSG */}
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={!!anchor.actionMsg}
                        onChange={(e) => {
                          const copy = [...screens];
                          copy[sIdx].anchors[aIdx] = {
                            ...anchor,
                            actionMsg: e.target.checked
                              ? { message: "", notificationOnly: true }
                              : undefined,
                          };
                          setFeature({
                            ...feature,
                            interactiveP3DModel: {
                              ...feature.interactiveP3DModel,
                              screenOptions: copy,
                            },
                          });
                        }}
                      />
                      AcionMsg
                    </label>

                    {/* TARGET IMAGE */}
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={!!anchor.targetImage}
                        onChange={(e) => {
                          const copy = [...screens];
                          copy[sIdx].anchors[aIdx] = {
                            ...anchor,
                            targetImage: e.target.checked
                              ? { direction: "forward", urls: [] }
                              : undefined,
                          };
                          setFeature({
                            ...feature,
                            interactiveP3DModel: {
                              ...feature.interactiveP3DModel,
                              screenOptions: copy,
                            },
                          });
                        }}
                      />
                      TargetImage
                    </label>
                  </div>

                  {/* TARGET SCREEN UI */}
                  {anchor.targetScreen && (
                    <select
                      value={anchor.targetScreen.id}
                      className="w-full rounded px-2 py-1 text-sm bg-[#fefefe] drop-shadow-md"
                      onChange={(e) => {
                        const copy = [...screens];
                        copy[sIdx].anchors[aIdx] = {
                          ...anchor,
                          targetScreen: { id: e.target.value },
                        };
                        setFeature({
                          ...feature,
                          interactiveP3DModel: {
                            ...feature.interactiveP3DModel,
                            screenOptions: copy,
                          },
                        });
                      }}
                    >
                      <option value="">Select screen</option>
                      {screens.map((s) => (
                        <option key={`${feature.productID || feature.product_id}-${s.id}`} value={s.id}>
                          {s.id + ' '}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* ACTION MESSAGE UI */}
                  {anchor.actionMsg && (
                    <>

                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={!!anchor.actionMsg.notificationOnly}
                          onChange={(e) => {
                            const msg = e.target.checked
                              ? {
                                message: anchor.actionMsg!.message,
                                notificationOnly: true,
                              }
                              : {
                                message: anchor.actionMsg!.message,
                                title: "",
                              };

                            const copy = [...screens];
                            copy[sIdx].anchors[aIdx] = {
                              ...anchor,
                              actionMsg: msg,
                            };
                            setFeature({
                              ...feature,
                              interactiveP3DModel: {
                                ...feature.interactiveP3DModel,
                                screenOptions: copy,
                              },
                            });
                          }}
                        />
                        Notification only
                      </label>
                      {!anchor.actionMsg.notificationOnly && (
                        <input
                          placeholder="Title"
                          className="w-full rounded px-2 py-1 text-sm bg-[#fefefe] drop-shadow-md"
                          value={anchor.actionMsg.title ?? ""}
                          onChange={(e) => {
                            const copy = [...screens];
                            copy[sIdx].anchors[aIdx] = {
                              ...anchor,
                              actionMsg: {
                                ...anchor.actionMsg!,
                                title: e.target.value,
                              },
                            };
                            setFeature({
                              ...feature,
                              interactiveP3DModel: {
                                ...feature.interactiveP3DModel,
                                screenOptions: copy,
                              },
                            });
                          }}
                        />
                      )}
                      <textarea
                        placeholder="Message"
                        className="w-full rounded px-2 py-1 text-sm bg-[#fefefe] drop-shadow-md"
                        value={anchor.actionMsg.message}
                        onChange={(e) => {
                          const copy = [...screens];
                          copy[sIdx].anchors[aIdx] = {
                            ...anchor,
                            actionMsg: {
                              ...anchor.actionMsg!,
                              message: e.target.value,
                            },
                          };
                          setFeature({
                            ...feature,
                            interactiveP3DModel: {
                              ...feature.interactiveP3DModel,
                              screenOptions: copy,
                            },
                          });
                        }}
                      />



                    </>
                  )}

                  {/* TARGET IMAGE UI */}
                  {anchor.targetImage && (
                    <>
                      <select
                        value={anchor.targetImage.direction}
                        className="w-full rounded px-2 py-1 text-sm bg-[#fefefe] drop-shadow-md"
                        onChange={(e) => {
                          const copy = [...screens];
                          copy[sIdx].anchors[aIdx] = {
                            ...anchor,
                            targetImage: {
                              ...anchor.targetImage!,
                              direction: e.target.value as any,
                            },
                          };
                          setFeature({
                            ...feature,
                            interactiveP3DModel: {
                              ...feature.interactiveP3DModel,
                              screenOptions: copy,
                            },
                          });
                        }}
                      >
                        <option value="forward">forward</option>
                        <option value="backwards">backwards</option>
                        <option value="forward-backwards">forward-backwards</option>
                      </select>

                      <textarea
                        placeholder="One URL per line"
                        className="w-full rounded px-2 py-1 text-sm bg-[#fefefe] drop-shadow-md"
                        value={anchor.targetImage.urls.join("\n")}
                        onChange={(e) => {
                          const copy = [...screens];
                          copy[sIdx].anchors[aIdx] = {
                            ...anchor,
                            targetImage: {
                              ...anchor.targetImage!,
                              urls: e.target.value.split("\n").filter(Boolean),
                            },
                          };
                          setFeature({
                            ...feature,
                            interactiveP3DModel: {
                              ...feature.interactiveP3DModel,
                              screenOptions: copy,
                            },
                          });
                        }}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Duplicate export for other assets: entry-based */}
      <section className="mt-4 rounded-lg p-3 bg-[#222] text-white">
        <div className="flex items-center justify-between">
          <strong>Duplicate export for other assets</strong>
          <button
            className="rounded px-2 py-1 text-lg cursor-pointer"
            onClick={() => setDuplicates((prev) => [...prev, { product_id: "", p3dID: "" }])}
          >
            ➕ 
          </button>
        </div>

        <div className="space-y-2 mt-3">
          {duplicates.length === 0 && (
            <p className="text-xs text-gray-300">No duplicates added — export will output only the editor object.</p>
          )}

          {duplicates.map((d, idx) => (
            <div key={`dup-${idx}`} className="flex gap-2 items-center">
              <div className="col-span-5 flex-grow">
                <input
                  placeholder="product_id"
                  className="w-full rounded px-2 py-1 text-sm bg-[#444] text-white"
                  value={d.product_id}
                  onChange={(e) => setDuplicates((prev) => {
                    const copy = [...prev];
                    copy[idx] = { ...copy[idx], product_id: e.target.value };
                    return copy;
                  })}
                />
              </div>

              <div className="col-span-5 flex-grow">
                <input
                  placeholder="p3dID"
                  className="w-full rounded px-2 py-1 text-sm bg-[#444] text-white"
                  value={d.p3dID}
                  onChange={(e) => setDuplicates((prev) => {
                    const copy = [...prev];
                    copy[idx] = { ...copy[idx], p3dID: e.target.value };
                    return copy;
                  })}
                />
              </div>

              <div className="col-span-2 flex gap-2 w-fit">
                {/* <button
                  className="rounded px-2 py-1 text-sm bg-yellow-500"
                  onClick={() => {
                    // quick copy current editor values into this duplicate for faster entry
                    setDuplicates((prev) => {
                      const copy = [...prev];
                      copy[idx] = {
                        product_id: feature.product_id || "",
                        p3dID: feature.interactiveP3DModel.p3dID || "",
                      };
                      return copy;
                    });
                  }}
                  title="Fill with editor's product_id + p3dID"
                >
                  Fill
                </button> */}

                <button
                  className="rounded px-2 py-1 text-sm w-fit"
                  onClick={() => setDuplicates((prev) => prev.filter((_, i) => i !== idx))}
                >
                  ❌
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-300 mt-2">
          Each entry will create a variant of the editor object with its own <code>product_id</code> and <code>interactiveP3DModel.p3dID</code>.
        </p>
      </section>

      <button
        className="bg-[#2b7fff] text-white  rounded-lg text-lg font-bold py-2 w-full cursor-pointer hover:opacity-50 mb-10"
        onClick={exportJSON}
      >
        Export JSON
      </button>
    </div>
  );
}
