  const siteAdapters = [
    {
      matches: (hostname) => hostname === "leclercdrive.fr" || hostname.endsWith(".leclercdrive.fr"),
      findTargets: findLeclercTargets,
    },
  ];
  const activeSite = siteAdapters.find((site) => site.matches(location.hostname));

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
    for (const target of activeSite.findTargets()) {
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

  if (activeSite) {
    new MutationObserver(scheduleScan).observe(document.documentElement, { childList: true, subtree: true });
    scheduleScan();
  }
