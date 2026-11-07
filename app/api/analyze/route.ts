import { NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
];

const priceComparisonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    detectedStore: {
      type: Type.STRING,
      description: "Store name on the receipt (e.g., Tesco Express Oxford Rd)",
    },
    userPostcode: {
      type: Type.STRING,
      description: "Detected or default area (e.g., M13 9PL - Manchester Uni / Oxford Rd)",
    },
    currentBasketTotalGBP: {
      type: Type.NUMBER,
      description: "Total price of the current basket in GBP (£)",
    },
    cheapestStoreName: {
      type: Type.STRING,
      description: "Name of the cheapest nearby supermarket for this basket (e.g., Aldi or Lidl)",
    },
    cheapestBasketTotalGBP: {
      type: Type.NUMBER,
      description: "Total cost of the exact same basket at the cheapest store in GBP (£)",
    },
    nearestStoreName: {
      type: Type.STRING,
      description: "Closest supermarket by walking distance",
    },
    nearestDistanceMiles: {
      type: Type.NUMBER,
      description: "Distance to the nearest store in miles (e.g., 0.2)",
    },
    storeComparisons: {
      type: Type.ARRAY,
      description: "Comparison of total basket cost and walking distance across 4-5 nearby UK supermarkets (Aldi, Lidl, Asda, Tesco, Sainsbury's)",
      items: {
        type: Type.OBJECT,
        properties: {
          storeName: { type: Type.STRING, description: "Store name & branch (e.g., Lidl Oxford Rd)" },
          totalBasketGBP: { type: Type.NUMBER, description: "Estimated total price for this basket in GBP (£)" },
          distanceMiles: { type: Type.NUMBER, description: "Distance in miles from user (e.g., 0.4)" },
          walkMinutes: { type: Type.NUMBER, description: "Walking time in minutes (e.g., 8)" },
          savingsVsCurrentGBP: {
            type: Type.NUMBER,
            description: "How much cheaper than the current store in GBP (0 if current store)",
          },
          tag: {
            type: Type.STRING,
            description: "'Cheapest Overall', 'Best Value + Close', 'Nearest Store', or 'Current Store'",
          },
        },
        required: [
          "storeName",
          "totalBasketGBP",
          "distanceMiles",
          "walkMinutes",
          "savingsVsCurrentGBP",
          "tag",
        ],
      },
    },
    items: {
      type: Type.ARRAY,
      description: "List of 4 to 8 grocery items with current price vs cheapest nearby competitor price",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Original receipt item name" },
          cheapestItemName: {
            type: Type.STRING,
            description: "Equivalent cheaper item name at the competitor store (e.g., own-brand equivalent)",
          },
          category: {
            type: Type.STRING,
            description: "Category (Meat & Dairy, Produce, Bakery & Pantry, Snacks & Drinks)",
          },
          currentPriceGBP: { type: Type.NUMBER, description: "Price paid at current store (£)" },
          cheapestPriceGBP: { type: Type.NUMBER, description: "Cheapest price at nearby Aldi/Lidl/Asda (£)" },
          cheapestStore: { type: Type.STRING, description: "Store offering the cheapest price" },
        },
        required: [
          "name",
          "cheapestItemName",
          "category",
          "currentPriceGBP",
          "cheapestPriceGBP",
          "cheapestStore",
        ],
      },
    },
    smartSwaps: {
      type: Type.ARRAY,
      description: "3 highest-saving store & brand switches for items in this basket",
      items: {
        type: Type.OBJECT,
        properties: {
          originalItem: { type: Type.STRING, description: "Item & price at current store" },
          betterDealSuggestion: {
            type: Type.STRING,
            description: "Equivalent item & price at cheaper nearby supermarket",
          },
          targetStore: { type: Type.STRING, description: "Nearby store name & walking time (e.g., Lidl Oxford Rd • 6 min walk)" },
          moneySavedGBP: { type: Type.NUMBER, description: "Money saved on this item in GBP (£)" },
          reason: { type: Type.STRING, description: "Why this store/own-brand switch saves money" },
        },
        required: ["originalItem", "betterDealSuggestion", "targetStore", "moneySavedGBP", "reason"],
      },
    },
  },
  required: [
    "detectedStore",
    "userPostcode",
    "currentBasketTotalGBP",
    "cheapestStoreName",
    "cheapestBasketTotalGBP",
    "nearestStoreName",
    "nearestDistanceMiles",
    "storeComparisons",
    "items",
    "smartSwaps",
  ],
};

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType, textList, postcode } = await req.json();

    if (!imageBase64 && (!textList || textList.trim().length === 0)) {
      return NextResponse.json(
        { error: "Please upload a receipt photo or enter a grocery list." },
        { status: 400 }
      );
    }

    const contents: any[] = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.includes(",")
        ? imageBase64.split(",")
        : imageBase64;

      contents.push({
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: cleanBase64,
        },
      });
    }

    contents.push({
      text: `You are a UK Supermarket Price & Proximity Comparison Auditor for students in Manchester (Default Postcode Area: ${
        postcode || "M13 9PL Oxford Road"
      }).
Analyze this supermarket receipt image or shopping list.
1. Extract the items and prices in GBP (£).
2. Compare the total cost of buying this exact basket across nearby UK supermarkets (e.g., Lidl Oxford Rd, Aldi Market St/Arndale, Asda Hulme, Sainsbury's Local, Tesco Express) with realistic walking distances in miles and minutes from ${
        postcode || "M13 9PL"
      }.
3. Suggest the 3 biggest money-saving switches (switching from convenience-store branded items to nearby Lidl/Aldi/Asda equivalents).
${textList ? `\nShopping List / Receipt Text:\n${textList}` : ""}`,
    });

    let lastError: any = null;

    for (const modelName of FALLBACK_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            responseMimeType: "application/json",
            responseSchema: priceComparisonSchema,
          },
        });

        const structuredData = JSON.parse(response.text || "{}");
        return NextResponse.json(structuredData);
      } catch (err: any) {
        lastError = err;
      }
    }

    throw lastError;
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to compare supermarket prices" },
      { status: 500 }
    );
  }
}
