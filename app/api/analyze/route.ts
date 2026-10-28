import { NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Same 503 High-Demand Armor from Project #1!
const FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
];

const greenBasketSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    storeName: {
      type: Type.STRING,
      description: "Detected UK supermarket name (e.g., Tesco, Aldi, Sainsbury's, Asda) or 'Grocery Basket'",
    },
    ecoScore: {
      type: Type.NUMBER,
      description: "Overall sustainability score from 0 to 100 (100 = most eco-friendly)",
    },
    totalCostGBP: {
      type: Type.NUMBER,
      description: "Total cost of the basket in GBP (£)",
    },
    totalCo2Kg: {
      type: Type.NUMBER,
      description: "Total estimated carbon footprint of the basket in kg CO2e",
    },
    items: {
      type: Type.ARRAY,
      description: "List of 4 to 8 detected grocery items with their price and carbon footprint",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Item name" },
          category: {
            type: Type.STRING,
            description: "Category (Meat & Dairy, Produce, Snacks & Drinks, Household)",
          },
          priceGBP: { type: Type.NUMBER, description: "Price in GBP (£)" },
          co2Kg: { type: Type.NUMBER, description: "Estimated kg CO2e for this item" },
          impactLevel: {
            type: Type.STRING,
            description: "Must be 'High', 'Medium', or 'Low'",
          },
        },
        required: ["name", "category", "priceGBP", "co2Kg", "impactLevel"],
      },
    },
    smartSwaps: {
      type: Type.ARRAY,
      description: "3 realistic UK supermarket swaps that reduce CO2 AND cost the same or less",
      items: {
        type: Type.OBJECT,
        properties: {
          originalItem: { type: Type.STRING, description: "High-carbon item from the basket" },
          swapSuggestion: { type: Type.STRING, description: "Specific lower-carbon alternative" },
          co2SavedKg: { type: Type.NUMBER, description: "kg of CO2e saved by making this swap" },
          moneySavedGBP: { type: Type.NUMBER, description: "Money saved in GBP (£) (0 if equal cost)" },
          reason: { type: Type.STRING, description: "Short 1-sentence reason why this swap works" },
        },
        required: ["originalItem", "swapSuggestion", "co2SavedKg", "moneySavedGBP", "reason"],
      },
    },
  },
  required: ["storeName", "ecoScore", "totalCostGBP", "totalCo2Kg", "items", "smartSwaps"],
};

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType, textList } = await req.json();

    if (!imageBase64 && (!textList || textList.trim().length === 0)) {
      return NextResponse.json(
        { error: "Please upload a receipt photo or enter a grocery list." },
        { status: 400 }
      );
    }

    // Build multimodal contents array (supports BOTH receipt image OR text list!)
    const contents: any[] = [];

    if (imageBase64) {
      // Strip data URL prefix if present (e.g., "data:image/jpeg;base64,...")
      const cleanBase64 = imageBase64.includes(",")
        ? imageBase64.split(",") ``
        : imageBase64;

      contents.push({
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: cleanBase64,
        },
      });
    }

    contents.push({
      text: `You are an expert UK supermarket sustainability & student budget analyst. Analyze this grocery receipt image or shopping list. Extract the items, prices in GBP (£), and realistic carbon footprint estimates in kg CO2e. Then suggest 3 realistic cheaper-or-equal-cost lower-carbon swaps available at UK supermarkets (like Tesco, Aldi, or Sainsbury's). ${
        textList ? `\n\nShopping List / Receipt Text:\n${textList}` : ""
      }`,
    });

    let lastError: any = null;

    for (const modelName of FALLBACK_MODELS) {
      try {
        console.log(`Analyzing basket with ${modelName}...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            responseMimeType: "application/json",
            responseSchema: greenBasketSchema,
          },
        });

        const structuredData = JSON.parse(response.text || "{}");
        console.log(`✅ Success with ${modelName}!`);
        return NextResponse.json(structuredData);
      } catch (err: any) {
        console.warn(`⚠️ ${modelName} failed (${err?.status || err?.message}). Trying next model...`);
        lastError = err;
      }
    }

    throw lastError;
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to analyze grocery basket" },
      { status: 500 }
    );
  }
}
