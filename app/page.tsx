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
} from "lucide-react";

interface StoreComparison {
  storeName: string;
  totalBasketGBP: number;
  distanceMiles: number;
  walkMinutes: number;
  savingsVsCurrentGBP: number;
  tag: string;
  lat: number;
  lng: number;
}

interface BasketItem {
  name: string;
  cheapestItemName?: string;
  category: string;
  currentPriceGBP: number;
  cheapestPriceGBP: number;
  cheapestStore: string;
}

interface SmartSwap {
  originalItem: string;
  betterDealSuggestion: string;
  targetStore: string;
  moneySavedGBP: number;
  reason: string;
}

interface BasketComparisonData {
  detectedStore: string;
  userPostcode: string;
  userLat?: number;
  userLng?: number;
  currentBasketTotalGBP: number;
  cheapestStoreName: string;
  cheapestBasketTotalGBP: number;
  nearestStoreName: string;
  nearestDistanceMiles: number;
  storeComparisons: StoreComparison[];
  items: BasketItem[];
  smartSwaps: SmartSwap[];
}

const SAMPLE_RECEIPTS = [
  {
    label: "🛒 Tesco Express Oxford Rd (Convenience Markup)",
    text: "TESCO EXPRESS OXFORD RD MANCHESTER: British Beef Steak Mince 500g £3.75, Cathedral City Mature Cheddar 400g £3.60, Lurpak Spreadable Butter 400g £4.25, Walkers Crisps 6 Pack £2.10, Fairtrade Bananas 5 Pack £1.10, Semi-Skimmed Milk 4 Pints £1.55",
  },
  {
    label: "🛍️ Sainsbury's Local Fallowfield (Student Essentials)",
    text: "SAINSBURYS LOCAL FALLOWFIELD: Chicken Breast Fillets 600g £5.20, Heinz Baked Beans 4 Pack £3.75, Tropicana Orange Juice 1L £3.00, Barista Oat Milk 1L £2.15, Frozen Pepperoni Pizza £3.25, Pasta Fusilli 500g £1.35",
  },
  {
    label: "🥖 Co-op Piccadilly (Evening Basket)",
    text: "CO-OP MANCHESTER: Salmon Fillets 2 Pack £4.85, Ben & Jerry's Tub 465ml £5.50, Olive Oil 500ml £5.20, Free Range Eggs 6 Pack £2.10, Sourdough Loaf £2.30",
  },
];

