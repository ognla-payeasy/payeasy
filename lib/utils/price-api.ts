/**
 * Fetches XLM to USD price data from CoinGecko API.
 * Includes current price and historical data for price conversions.
 */

interface PriceResponse {
  xlm: {
    usd: number;
  };
}

interface HistoricalPriceResponse {
  prices: Array<[number, number]>; // [timestamp, price]
  market_caps: Array<[number, number]>;
  volumes: Array<[number, number]>;
}

/**
 * Fetch the current XLM to USD price from CoinGecko
 */
export async function getCurrentXlmPrice(): Promise<number> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd",
      { next: { revalidate: 60 } } // Cache for 60 seconds
    );
    
    if (!response.ok) {
      console.error("Failed to fetch XLM price:", response.statusText);
      return 0;
    }

    const data: PriceResponse = await response.json();
    return data.xlm.usd || 0;
  } catch (error) {
    console.error("Error fetching XLM price:", error);
    return 0;
  }
}

/**
 * Fetch historical XLM prices for a given date range
 * @param days Number of days to fetch (max 365)
 * @returns Array of [timestamp, price] tuples
 */
export async function getHistoricalXlmPrices(
  days: number = 365
): Promise<Array<[number, number]>> {
  try {
    const clampedDays = Math.min(days, 365); // CoinGecko limits to 365 days
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/stellar/market_chart?vs_currency=usd&days=${clampedDays}&interval=daily`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      console.error("Failed to fetch historical prices:", response.statusText);
      return [];
    }

    const data: HistoricalPriceResponse = await response.json();
    return data.prices || [];
  } catch (error) {
    console.error("Error fetching historical prices:", error);
    return [];
  }
}

/**
 * Get the XLM price for a specific date
 * @param date The date to get the price for
 * @returns The price of XLM in USD for that date
 */
export async function getXlmPriceForDate(date: Date): Promise<number> {
  try {
    const timestamp = Math.floor(date.getTime() / 1000);
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/stellar/market_chart/range?vs_currency=usd&from=${timestamp}&to=${timestamp}`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );

    if (!response.ok) {
      console.error("Failed to fetch price for date:", response.statusText);
      return 0;
    }

    const data: HistoricalPriceResponse = await response.json();
    if (data.prices && data.prices.length > 0) {
      return data.prices[0][1];
    }
    
    return 0;
  } catch (error) {
    console.error("Error fetching price for date:", error);
    return 0;
  }
}

/**
 * Convert XLM amount to USD using current price
 * @param xlmAmount Amount in XLM
 * @returns Amount in USD
 */
export async function convertXlmToUsd(xlmAmount: number): Promise<number> {
  const price = await getCurrentXlmPrice();
  return xlmAmount * price;
}

/**
 * Build a price map for a date range (one price per day)
 * This is useful for converting historical transactions
 */
export async function getPriceMapForDateRange(
  startDate: Date,
  endDate: Date
): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();
  
  try {
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const prices = await getHistoricalXlmPrices(days);
    
    prices.forEach(([timestamp, price]) => {
      const date = new Date(timestamp * 1000);
      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
      priceMap.set(dateStr, price);
    });
    
    return priceMap;
  } catch (error) {
    console.error("Error building price map:", error);
    return priceMap;
  }
}
