import React, { useMemo, useState } from "react";
import { fullDataJSON } from "../data/screenData";


/* ---------- Types ---------- */

type Feature = {
  pdfID: string;
  pdf_id?: string;
  productID: string;
  product_id: string;
  caption: string;
  section?: string;
  tags?: string[];
  suggestedLabel: string;
  type: string;
  interactiveP3DModel?: {
    p3dID: string;
    [key: string]: any;
  };
  [key: string]: any;
};

type AssetEntry = {
  id: string;
  productID: string;
  p3dID: string;
};

/* ---------- Component ---------- */

export const FeatureExporter: React.FC = () => {
  const features = fullDataJSON as Feature[];

  const [selectedFeatureIndexes, setSelectedFeatureIndexes] = useState<
    Set<number>
  >(new Set());

  const [assets, setAssets] = useState<AssetEntry[]>([
    { id: crypto.randomUUID(), productID: "", p3dID: "" },
  ]);

  /* ---------- Handlers ---------- */

  const toggleFeature = (index: number) => {
    setSelectedFeatureIndexes((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const updateAsset = (
    id: string,
    field: "productID" | "p3dID",
    value: string
  ) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const addAsset = () => {
    setAssets((prev) => [
      ...prev,
      { id: crypto.randomUUID(), productID: "", p3dID: "" },
    ]);
  };

  const removeAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  /* ---------- Export Logic ---------- */

  const exportFeatures = () => {
    const selectedFeatures = [...selectedFeatureIndexes].map(
      (i) => features[i]
    );
  
    const validAssets = assets.filter(
      (a) => a.productID.trim() && a.p3dID.trim()
    );
  
    const exportedFeatures: Feature[] = [];
  
    selectedFeatures.forEach((feature) => {
      validAssets.forEach((asset) => {
        const clonedFeature: Feature = JSON.parse(
          JSON.stringify(feature)
        );
  
        clonedFeature.productID = asset.productID;
        clonedFeature.product_id = asset.productID;
        clonedFeature.pdfID = `${feature.pdfID}`;
        clonedFeature.pdf_id = clonedFeature.pdfID;
  
        if (clonedFeature.interactiveP3DModel) {
          clonedFeature.interactiveP3DModel.p3dID = asset.p3dID;
        }
  
        exportedFeatures.push(clonedFeature);
      });
    });
  
    // 🔽 JSON-compatible output
    const jsonOutput = JSON.stringify(exportedFeatures, null, 2);
  
    console.log(jsonOutput);
  };

  /* ---------- Render ---------- */

  return (
    <div className="w-full pr-2">
        <h1 className="font-black text-xl pb-2">FEATURE EXPORTER</h1>
      {/* Feature List */}
      <div className="flex p-2 flex-col bg-[#222] text-[#eee] rounded-xl">
        <h3 className="font-bold">Features</h3>
        {features.map((feature, index) => {
          const label = `${feature.pdfID} || ${feature.productID} || ${feature.section} || ${feature.caption}`;
          return (
            <div key={`hd-${index}`}>
              {
                (index == 0 || (index >= 1 && features[index-1].productID != feature.productID)) && (
                  <h1 className="font-black uppercase text-2xl border-b-3 pb-1 pt-2 border-dotted">
                    📦 {feature.productID}
                  </h1>
                )
              }
              <label
                key={index}
                className="border-b-2 border-[#ffffff33] pl-1 text-sm"
                style={{ display: "block", marginBottom: 6 }}
                
              >
                <input
                  type="checkbox"
                  checked={selectedFeatureIndexes.has(index)}
                  onChange={() => toggleFeature(index)}
                />{" "}
                {label}
              </label>
            </div>
            
          );
        })}
      </div>

      {/* Asset Editor */}
      <div className="flex flex-col bg-[#222] mt-1 rounded-xl text-[#eee] p-4">
        <h3 className="font-bold pb-2">Assets</h3>

        {assets.map((asset) => (
          <div
            key={asset.id}
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 8,
              alignItems: "center",
            }}
          >
            <input
              placeholder="productID"
              value={asset.productID}
              onChange={(e) =>
                updateAsset(asset.id, "productID", e.target.value)
              }
              className="bg-[#eee] rounded-md px-2 py-1 font-semibold text-black border-none outline-none flex-grow"
            />
            <input
              placeholder="p3dID"
              value={asset.p3dID}
              onChange={(e) =>
                updateAsset(asset.id, "p3dID", e.target.value)
              }
              className="bg-[#eee] rounded-md px-2 py-1 font-semibold text-black border-none outline-none flex-grow"
            />
            <button onClick={() => removeAsset(asset.id)} 
                    className="px-2"
                >❌</button>
          </div>
        ))}

        <button onClick={addAsset}
        className="bg-[#555] p-2 rounded-md text-white font-bold"
        >➕ Add Asset</button>

        {/* Export */}
        <div>
            <button onClick={exportFeatures}
            className="bg-[#2b7fff] p-2 rounded-md text-white font-bold w-full mt-2"
            >Export Features</button>
        </div>
      </div>

      
    </div>
  );
};
