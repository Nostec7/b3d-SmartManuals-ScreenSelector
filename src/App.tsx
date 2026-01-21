import { useEffect, useMemo, useState } from "react";
import ModelEmbed from "./components/ModelEmbed";
import ScreenController from "./components/ScreenController";
import { fullDataJSON } from "./data/screenData";
import FeatureBuilder from "./components/FeatureBuilder";

export default function App() {
  const [PLUG_IN_VARIABLES, setPLUG_IN_VARIABLES] = useState<{
    pdfID: string;
    caption: string;
  }>({
    pdfID: "25-J400-EN",
    caption: "",
  });

  const [productDatas, setProductData] = useState<any>(null);
  const [screenSetups, setScreenSetup] = useState<any>(null);
  const [screenDatas, setScreenData] = useState<any>(null);

  const [debug, setDebug] = useState(false);

  /**
   * Build feature list dynamically from JSON
   * caption replaces featureID
   */
  const featureMap = useMemo(() => {
    return fullDataJSON.map((entry) => ({
      pdfID: entry.pdfID,
      caption: entry.caption,
    }));
  }, []);

  /**
   * Process selected feature
   */
  useEffect(() => {
    const entry = fullDataJSON.find(
      (e) =>
        e.pdfID === PLUG_IN_VARIABLES.pdfID &&
        e.caption === PLUG_IN_VARIABLES.caption
    );

    if (!entry || !entry.interactiveP3DModel) {
      setProductData(null);
      setScreenSetup(null);
      setScreenData(null);
      return;
    }

    // PRODUCT DATA
    setProductData({
      id: entry.productID,
      title: entry.caption,
      pdfID: entry.pdfID,
      p3dID: entry.interactiveP3DModel.p3dID,
    });

    // SCREEN SETUP
    setScreenSetup({
      pdfID: entry.pdfID,
      baseUrl: entry.interactiveP3DModel.productMount.baseUrl,
      beautyLayerUrl: entry.interactiveP3DModel.productMount.beautyLayerUrl,
      screenCorners: entry.interactiveP3DModel.productMount.screenCorners,
    });

    // SCREEN DATA
    setScreenData({
      pdfID: entry.pdfID,
      id: entry.caption,
      label: entry.caption,
      screenOptions: entry.interactiveP3DModel.screenOptions,
    });
  }, [PLUG_IN_VARIABLES]);

  return (
    <div className="min-h-screen bg-white">
      <div className="grid grid-rows-4 lg:grid-cols-[360px_1fr]">
        {/* DEBUG / FEATURE LIST */}
        <div className="row-span-1 w-full font-semibold p-4 gap-2 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <label htmlFor="debug-toggle" className="font-bold">
              DEBUG MODE
            </label>
            <input
              type="checkbox"
              checked={debug}
              onChange={(e) => setDebug(e.target.checked)}
              id="debug-toggle"
            />
          </div>

          <h1 className="font-bold">FEATURES</h1>

          {featureMap.map((f, i) => (
            <button
              key={`${f.pdfID}_${i}`}
              className="bg-gray-300 p-2 w-full rounded-md cursor-pointer hover:opacity-80 active:opacity-30"
              onClick={() =>
                setPLUG_IN_VARIABLES({
                  pdfID: f.pdfID,
                  caption: f.caption,
                })
              }
            >
              {f.pdfID}: {f.caption}
            </button>
          ))}

        <div className=" bg-white relative w-fit">
            <FeatureBuilder />
        </div>
        </div>

        {/* MAIN CONTENT */}
        <main className="p-3 relative aspect-square row-span-3 w-fit">
          {/* {productDatas != null && (
            <div className="absolute top-0 left-0 w-full pt-8 z-1">
              <ModelEmbed p3dID={productDatas.p3dID} />
            </div>
          )} */}

          {productDatas && screenSetups && screenDatas && (
            <ScreenController
              product={productDatas}
              screenSetup={screenSetups}
              screenData={screenDatas}
              debug={debug}
            />
            
          )}
          
        </main>
      </div>
    </div>
  );
}
