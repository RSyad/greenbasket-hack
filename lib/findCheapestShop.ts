// lib/findCheapestShop.ts

export interface Product {
  itemType: string;
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
  amountGrams: number;
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {

  const R = 6371; // Earth's radius in km

  const toRad = (degrees: number) =>
    degrees * (Math.PI / 180);

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );

  return R * c;
}

export function findCheapestShop(
  shops: Shop[],
  requirements: ShoppingRequirement[],
  userLatitude: number,
  userLongitude: number,
  maxDistanceKm: number
) {
  const results = [];

  for (const shop of shops) {

    // Calculate distance from user
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

    // Calculate required shopping cost
    for (const requirement of requirements) {

      const matchingProducts = shop.products.filter(
        p => p.itemType.toLowerCase() ===
             requirement.itemType.toLowerCase()
      );

      if (matchingProducts.length === 0) {
        validShop = false;
        break;
      }

      // Choose the cheapest price per gram
      const cheapestProduct = matchingProducts.reduce(
        (best, current) =>
          current.costGBP / current.amountGrams <
          best.costGBP / best.amountGrams
            ? current
            : best
      );

      const unitPrice =
        cheapestProduct.costGBP /
        cheapestProduct.amountGrams;

      const itemCost =
        unitPrice * requirement.amountGrams;

      totalCost += itemCost;

      breakdown.push({
        itemType: requirement.itemType,
        amountGrams: requirement.amountGrams,
        costGBP: itemCost
      });
    }

    if (validShop) {
      results.push({
        shopName: shop.name,
        distanceKm: distance,
        totalCostGBP: totalCost,
        breakdown
      });
    }
  }

  // Sort from cheapest to most expensive
  results.sort(
    (a, b) => a.totalCostGBP - b.totalCostGBP
  );

  // Return cheapest shop, or null if none qualify
  return results.length > 0 ? results[0] : null;
}

// Unit test

const shops: Shop[] = [
  {
    name: "Tesco",
    latitude: 52.4862,
    longitude: -1.8904,
    products: [
      { itemType: "coffee", amountGrams: 250, costGBP: 3.50 },
      { itemType: "milk", amountGrams: 1000, costGBP: 1.60 },
      { itemType: "cereal", amountGrams: 500, costGBP: 2.50 }
    ]
  },
  {
    name: "Sainsbury's",
    latitude: 52.4870,
    longitude: -1.8950,
    products: [
      { itemType: "coffee", amountGrams: 250, costGBP: 3.00 },
      { itemType: "milk", amountGrams: 1000, costGBP: 1.70 },
      { itemType: "cereal", amountGrams: 500, costGBP: 2.20 }
    ]
  },
  {
    name: "Aldi",
    latitude: 52.4900,
    longitude: -1.8800,
    products: [
      { itemType: "coffee", amountGrams: 250, costGBP: 2.50 },
      { itemType: "milk", amountGrams: 1000, costGBP: 1.50 }
    ]
  }
];

const requirements: ShoppingRequirement[] = [
  { itemType: "coffee", amountGrams: 250 },
  { itemType: "milk", amountGrams: 1000 },
  { itemType: "cereal", amountGrams: 500 }
];

const cheapest = findCheapestShop(
  shops,
  requirements,
  52.4862,  // User latitude
  -1.8904,  // User longitude
  1.0       // Maximum distance in km
);

console.log(cheapest);