const INITIAL_DATA: BasketComparisonData = {
  detectedStore: "Tesco Express (Oxford Rd, M13)",
  userPostcode: "M13 9PL (Manchester Uni)",
  userLat: 53.4668,
  userLng: -2.2339,
  currentBasketTotalGBP: 16.35,
  cheapestStoreName: "Lidl (Oxford Rd • 0.3 mi)",
  cheapestBasketTotalGBP: 9.87,
  nearestStoreName: "Tesco Express (0.1 mi • 2 min walk)",
  nearestDistanceMiles: 0.1,
  storeComparisons: [
    {
      storeName: "Lidl (Oxford Rd)",
      totalBasketGBP: 9.87,
      distanceMiles: 0.3,
      walkMinutes: 6,
      savingsVsCurrentGBP: 6.48,
      tag: "Cheapest & Close",
      lat: 53.4631,
      lng: -2.2285,
    },
    {
      storeName: "Aldi (Hulme)",
      totalBasketGBP: 10.15,
      distanceMiles: 0.7,
      walkMinutes: 14,
      savingsVsCurrentGBP: 6.2,
      tag: "Low Price",
      lat: 53.4658,
      lng: -2.2485,
    },
    {
      storeName: "Asda Superstore (Hulme)",
      totalBasketGBP: 11.9,
      distanceMiles: 0.8,
      walkMinutes: 16,
      savingsVsCurrentGBP: 4.45,
      tag: "Large Superstore",
      lat: 53.4642,
      lng: -2.2508,
    },
    {
      storeName: "Sainsbury's Local (Oxford Rd)",
      totalBasketGBP: 15.9,
      distanceMiles: 0.2,
      walkMinutes: 4,
      savingsVsCurrentGBP: 0.45,
      tag: "Convenience Store",
      lat: 53.4701,
      lng: -2.2369,
    },
    {
      storeName: "Tesco Express (Current)",
      totalBasketGBP: 16.35,
      distanceMiles: 0.1,
      walkMinutes: 2,
      savingsVsCurrentGBP: 0,
      tag: "Current Store",
      lat: 53.4682,
      lng: -2.2351,
    },
  ],
  items: [
    {
      name: "Lurpak Butter 400g",
      cheapestItemName: "Danepak Spreadable 500g",
      category: "Meat & Dairy",
      currentPriceGBP: 4.25,
      cheapestPriceGBP: 2.15,
      cheapestStore: "Lidl (0.3 mi)",
    },
    {
      name: "Beef Steak Mince 500g",
      cheapestItemName: "British Beef Mince 500g",
      category: "Meat & Dairy",
      currentPriceGBP: 3.75,
      cheapestPriceGBP: 2.49,
      cheapestStore: "Lidl (0.3 mi)",
    },
    {
      name: "Cathedral City Cheddar 400g",
      cheapestItemName: "Valley Spire Mature 400g",
      category: "Meat & Dairy",
      currentPriceGBP: 3.6,
      cheapestPriceGBP: 2.35,
      cheapestStore: "Lidl (0.3 mi)",
    },
    {
      name: "Walkers Crisps 6pk",
      cheapestItemName: "Snackrite Crisps 6pk",
      category: "Snacks & Drinks",
      currentPriceGBP: 2.1,
      cheapestPriceGBP: 1.15,
      cheapestStore: "Lidl (0.3 mi)",
    },
    {
      name: "Semi-Skimmed Milk 4pt",
      cheapestItemName: "British Milk 4 Pints",
      category: "Meat & Dairy",
      currentPriceGBP: 1.55,
      cheapestPriceGBP: 1.45,
      cheapestStore: "Lidl (0.3 mi)",
    },
    {
      name: "Fairtrade Bananas 5pk",
      cheapestItemName: "Bananas 5 Pack",
      category: "Produce",
      currentPriceGBP: 1.1,
      cheapestPriceGBP: 0.78,
      cheapestStore: "Aldi (0.7 mi)",
    },
  ],
  smartSwaps: [
    {
      originalItem: "Lurpak Spreadable 400g at Tesco Express (£4.25)",
      betterDealSuggestion: "Danepak / Nordpak Spreadable 500g at Lidl (£2.15)",
      targetStore: "Lidl Oxford Rd • 0.3 miles (6 min walk)",
      moneySavedGBP: 2.1,
      reason: "Convenience stores charge a 97% premium on branded butter compared to Lidl 300m down Oxford Road.",
    },
    {
      originalItem: "Cathedral City Cheddar 400g (£3.60) + Crisps 6pk (£2.10)",
      betterDealSuggestion: "Valley Spire Mature Cheddar 400g (£2.35) + Snackrite 6pk (£1.15)",
      targetStore: "Lidl Oxford Rd • 0.3 miles (6 min walk)",
      moneySavedGBP: 2.2,
      reason: "Switching to discounter own-label dairy & snacks cuts £2.20 instantly with identical weight.",
    },
    {
      originalItem: "Beef Steak Mince 500g at Tesco Express (£3.75)",
      betterDealSuggestion: "British 5% Lean Beef Mince 500g at Lidl/Aldi (£2.49)",
      targetStore: "Lidl Oxford Rd • 0.3 miles (6 min walk)",
      moneySavedGBP: 1.26,
      reason: "Tesco Express adds a convenience store markup versus standard supermarket and discounter pricing.",
    },
  ],
};

