  const siteAdapters = [
    {
      matches: (hostname) => hostname === "leclercdrive.fr" || hostname.endsWith(".leclercdrive.fr"),
      findTargets: findLeclercTargets,
    },
  ];
  const activeSite = siteAdapters.find((site) => site.matches(location.hostname));
  let productWidget;

  function mount(target) {
    if (!target.page && rendered.has(target.container)) return;
    const widget = makeWidget(target.barcode);
    if (target.page) {
      productWidget = widget;
      target.title.after(widget.host);
    } else {
      rendered.set(target.container, widget);
      target.container.append(widget.host);
    }
    fetchProduct(target.barcode).then((product) => renderProduct(widget, product)).catch(() => renderError(widget));
  }

  function scan() {
    scheduled = false;
    for (const target of activeSite.findTargets()) {
      if (target.page && productWidget?.barcode === target.barcode) {
        if (productWidget.host.previousElementSibling !== target.title) {
          target.title.after(productWidget.host);
        }
        continue;
      }
      if (autoLookups >= MAX_AUTO_LOOKUPS_PER_PAGE) break;
      if (!target.page && rendered.has(target.container)) continue;
      if (target.page && productWidget) productWidget.host.remove();
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
