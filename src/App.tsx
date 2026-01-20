import { useEffect, useState } from "react";
import ModelEmbed from "./components/ModelEmbed";
import ScreenController from "./components/ScreenController";
import { hardcodedProductsData } from "./data/productData";
import { fullDataJSON, hardcodedScreenData } from "./data/screenData";
import { hardcodedScreenSetups } from "./data/screenSetup";

export default function App() {

  const [PLUG_IN_VARIABLES, setPLUG_IN_VARIABLES] = useState(
    {
      pdfID: "25-J400-EN",
      featureID: "temperature-control",
    }
  )



  useEffect(() => {
    console.log(fullDataJSON)

  }, [])









 // Methods to iterate through hardcoded options
  const getProductData = (pdfID: string) => {
    return fullDataJSON.find((s) => s.pdfID === pdfID) ?? null;
  }

  const getScreenSetup = (pdfID: string) => {
    return hardcodedScreenSetups.find((s) => s.pdfID === pdfID) ?? null;
  }

  const getScreenData = (pdfID: string, featureID: string) => {
    return hardcodedScreenData.find(
      (s) => s.pdfID === pdfID && s.id === featureID
    ) ?? null;
  }




// LISTING ALL POSSIBLE FEATURES HERE
const featureMap = [
  // J-400 data
  {
    pdfID: "25-J400-EN",
    featureID: "temperature-control",
  },
  {
    pdfID: "25-J400-EN",
    featureID: "activating-jet-pumps",
  },
  {
    pdfID: "25-J400-EN",
    featureID: "lights-menu",
  },
  {
    pdfID: "25-J400-EN",
    featureID: "music-menu",
  },

  // SDS 780 data
  {
    pdfID: "26-SDS-780-EN",
    featureID: "temperature-control",
  },
]

const productData = getProductData(PLUG_IN_VARIABLES.pdfID);
const screenSetup = getScreenSetup(PLUG_IN_VARIABLES.pdfID);
const screenData = getScreenData(PLUG_IN_VARIABLES.pdfID, PLUG_IN_VARIABLES.featureID)


const [debug, setDebug] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      
      <div className="grid grid-rows-4 lg:grid-cols-[360px_1fr]">
        {/* DEBUG - SUPPORTING ELEMENTS */}
        <div className="row-span-1 w-full font-semibold p-4 gap-2 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
          <label htmlFor="debug-toggle" className="font-bold">
              DEBUG MDOE
            </label>
            <input
              type="checkbox"
              checked={debug}
              onChange={(e) => setDebug(e.target.checked)}
              id="debug-toggle"
            />
            
          </div>
            <h1 className="font-bold">FEATURE MAP</h1>
            {featureMap.map((f) => {
              return(
                <button 
                key={`${f.pdfID}_${f.featureID}`}
                className="bg-gray-300 p-2 w-full rounded-md cursor-pointer hover:opacity-80 active:opacity-30"
                onClick={() => {
                setPLUG_IN_VARIABLES(
                {
                  pdfID: f.pdfID,
                  featureID: f.featureID,
                })
              }}>
                  {f.pdfID}: {f.featureID} 
              </button>
              )
              
          })}
        </div>

        {/* MAIN ELEMENTS */}
        <main className="p-3 relative aspect-square row-span-3 w-full">
          {/* {productData != null && (
            <div className="absolute top-0 left-0 w-full pt-8 z-1">
              <ModelEmbed p3dID={productData.p3dID}/> 
            </div>
          )} */}
          {productData != null && screenSetup != null && screenData != null && (
            <ScreenController
            // i screen controlleri dabar ateis tiesiog vienas objektas
              product={productData}
              screenSetup={screenSetup}
              screenData={screenData}
              debug={debug}
            />
          )}
        </main>
      </div>
    </div>
  );
}
