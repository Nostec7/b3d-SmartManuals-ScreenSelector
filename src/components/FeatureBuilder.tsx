import { useState } from "react";
import { fullDataJSON } from "../data/screenData";

/* =======================
   Types (JSON-aligned)
======================= */

type Vec2 = { x: number; y: number };

type AnchorState = {
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
  productID: string;
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
======================= */

function createEmptyAnchor(): AnchorState {
  return {
    key: crypto.randomUUID(),
    label: "",
    box_2d: [0, 0, 0, 0],
  };
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
======================= */

const initialFeatureState: FeatureState = {
  pdfID: "",
  productID: "",
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

export default function FeatureBuilder() {
  const [feature, setFeature] = useState<FeatureState>(initialFeatureState);
  const [preloadKey, setPreloadKey] = useState<string>("");

  const screens = feature.interactiveP3DModel.screenOptions;

  /* =======================
     Export
  ======================= */

  const exportJSON = () => {
    const json = JSON.stringify(feature, null, 2);
    console.log(json);

    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "feature.json";
    //a.click();
  };

  /* =======================
     Render
  ======================= */

  return (
    <div className="p-2 space-y-4 max-w-5xl mx-auto">
      <h1 className="text-lg font-bold">Feature Builder</h1>

      {/* =======================
          PRELOAD EXISTING FEATURE
      ======================= */}
      <section className="border p-2 rounded space-y-1">
        <label className="block text-xs font-semibold">
          Preload from existing feature
        </label>

        <div className="flex gap-2 items-center">
          <select
            className="w-full rounded border px-2 py-1 text-sm"
            value={preloadKey}
            onChange={(e) => {
              const selectedKey = e.target.value;

              // RESET FIRST
              setFeature(initialFeatureState);
              setPreloadKey(selectedKey);

              if (!selectedKey) return;

              const selectedFeature = fullDataJSON.find((f: any) => {
                const key = `${f.pdfID}||${f.caption}`;
                return key === selectedKey;
              });

              if (selectedFeature) {
                setFeature(selectedFeature);
              }
            }}
          >
            <option value="">Select feature…</option>
            {fullDataJSON.map((f: any) => {
              const key = `${f.pdfID}||${f.caption}`;
              return (
                <option key={key} value={key}>
                  {f.caption || f.pdfID}
                </option>
              );
            })}
          </select>

          <button
            className="rounded px-2 py-1 border text-sm bg-gray-100 hover:bg-gray-200"
            onClick={() => {
              setPreloadKey("");
              setFeature(initialFeatureState);
            }}
          >
            Reset
          </button>
        </div>

        <p className="text-[10px] text-gray-500 mt-1">
          Loads the entire feature into the editor for modification.
        </p>
      </section>

      {/* FEATURE INFO */}
      <section className="border p-2 rounded space-y-1">
        <input
          placeholder="PDF ID"
          className="w-full rounded border px-2 py-1 text-sm"
          value={feature.pdfID}
          onChange={(e) =>
            setFeature({ ...feature, pdfID: e.target.value })
          }
        />

        <input
          placeholder="Feature caption"
          className="w-full rounded border px-2 py-1 text-sm"
          value={feature.caption}
          onChange={(e) =>
            setFeature({ ...feature, caption: e.target.value })
          }
        />

        <input
          placeholder="Tags (comma separated)"
          className="w-full rounded border px-2 py-1 text-sm"
          value={feature.tags.join(",")}
          onChange={(e) =>
            setFeature({
              ...feature,
              tags: e.target.value.split(",").map((t) => t.trim()),
            })
          }
        />
      </section>

      {/* SCREENS */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-sm">Screens</h2>
          <button
            className="rounded px-2 py-1 border text-sm"
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
        </div>

        {screens.map((screen, sIdx) => (
          <div key={sIdx} className="border p-2 rounded space-y-2">
            <input
              placeholder="Screen ID"
              className="w-full rounded border px-2 py-1 text-sm"
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
              className="w-full rounded border px-2 py-1 text-sm"
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
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <strong className="text-sm">Anchors</strong>
                <button
                  className="rounded px-2 py-1 border text-sm"
                  onClick={() => {
                    const copy = [...screens];
                    copy[sIdx] = {
                      ...screen,
                      anchors: [...screen.anchors, createEmptyAnchor()],
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
              </div>

              {screen.anchors.map((anchor, aIdx) => (
                <div key={anchor.key} className="border p-2 rounded space-y-2">
                  <input
                    placeholder="Key"
                    className="w-full rounded border px-2 py-1 text-sm"
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
                    className="w-full rounded border px-2 py-1 text-sm"
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
                    className="w-full rounded border px-2 py-1 text-xs font-mono"
                    defaultValue={JSON.stringify(anchor.box_2d, null, 2)}
                    onBlur={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        if (!isValidBox2D(parsed)) {
                          throw new Error("box_2d must be [yMin, xMin, yMax, xMax]");
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
                  <p className="text-[10px] text-gray-500 mt-1">
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
                            targetScreen: e.target.checked
                              ? { id: "" }
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
                      targetScreen
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
                      actionMsg
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
                      targetImage
                    </label>
                  </div>

                  {/* TARGET SCREEN UI */}
                  {anchor.targetScreen && (
                    <select
                      value={anchor.targetScreen.id}
                      className="w-full rounded border px-2 py-1 text-sm"
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
                        <option key={s.id} value={s.id}>
                          {s.id}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* ACTION MESSAGE UI */}
                  {anchor.actionMsg && (
                    <>
                      <textarea
                        placeholder="Message"
                        className="w-full rounded border px-2 py-1 text-sm"
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
                          className="w-full rounded border px-2 py-1 text-sm"
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
                    </>
                  )}

                  {/* TARGET IMAGE UI */}
                  {anchor.targetImage && (
                    <>
                      <select
                        value={anchor.targetImage.direction}
                        className="w-full rounded border px-2 py-1 text-sm"
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
                      </select>

                      <textarea
                        placeholder="One URL per line"
                        className="w-full rounded border px-2 py-1 text-sm"
                        value={anchor.targetImage.urls.join("\n")}
                        onChange={(e) => {
                          const copy = [...screens];
                          copy[sIdx].anchors[aIdx] = {
                            ...anchor,
                            targetImage: {
                              ...anchor.targetImage!,
                              urls: e.target.value
                                .split("\n")
                                .filter(Boolean),
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

      <button
        className="bg-black text-white px-3 py-1 rounded text-sm"
        onClick={exportJSON}
      >
        Export JSON
      </button>
    </div>
  );
}
