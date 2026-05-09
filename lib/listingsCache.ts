import redis from '../redis';

const LISTINGS_ALL_KEY = (page: number) => `listings:all:page:${page}`;
const LISTING_DETAIL_KEY = (id: string) => `listings:detail:${id}`;

export async function getCachedListings(page: number, fetchFn: () => Promise<any[]>) {
  const key = LISTINGS_ALL_KEY(page);
  let listings = await redis.get(key);
  if (!listings) {
    listings = await fetchFn();
    await redis.set(key, listings, { ex: 900 }); // 15 min TTL
  }
  return listings;
}

export async function getCachedListingDetail(id: string, fetchFn: () => Promise<any>) {
  const key = LISTING_DETAIL_KEY(id);
  let detail = await redis.get(key);
  if (!detail) {
    detail = await fetchFn();
    await redis.set(key, detail, { ex: 3600 }); // 1 hour TTL
  }
  return detail;
}

export async function invalidateListingsCache() {
  const keys = await redis.keys('listings:all:*');
  for (const key of keys) {
    await redis.del(key);
  }
}

export async function invalidateListingDetail(id: string) {
  await redis.del(LISTING_DETAIL_KEY(id));
}

export async function monitorCache() {
  return redis.info();
}
