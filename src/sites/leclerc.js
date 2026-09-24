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

  function findLeclercTargets(root = document) {
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
