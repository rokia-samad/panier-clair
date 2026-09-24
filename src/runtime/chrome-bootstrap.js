// Loaded first in the Chrome content-script world to route OFF requests through
// the extension service worker, where Chrome permits cross-origin fetches.
globalThis.PANIER_ETIQ_USE_BACKGROUND_OFF_FETCH = true;
