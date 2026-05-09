# Listings Caching Strategy

## Overview

- Uses Upstash Redis for serverless caching.
- Caches active listings (15 min TTL) and individual listing details (1 hour TTL).
- Cache keys:
  - All listings: `listings:all:page:1`, `listings:all:page:2`, ...
  - Listing detail: `listings:detail:{listingId}`
- Invalidate all listings cache on create/update/delete: `await redis.del('listings:all:*')`
- Add cache busting headers: `Cache-Control: public, max-age=900`
- Monitor cache: `redis.info()`

## Usage

- Use `getCachedListings(page, fetchFn)` to fetch and cache listings.
- Use `getCachedListingDetail(id, fetchFn)` for individual listing details.
- Use `invalidateListingsCache()` and `invalidateListingDetail(id)` on updates.

## Example

```js
import { getCachedListings, invalidateListingsCache } from '@/lib/listingsCache';

// Fetch listings with caching
const listings = await getCachedListings(1, fetchListingsFromDb);

// Invalidate cache after update
await invalidateListingsCache();
```

## Monitoring

- Use `monitorCache()` to get Redis info and hit rates.

---

For more, see Upstash Redis docs: https://upstash.com/docs/redis