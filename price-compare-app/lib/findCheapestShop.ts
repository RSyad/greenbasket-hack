// lib/findCheapestShop.ts

export interface Product {
  itemType: string;
  productName?: string; // Optional specific brand/item name for the receipt UI
  amountGrams: number;
  costGBP: number;
}

export interface Shop {
  name: string;
  latitude: number;
  longitude: number;
  products: Product[];
}

export interface ShoppingRequirement {
  itemType: string;
  originalName?: string;
  amountGrams: number;
  paidPriceGBP?: number;
}

export interface RankedShopResult {
  shopName: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  distanceMiles: number;
  walkMinutes: number;
  totalCostGBP: number;
  breakdown: {
    itemType: string;
    productName: string;
    amountGrams: number;
    costGBP: number;
    unitPricePer100g: number;
  }[];
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km

  const toRad = (degrees: number) => degrees * (Math.PI / 180);

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Returns all qualifying shops sorted from cheapest to most expensive
export function rankAllShops(
  shops: Shop[],
  requirements: ShoppingRequirement[],
  userLatitude: number,
  userLongitude: number,
  maxDistanceKm: number
): RankedShopResult[] {
  const results: RankedShopResult[] = [];

  for (const shop of shops) {
    // Calculate Haversine distance from user in km
    const distance = calculateDistance(
      userLatitude,
      userLongitude,
      shop.latitude,
      shop.longitude
    );

    // Exclude shops outside permitted distance
    if (distance > maxDistanceKm) {
      continue;
    }

    let totalCost = 0;
    let validShop = true;
    const breakdown = [];

    // Calculate required shopping cost using unit-price per gram
    for (const requirement of requirements) {
      const matchingProducts = shop.products.filter(
        (p) =>
          p.itemType.toLowerCase().trim() ===
          requirement.itemType.toLowerCase().trim()
      );

      if (matchingProducts.length === 0) {
        validShop = false;
        break;
      }

      // Choose the cheapest price per gram
      const cheapestProduct = matchingProducts.reduce((best, current) =>
        current.costGBP / current.amountGrams <
        best.costGBP / best.amountGrams
          ? current
          : best
      );

      const unitPrice = cheapestProduct.costGBP / cheapestProduct.amountGrams;
      const itemCost = unitPrice * requirement.amountGrams;

      totalCost += itemCost;

      breakdown.push({
        itemType: requirement.itemType,
        productName: cheapestProduct.productName || cheapestProduct.itemType,
        amountGrams: requirement.amountGrams,
        costGBP: Number(itemCost.toFixed(2)),
        unitPricePer100g: Number((unitPrice * 100).toFixed(2)),
      });
    }

    if (validShop) {
      const distanceKm = Number(distance.toFixed(2));
      const distanceMiles = Number((distance * 0.621371).toFixed(2));
      const walkMinutes = Math.max(1, Math.round(distance * 12)); // ~12 mins per km walking

      results.push({
        shopName: shop.name,
        latitude: shop.latitude,
        longitude: shop.longitude,
        distanceKm,
        distanceMiles,
        walkMinutes,
        totalCostGBP: Number(totalCost.toFixed(2)),
        breakdown,
      });
    }
  }

  // Sort from cheapest to most expensive
  results.sort((a, b) => a.totalCostGBP - b.totalCostGBP);

  return results;
}

export function findCheapestShop(
  shops: Shop[],
  requirements: ShoppingRequirement[],
  userLatitude: number,
  userLongitude: number,
  maxDistanceKm: number
) {
  const results = rankAllShops(
    shops,
    requirements,
    userLatitude,
    userLongitude,
    maxDistanceKm
  );
  return results.length > 0 ? results[0] : null;
}
