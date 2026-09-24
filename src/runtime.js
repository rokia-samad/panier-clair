  const OFF_API = "https://world.openfoodfacts.org/api/v2/product/";
  const OFF_FIELDS = "product_name,nutriscore_grade,nova_group,additives_tags,additives_original_tags,code";
  const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
  const MIN_REQUEST_GAP_MS = 4000; // Open Food Facts: 15 product reads / minute / IP.
  const MAX_AUTO_LOOKUPS_PER_PAGE = 10;
  const rendered = new WeakMap();
  const inFlight = new Map();
  let lastRequestAt = 0;
  let scheduled = false;
  let autoLookups = 0;

  const browserApi = globalThis.browser ?? globalThis.chrome;
