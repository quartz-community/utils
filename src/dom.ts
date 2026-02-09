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

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onEscape();
    }
  };

  const onClick = (e: MouseEvent) => {
    if (e.target instanceof Node && !outsideContainer.contains(e.target)) {
      onEscape();
    }
  };

  document.addEventListener("keydown", onKeydown);
  document.addEventListener("click", onClick);

  return () => {
    document.removeEventListener("keydown", onKeydown);
    document.removeEventListener("click", onClick);
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
