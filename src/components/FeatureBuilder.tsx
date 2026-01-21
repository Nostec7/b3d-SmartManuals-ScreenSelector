import { useState } from "react";

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

/* =======================
   Component
======================= */

export default function FeatureBuilder() {
  const [feature, setFeature] = useState<FeatureState>({
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
  });

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
    a.click();
  };

  /* =======================
     Render
  ======================= */

  return (
    <div className="p-4 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold">Feature Builder</h1>

      {/* FEATURE INFO */}
      <section className="border p-4 rounded space-y-2">
        <input
          placeholder="PDF ID"
          value={feature.pdfID}
          onChange={(e) =>
            setFeature({ ...feature, pdfID: e.target.value })
          }
        />

        <input
          placeholder="Feature caption"
          value={feature.caption}
          onChange={(e) =>
            setFeature({ ...feature, caption: e.target.value })
          }
        />

        <input
          placeholder="Tags (comma separated)"
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
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Screens</h2>
          <button
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
          <div key={sIdx} className="border p-3 rounded space-y-3">
            <input
              placeholder="Screen ID"
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
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <strong>Anchors</strong>
                <button
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
                <div key={anchor.key} className="border p-3 rounded space-y-2">
                  <input
                    placeholder="Label"
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

                  {/* ACTION TOGGLES */}
                  <div className="flex gap-4 flex-wrap">
                    {/* TARGET SCREEN */}
                    <label>
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
                    <label>
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
                    <label>
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

                      <label>
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
        className="bg-black text-white px-4 py-2 rounded"
        onClick={exportJSON}
      >
        Export JSON
      </button>
    </div>
  );
}
