(() => {
  "use strict";

  const OFF_API = "https://world.openfoodfacts.org/api/v2/product/";
  const OFF_FIELDS = "product_name,nutriscore_grade,nova_group,additives_tags,additives_original_tags,additives_tags_fr,code";
  const browserApi = globalThis.browser ?? globalThis.chrome;

  function isValidGtin(value) {
    if (typeof value !== "string" || !/^\d+$/.test(value) || ![8, 12, 13, 14].includes(value.length)) return false;
    let sum = 0;
    for (let index = value.length - 2, weight = 3; index >= 0; index -= 1) {
      sum += Number(value[index]) * weight;
      weight = weight === 3 ? 1 : 3;
    }
    return (10 - (sum % 10)) % 10 === Number(value.at(-1));
  }

  function isLeclercDriveUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" &&
        (url.hostname === "leclercdrive.fr" || url.hostname.endsWith(".leclercdrive.fr"));
    } catch {
      return false;
    }
  }

  browserApi.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== "panier-etiq:lookup-openfoodfacts-product") return false;
    if (!isLeclercDriveUrl(sender.url) || !isValidGtin(message.barcode)) {
      sendResponse({ ok: false });
      return false;
    }

    const url = `${OFF_API}${message.barcode}.json?fields=${OFF_FIELDS}`;
    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error("Open Food Facts request failed");
        return response.json();
      })
      .then((payload) => sendResponse({ ok: true, payload }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  });
})();
