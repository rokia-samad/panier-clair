  function additiveEntries(product) {
    const tags = Array.isArray(product.additives_tags) ? product.additives_tags
      : Array.isArray(product.additives_original_tags) ? product.additives_original_tags : [];
    const frenchNames = Array.isArray(product.additives_tags_fr) ? product.additives_tags_fr : [];
    if (!tags.length) return frenchNames.filter(Boolean).map((name) => ({ name, url: null }));
    return tags.map((tag, index) => {
      const id = String(tag).replace(/^[a-z]{2}:/i, "");
      const name = frenchNames[index]
        || id.replace(/^e(\d+)/i, "E$1");
      const url = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(id)
        ? `https://world.openfoodfacts.org/additive/${encodeURIComponent(id)}`
        : null;
      return { name, url };
    });
  }

  function additiveLabel(count) {
    return `${count} additif${count > 1 ? "s" : ""} renseigné${count > 1 ? "s" : ""}`;
  }

  function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function makeExternalLink(text, url, className = "") {
    const link = makeElement("a", className, text);
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
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
      return null;
    }
    const scale = 3;
    const margin = 10;
    const barHeight = 86;
    const width = (pattern.length + margin * 2) * scale;
    const svgNs = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNs, "svg");
    svg.classList.add("barcode");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", `Code-barres ${code}`);
    svg.setAttribute("viewBox", `0 0 ${width} 108`);
    const background = document.createElementNS(svgNs, "rect");
    background.setAttribute("width", "100%");
    background.setAttribute("height", "100%");
    background.setAttribute("fill", "white");
    svg.append(background);
    for (const [index, bit] of [...pattern].entries()) {
      if (bit !== "1") continue;
      const bar = document.createElementNS(svgNs, "rect");
      bar.setAttribute("x", String((margin + index) * scale));
      bar.setAttribute("y", "0");
      bar.setAttribute("width", String(scale));
      bar.setAttribute("height", String(barHeight));
      svg.append(bar);
    }
    const label = document.createElementNS(svgNs, "text");
    label.setAttribute("x", "50%");
    label.setAttribute("y", "103");
    label.setAttribute("text-anchor", "middle");
    label.textContent = code;
    svg.append(label);
    return svg;
  }

  function makeWidget(barcode) {
    const host = document.createElement("span");
    host.className = "qd-off-host";
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      :host { all: initial; display: inline-block; font-family: system-ui, -apple-system, sans-serif; }
      .card { box-sizing: border-box; margin: 6px 0; padding: 8px; max-width: 330px; border: 1px solid #c8d9cc; border-radius: 8px; background: #f6fbf7; color: #16331e; font-size: 12px; line-height: 1.35; }
      .title { font-weight: 700; margin-bottom: 5px; } .grid { display: flex; flex-wrap: wrap; gap: 4px; }
      .chip { border-radius: 999px; padding: 3px 6px; background: #e3efe5; white-space: nowrap; }
      .nutri-a { background: #0b8a3b; color: white; } .nutri-b { background: #4cae4f; color: white; } .nutri-c { background: #f3c242; color: #3a2b00; } .nutri-d { background: #eb7a34; color: white; } .nutri-e { background: #d9423a; color: white; }
      button { margin-top: 6px; padding: 0; border: 0; background: transparent; color: #1c5d31; font: inherit; text-decoration: underline; cursor: pointer; }
      .additive-toggle { margin-top: 0; padding: 3px 6px; background: #e3efe5; color: #16331e; text-decoration: none; }
      .additive-toggle:hover { background: #d5e8da; }
      .additive-toggle:focus-visible { outline: 2px solid #1c5d31; outline-offset: 2px; }
      .chip-link { color: inherit; text-decoration: none; }
      .chip-link:hover, .additive-link:hover { text-decoration: underline; }
      .chip-link:focus-visible, .additive-link:focus-visible { outline: 2px solid #1c5d31; outline-offset: 2px; }
      .additive-link { color: #1c5d31; }
      .additive-details { margin-top: 7px; }
      .additive-details ul { margin: 3px 0 0; padding-left: 19px; }
      .additive-details li { margin: 2px 0; }
      .barcode-wrap { margin-top: 7px; } .barcode { display: block; width: min(100%, 310px); height: auto; }
      .muted { color: #53645a; } .error { color: #9d241d; }`;
    const card = makeElement("div", "card");
    card.append(makeElement("div", "title", "Qualité — Open Food Facts"));
    card.append(makeElement("div", "muted", "Recherche en cours…"));
    shadow.append(style, card);
    return { host, shadow, card, barcode };
  }

  function setMessage(widget, message, className = "muted") {
    widget.card.replaceChildren(
      makeElement("div", "title", "Qualité — Open Food Facts"),
      makeElement("div", className, message)
    );
  }

  function renderProduct(widget, product) {
    if (!product) {
      setMessage(widget, "Produit non trouvé dans Open Food Facts.");
      return;
    }
    const rawGrade = String(product.nutriscore_grade || "").toUpperCase();
    const gradeClass = /^[A-E]$/.test(rawGrade) ? `nutri-${rawGrade.toLowerCase()}` : "";
    const grade = gradeClass ? rawGrade : "INCONNU";
    const nova = product.nova_group ? `NOVA ${product.nova_group}` : "NOVA non renseigné";
    const additives = additiveEntries(product);
    const grid = makeElement("div", "grid");
    grid.append(
      makeExternalLink(`Nutri-Score ${grade}`, "https://www.santepubliquefrance.fr/nutrition-et-activite-physique/nutri-score", `chip ${gradeClass} chip-link`),
      makeExternalLink(nova, "https://world.openfoodfacts.org/nova", "chip chip-link")
    );
    let additiveDetails;
    if (additives.length) {
      const toggle = makeElement("button", "chip additive-toggle", additiveLabel(additives.length));
      toggle.type = "button";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", "qd-additives-details");
      additiveDetails = makeElement("div", "additive-details");
      additiveDetails.id = "qd-additives-details";
      additiveDetails.hidden = true;
      additiveDetails.append(makeElement("div", "muted", "Additifs selon Open Food Facts :"));
      const list = makeElement("ul");
      for (const additive of additives) {
        const item = makeElement("li", "");
        item.append(additive.url
          ? makeExternalLink(additive.name, additive.url, "additive-link")
          : document.createTextNode(additive.name));
        list.append(item);
      }
      additiveDetails.append(list);
      toggle.addEventListener("click", () => {
        additiveDetails.hidden = !additiveDetails.hidden;
        toggle.setAttribute("aria-expanded", String(!additiveDetails.hidden));
      });
      grid.append(toggle);
    } else {
      grid.append(makeElement("span", "chip", "Aucun additif renseigné"));
    }
    const button = makeElement("button", "", "Afficher le code-barres à scanner avec Yuka");
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    const barcodeWrap = makeElement("div", "barcode-wrap");
    barcodeWrap.id = `qd-barcode-${widget.barcode}`;
    button.setAttribute("aria-controls", barcodeWrap.id);
    barcodeWrap.hidden = true;
    const barcode = eanSvg(widget.barcode);
    if (barcode) barcodeWrap.append(barcode);
    barcodeWrap.append(makeElement("div", "muted", barcode
      ? "Scanne ce code dans l’application Yuka pour voir sa note officielle."
      : `Code-barres : ${widget.barcode}`));
    button.addEventListener("click", () => {
      barcodeWrap.hidden = !barcodeWrap.hidden;
      button.setAttribute("aria-expanded", String(!barcodeWrap.hidden));
      button.textContent = barcodeWrap.hidden
        ? "Afficher le code-barres à scanner avec Yuka"
        : "Masquer le code-barres";
    });
    widget.card.replaceChildren(
      makeElement("div", "title", "Qualité — Open Food Facts"), grid,
      ...(additiveDetails ? [additiveDetails] : []), button, barcodeWrap
    );
  }

  function renderError(widget) {
    setMessage(widget, "Données indisponibles pour le moment.", "error");
  }
