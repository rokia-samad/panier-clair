(() => {
  "use strict";

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

  function digits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function isValidGtin(value) {
    const code = digits(value);
    if (![8, 12, 13, 14].includes(code.length)) return false;
    let sum = 0;
    for (let index = code.length - 2, weight = 3; index >= 0; index -= 1) {
      sum += Number(code[index]) * weight;
      weight = weight === 3 ? 1 : 3;
    }
    return (10 - (sum % 10)) % 10 === Number(code.at(-1));
  }

  function barcodeFromText(text) {
    const labelled = String(text || "").match(/(?:ean|g(?:tin)?|code[-\s]?barres?)\s*[:#-]?\s*([0-9\s-]{8,20})/i);
    const candidates = labelled ? [labelled[1]] : String(text || "").match(/\b\d{8,14}\b/g) || [];
    return candidates.map(digits).find(isValidGtin) || null;
  }

  function barcodeFromElement(element) {
    if (!element) return null;
    const attributes = ["data-ean", "data-gtin", "data-barcode", "ean", "gtin", "barcode", "content", "value"];
    for (const name of attributes) {
      const candidate = element.getAttribute?.(name);
      if (isValidGtin(candidate)) return digits(candidate);
    }
    return barcodeFromText(element.textContent);
  }

  function barcodeFromJsonLd() {
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const entries = JSON.parse(script.textContent);
        const queue = Array.isArray(entries) ? [...entries] : [entries];
        while (queue.length) {
          const entry = queue.shift();
          if (!entry || typeof entry !== "object") continue;
          for (const [key, value] of Object.entries(entry)) {
            if (/^(gtin|barcode|ean)/i.test(key) && isValidGtin(value)) return digits(value);
            if (value && typeof value === "object") queue.push(value);
          }
        }
      } catch {
        // Ignore malformed structured data supplied by the page.
      }
    }
    return null;
  }

  // Leclerc keeps product records in an inline JavaScript payload rather than in
  // visible markup. The first pattern covers catalogue records; the second
  // covers a product-page photo filename which contains the EAN followed by a
  // two-digit photo sequence (for example 3564706670389 + 05).
  function leclercBarcodes() {
    const codes = new Map();
    const productIdPattern = /"iIdProduit":(\d+)(?:(?!"iIdProduit":)[\s\S]){0,3500}?"sCodeEAN":"(\d{8,14})"/g;
    for (const script of document.scripts) {
      const source = script.textContent || "";
      for (const match of source.matchAll(productIdPattern)) {
        if (isValidGtin(match[2])) codes.set(match[1], match[2]);
      }
    }

    const productId = location.pathname.match(/fiche-produits-(\d+)-/i)?.[1]
      || document.querySelector("[id*='Produit']")?.id.match(/Produit(\d+)/)?.[1];
    if (productId && !codes.has(productId)) {
      const photoPattern = new RegExp(
        `"iIdProduit":${productId}(?:(?!"iIdProduit":)[\\s\\S]){0,3500}?"sNomFichierSource":"[^"]*?(\\d{13})(?:\\d{2})?"`
      );
      for (const script of document.scripts) {
        const match = script.textContent?.match(photoPattern);
        if (match && isValidGtin(match[1])) {
          codes.set(productId, match[1]);
          break;
        }
      }
    }
    return codes;
  }

  function nearestProductContainer(element) {
    return element.closest?.(
      "article, li, [data-product-id], [data-ean], [data-gtin], [class*='product'], [class*='produit']"
    ) || element.parentElement || document.body;
  }

  function findTargets(root = document) {
    const targets = [];
    const seen = new Set();
    const leclercCodes = leclercBarcodes();
    const dataSelectors = "[data-ean], [data-gtin], [data-barcode], [itemprop*='gtin' i], [itemprop*='barcode' i]";
    for (const element of root.querySelectorAll?.(dataSelectors) || []) {
      const barcode = barcodeFromElement(element);
      const container = nearestProductContainer(element);
      if (barcode && !seen.has(container)) {
        seen.add(container);
        targets.push({ barcode, container });
      }
    }

    for (const element of root.querySelectorAll?.("[id*='Produit']") || []) {
      const productId = element.id.match(/Produit(\d+)/)?.[1];
      const barcode = productId && leclercCodes.get(productId);
      const container = nearestProductContainer(element);
      if (barcode && !seen.has(container)) {
        seen.add(container);
        targets.push({ barcode, container });
      }
    }

    const pageBarcode = barcodeFromJsonLd() || barcodeFromText(document.body?.innerText);
    const currentProductId = location.pathname.match(/fiche-produits-(\d+)-/i)?.[1];
    const leclercPageBarcode = currentProductId && leclercCodes.get(currentProductId);
    const resolvedPageBarcode = pageBarcode || leclercPageBarcode;
    if (resolvedPageBarcode && !targets.some((target) => target.barcode === resolvedPageBarcode)) {
      const headline = document.querySelector("h1") || document.body;
      targets.push({ barcode: resolvedPageBarcode, container: headline.parentElement || document.body, page: true });
    }
    return targets;
  }

  function cacheKey(barcode) {
    return `off-product:${barcode}`;
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
      const response = await fetch(`${OFF_API}${barcode}.json?fields=${OFF_FIELDS}`);
      if (!response.ok) throw new Error(`Open Food Facts (${response.status})`);
      const payload = await response.json();
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

  function additiveLabel(product) {
    const additives = product.additives_original_tags || product.additives_tags || [];
    if (!additives.length) return "Aucun additif renseigné";
    return `${additives.length} additif${additives.length > 1 ? "s" : ""} renseigné${additives.length > 1 ? "s" : ""}`;
  }

  // A self-contained EAN renderer: no image is fetched and the bars encode the
  // actual GTIN read from Leclerc. Most grocery products use EAN-13; EAN-8 is
  // retained for the smaller codes sometimes used on individual items.
  function eanSvg(barcode) {
    const code = digits(barcode);
    const L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
    const G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
    const R = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"];
    const PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLLLG", "LGGLLL", "LGLLGL"];
    let pattern;
    if (code.length === 13) {
      const parity = PARITY[Number(code[0])];
      pattern = "101";
      for (let index = 1; index <= 6; index += 1) {
        pattern += (parity[index - 1] === "L" ? L : G)[Number(code[index])];
      }
      pattern += "01010";
      for (let index = 7; index <= 12; index += 1) pattern += R[Number(code[index])];
      pattern += "101";
    } else if (code.length === 8) {
      pattern = `101${[...code.slice(0, 4)].map((digit) => L[Number(digit)]).join("")}01010${[...code.slice(4)].map((digit) => R[Number(digit)]).join("")}101`;
    } else {
      return "";
    }
    const scale = 3;
    const margin = 10;
    const barHeight = 86;
    const width = (pattern.length + margin * 2) * scale;
    const bars = [...pattern].map((bit, index) => bit === "1"
      ? `<rect x="${(margin + index) * scale}" y="0" width="${scale}" height="${barHeight}"/>`
      : "").join("");
    return `<svg class="barcode" role="img" aria-label="Code-barres ${code}" viewBox="0 0 ${width} 108" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="white"/>${bars}<text x="50%" y="103" text-anchor="middle">${code}</text></svg>`;
  }

  function makeWidget(barcode) {
    const host = document.createElement("span");
    host.className = "qd-off-host";
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host { all: initial; display: inline-block; font-family: system-ui, -apple-system, sans-serif; }
        .card { box-sizing: border-box; margin: 6px 0; padding: 8px; max-width: 330px; border: 1px solid #c8d9cc; border-radius: 8px; background: #f6fbf7; color: #16331e; font-size: 12px; line-height: 1.35; }
        .title { font-weight: 700; margin-bottom: 5px; }
        .grid { display: flex; flex-wrap: wrap; gap: 4px; }
        .chip { border-radius: 999px; padding: 3px 6px; background: #e3efe5; white-space: nowrap; }
        .nutri-a { background: #0b8a3b; color: white; } .nutri-b { background: #4cae4f; color: white; } .nutri-c { background: #f3c242; color: #3a2b00; } .nutri-d { background: #eb7a34; color: white; } .nutri-e { background: #d9423a; color: white; }
        button { margin-top: 6px; padding: 0; border: 0; background: transparent; color: #1c5d31; font: inherit; text-decoration: underline; cursor: pointer; }
        .barcode-wrap { margin-top: 7px; } .barcode { display: block; width: min(100%, 310px); height: auto; }
        .muted { color: #53645a; } .error { color: #9d241d; }
      </style>
      <div class="card"><div class="title">Qualité — Open Food Facts</div><div class="muted">Recherche en cours…</div></div>`;
    return { host, shadow, barcode };
  }

  function renderProduct(widget, product) {
    const container = widget.shadow.querySelector(".card");
    if (!product) {
      container.innerHTML = `<div class="title">Qualité — Open Food Facts</div><div class="muted">Produit non trouvé dans Open Food Facts.</div>`;
      return;
    }
    const grade = String(product.nutriscore_grade || "?").toUpperCase();
    const gradeClass = /^[A-E]$/.test(grade) ? `nutri-${grade.toLowerCase()}` : "";
    const nova = product.nova_group ? `NOVA ${product.nova_group}` : "NOVA non renseigné";
    container.innerHTML = `
      <div class="title">Qualité — Open Food Facts</div>
      <div class="grid">
        <span class="chip ${gradeClass}">Nutri-Score ${grade}</span>
        <span class="chip">${nova}</span>
        <span class="chip">${additiveLabel(product)}</span>
      </div>
      <button type="button">Afficher le code-barres à scanner avec Yuka</button>
      <div class="barcode-wrap" hidden>${eanSvg(widget.barcode)}<div class="muted">Scanne ce code dans l’application Yuka pour voir sa note officielle.</div></div>`;
    container.querySelector("button").addEventListener("click", () => {
      container.querySelector(".barcode-wrap").hidden = false;
    });
  }

  function renderError(widget) {
    widget.shadow.querySelector(".card").innerHTML = `<div class="title">Qualité — Open Food Facts</div><div class="error">Données indisponibles pour le moment.</div>`;
  }

  function mount(target) {
    if (rendered.has(target.container)) return;
    const widget = makeWidget(target.barcode);
    rendered.set(target.container, widget);
    const title = location.pathname.includes("/fiche-produits-") && document.querySelector("h1");
    if (title) {
      title.insertAdjacentElement("afterend", widget.host);
    } else {
      target.container.append(widget.host);
    }
    fetchProduct(target.barcode).then((product) => renderProduct(widget, product)).catch(() => renderError(widget));
  }

  function scan() {
    scheduled = false;
    for (const target of findTargets()) {
      if (autoLookups >= MAX_AUTO_LOOKUPS_PER_PAGE) break;
      if (rendered.has(target.container)) continue;
      autoLookups += 1;
      mount(target);
    }
  }

  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(scan, 350);
  }

  new MutationObserver(scheduleScan).observe(document.documentElement, { childList: true, subtree: true });
  scheduleScan();
})();
