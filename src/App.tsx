import ModelEmbed from "./components/ModelEmbed";
import ScreenController from "./components/ScreenController";
import { hardcodedProductsData } from "./data/productData";
import { hardcodedScreenData } from "./data/screenData";
import { hardcodedScreenSetups } from "./data/screenSetup";


export default function App() {

 // Methods to iterate through hardcoded options
  const getProductData = (pdfID: string) => {
    return hardcodedProductsData.find((s) => s.pdfID === pdfID) ?? null;
  }

  const getScreenSetup = (pdfID: string) => {
    return hardcodedScreenSetups.find((s) => s.pdfID === pdfID) ?? null;
  }

  const getScreenData = (pdfID: string, featureID: string) => {
    return hardcodedScreenData.find(
      (s) => s.pdfID === pdfID && s.id === featureID
    ) ?? null;
  }


// IN YOUR APP - retrieve the pdfID and featureID for what you need to show
// pdfID - the ID of a specific product's PDF
// featureID - specific feature that you want to show


// const PLUG_IN_VARIABLES = {
//   pdfID: "25-J400-EN",
//   featureID: "temperature-control",
//   featureID: "activating-jet-pumps",

//   pdfID: "26-SDS-780-EN",
//   featureID: "activating-jet-pumps"
// }


// const PLUG_IN_VARIABLES = {
//   pdfID: "25-J400-EN",
//   featureID: "temperature-control",
// }

const PLUG_IN_VARIABLES = {
  pdfID: "26-SDS-780-EN",
  featureID: "temperature-control",
}

const productData = getProductData(PLUG_IN_VARIABLES.pdfID);
const screenSetup = getScreenSetup(PLUG_IN_VARIABLES.pdfID);
const screenData = getScreenData(PLUG_IN_VARIABLES.pdfID, PLUG_IN_VARIABLES.featureID)



  return (
    <div className="min-h-screen bg-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[360px_1fr]">
        <main className="p-3 relative h-full aspect-square">
        
          {productData != null && (
            <div className="absolute top-0 left-0 w-full pt-8 z-1">
              <ModelEmbed p3dID={productData.p3dID}/> {/* <--- p3d.in EMBED UID GOES HERE */}
            </div>
          )}

          {productData != null && screenSetup != null && screenData != null && (
            <ScreenController
              product={productData}
              screenSetup={screenSetup}
              screenData={screenData}
            />
          )}
          
        </main>
        
      </div>
    </div>
  );
}
