  function cacheKey(barcode) {
    return `off-product:v2:${barcode}`;
  }

  async function readCache(barcode) {
    const stored = await browserApi.storage.local.get(cacheKey(barcode));
    const entry = stored[cacheKey(barcode)];
    return entry && Date.now() - entry.savedAt < CACHE_TTL_MS ? entry.product : null;
  }

  async function fetchProduct(barcode) {
    if (inFlight.has(barcode)) return inFlight.get(barcode);
    const job = (async () => {
      const cached = await readCache(barcode);
      if (cached !== null) return cached;

      const wait = Math.max(0, MIN_REQUEST_GAP_MS - (Date.now() - lastRequestAt));
      if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
      lastRequestAt = Date.now();
      const result = await browserApi.runtime.sendMessage({
        type: "panier-etiq:lookup-openfoodfacts-product",
        barcode,
      });
      if (!result?.ok) throw new Error("Open Food Facts request failed");
      const payload = result.payload;
      const product = payload.status === 1 ? payload.product : false;
      await browserApi.storage.local.set({ [cacheKey(barcode)]: { savedAt: Date.now(), product } });
      return product;
    })();
    inFlight.set(barcode, job);
    try {
      return await job;
    } finally {
      inFlight.delete(barcode);
    }
  }
