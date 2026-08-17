export function qs(root: ParentNode, selector: string): HTMLElement | null {
  const el = root.querySelector(selector);
  return el instanceof HTMLElement ? el : null;
}

export function qsa(root: ParentNode, selector: string): HTMLElement[] {
  return [...root.querySelectorAll(selector)].filter(
    (el): el is HTMLElement => el instanceof HTMLElement
  );
}
