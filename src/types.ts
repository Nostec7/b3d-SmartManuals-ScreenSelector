export type Vec2 = { x: number; y: number };

export type TargetScreen = {
  section: string;
  id: string;
}

export type TargetImage = {
  direction: "forward" | "backwards" | "forward-backwards";
  urls: string[];
}

export type ActionMsg = {
  title: string;
  message: string;
}

export type Anchor = {
  key: string;
  anchor?: { x: number; y: number };
  box?: [number, number, number, number];
  box_2d: number[]; // [left, top, right, bottom] in screen image px
  confidence?: number;
  label?: string;
  actionMsg?: ActionMsg;
  targetScreen?: TargetScreen;
  targetImage?: TargetImage;
};

export type ScreenDoc = {
  id: string;
  page: string;
  section: string;
  docPath: string;
  image: {
    url: string;
    targets?: string[];
  };
  anchors: Anchor[];
};

export type ProductMount = {
  /** Base render image (screen without content). */
  baseUrl: string;

  // Optional beauty layer image (screen overlay with reflections, shadows, etc).
  beautyLayerUrl?: string;

  /**
   * Screen opening corners in NORMALIZED base coordinates (0..1),
   * ordered: TL, TR, BR, BL.
   */
  screenCorners: { x: number, y: number}[];
};
