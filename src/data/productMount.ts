import type { ProductMount } from "../types";

/**
 * IMPORTANT:
 * - baseUrl should be product render WITHOUT screen content
 * - screenCorners are normalized (0..1) relative to the base image
 *   order: TL, TR, BR, BL
 */



export const PRODUCT: ProductMount = { // whole J-400 series
  name: "PoC Tub J-400 2025",
  baseUrl: "/controllerScreens/J-400_2025_BaseLayer.webp",
  beautyLayerUrl: "/controllerScreens/J-400_2025_BeautyLayer.webp",
  screenCorners: [
    { x: 0.322, y: 0.35 }, // TL
    { x: 0.69, y: 0.35 }, // TR
    { x: 0.693, y: 0.62 }, // BR
    { x: 0.32, y: 0.62 }, // BL
  ],
};





















// export const PRODUCT: ProductMount = { // whole J-200 series
//   name: "PoC Tub J-215 2025",
//   baseUrl: "/controllerScreens/J-200_BaseLayer.webp",
//   beautyLayerUrl: "/controllerScreens/J-200_BeautyLayer.webp",
//   screenCorners: [
//     { x: 0.405, y: 0.463 }, // TL
//     { x: 0.61, y: 0.463 }, // TR
//     { x: 0.61, y: 0.542 }, // BR
//     { x: 0.405, y: 0.542 }, // BL
//   ],
// };

// export const PRODUCT: ProductMount = { // whole J-300 series
//   name: "PoC Tub J-315 2025",
//   baseUrl: "/controllerScreens/J-300_BaseLayer.webp",
//   beautyLayerUrl: "/controllerScreens/J-300_BeautyLayer.webp",
//   screenCorners: [
//     { x: 0.304, y: 0.371 }, // TL
//     { x: 0.715, y: 0.371 }, // TR
//     { x: 0.71, y: 0.63 }, // BR
//     { x: 0.304, y: 0.63 }, // BL
//   ],
// };

// export const PRODUCT: ProductMount = { // whole SDS 680 series
//   name: "PoC Tub SDS 680 Edison 2025",
//   baseUrl: "/controllerScreens/SDS_680_BaseLayer.webp",
//   beautyLayerUrl: "/controllerScreens/SDS_680_BeautyLayer.webp",
//   screenCorners: [
//     { x: 0.41, y: 0.462 }, // TL
//     { x: 0.61, y: 0.462 }, // TR
//     { x: 0.61, y: 0.542 }, // BR
//     { x: 0.405, y: 0.542 }, // BL
//   ],
// };

// export const PRODUCT: ProductMount = { // whole SDS 780 & 880 series
//   name: "PoC Tub SDS Chelsee 780 2025",
//   baseUrl: "/controllerScreens/SDS_780-880_BaseLayer.webp",
//   beautyLayerUrl: "/controllerScreens/SDS_780-880_BeautyLayer.webp",
//   screenCorners: [
//     { x: 0.306, y: 0.358 }, // TL
//     { x: 0.731, y: 0.358 }, // TR
//     { x: 0.737, y: 0.638 }, // BR
//     { x: 0.295, y: 0.638 }, // BL
//   ],
// };

// export const PRODUCT: ProductMount = { // whole SDS 980 series
//   name: "PoC Tub SDS 980 Kingston 2025",
//   baseUrl: "/controllerScreens/SDS_980_BaseLayer.webp",
//   beautyLayerUrl: "/controllerScreens/SDS_980_BeautyLayer.webp",
//   screenCorners: [
//     { x: 0.443, y: 0.325 }, // TL
//     { x: 0.639, y: 0.325 }, // TR
//     { x: 0.643, y: 0.662 }, // BR
//     { x: 0.435, y: 0.662 }, // BL
//   ],
// };

// export const PRODUCT: ProductMount = { // SwimSpa J-13 - specific to this
//   name: "PoC Tub SwimSpa J-13 2025",
//   baseUrl: "/controllerScreens/SS_J-13_BaseLayer.webp",
//   beautyLayerUrl: "/controllerScreens/SS_J-13_BeautyLayer.webp",
//   screenCorners: [
//     { x: 0.4, y: 0.453 }, // TL
//     { x: 0.617, y: 0.453 }, // TR
//     { x: 0.618, y: 0.542 }, // BR
//     { x: 0.4, y: 0.542 }, // BL
//   ],
// };