"use client";

import React, { useState, useRef } from "react";
import {
  Leaf,
  Upload,
  Sparkles,
  TrendingDown,
  PoundSterling,
  ShoppingBag,
  ArrowRight,
  Award,
  Zap,
  Image as ImageIcon,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  X,
  ListChecks,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

interface BasketItem {
  name: string;
  category: string;
  priceGBP: number;
  co2Kg: number;
  impactLevel: "High" | "Medium" | "Low";
}

interface SmartSwap {
  originalItem: string;
  swapSuggestion: string;
  co2SavedKg: number;
  moneySavedGBP: number;
  reason: string;
}

interface GreenBasketData {
  storeName: string;
  ecoScore: number;
  totalCostGBP: number;
  totalCo2Kg: number;
  items: BasketItem[];
  smartSwaps: SmartSwap[];
}

const SAMPLE_RECEIPTS = [
  {
    label: "🛒 Tesco Express (Meat & Dairy Heavy)",
    text: "TESCO EXPRESS OXFORD RD MANCHESTER: British Beef Steak Mince 500g £3.50, Cathedral City Mature Cheddar 400g £3.40, Air-Freighted Peruvian Asparagus 200g £2.50, Walkers Crisps Multipack £2.00, Fairtrade Bananas 5 Pack £0.95, Semi-Skimmed Milk 4 Pints £1.45",
  },
  {
    label: "🛍️ Aldi Student Weekly Shop",
    text: "ALDI MANCHESTER ARNDALE: Chicken Breast Fillets 600g £4.29, Imported Strawberries 400g £2.29, Frozen Pepperoni Pizza £1.75, Tin Chopped Tomatoes 400g £0.45, Brown Lentils 500g £0.99, Instant Coffee Jar £2.49",
  },
  {
    label: "🥗 Sainsbury's Meal Deal + Essentials",
    text: "SAINSBURYS LOCAL: Bacon & Egg Triple Sandwich £3.50, Smoothie Bottle 250ml £2.10, Lamb Chops 400g £5.50, British Potatoes 2kg £1.35, Oat Drink 1L £1.60",
  },
];

const INITIAL_DATA: GreenBasketData = {
  storeName: "Tesco Express (Oxford Rd, Manchester)",
  ecoScore: 42,
  totalCostGBP: 13.8,
  totalCo2Kg: 19.4,
  items: [
    { name: "Beef Mince 500g", category: "Meat & Dairy", priceGBP: 3.5, co2Kg: 11.5, impactLevel: "High" },
    { name: "Mature Cheddar 400g", category: "Meat & Dairy", priceGBP: 3.4, co2Kg: 4.2, impactLevel: "High" },
    { name: "Peru Asparagus", category: "Produce", priceGBP: 2.5, co2Kg: 1.9, impactLevel: "Medium" },
    { name: "Milk 4 Pints", category: "Meat & Dairy", priceGBP: 1.45, co2Kg: 1.1, impactLevel: "Medium" },
    { name: "Crisps Multipack", category: "Snacks & Drinks", priceGBP: 2.0, co2Kg: 0.4, impactLevel: "Low" },
    { name: "Bananas 5pk", category: "Produce", priceGBP: 0.95, co2Kg: 0.3, impactLevel: "Low" },
  ],
  smartSwaps: [
    {
      originalItem: "British Beef Steak Mince 500g (£3.50)",
      swapSuggestion: "50/50 Chicken & Red Lentil Mince or Plant Mince (£2.20)",
      co2SavedKg: 8.8,
      moneySavedGBP: 1.3,
      reason: "Ruminant beef methane accounts for nearly 60% of this basket's carbon footprint.",
    },
    {
      originalItem: "Air-Freighted Peruvian Asparagus (£2.50)",
      swapSuggestion: "Seasonal British Broccoli or Tenderstem (£1.20)",
      co2SavedKg: 1.5,
      moneySavedGBP: 1.3,
      reason: "Eliminates air-freight emissions while cutting vegetable cost in half.",
    },
    {
      originalItem: "Mature Cheddar 400g (£3.40)",
      swapSuggestion: "Reduced-Portion Extra Mature 250g + Hummus (£2.65)",
      co2SavedKg: 1.8,
      moneySavedGBP: 0.75,
      reason: "Stronger cheese requires less weight per meal for the same flavor hit.",
    },
  ],
};

const PIE_COLORS = ["#059669", "#0284c7", "#d97706", "#7c3aed"];

export default function GreenBasketPage() {
  const [data, setData] = useState<GreenBasketData>(INITIAL_DATA);
  const [textList, setTextList] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Interactive Hour 3 States: Applied Swaps + Action Modal
  const [appliedSwapIndices, setAppliedSwapIndices] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedList, setCopiedList] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setAppliedSwapIndices([]); // Reset applied swaps on new scan

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imgToSend,
          mimeType: "image/jpeg",
          textList: txtToSend,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to analyze basket");
      setData(result);
    } catch (err: any) {
      setError(err.message || "Error analyzing grocery basket.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle a swap on/off and recalculate live KPI metrics!
  const toggleSwap = (idx: number) => {
    setAppliedSwapIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const applyAllSwaps = () => {
    setAppliedSwapIndices(data.smartSwaps.map((_, idx) => idx));
  };

  // Calculate active savings based on which swaps the user toggled on
  const activeCo2Saved = appliedSwapIndices.reduce(
    (sum, idx) => sum + (data.smartSwaps[idx]?.co2SavedKg || 0),
    0
  );
  const activeMoneySaved = appliedSwapIndices.reduce(
    (sum, idx) => sum + (data.smartSwaps[idx]?.moneySavedGBP || 0),
    0
  );

  // Max possible savings across all 3 swaps
  const maxCo2Savings = data.smartSwaps.reduce((sum, s) => sum + (s.co2SavedKg || 0), 0);
  const maxMoneySavings = data.smartSwaps.reduce((sum, s) => sum + (s.moneySavedGBP || 0), 0);

  // Live adjusted KPI numbers
  const liveCostGBP = Math.max(0, data.totalCostGBP - activeMoneySaved);
  const liveCo2Kg = Math.max(0.5, data.totalCo2Kg - activeCo2Saved);
  const liveEcoScore = Math.min(
    99,
    Math.round(data.ecoScore + appliedSwapIndices.length * 14)
  );

  // Generate plain-text WhatsApp/Telegram shopping list for the Action Modal
  const generateShoppingListText = () => {
    const swapsToUse =
      appliedSwapIndices.length > 0
        ? appliedSwapIndices.map((i) => data.smartSwaps[i])
        : data.smartSwaps;

    const lines = [
      `🌱 *GreenBasket Smart Shopping List (${data.storeName})*`,
      `📊 Eco Score: ${liveEcoScore}/100 | Est. Bill: £${liveCostGBP.toFixed(2)}`,
      `🌍 Carbon Saved: -${(activeCo2Saved || maxCo2Savings).toFixed(1)} kg CO₂e | Money Saved: £${(activeMoneySaved || maxMoneySavings).toFixed(2)}`,
      ``,
      `🔄 *Recommended Eco & Budget Swaps:*`,
      ...swapsToUse.map(
        (s, i) =>
          `${i + 1}. Buy *${s.swapSuggestion}* instead of ${s.originalItem} (Save £${s.moneySavedGBP.toFixed(2)} & ${s.co2SavedKg.toFixed(1)}kg CO₂)`
      ),
      ``,
      `✅ *Keep from Original Basket:*`,
      ...data.items
        .filter((item) => item.impactLevel === "Low")
        .map((item) => `• ${item.name} (£${item.priceGBP.toFixed(2)})`),
    ];
    return lines.join("\n");
  };

  const handleCopyShoppingList = async () => {
    await navigator.clipboard.writeText(generateShoppingListText());
    setCopiedList(true);
    setTimeout(() => setCopiedList(false), 2500);
  };

  // Aggregate spend by category for the Donut Chart
  const categoryData = Object.values(
    data.items.reduce((acc: Record<string, { name: string; value: number }>, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { name: item.category, value: 0 };
      }
      acc[item.category].value = Number((acc[item.category].value + item.priceGBP).toFixed(2));
      return acc;
    }, {})
  );

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Top Navbar */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              GreenBasket AI
            </h1>
            <p className="text-xs text-slate-500">
              Instant UK Supermarket Carbon & Student Budget Swapper
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-3 py-2 rounded-full border border-emerald-200">
            Detected Store: {data.storeName}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-sm"
          >
            <ListChecks className="w-4 h-4 text-emerald-400" />
            Export Smart Shopping List
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Receipt Upload + Sample Pills (4 cols) */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              1. Snap or Upload Receipt Photo
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
              className="w-full border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl p-5 text-center transition cursor-pointer mb-4"
            >
              {imagePreview ? (
                <div className="space-y-2">
                  <img
                    src={imagePreview}
                    alt="Receipt preview"
                    className="max-h-36 mx-auto rounded-lg object-contain border border-slate-200"
                  />
                  <span className="text-xs text-emerald-700 font-semibold block">
                    Click to Upload a Different Receipt Photo
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <ImageIcon className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">
                    Upload Supermarket Receipt (JPG/PNG)
                  </p>
                  <p className="text-xs text-slate-500">
                    Auto-compressed for fast Gemini Vision OCR
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
                    className="text-left text-xs bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 px-3 py-2 rounded-lg font-medium transition cursor-pointer"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={textList}
              onChange={(e) => setTextList(e.target.value)}
              placeholder="Or paste/type a shopping list (e.g., Beef mince £3.50, Cheddar £3.20, Oat milk £1.80)..."
              rows={4}
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 mb-4"
            />

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={() => runAnalysis()}
              disabled={loading || (!imagePreview && !textList.trim())}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Scanning Basket with Gemini Vision..." : "Analyze Carbon & Cost"}
            </button>
          </div>
        </section>

        {/* RIGHT COLUMN: KPI Cards + Recharts + Interactive Smart Swaps (8 cols) */}
        <section className="lg:col-span-8 space-y-6">
          {/* 4 Live KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Live Eco Score</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-600">
                {liveEcoScore}/100
              </div>
              <div className="text-[11px] text-slate-400">
                {appliedSwapIndices.length > 0
                  ? `+${appliedSwapIndices.length * 14} pts from swaps!`
                  : "Click swaps below to boost"}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Projected Spend</span>
                <PoundSterling className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                £{liveCostGBP.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400">
                {activeMoneySaved > 0
                  ? `Was £${data.totalCostGBP.toFixed(2)} (-£${activeMoneySaved.toFixed(2)})`
                  : `${data.items.length} Items Detected`}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Carbon Footprint</span>
                <ShoppingBag className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-amber-600">
                {liveCo2Kg.toFixed(1)} <span className="text-sm font-normal">kg CO₂e</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {activeCo2Saved > 0
                  ? `Cut ${activeCo2Saved.toFixed(1)} kg CO₂e!`
                  : "Current Basket"}
              </div>
            </div>

            <div className="bg-emerald-900 text-white p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-xs text-emerald-200 mb-1">
                <span>Potential Yearly Saving</span>
                <TrendingDown className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-300">
                £{((activeMoneySaved || maxMoneySavings) * 52).toFixed(0)}/yr
              </div>
              <div className="text-[11px] text-emerald-200">
                & {((activeCo2Saved || maxCo2Savings) * 52).toFixed(0)} kg CO₂e/yr!
              </div>
            </div>
          </div>

          {/* Interactive Recharts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                Carbon Impact per Item (kg CO₂e)
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Red = High Impact • Amber = Medium • Green = Low
              </p>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.items} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <XAxis type="number" fontSize={11} />
                    <YAxis dataKey="name" type="category" width={105} fontSize={11} />
                    <Tooltip formatter={(val: any) => [`${val} kg CO₂e`, "Carbon Footprint"]} />
                    <Bar dataKey="co2Kg" radius={[0, 6, 6, 0]}>
                      {data.items.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.impactLevel === "High"
                              ? "#dc2626"
                              : entry.impactLevel === "Medium"
                              ? "#d97706"
                              : "#059669"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                Spend Breakdown by Category (£)
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Where your grocery budget goes
              </p>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {categoryData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`£${Number(val).toFixed(2)}`, "Spend"]} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Interactive Smart Swaps Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                3 Cheaper-or-Equal-Cost UK Supermarket Swaps
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={applyAllSwaps}
                  className="text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  Apply All 3 Swaps
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  Generate Next Week&apos;s List ➔
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {data.smartSwaps.map((swap, idx) => {
                const isApplied = appliedSwapIndices.includes(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleSwap(idx)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isApplied
                        ? "bg-emerald-100/80 border-emerald-500 shadow-sm"
                        : "bg-emerald-50/40 border-emerald-200 hover:border-emerald-400"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                        <span className="line-through text-red-600">{swap.originalItem}</span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <span className="text-emerald-900">{swap.swapSuggestion}</span>
                      </div>
                      <p className="text-xs text-slate-600">{swap.reason}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg">
                        -{swap.co2SavedKg.toFixed(1)} kg CO₂e
                      </span>
                      <span className="px-2.5 py-1 bg-sky-600 text-white text-xs font-bold rounded-lg">
                        Save £{swap.moneySavedGBP.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border ${
                          isApplied
                            ? "bg-emerald-700 text-white border-emerald-700"
                            : "bg-white text-slate-700 border-slate-300"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isApplied ? "Applied" : "Apply"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* INTERACTIVE ACTION MODAL: Smart Shopping List Generator */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  Your Optimized UK Shopping List
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
              Ready to paste into WhatsApp, Telegram, or Apple/Google Notes for your next supermarket run:
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
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                {copiedList ? (
                  <>
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Copied for WhatsApp!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Shopping List</span>
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
