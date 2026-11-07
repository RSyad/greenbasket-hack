"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MapPin,
  Upload,
  Sparkles,
  TrendingDown,
  PoundSterling,
  ShoppingBag,
  Navigation,
  Zap,
  Image as ImageIcon,
  ClipboardCheck,
  Copy,
  X,
  ListChecks,
  Store,
  Receipt,
  Check,
  Compass,
  SlidersHorizontal,
} from "lucide-react";
import {
  Shop,
  ShoppingRequirement,
  rankAllShops,
  findCheapestShop,
} from "@/lib/findCheapestShop";

interface RequirementWithMeta extends ShoppingRequirement {
  originalName: string;
  category: string;
  paidPriceGBP: number;
}

interface ExtractedPayload {
  detectedStore: string;
  userPostcode: string;
  userLatitude: number;
  userLongitude: number;
  requirements: RequirementWithMeta[];
  shops: Shop[];
}

const SAMPLE_RECEIPTS = [
  {
    label: "🛒 Tesco Express Oxford Rd (Convenience Markup)",
    text: "TESCO EXPRESS OXFORD RD MANCHESTER: British Beef Steak Mince 500g £3.75, Cathedral City Mature Cheddar 400g £3.60, Lurpak Spreadable Butter 400g £4.25, Walkers Crisps 150g £2.10, Fairtrade Bananas 600g £1.10, Semi-Skimmed Milk 2272g £1.55",
  },
  {
    label: "🛍️ Sainsbury's Local Fallowfield (Student Essentials)",
    text: "SAINSBURYS LOCAL FALLOWFIELD: Chicken Breast Fillets 600g £5.20, Heinz Baked Beans 1600g £3.75, Orange Juice 1000g £3.00, Barista Oat Milk 1000g £2.15, Frozen Pepperoni Pizza 350g £3.25, Pasta Fusilli 500g £1.35",
  },
  {
    label: "🥖 Co-op Piccadilly (Evening Basket)",
    text: "CO-OP MANCHESTER: Salmon Fillets 240g £4.85, Vanilla Ice Cream Tub 465g £5.50, Olive Oil 500g £5.20, Free Range Eggs 360g £2.10, Sourdough Loaf 400g £2.30",
  },
];

