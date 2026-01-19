//==================================================================
// Separate for each pdfID
export const hardcodedScreenSetups = [
  {
    pdfID: "25-J400-EN", 
    baseUrl: "/controllerScreens/J-400_2025_BaseLayer.webp", 
    beautyLayerUrl: "/controllerScreens/J-400_2025_BeautyLayer.webp", 
    screenCorners: [ 
      { x: 0.322, y: 0.35 }, // TL 
      { x: 0.69, y: 0.35 }, // TR 
      { x: 0.693, y: 0.62 }, // BR 
      { x: 0.32, y: 0.62 }, // BL 
    ],
  },
  {
    pdfID: "26-SDS-780-EN",
    baseUrl: "/controllerScreens/SDS_780-880_BaseLayer.webp",
    beautyLayerUrl: "/controllerScreens/SDS_780-880_BeautyLayer.webp",
    screenCorners: [
        { x: 0.31, y: 0.363 }, // TL
        { x: 0.725, y: 0.363 }, // TR
        { x: 0.73, y: 0.632 }, // BR
        { x: 0.304, y: 0.632 }, // BL
      ],
  }
]