export default function BasketScoutPage() {
  const [data, setData] = useState<BasketComparisonData>(INITIAL_DATA);
  const [postcode, setPostcode] = useState("M13 9PL");
  const [textList, setTextList] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedItemIndices, setSelectedItemIndices] = useState<number[]>(
    INITIAL_DATA.items.map((_, i) => i)
  );
  const [activeStoreIdx, setActiveStoreIdx] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedList, setCopiedList] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Render & update the interactive Leaflet Map whenever data or activeStoreIdx changes
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

      const userLat = data.userLat || 53.4668;
      const userLng = data.userLng || -2.2339;

      const map = L.map(mapContainerRef.current).setView([userLat, userLng], 14);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // 1. Add User Location Marker (Pulsing Blue Badge)
      const userIcon = L.divIcon({
        className: "",
        html: `<div style="background:#1e3a8a;color:#fff;padding:4px 10px;border-radius:999px;font-weight:800;font-size:11px;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.25);white-space:nowrap;">
          📍 You (${data.userPostcode.split(" ")[0] || "M13"})
        </div>`,
        iconSize: [90, 26],
        iconAnchor: [45, 13],
      });
      L.marker([userLat, userLng], { icon: userIcon }).addTo(map);

      const bounds: [number, number][] = [[userLat, userLng]];

      // 2. Add Each Supermarket Marker + Walking Route Line
      data.storeComparisons.forEach((store, idx) => {
        const sLat = store.lat || userLat + (idx - 2) * 0.003;
        const sLng = store.lng || userLng + (idx - 2) * 0.004;
        bounds.push([sLat, sLng]);

        const isCheapest = idx === 0;
        const isSelected = idx === activeStoreIdx;
        const isCurrent = store.savingsVsCurrentGBP === 0;

        const bg = isCheapest ? "#059669" : isCurrent ? "#dc2626" : "#2563eb";
        const scale = isSelected ? "transform:scale(1.1);z-index:999;" : "";

        const storeIcon = L.divIcon({
          className: "",
          html: `<div style="background:${bg};color:#fff;padding:5px 9px;border-radius:10px;font-family:monospace;font-weight:800;font-size:11px;border:2px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.22);white-space:nowrap;${scale}">
            ${store.storeName.split("(")[0].trim()} • £${store.totalBasketGBP.toFixed(2)}
            <div style="font-size:9px;font-family:sans-serif;font-weight:600;opacity:0.95;">
              🚶 ${store.walkMinutes}m (${store.distanceMiles} mi) ${
            store.savingsVsCurrentGBP > 0 ? `• Save £${store.savingsVsCurrentGBP.toFixed(2)}` : "• Paid"
          }
            </div>
          </div>`,
          iconSize: [140, 40],
          iconAnchor: [70, 20],
        });

        const marker = L.marker([sLat, sLng], { icon: storeIcon }).addTo(map);
        marker.on("click", () => setActiveStoreIdx(idx));

        // Draw dashed walking route line from User to each Supermarket
        L.polyline(
          [
            [userLat, userLng],
            [sLat, sLng],
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
  }, [data, activeStoreIdx]);

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
          imageBase64: imgToSend,
          mimeType: "image/jpeg",
          textList: txtToSend,
          postcode,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to compare prices");
      setData(result);
      setSelectedItemIndices((result.items || []).map((_: any, i: number) => i));
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

  const originalItemsTotal = data.items.reduce((sum, item) => sum + item.currentPriceGBP, 0);

  const optimizedItemsTotal = data.items.reduce((sum, item, idx) => {
    const useCheaper = selectedItemIndices.includes(idx);
    return sum + (useCheaper ? item.cheapestPriceGBP : item.currentPriceGBP);
  }, 0);

  const totalReceiptSavings = Math.max(0, originalItemsTotal - optimizedItemsTotal);
  const savingsPercentage =
    originalItemsTotal > 0 ? Math.round((totalReceiptSavings / originalItemsTotal) * 100) : 0;

  const generateShoppingListText = () => {
    const lines = [
      `🧾 *BasketScout Side-by-Side Receipt Savings (${postcode})*`,
      `📍 Switch From: ${data.detectedStore} (£${originalItemsTotal.toFixed(2)})`,
      `🏆 Switch To: *${data.cheapestStoreName}* (£${optimizedItemsTotal.toFixed(2)})`,
      `💰 *Total Saved: £${totalReceiptSavings.toFixed(2)} (-${savingsPercentage}%)* | £${(totalReceiptSavings * 52).toFixed(0)}/yr`,
      ``,
      `🛒 *Cheaper Receipt Line-by-Line:*`,
      ...data.items.map((item, idx) => {
        const saved = Math.max(0, item.currentPriceGBP - item.cheapestPriceGBP);
        const targetName = item.cheapestItemName || item.name;
        return `${idx + 1}. ${targetName} @ ${item.cheapestStore}: *£${item.cheapestPriceGBP.toFixed(2)}* (was £${item.currentPriceGBP.toFixed(2)}, save £${saved.toFixed(2)})`;
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
              Side-by-Side Receipt Price Optimizer & Live Supermarket Distance Map
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-800 px-3 py-2 rounded-full border border-blue-200">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Scanned: {data.detectedStore}</span>
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
        {/* LEFT COLUMN: Postcode + Receipt Upload + Sample Pills (4 cols) */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                Your Location / Postcode (For Map Distance)
              </label>
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="e.g., M13 9PL or Fallowfield"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
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
                    Maps cheapest nearby shops & side-by-side receipt
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
              placeholder="Or paste/type a shopping list (e.g., Beef mince £3.75, Cheddar £3.60, Lurpak £4.25)..."
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
              {loading ? "Mapping Nearby Supermarkets..." : "Compare Receipt & Map Shops"}
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
                {data.detectedStore}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-300 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Optimized Receipt</span>
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-600 font-mono">
                £{optimizedItemsTotal.toFixed(2)}
              </div>
              <div className="text-[11px] font-semibold text-emerald-700 truncate">
                {data.cheapestStoreName}
              </div>
            </div>

            <div className="bg-emerald-900 text-white p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-xs text-emerald-200 mb-1">
                <span>Instant Savings</span>
                <TrendingDown className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-300 font-mono">
                -£{totalReceiptSavings.toFixed(2)}
              </div>
              <div className="text-[11px] text-emerald-200">
                Save {savingsPercentage}% on this shop!
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
                {data.storeComparisons[0]?.walkMinutes || 6} min walk ({data.storeComparisons[0]?.distanceMiles || 0.3} mi)
              </div>
            </div>
          </div>

          {/* SIDE-BY-SIDE ORIGINAL RECEIPT VS. SAVED RECEIPT COMPARISON */}
          <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  Side-by-Side Receipt Comparison
                </h3>
                <p className="text-xs text-slate-500">
                  Left: What you paid • Right: Exact item-by-item savings at nearby supermarkets (click any item on the right to toggle)
                </p>
              </div>
              <button
                onClick={() =>
                  setSelectedItemIndices(
                    selectedItemIndices.length === data.items.length
                      ? []
                      : data.items.map((_, i) => i)
                  )
                }
                className="text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs"
              >
                {selectedItemIndices.length === data.items.length
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
                      {data.detectedStore}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Area: {data.userPostcode} • Convenience Pricing
                    </p>
                  </div>

                  <div className="divide-y divide-dashed divide-slate-200">
                    {data.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="py-2.5 flex items-center justify-between gap-2 min-h-[56px]"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">{item.name}</p>
                          <span className="text-[10px] text-slate-400 font-sans">
                            {item.category}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-900 tabular-nums">
                          £{item.currentPriceGBP.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border-t-2 border-dashed border-slate-300 font-mono">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>ITEMS COUNT</span>
                    <span>{data.items.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-extrabold text-slate-900">
                    <span>TOTAL PAID</span>
                    <span>£{originalItemsTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT RECEIPT: OPTIMIZED CHEAPER RECEIPT */}
              <div className="bg-white rounded-xl border-2 border-emerald-500 shadow-md overflow-hidden flex flex-col justify-between relative">
                <div className="h-2 bg-emerald-500" />

                <div className="p-5 font-mono">
                  <div className="text-center border-b-2 border-dashed border-emerald-200 pb-3 mb-4">
                    <span className="inline-block text-[10px] font-sans font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full mb-1">
                      Smart Saver Receipt (Save £{totalReceiptSavings.toFixed(2)})
                    </span>
                    <h4 className="text-sm font-extrabold text-emerald-950 uppercase">
                      {data.cheapestStoreName}
                    </h4>
                    <p className="text-[11px] text-emerald-700 font-sans font-medium">
                      📍 {data.storeComparisons[0]?.distanceMiles || 0.3} mi away ({data.storeComparisons[0]?.walkMinutes || 6} min walk)
                    </p>
                  </div>

                  <div className="divide-y divide-dashed divide-emerald-100">
                    {data.items.map((item, idx) => {
                      const isSelected = selectedItemIndices.includes(idx);
                      const itemSaving = Math.max(0, item.currentPriceGBP - item.cheapestPriceGBP);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleReceiptItem(idx)}
                          className={`py-2 px-2 -mx-2 rounded-lg transition cursor-pointer flex items-center justify-between gap-2 min-h-[56px] ${
                            isSelected ? "bg-emerald-50/70 hover:bg-emerald-100/60" : "opacity-50 hover:opacity-80"
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
                                {item.cheapestItemName || item.name}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] font-sans">
                                <span className="text-emerald-700 font-semibold">
                                  @{item.cheapestStore}
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
                              £{(isSelected ? item.cheapestPriceGBP : item.currentPriceGBP).toFixed(2)}
                            </span>
                            {isSelected && itemSaving > 0 && (
                              <span className="text-[10px] line-through text-slate-400 block">
                                £{item.currentPriceGBP.toFixed(2)}
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
                    <span className="text-emerald-400">£{optimizedItemsTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* NEW: LIVE INTERACTIVE SUPERMARKET DISTANCE & BASKET PRICE MAP         */}
          {/* ===================================================================== */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-blue-600" />
                  Live Supermarket Distance & Basket Price Map ({data.userPostcode})
                </h3>
                <p className="text-xs text-slate-500">
                  Click any supermarket card below to highlight its walking route and price pin on the map
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Cheapest
                </span>
                <span className="flex items-center gap-1 text-blue-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Alternative
                </span>
                <span className="flex items-center gap-1 text-red-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" /> Current
                </span>
              </div>
            </div>

            {/* Clickable Store Distance Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {data.storeComparisons.map((store, idx) => {
                const isCheapest = idx === 0;
                const isSelected = idx === activeStoreIdx;
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
                        {store.tag}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {store.storeName}
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        🚶 {store.walkMinutes} min walk ({store.distanceMiles} mi)
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-baseline justify-between">
                      <span className="text-base font-extrabold text-slate-900 font-mono">
                        £{store.totalBasketGBP.toFixed(2)}
                      </span>
                      {store.savingsVsCurrentGBP > 0 ? (
                        <span className="text-[11px] font-bold text-emerald-700">
                          -£{store.savingsVsCurrentGBP.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Paid</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive Leaflet Street Map Container */}
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
              Ready to paste into WhatsApp, Telegram, or Notes before walking to the supermarket:
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
