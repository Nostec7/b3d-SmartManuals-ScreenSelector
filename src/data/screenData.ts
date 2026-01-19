
//==================================================================
// Full Data for screen navigation on a specific series of products (single PDF)
export const hardcodedScreenData = [
    {
      pdfID:"25-J400-EN",
      docPath: "manual_media/xx_25-J400-EN_11-2_activating-the-jets-pumps",
      id: "activating-jet-pumps",
      label: "Activating Jet Pumps", // anything that helps AI detect it goes...
      screenOptions: [
        {
          id: "main-menu",
          section: "11.2",
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
                id: "jets-menu"
              }
            },
          ],
        },
        {
          id: "jets-menu",
          section: "11.2",
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
                id: "main-menu"
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
      ]
    },
    {
      pdfID:"25-J400-EN",
      docPath: "manual_media/xx_25-J400-EN_11-2_activating-the-jets-pumps",
      id: "temperature-control",
      label: "Increase decrease the temperature", // anything that helps AI detect it goes...
      screenOptions: [
        {
          id: "temperature-100",
          section: "8.7",
          image: {
            url: "https://firebasestorage.googleapis.com/v0/b/smartmanuals-477417-t9.firebasestorage.app/o/productImages%2Fjht-j-475%2Fscreens%2F8.7-Set-spa-to-heat-100.webp?alt=media&token=ce64f577-43ef-409d-978f-94d03d223ce2",
            targets: ["temperature up"],
          },
          anchors: [
            {
              key: "temperature-up",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                376.7095881377719,
                462.34050097124674,
                469.5052301560487,
                545.9067713060927
            ],
              confidence: 0.98,
              label: "temperature up",
              targetScreen:{
                section: "8.7",
                id: "temperature-101"
              }
            },
            {
              key: "temperature-down",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                511.7095881377719,
                468.626206537653,
                600.5052301560487,
                548.1924768724989
            ],
              confidence: 0.98,
              label: "temperature down",
              targetScreen:{
                section: "8.7",
                id: "temperature-99"
              }
            },
          ],
        },
        {
          id: "temperature-96",
          section: "8.7",
          image: {
            url: "https://firebasestorage.googleapis.com/v0/b/smartmanuals-477417-t9.firebasestorage.app/o/productImages%2Fjht-j-475%2Fscreens%2F8.7-Set-spa-to-heat-96.webp?alt=media&token=19b803c1-b3e9-4c14-9cb1-5b22cd35f30a",
            targets: ["temperature up"],
          },
          anchors: [
            {
              key: "temperature-up",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                376.7095881377719,
                462.34050097124674,
                469.5052301560487,
                545.9067713060927
            ],
              confidence: 0.98,
              label: "temperature up",
              targetScreen:{
                section: "8.7",
                id: "temperature-97"
              }
            },
          ],
        },
        {
          id: "temperature-97",
          section: "8.7",
          image: {
            url: "https://firebasestorage.googleapis.com/v0/b/smartmanuals-477417-t9.firebasestorage.app/o/productImages%2Fjht-j-475%2Fscreens%2F8.7-Set-spa-to-heat-97.webp?alt=media&token=d3e9bf97-cd55-4299-823d-c351bf292a96",
            targets: ["temperature up"],
          },
          anchors: [
            {
              key: "temperature-up",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                376.7095881377719,
                462.34050097124674,
                469.5052301560487,
                545.9067713060927
            ],
              confidence: 0.98,
              label: "temperature up",
              targetScreen:{
                section: "8.7",
                id: "temperature-98"
              }
            },
            {
              key: "temperature-down",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                511.7095881377719,
                468.626206537653,
                600.5052301560487,
                548.1924768724989
            ],
              confidence: 0.98,
              label: "temperature down",
              targetScreen:{
                section: "8.7",
                id: "temperature-96"
              }
            },
          ],
        },
        {
          id: "temperature-98",
          section: "8.7",
          image: {
            url: "https://firebasestorage.googleapis.com/v0/b/smartmanuals-477417-t9.firebasestorage.app/o/productImages%2Fjht-j-475%2Fscreens%2F8.7-Set-spa-to-heat-98.webp?alt=media&token=f5e54b90-e5bd-45ad-b3f9-0dc254559737",
            targets: ["temperature up"],
          },
          anchors: [
            {
              key: "temperature-up",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                376.7095881377719,
                462.34050097124674,
                469.5052301560487,
                545.9067713060927
            ],
              confidence: 0.98,
              label: "temperature up",
              targetScreen:{
                section: "8.7",
                id: "temperature-99"
              }
            },
            {
              key: "temperature-down",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                511.7095881377719,
                468.626206537653,
                600.5052301560487,
                548.1924768724989
            ],
              confidence: 0.98,
              label: "temperature down",
              targetScreen:{
                section: "8.7",
                id: "temperature-97"
              }
            },
          ],
        },
        {
          id: "temperature-99",
          section: "8.7",
          image: {
            url: "https://firebasestorage.googleapis.com/v0/b/smartmanuals-477417-t9.firebasestorage.app/o/productImages%2Fjht-j-475%2Fscreens%2F8.7-Set-spa-to-heat-99.webp?alt=media&token=259716a4-6e06-47e4-82e8-277bb4fbcfd9",
            targets: ["temperature up"],
          },
          anchors: [
            {
              key: "temperature-up",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                376.7095881377719,
                462.34050097124674,
                469.5052301560487,
                545.9067713060927
            ],
              confidence: 0.98,
              label: "temperature up",
              targetScreen:{
                section: "8.7",
                id: "temperature-100"
              }
            },
            {
              key: "temperature-down",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                511.7095881377719,
                468.626206537653,
                600.5052301560487,
                548.1924768724989
            ],
              confidence: 0.98,
              label: "temperature down",
              targetScreen:{
                section: "8.7",
                id: "temperature-98"
              }
            },
          ],
        },
        {
          id: "temperature-101",
          section: "8.7",
          image: {
            url: "https://firebasestorage.googleapis.com/v0/b/smartmanuals-477417-t9.firebasestorage.app/o/productImages%2Fjht-j-475%2Fscreens%2F8.7-Set-spa-to-heat-101.webp?alt=media&token=79b6e817-d4ad-4bb9-b339-7b34c827ff46",
            targets: ["temperature up"],
          },
          anchors: [
            {
              key: "temperature-up",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                376.7095881377719,
                462.34050097124674,
                469.5052301560487,
                545.9067713060927
            ],
              confidence: 0.98,
              label: "temperature up",
              targetScreen:{
                section: "8.7",
                id: "temperature-102"
              }
            },
            {
              key: "temperature-down",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                511.7095881377719,
                468.626206537653,
                600.5052301560487,
                548.1924768724989
            ],
              confidence: 0.98,
              label: "temperature down",
              targetScreen:{
                section: "8.7",
                id: "temperature-100"
              }
            },
          ],
        },
        {
          id: "temperature-102",
          section: "8.7",
          image: {
            url: "https://firebasestorage.googleapis.com/v0/b/smartmanuals-477417-t9.firebasestorage.app/o/productImages%2Fjht-j-475%2Fscreens%2F8.7-Set-spa-to-heat-102.webp?alt=media&token=3bccadc1-2394-4ad8-b958-b46f35363f2f",
            targets: ["temperature up"],
          },
          anchors: [
            {
              key: "temperature-up",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                376.7095881377719,
                462.34050097124674,
                469.5052301560487,
                545.9067713060927
            ],
              confidence: 0.98,
              label: "temperature up",
              targetScreen:{
                section: "8.7",
                id: "temperature-103"
              }
            },
            {
              key: "temperature-down",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                511.7095881377719,
                468.626206537653,
                600.5052301560487,
                548.1924768724989
            ],
              confidence: 0.98,
              label: "temperature down",
              targetScreen:{
                section: "8.7",
                id: "temperature-101"
              }
            },
          ],
        },
        {
          id: "temperature-103",
          section: "8.7",
          image: {
            url: "https://firebasestorage.googleapis.com/v0/b/smartmanuals-477417-t9.firebasestorage.app/o/productImages%2Fjht-j-475%2Fscreens%2F8.7-Set-spa-to-heat-103.webp?alt=media&token=8ad24ce3-542b-49f7-857e-35ddec6af351",
            targets: ["temperature up"],
          },
          anchors: [
            {
              key: "temperature-up",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                376.7095881377719,
                462.34050097124674,
                469.5052301560487,
                545.9067713060927
            ],
              confidence: 0.98,
              label: "temperature up",
              targetScreen:{
                section: "8.7",
                id: "temperature-104"
              }
            },
            {
              key: "temperature-down",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                511.7095881377719,
                468.626206537653,
                600.5052301560487,
                548.1924768724989
            ],
              confidence: 0.98,
              label: "temperature down",
              targetScreen:{
                section: "8.7",
                id: "temperature-102"
              }
            },
          ],
        },
        {
          id: "temperature-104",
          section: "8.7",
          image: {
            url: "https://firebasestorage.googleapis.com/v0/b/smartmanuals-477417-t9.firebasestorage.app/o/productImages%2Fjht-j-475%2Fscreens%2F8.7-Set-spa-to-heat-104.webp?alt=media&token=d20e35ff-2518-4870-bb49-58b8f0e4f901",
            targets: ["temperature up"],
          },
          anchors: [
            {
              key: "temperature-down",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                511.7095881377719,
                468.626206537653,
                600.5052301560487,
                548.1924768724989
            ],
              confidence: 0.98,
              label: "temperature down",
              targetScreen:{
                section: "8.7",
                id: "temperature-103"
              }
            },
          ],
        },
      ]
    },












    {
      pdfID:"26-SDS-780-EN",
      docPath: "manual_media/",
      id: "temperature-control",
      label: "Increase decrease the temperature", // anything that helps AI detect it goes...
      screenOptions: [
        {
          id: "temperature-100",
          section: "8.7",
          image: {
            url: "https://firebasestorage.googleapis.com/v0/b/smartmanuals-477417-t9.firebasestorage.app/o/productImages%2Fsds-780-montclair%2Fscreens%2F8.7-Set-spa-to-heat-100.webp?alt=media&token=623acfcc-53e9-4050-bd84-de8d068fe3e1",
            targets: ["temperature up"],
          },
          anchors: [
            {
              key: "temperature-up",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                436.2809992705844,
                591.7690288032779,
                513.93375798807995,
                651.9067102709364
              ],
              confidence: 0.98,
              label: "temperature up",
              targetScreen:{
                section: "8.7",
                id: "temperature-101"
              }
            },
            {
              key: "temperature-down",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                434.1381464873813,
                391.1976176704655,
                513.7909052048768,
                450.33529913812396
              ],
              confidence: 0.98,
              label: "temperature down",
              targetScreen:{
                section: "8.7",
                id: "temperature-99"
              }
            },
          ],
        },
        {
          id: "temperature-101",
          section: "8.7",
          image: {
            url: "https://firebasestorage.googleapis.com/v0/b/smartmanuals-477417-t9.firebasestorage.app/o/productImages%2Fsds-780-montclair%2Fscreens%2F8.7-Set-spa-to-heat-101.webp?alt=media&token=7eebbfa0-53ce-4e8b-aacb-c0307c1c74b9",
            targets: ["temperature up"],
          },
          anchors: [
            {
              key: "temperature-up",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                436.2809992705844,
                591.7690288032779,
                513.93375798807995,
                651.9067102709364
              ],
              confidence: 0.98,
              label: "temperature up",
              targetScreen:{
                section: "8.7",
                id: "temperature-102"
              }
            },
            {
              key: "temperature-down",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                434.1381464873813,
                391.1976176704655,
                513.7909052048768,
                450.33529913812396
              ],
              confidence: 0.98,
              label: "temperature down",
              targetScreen:{
                section: "8.7",
                id: "temperature-100"
              }
            },
          ],
        },
        {
          id: "temperature-102",
          section: "8.7",
          image: {
            url: "https://firebasestorage.googleapis.com/v0/b/smartmanuals-477417-t9.firebasestorage.app/o/productImages%2Fsds-780-montclair%2Fscreens%2F8.7-Set-spa-to-heat-102.webp?alt=media&token=ae1d7458-58b4-4e82-8a6f-27fd37bfa9dc",
            targets: ["temperature up"],
          },
          anchors: [
            {
              key: "temperature-up",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                436.2809992705844,
                591.7690288032779,
                513.93375798807995,
                651.9067102709364
              ],
              confidence: 0.98,
              label: "temperature up",
              targetScreen:{
                section: "8.7",
                id: "temperature-103"
              }
            },
            {
              key: "temperature-down",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                434.1381464873813,
                391.1976176704655,
                513.7909052048768,
                450.33529913812396
              ],
              confidence: 0.98,
              label: "temperature down",
              targetScreen:{
                section: "8.7",
                id: "temperature-101"
              }
            },
          ],
        },
        {
          id: "temperature-103",
          section: "8.7",
          image: {
            url: "https://firebasestorage.googleapis.com/v0/b/smartmanuals-477417-t9.firebasestorage.app/o/productImages%2Fsds-780-montclair%2Fscreens%2F8.7-Set-spa-to-heat-103.webp?alt=media&token=d79ad714-b37d-45db-97d2-f605f004d065",
            targets: ["temperature up"],
          },
          anchors: [
            {
              key: "temperature-up",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                436.2809992705844,
                591.7690288032779,
                513.93375798807995,
                651.9067102709364
              ],
              confidence: 0.98,
              label: "temperature up",
              targetScreen:{
                section: "8.7",
                id: "temperature-104"
              }
            },
            {
              key: "temperature-down",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                434.1381464873813,
                391.1976176704655,
                513.7909052048768,
                450.33529913812396
              ],
              confidence: 0.98,
              label: "temperature down",
              targetScreen:{
                section: "8.7",
                id: "temperature-102"
              }
            },
          ],
        },
        {
          id: "temperature-104",
          section: "8.7",
          image: {
            url: "https://firebasestorage.googleapis.com/v0/b/smartmanuals-477417-t9.firebasestorage.app/o/productImages%2Fsds-780-montclair%2Fscreens%2F8.7-Set-spa-to-heat-104.webp?alt=media&token=8120ce84-49d3-4c55-856d-81d6eb6c158e",
            targets: ["temperature up"],
          },
          anchors: [
            {
              key: "temperature-down",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                434.1381464873813,
                391.1976176704655,
                513.7909052048768,
                450.33529913812396
              ],
              confidence: 0.98,
              label: "temperature down",
              targetScreen:{
                section: "8.7",
                id: "temperature-103"
              }
            },
          ],
        },
        {
          id: "temperature-99",
          section: "8.7",
          image: {
            url: "https://firebasestorage.googleapis.com/v0/b/smartmanuals-477417-t9.firebasestorage.app/o/productImages%2Fsds-780-montclair%2Fscreens%2F8.7-Set-spa-to-heat-99.webp?alt=media&token=ecc3d7eb-4277-4441-8de6-29e8cb3f9bf2",
            targets: ["temperature up"],
          },
          anchors: [
            {
              key: "temperature-up",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                436.2809992705844,
                591.7690288032779,
                513.93375798807995,
                651.9067102709364
              ],
              confidence: 0.98,
              label: "temperature up",
              targetScreen:{
                section: "8.7",
                id: "temperature-100"
              }
            },
            {
              key: "temperature-down",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                434.1381464873813,
                391.1976176704655,
                513.7909052048768,
                450.33529913812396
              ],
              confidence: 0.98,
              label: "temperature down",
              targetScreen:{
                section: "8.7",
                id: "temperature-98"
              }
            },
          ],
        },
        {
          id: "temperature-98",
          section: "8.7",
          image: {
            url: "https://firebasestorage.googleapis.com/v0/b/smartmanuals-477417-t9.firebasestorage.app/o/productImages%2Fsds-780-montclair%2Fscreens%2F8.7-Set-spa-to-heat-98.webp?alt=media&token=77107ad0-3026-4e2c-9e0d-04a2047b4348",
            targets: ["temperature up"],
          },
          anchors: [
            {
              key: "temperature-up",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                436.2809992705844,
                591.7690288032779,
                513.93375798807995,
                651.9067102709364
              ],
              confidence: 0.98,
              label: "temperature up",
              targetScreen:{
                section: "8.7",
                id: "temperature-99"
              }
            },
            {
              key: "temperature-down",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                434.1381464873813,
                391.1976176704655,
                513.7909052048768,
                450.33529913812396
              ],
              confidence: 0.98,
              label: "temperature down",
              targetScreen:{
                section: "8.7",
                id: "temperature-97"
              }
            },
          ],
        },
        {
          id: "temperature-97",
          section: "8.7",
          image: {
            url: "https://firebasestorage.googleapis.com/v0/b/smartmanuals-477417-t9.firebasestorage.app/o/productImages%2Fsds-780-montclair%2Fscreens%2F8.7-Set-spa-to-heat-97.webp?alt=media&token=03820778-9057-4a23-9ba5-bc394c6f072c",
            targets: ["temperature up"],
          },
          anchors: [
            {
              key: "temperature-up",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                436.2809992705844,
                591.7690288032779,
                513.93375798807995,
                651.9067102709364
              ],
              confidence: 0.98,
              label: "temperature up",
              targetScreen:{
                section: "8.7",
                id: "temperature-98"
              }
            },
            {
              key: "temperature-down",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                434.1381464873813,
                391.1976176704655,
                513.7909052048768,
                450.33529913812396
              ],
              confidence: 0.98,
              label: "temperature down",
              targetScreen:{
                section: "8.7",
                id: "temperature-96"
              }
            },
          ],
        },
        {
          id: "temperature-96",
          section: "8.7",
          image: {
            url: "https://firebasestorage.googleapis.com/v0/b/smartmanuals-477417-t9.firebasestorage.app/o/productImages%2Fsds-780-montclair%2Fscreens%2F8.7-Set-spa-to-heat-96.webp?alt=media&token=a4171c40-2bd3-4584-a53b-448bf0768b5b",
            targets: ["temperature up"],
          },
          anchors: [
            {
              key: "temperature-up",
              anchor: { x: 0.1565, y: 0.163 },
              "box_2d": [
                436.2809992705844,
                591.7690288032779,
                513.93375798807995,
                651.9067102709364
              ],
              confidence: 0.98,
              label: "temperature up",
              targetScreen:{
                section: "8.7",
                id: "temperature-97"
              }
            },
          ],
        },
        
      ]
    }
    
  ]