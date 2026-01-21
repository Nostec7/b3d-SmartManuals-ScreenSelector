import { useEffect, useMemo, useState } from "react";
import ModelEmbed from "./components/ModelEmbed";
import ScreenController from "./components/ScreenController";
import { fullDataJSON } from "./data/screenData";
import FeatureBuilder from "./components/FeatureBuilder";

export default function App() {
  const firstEntry = fullDataJSON[0];

  const [PLUG_IN_VARIABLES, setPLUG_IN_VARIABLES] = useState<{
    tags: string[];
    pdfID: string;
    productID: string;
    caption: string;
    section: string;
  }>({
    tags: firstEntry.tags,
    pdfID: firstEntry.pdf_id,
    productID: firstEntry.product_id,
    caption: firstEntry.caption,
    section: firstEntry.section
  });

  const [productDatas, setProductData] = useState<any>(null);
  const [screenSetups, setScreenSetup] = useState<any>(null);
  const [screenDatas, setScreenData] = useState<any>(null);
  const [previewmode, setPreviewMode] = useState(false);

  const [debug, setDebug] = useState(false);

  /**
   * Build feature list dynamically from JSON
   * caption replaces featureID
   */
  const featureMap = useMemo(() => {
    return fullDataJSON.map((entry, i) => ({
      pdfID: entry.pdf_id,
      productID: entry.product_id,
      caption: entry.caption,
      section: entry.section,
      tags: entry.tags
    }));
  }, []);

  /**
   * Process selected feature
   */

  
  useEffect(() => {
    if(previewmode){

      const entry = PLUG_IN_VARIABLES;

      // PRODUCT DATA
      setProductData({
        id: entry.product_id,
        title: entry.caption,
        pdfID: entry.pdf_id,
        p3dID: entry.interactiveP3DModel.p3dID,
      });

      // SCREEN SETUP
      setScreenSetup({
        pdfID: entry.pdf_id,
        baseUrl: entry.interactiveP3DModel.productMount.baseUrl,
        beautyLayerUrl: entry.interactiveP3DModel.productMount.beautyLayerUrl,
        screenCorners: entry.interactiveP3DModel.productMount.screenCorners,
      });

      // SCREEN DATA
      setScreenData({
        pdfID: entry.pdf_id,
        id: entry.interactiveP3DModel.screenOptions[0]?.id ?? "default",
        label: entry.caption,
        screenOptions: entry.interactiveP3DModel.screenOptions,
      });


      

    } else {
      const entry = fullDataJSON.find(
        (e) =>
          e.tags === PLUG_IN_VARIABLES.tags &&
          e.pdf_id === PLUG_IN_VARIABLES.pdfID &&
          e.product_id === PLUG_IN_VARIABLES.productID &&
          e.caption === PLUG_IN_VARIABLES.caption &&
          e.section === PLUG_IN_VARIABLES.section
      );
  
      if (!entry || !entry.interactiveP3DModel) {
        setProductData(null);
        setScreenSetup(null);
        setScreenData(null);
        return;
      }

      // PRODUCT DATA
      setProductData({
        id: entry.product_id,
        title: entry.caption,
        pdfID: entry.pdf_id,
        p3dID: entry.interactiveP3DModel.p3dID,
      });

      // SCREEN SETUP
      setScreenSetup({
        pdfID: entry.pdf_id,
        baseUrl: entry.interactiveP3DModel.productMount.baseUrl,
        beautyLayerUrl: entry.interactiveP3DModel.productMount.beautyLayerUrl,
        screenCorners: entry.interactiveP3DModel.productMount.screenCorners,
      });

      // SCREEN DATA
      setScreenData({
        pdfID: entry.pdf_id,
        id: entry.interactiveP3DModel.screenOptions[0]?.id ?? "default",
        label: entry.caption,
        screenOptions: entry.interactiveP3DModel.screenOptions,
      });
    }
    

    

  }, [PLUG_IN_VARIABLES, previewmode]);



  useEffect(() => {
    function handleFeatureBuilderPreview(ev: Event) {
      setPreviewMode(true);
      const customEv = ev as CustomEvent<any>;
      const feature = customEv.detail;
  
      if (!feature) return;
  
      setPLUG_IN_VARIABLES({
        tags: feature.tags,
        pdfID: feature.pdf_id,       // IMPORTANT: use pdf_id
        productID: feature.product_id, // IMPORTANT: use product_id
        caption: feature.caption,
        section: feature.section,
      });
    }
  
    window.addEventListener(
      "featureBuilderPreview",
      handleFeatureBuilderPreview
    );
  
    return () => {
      window.removeEventListener(
        "featureBuilderPreview",
        handleFeatureBuilderPreview
      );
    };
  }, []);
  


  useEffect(() => {
    function onPreview(ev: any) {
      setPLUG_IN_VARIABLES(ev.detail);
    }
    window.addEventListener("featureBuilderPreview", onPreview);
    return () => window.removeEventListener("featureBuilderPreview", onPreview);
  }, []);




  return (
    <div className="min-h-screen bg-white">
      <div className="grid grid-cols-6 relative">
        <div className="w-full">
          <div className="row-span-1 w-full font-semibold p-4 gap-2 flex flex-col max-h-screen overflow-y-auto">
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
                key={`${f.pdfID}|${f.productID}|${f.caption}|${i}`}
                className="bg-gray-300 p-1 w-full rounded-md cursor-pointer hover:opacity-80 active:opacity-30 text-sm text-left"
                onClick={() =>
                  setPLUG_IN_VARIABLES({
                    pdfID: f.pdfID,
                    productID: f.productID,
                    caption: f.caption,
                    section: f.section,
                    tags: f.tags
                  })
                }
              >
                {f.pdfID} || <b>{f.productID}</b> || {f.caption}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full relative aspect-square h-auto col-span-3 bg-white">
          <main className="w-full h-auto">
            {productDatas && screenSetups && screenDatas && (
              <ScreenController
                product={productDatas}
                screenSetup={screenSetups}
                screenData={screenDatas}
                debug={debug}
                className="max-w-full p-2"
              />
            )}
          </main>
        </div>

        <div className="w-full max-h-screen col-span-2 overflow-auto">
        <FeatureBuilder
            // onPreview={(feature) => {
            //   setPLUG_IN_VARIABLES({
            //     tags: feature.tags,
            //     pdfID: feature.pdf_id,
            //     productID: feature.product_id,
            //     caption: feature.caption,
            //     section: feature.section,
            //   });
            // }}
          />
        </div>
      </div>
    </div>
  );
}
