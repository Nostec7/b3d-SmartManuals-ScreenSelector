import type { ScreenDoc } from "../types";

export const SCREENS: ScreenDoc[] = [
  {
    //id:"main",
    id:"25-J400-EN",
    page: "main",
    section: "11.2",
    docPath: "manual_media/xx_25-J400-EN_11-2_activating-the-jets-pumps",
    image: {
      url: "https://firebasestorage.googleapis.com/v0/b/extended-experiences.firebasestorage.app/o/assets%2Fscreens%2F11.2-Activating-the-Jets-Pumps-Figure-A.png?alt=media",
      targets: ["top left button"],
    },
    anchors: [
      {
        key: "top-left-button-1",
        anchor: { x: 0.1565, y: 0.163 },
        "box_2d": [
          360.852440920975,
          344.0547954048405,
          449.6480829392518,
          423.62106573968646
      ],
        confidence: 0.98,
        label: "top left button",
        targetScreen:{
          section: "11.2",
          name: "jets"
        }
      },
    ],
  },
  {
    id: "25-J400-EN",
    page: "jets",
    section: "11.2",
    docPath: "manual_media/xx_25-J400-EN_11-2_activating-the-jets-pumps",
    image: {
      url: "https://firebasestorage.googleapis.com/v0/b/extended-experiences.firebasestorage.app/o/assets%2Fscreens%2F11.2-Activating-the-Jets-Pumps-Figure-B.png?alt=media",
      targets: [
        "back button in top left corner",
        "jet number one button",
        "jet number two button",
      ],
    },
    anchors: [
      {
        key: "back-button-in-top-left-corner-1",
        anchor: { x: 3.0675, y: 0.084 },
        box_2d: [
          346.7894648208306,
          324.57147216796875,
          411.09288054567196,
          397.0859059604677
      ],
        confidence: 0.95,
        label: "back button",
        targetScreen:{
          section: "11.2",
          name: "main"
        }
      },
      {
        key: "jet-number-one-button-2",
        anchor: { x: 0.318, y: 0.44 },
        box_2d: [
          440.74129107538977,
          437.95247178011834,
          519.7242775716443,
          515.998457455177
      ],
        confidence: 0.95,
        label: "jet number one button",
        actionMsg: {
          title: "Jet 1",
          message: "Jet pumps should now be turned on/off"
        }
      },
      {
        key: "jet-number-two-button-3",
        anchor: { x: 0.68, y: 0.44 },
        box_2d: [
          439.5984077746085,
          560.8095884793371,
          518.581394270863,
          638.8555741543958
      ],
        confidence: 0.95,
        label: "jet number two button",
        actionMsg: {
          title: "Jet 2",
          message: "Jet pumps 2 should now be turned on/off"
        }
      },
    ],
  },

  {
    id:"main",
    section: "11.3",
    docPath: "manual_media/xx_25-J400-EN_11-3_lights-menu",
    image: {
      url: "https://firebasestorage.googleapis.com/v0/b/extended-experiences.firebasestorage.app/o/assets%2Fscreens%2F11.3-Lights-Menu-Figure-A.png?alt=media",
      targets: ["top right button"],
    },
    anchors: [
      {
        key: "top-right-button-1",
        anchor: { x: 0.81, y: 0.2825 },
        box_2d: [
          0,
          695.0229430621528,
          391.2050817563789,
          975.1076832087842
        ],
        confidence: 0.95,
        label: "lightbulb button",
        targetScreen:{
          section: "11.3",
          name: "lights"
        }
      },
    ],
  },
  {
    id: "lights",
    section: "11.3",
    docPath: "manual_media/xx_25-J400-EN_11-3_lights-menu",
    image: {
      url: "https://firebasestorage.googleapis.com/v0/b/extended-experiences.firebasestorage.app/o/assets%2Fscreens%2F11.3-Lights-Menu-Figure-B.png?alt=media",
      targets: ["back button in top left corner"],
    },
    anchors: [
      {
        key: "back-button-in-top-left-corner-1",
        anchor: { x: 0.0915, y: 0.0835 },
        box_2d: [
          5.294086798898817, 11.417167941397516, 193.452436650614,
          198.8758647374513,
        ],
        confidence: 0.95,
        label: "back button",
        targetScreen:{
          section: "11.3",
          name: "main"
        }
      },
    ],
  },
];


export const getScreenIndex = (section: string, id: string) => {
  return SCREENS.findIndex(
    i => i.id === id && i.section === section
  )
}