// Initial dataset structured for your teammate's findCheapestShop.ts engine!
const INITIAL_PAYLOAD: ExtractedPayload = {
  detectedStore: "Tesco Express (Oxford Rd, M13)",
  userPostcode: "M13 9PL (Manchester Uni)",
  userLatitude: 53.4668,
  userLongitude: -2.2339,
  requirements: [
    { itemType: "butter", originalName: "Lurpak Butter 400g", category: "Meat & Dairy", amountGrams: 400, paidPriceGBP: 4.25 },
    { itemType: "beef mince", originalName: "Beef Steak Mince 500g", category: "Meat & Dairy", amountGrams: 500, paidPriceGBP: 3.75 },
    { itemType: "cheddar", originalName: "Cathedral City Cheddar 400g", category: "Meat & Dairy", amountGrams: 400, paidPriceGBP: 3.60 },
    { itemType: "crisps", originalName: "Walkers Crisps 6pk (150g)", category: "Snacks & Drinks", amountGrams: 150, paidPriceGBP: 2.10 },
    { itemType: "milk", originalName: "Semi-Skimmed Milk 4pt (2272g)", category: "Meat & Dairy", amountGrams: 2272, paidPriceGBP: 1.55 },
    { itemType: "bananas", originalName: "Fairtrade Bananas (600g)", category: "Produce", amountGrams: 600, paidPriceGBP: 1.10 },
  ],
  shops: [
    {
      name: "Lidl (Oxford Rd)",
      latitude: 53.4631,
      longitude: -2.2285,
      products: [
        { itemType: "butter", productName: "Danepak Spreadable 500g", amountGrams: 500, costGBP: 2.49 },
        { itemType: "beef mince", productName: "British Beef Mince 500g", amountGrams: 500, costGBP: 2.49 },
        { itemType: "cheddar", productName: "Valley Spire Mature 400g", amountGrams: 400, costGBP: 2.35 },
        { itemType: "crisps", productName: "Snackrite Crisps 150g", amountGrams: 150, costGBP: 1.15 },
        { itemType: "milk", productName: "British Milk 2272g", amountGrams: 2272, costGBP: 1.45 },
        { itemType: "bananas", productName: "Bananas 600g", amountGrams: 600, costGBP: 0.78 },
      ],
    },
    {
      name: "Aldi (Hulme)",
      latitude: 53.4658,
      longitude: -2.2485,
      products: [
        { itemType: "butter", productName: "Nordpak Spreadable 500g", amountGrams: 500, costGBP: 2.39 },
        { itemType: "beef mince", productName: "Ashfields Beef Mince 500g", amountGrams: 500, costGBP: 2.39 },
        { itemType: "cheddar", productName: "Emporium Mature 400g", amountGrams: 400, costGBP: 2.29 },
        { itemType: "crisps", productName: "Snackrite Multipack 150g", amountGrams: 150, costGBP: 1.09 },
        { itemType: "milk", productName: "Cowbelle Milk 2272g", amountGrams: 2272, costGBP: 1.45 },
        { itemType: "bananas", productName: "Nature's Pick Bananas 600g", amountGrams: 600, costGBP: 0.75 },
      ],
    },
    {
      name: "Asda Superstore (Hulme)",
      latitude: 53.4642,
      longitude: -2.2508,
      products: [
        { itemType: "butter", productName: "Asda Spreadable 500g", amountGrams: 500, costGBP: 2.75 },
        { itemType: "beef mince", productName: "Asda Beef Mince 500g", amountGrams: 500, costGBP: 2.85 },
        { itemType: "cheddar", productName: "Asda Extra Mature 400g", amountGrams: 400, costGBP: 2.70 },
        { itemType: "crisps", productName: "Asda Crisps 150g", amountGrams: 150, costGBP: 1.35 },
        { itemType: "milk", productName: "Asda Milk 2272g", amountGrams: 2272, costGBP: 1.45 },
        { itemType: "bananas", productName: "Asda Bananas 600g", amountGrams: 600, costGBP: 0.85 },
      ],
    },
    {
      name: "Sainsbury's Local (Oxford Rd)",
      latitude: 53.4701,
      longitude: -2.2369,
      products: [
        { itemType: "butter", productName: "Country Life Spreadable 400g", amountGrams: 400, costGBP: 3.95 },
        { itemType: "beef mince", productName: "Sainsbury's Beef Mince 500g", amountGrams: 500, costGBP: 3.60 },
        { itemType: "cheddar", productName: "Sainsbury's Cheddar 400g", amountGrams: 400, costGBP: 3.40 },
        { itemType: "crisps", productName: "Walkers 6pk 150g", amountGrams: 150, costGBP: 2.00 },
        { itemType: "milk", productName: "Sainsbury's Milk 2272g", amountGrams: 2272, costGBP: 1.50 },
        { itemType: "bananas", productName: "Fairtrade Bananas 600g", amountGrams: 600, costGBP: 1.05 },
      ],
    },
    {
      name: "Tesco Express (Current)",
      latitude: 53.4682,
      longitude: -2.2351,
      products: [
        { itemType: "butter", productName: "Lurpak Butter 400g", amountGrams: 400, costGBP: 4.25 },
        { itemType: "beef mince", productName: "Beef Steak Mince 500g", amountGrams: 500, costGBP: 3.75 },
        { itemType: "cheddar", productName: "Cathedral City Cheddar 400g", amountGrams: 400, costGBP: 3.60 },
        { itemType: "crisps", productName: "Walkers Crisps 150g", amountGrams: 150, costGBP: 2.10 },
        { itemType: "milk", productName: "Semi-Skimmed Milk 2272g", amountGrams: 2272, costGBP: 1.55 },
        { itemType: "bananas", productName: "Fairtrade Bananas 600g", amountGrams: 600, costGBP: 1.10 },
      ],
    },
  ],
};

