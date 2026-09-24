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
