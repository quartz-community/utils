export function removeAllChildren(el: HTMLElement): void {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

export function registerEscapeHandler(
  outsideContainer: HTMLElement | null,
  onEscape: () => void,
): () => void {
  if (!outsideContainer) return () => {};

  // Click handler: only trigger when clicking directly on the container backdrop,
  // not when clicking on children or elements outside
  const onClick = (e: MouseEvent) => {
    if (e.target === outsideContainer) {
      e.preventDefault();
      e.stopPropagation();
      onEscape();
    }
  };

  outsideContainer.addEventListener("click", onClick);

  return () => {
    outsideContainer.removeEventListener("click", onClick);
  };
}

export function normalizeRelativeURLs(html: Document, baseUrl: string): void {
  const elements = html.querySelectorAll<HTMLElement>("[src], [href]");
  for (const el of Array.from(elements)) {
    const attr = el.hasAttribute("href") ? "href" : "src";
    const val = el.getAttribute(attr);
    if (!val) continue;
    if (
      val.startsWith("http://") ||
      val.startsWith("https://") ||
      val.startsWith("mailto:") ||
      val.startsWith("tel:") ||
      val.startsWith("#") ||
      val.startsWith("/") ||
      val.startsWith("data:")
    ) {
      continue;
    }
    try {
      const normalized = new URL(val, baseUrl).toString();
      el.setAttribute(attr, normalized);
    } catch {
      continue;
    }
  }
}