export default function BasketScoutPage() {
  const [payload, setPayload] = useState<ExtractedPayload>(INITIAL_PAYLOAD);
  const [postcode, setPostcode] = useState("M13 9PL");
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(2.0); // Live slider parameter for teammate's function!
  const [textList, setTextList] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedItemIndices, setSelectedItemIndices] = useState<number[]>(
    INITIAL_PAYLOAD.requirements.map((_, i) => i)
  );
  const [activeStoreIdx, setActiveStoreIdx] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedList, setCopiedList] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // =========================================================================
  // RUN TEAMMATE'S HAVERSINE & UNIT-PRICE ENGINE IN REAL TIME!
  // =========================================================================
  const rankedShops = rankAllShops(
    payload.shops,
    payload.requirements,
    payload.userLatitude,
    payload.userLongitude,
    maxDistanceKm
  );

  const cheapestWinner = findCheapestShop(
    payload.shops,
    payload.requirements,
    payload.userLatitude,
    payload.userLongitude,
    maxDistanceKm
  );

  const activeShop = rankedShops[activeStoreIdx] || cheapestWinner || rankedShops[0];

  const originalItemsTotal = payload.requirements.reduce(
    (sum, req) => sum + req.paidPriceGBP,
    0
  );

  // Calculate live side-by-side receipt total using teammate's unit-price breakdown
  const optimizedItemsTotal = payload.requirements.reduce((sum, req, idx) => {
    const isChecked = selectedItemIndices.includes(idx);
    const matchedBreakdown = activeShop?.breakdown.find(
      (b) => b.itemType.toLowerCase() === req.itemType.toLowerCase()
    );
    const cheaperCost = matchedBreakdown ? matchedBreakdown.costGBP : req.paidPriceGBP;
    return sum + (isChecked ? cheaperCost : req.paidPriceGBP);
  }, 0);

  const totalReceiptSavings = Math.max(0, originalItemsTotal - optimizedItemsTotal);
  const savingsPercentage =
    originalItemsTotal > 0
      ? Math.round((totalReceiptSavings / originalItemsTotal) * 100)
      : 0;

  // Render & update Leaflet Map with maxDistanceKm radius circle
  useEffect(() => {
    let retryTimer: any;

    const initOrUpdateMap = () => {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current) {
        retryTimer = setTimeout(initOrUpdateMap, 150);
        return;
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const userLat = payload.userLatitude || 53.4668;
      const userLng = payload.userLongitude || -2.2339;

      const map = L.map(mapContainerRef.current).setView([userLat, userLng], 14);
      mapInstanceRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }
      ).addTo(map);

      // Draw Max Walking Distance Circle from teammate's maxDistanceKm filter
      L.circle([userLat, userLng], {
        radius: maxDistanceKm * 1000,
        color: "#2563eb",
        fillColor: "#3b82f6",
        fillOpacity: 0.06,
        weight: 1.5,
        dashArray: "4, 6",
      }).addTo(map);

      const userIcon = L.divIcon({
        className: "",
        html: `<div style="background:#1e3a8a;color:#fff;padding:4px 10px;border-radius:999px;font-weight:800;font-size:11px;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.25);white-space:nowrap;">
          📍 You (${payload.userPostcode.split(" ")[0] || "M13"})
        </div>`,
        iconSize: [90, 26],
        iconAnchor: [45, 13],
      });
      L.marker([userLat, userLng], { icon: userIcon }).addTo(map);

      const bounds: [number, number][] = [[userLat, userLng]];

      rankedShops.forEach((store, idx) => {
        bounds.push([store.latitude, store.longitude]);

        const isCheapest = idx === 0;
        const isSelected = idx === activeStoreIdx;
        const saved = Math.max(0, originalItemsTotal - store.totalCostGBP);

        const bg = isCheapest ? "#059669" : saved === 0 ? "#dc2626" : "#2563eb";
        const scale = isSelected ? "transform:scale(1.1);z-index:999;" : "";

        const storeIcon = L.divIcon({
          className: "",
          html: `<div style="background:${bg};color:#fff;padding:5px 9px;border-radius:10px;font-family:monospace;font-weight:800;font-size:11px;border:2px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.22);white-space:nowrap;${scale}">
            ${store.shopName.split("(")[0].trim()} • £${store.totalCostGBP.toFixed(2)}
            <div style="font-size:9px;font-family:sans-serif;font-weight:600;opacity:0.95;">
              🚶 ${store.distanceKm} km (${store.walkMinutes}m) ${
            saved > 0 ? `• Save £${saved.toFixed(2)}` : "• Current"
          }
            </div>
          </div>`,
          iconSize: [145, 40],
          iconAnchor: [72, 20],
        });

        const marker = L.marker([store.latitude, store.longitude], {
          icon: storeIcon,
        }).addTo(map);
        marker.on("click", () => setActiveStoreIdx(idx));

        L.polyline(
          [
            [userLat, userLng],
            [store.latitude, store.longitude],
          ],
          {
            color: isSelected ? "#059669" : "#94a3b8",
            weight: isSelected ? 4 : 2,
            dashArray: isSelected ? "6, 6" : "4, 8",
            opacity: isSelected ? 0.95 : 0.5,
          }
        ).addTo(map);
      });

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [45, 45] });
      }
    };

    initOrUpdateMap();

    return () => {
      clearTimeout(retryTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [payload, maxDistanceKm, activeStoreIdx]);

  const compressImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1024;
          const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedBase64 = await compressImageToBase64(file);
      setImagePreview(compressedBase64);
      await runAnalysis(compressedBase64, textList);
    } catch {
      setError("Failed to read receipt image.");
    }
  };

    const runAnalysis = async (customImage?: string | null, customText?: string) => {
    const imgToSend = customImage !== undefined ? customImage : imagePreview;
    const txtToSend = customText !== undefined ? customText : textList;

    if (!imgToSend && !txtToSend.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imgToSend || null,
          textList: txtToSend.trim(),
          postcode: postcode.trim() || "M13 9PL",
          userLat: payload.userLatitude || 53.4668,
          userLng: payload.userLongitude || -2.2339,
          maxDistanceKm,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to compare prices");

      setPayload(result);
      setSelectedItemIndices(
        (result.requirements || []).map((_: any, i: number) => i)
      );
      setActiveStoreIdx(0);
    } catch (err: any) {
      setError(err.message || "Error comparing grocery basket.");
    } finally {
      setLoading(false);
    }
  };


  const toggleReceiptItem = (idx: number) => {
    setSelectedItemIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const generateShoppingListText = () => {
    if (!activeShop) return "No qualifying shop within distance.";
    const lines = [
      `🧾 *BasketScout Unit-Price & Haversine Optimizer (${postcode})*`,
      `📍 Switch From: ${payload.detectedStore} (£${originalItemsTotal.toFixed(2)})`,
      `🏆 Switch To: *${activeShop.shopName}* (${activeShop.distanceKm} km away • £${optimizedItemsTotal.toFixed(2)})`,
      `💰 *Total Saved: £${totalReceiptSavings.toFixed(2)} (-${savingsPercentage}%)* | £${(totalReceiptSavings * 52).toFixed(0)}/yr`,
      ``,
      `🛒 *Unit-Price Normalized Breakdown:*`,
      ...payload.requirements.map((req, idx) => {
        const match = activeShop.breakdown.find(
          (b) => b.itemType.toLowerCase() === req.itemType.toLowerCase()
        );
        const newCost = match ? match.costGBP : req.paidPriceGBP;
        const saved = Math.max(0, req.paidPriceGBP - newCost);
        return `${idx + 1}. ${match?.productName || req.originalName} (${req.amountGrams}g): *£${newCost.toFixed(2)}* (was £${req.paidPriceGBP.toFixed(2)}, save £${saved.toFixed(2)})`;
      }),
    ];
    return lines.join("\n");
  };

  const handleCopyShoppingList = async () => {
    await navigator.clipboard.writeText(generateShoppingListText());
    setCopiedList(true);
    setTimeout(() => setCopiedList(false), 2500);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Top Navbar */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-5 rounded-2xl border border-blue-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              BasketScout UK
            </h1>
            <p className="text-xs text-slate-500">
              Haversine Distance & Unit-Price (£/g) Supermarket Receipt Optimizer
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-800 px-3 py-2 rounded-full border border-blue-200">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Scanned: {payload.detectedStore}</span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-sm"
          >
            <ListChecks className="w-4 h-4 text-emerald-400" />
            Export Cheaper Receipt List
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Postcode + Max Distance Slider + Receipt Upload (4 cols) */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                Your Location / Postcode
              </label>
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="e.g., M13 9PL or Fallowfield"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* LIVE HAVERSINE DISTANCE SLIDER POWERED BY TEAMMATE'S FUNCTION */}
            <div className="mb-5 p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between text-xs font-bold text-blue-950 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                  Max Walking Radius
                </span>
                <span className="font-mono bg-blue-600 text-white px-2 py-0.5 rounded-md">
                  {maxDistanceKm.toFixed(1)} km
                </span>
              </div>
              <input
                type="range"
                min={0.3}
                max={3.0}
                step={0.1}
                value={maxDistanceKm}
                onChange={(e) => {
                  setMaxDistanceKm(parseFloat(e.target.value));
                  setActiveStoreIdx(0);
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0.3 km (4m walk)</span>
                <span>{rankedShops.length} shops in range</span>
                <span>3.0 km</span>
              </div>
            </div>

            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              Snap or Upload Receipt Photo
            </h2>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 rounded-xl p-5 text-center transition cursor-pointer mb-4"
            >
              {imagePreview ? (
                <div className="space-y-2">
                  <img
                    src={imagePreview}
                    alt="Receipt preview"
                    className="max-h-36 mx-auto rounded-lg object-contain border border-slate-200"
                  />
                  <span className="text-xs text-blue-700 font-semibold block">
                    Click to Upload a Different Receipt Photo
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <ImageIcon className="w-8 h-8 text-blue-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">
                    Upload Supermarket Receipt (JPG/PNG)
                  </p>
                  <p className="text-xs text-slate-500">
                    Extracts weights (g) & runs unit-price solver
                  </p>
                </div>
              )}
            </button>

            <div className="mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-2">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Or Try 1-Click Sample UK Receipt:
              </span>
              <div className="flex flex-col gap-2">
                {SAMPLE_RECEIPTS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setImagePreview(null);
                      setTextList(sample.text);
                      runAnalysis(null, sample.text);
                    }}
                    className="text-left text-xs bg-slate-50 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300 border border-slate-200 px-3 py-2 rounded-lg font-medium transition cursor-pointer"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={textList}
              onChange={(e) => setTextList(e.target.value)}
              placeholder="Or paste/type a shopping list (e.g., Beef mince 500g £3.75, Cheddar 400g £3.60)..."
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 mb-4"
            />

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={() => runAnalysis()}
              disabled={loading || (!imagePreview && !textList.trim())}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Running Unit-Price Solver..." : "Find Cheapest Shop in Range"}
            </button>
          </div>
        </section>

        {/* RIGHT COLUMN: KPI Cards + SIDE-BY-SIDE RECEIPTS + INTERACTIVE MAP (8 cols) */}
        <section className="lg:col-span-8 space-y-6">
          {/* 4 KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Original Receipt</span>
                <PoundSterling className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                £{originalItemsTotal.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {payload.detectedStore}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-300 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Cheapest in Range</span>
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-600 font-mono">
                £{optimizedItemsTotal.toFixed(2)}
              </div>
              <div className="text-[11px] font-semibold text-emerald-700 truncate">
                {activeShop ? `${activeShop.shopName} (${activeShop.distanceKm} km)` : "Increase radius"}
              </div>
            </div>

            <div className="bg-emerald-900 text-white p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-xs text-emerald-200 mb-1">
                <span>Unit-Price Saving</span>
                <TrendingDown className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-300 font-mono">
                -£{totalReceiptSavings.toFixed(2)}
              </div>
              <div className="text-[11px] text-emerald-200">
                Save {savingsPercentage}% on equal weight (g)
              </div>
            </div>

            <div className="bg-blue-950 text-white p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-xs text-blue-200 mb-1">
                <span>Yearly Saving (52w)</span>
                <MapPin className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-extrabold text-white font-mono">
                £{(totalReceiptSavings * 52).toFixed(0)}/yr
              </div>
              <div className="text-[11px] text-blue-200 truncate">
                {activeShop ? `${activeShop.walkMinutes} min walk (${activeShop.distanceKm} km)` : "No shop in range"}
              </div>
            </div>
          </div>

          {/* SIDE-BY-SIDE ORIGINAL RECEIPT VS. UNIT-PRICE OPTIMIZED RECEIPT */}
          <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  Side-by-Side Receipt Comparison (Normalized by Weight in Grams)
                </h3>
                <p className="text-xs text-slate-500">
                  Powered by <code className="font-mono bg-white px-1.5 py-0.5 rounded border">findCheapestShop.ts</code> unit-price per gram calculator
                </p>
              </div>
              <button
                onClick={() =>
                  setSelectedItemIndices(
                    selectedItemIndices.length === payload.requirements.length
                      ? []
                      : payload.requirements.map((_, i) => i)
                  )
                }
                className="text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs"
              >
                {selectedItemIndices.length === payload.requirements.length
                  ? "Uncheck All Items"
                  : "Select All Savings"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LEFT RECEIPT: ORIGINAL RECEIPT */}
              <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden flex flex-col justify-between relative">
                <div className="h-2 bg-slate-200 border-b border-dashed border-slate-300" />

                <div className="p-5 font-mono">
                  <div className="text-center border-b-2 border-dashed border-slate-300 pb-3 mb-4">
                    <span className="inline-block text-[10px] font-sans font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full mb-1">
                      Original Receipt (What You Paid)
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900 uppercase">
                      {payload.detectedStore}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Area: {payload.userPostcode}
                    </p>
                  </div>

                  <div className="divide-y divide-dashed divide-slate-200">
                    {payload.requirements.map((req, idx) => (
                      <div
                        key={idx}
                        className="py-2.5 flex items-center justify-between gap-2 min-h-[58px]"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {req.originalName}
                          </p>
                          <span className="text-[10px] text-slate-400 font-sans">
                            Required: {req.amountGrams}g • £
                            {((req.paidPriceGBP / req.amountGrams) * 100).toFixed(2)}/100g
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 tabular-nums">
                          £{req.paidPriceGBP.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border-t-2 border-dashed border-slate-300 font-mono">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>ITEMS COUNT</span>
                    <span>{payload.requirements.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-extrabold text-slate-900">
                    <span>TOTAL PAID</span>
                    <span>£{originalItemsTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT RECEIPT: TEAMMATE ENGINE OPTIMIZED RECEIPT */}
              <div className="bg-white rounded-xl border-2 border-emerald-500 shadow-md overflow-hidden flex flex-col justify-between relative">
                <div className="h-2 bg-emerald-500" />

                <div className="p-5 font-mono">
                  <div className="text-center border-b-2 border-dashed border-emerald-200 pb-3 mb-4">
                    <span className="inline-block text-[10px] font-sans font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full mb-1">
                      Unit-Price Optimized (Save £{totalReceiptSavings.toFixed(2)})
                    </span>
                    <h4 className="text-sm font-extrabold text-emerald-950 uppercase">
                      {activeShop ? activeShop.shopName : "No Shop in Radius"}
                    </h4>
                    <p className="text-[11px] text-emerald-700 font-sans font-medium">
                      {activeShop
                        ? `📍 ${activeShop.distanceKm} km away (${activeShop.walkMinutes} min walk)`
                        : "Drag the Max Walking Radius slider left/right"}
                    </p>
                  </div>

                  <div className="divide-y divide-dashed divide-emerald-100">
                    {payload.requirements.map((req, idx) => {
                      const isSelected = selectedItemIndices.includes(idx);
                      const matched = activeShop?.breakdown.find(
                        (b) => b.itemType.toLowerCase() === req.itemType.toLowerCase()
                      );
                      const cheaperPrice = matched ? matched.costGBP : req.paidPriceGBP;
                      const itemSaving = Math.max(0, req.paidPriceGBP - cheaperPrice);

                      return (
                        <div
                          key={idx}
                          onClick={() => toggleReceiptItem(idx)}
                          className={`py-2 px-2 -mx-2 rounded-lg transition cursor-pointer flex items-center justify-between gap-2 min-h-[58px] ${
                            isSelected
                              ? "bg-emerald-50/70 hover:bg-emerald-100/60"
                              : "opacity-50 hover:opacity-80"
                          }`}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <div
                              className={`mt-0.5 w-4 h-4 rounded-sm flex items-center justify-center shrink-0 border ${
                                isSelected
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-emerald-950 truncate">
                                {matched?.productName || req.originalName}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] font-sans">
                                <span className="text-emerald-700 font-semibold">
                                  {req.amountGrams}g (£{matched?.unitPricePer100g.toFixed(2)}/100g)
                                </span>
                                {itemSaving > 0 && (
                                  <span className="bg-emerald-600 text-white px-1.5 py-0.2 rounded-sm font-bold">
                                    Save £{itemSaving.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-extrabold text-emerald-700 tabular-nums block">
                              £{(isSelected ? cheaperPrice : req.paidPriceGBP).toFixed(2)}
                            </span>
                            {isSelected && itemSaving > 0 && (
                              <span className="text-[10px] line-through text-slate-400 block">
                                £{req.paidPriceGBP.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-emerald-950 text-white p-4 border-t-2 border-dashed border-emerald-700 font-mono">
                  <div className="flex items-center justify-between text-xs text-emerald-300 mb-1">
                    <span>YOU SAVE ({savingsPercentage}%)</span>
                    <span className="font-bold">-£{totalReceiptSavings.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-extrabold text-white">
                    <span>NEW TOTAL</span>
                    <span className="text-emerald-400">
                      £{optimizedItemsTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LIVE INTERACTIVE HAVERSINE SUPERMARKET MAP */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-blue-600" />
                  Shops Within {maxDistanceKm.toFixed(1)} km Radius ({rankedShops.length} Qualifying)
                </h3>
                <p className="text-xs text-slate-500">
                  Click any shop below to inspect its unit-price receipt above and highlight its route on the map
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {rankedShops.map((store, idx) => {
                const isCheapest = idx === 0;
                const isSelected = idx === activeStoreIdx;
                const saved = Math.max(0, originalItemsTotal - store.totalCostGBP);
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveStoreIdx(idx)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-blue-50/90 border-blue-600 ring-2 ring-blue-500/30 shadow-xs"
                        : isCheapest
                        ? "bg-emerald-50/70 border-emerald-300 hover:border-emerald-500"
                        : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${
                          isCheapest
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {isCheapest ? "Cheapest in Radius" : `Rank #${idx + 1}`}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {store.shopName}
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        🚶 {store.distanceKm} km ({store.walkMinutes}m walk)
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-baseline justify-between">
                      <span className="text-base font-extrabold text-slate-900 font-mono">
                        £{store.totalCostGBP.toFixed(2)}
                      </span>
                      {saved > 0 ? (
                        <span className="text-[11px] font-bold text-emerald-700">
                          -£{saved.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Paid</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-300 shadow-inner">
              <div ref={mapContainerRef} className="h-96 w-full z-0" />
            </div>
          </div>
        </section>
      </div>

      {/* INTERACTIVE ACTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  Cheapest Nearby Shop Plan
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Calculated by <code className="font-mono">findCheapestShop.ts</code> (Haversine distance + £/gram normalization):
            </p>

            <pre className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">
              {generateShoppingListText()}
            </pre>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleCopyShoppingList}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                {copiedList ? (
                  <>
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Copied for WhatsApp!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Shop Plan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
