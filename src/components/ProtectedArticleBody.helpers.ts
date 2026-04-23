const BLOCKED_KEYS = new Set(['a', 'c', 'p', 's', 'x']);

export function buildWatermarkSvgDataUrl(label: string): string {
  const safe = label.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="140"><g transform="rotate(-30 140 70)" fill="rgba(0,0,0,0.07)" font-family="Inter, sans-serif" font-size="14" font-weight="500"><text x="-20" y="30">${safe}</text><text x="60" y="80">${safe}</text><text x="-40" y="130">${safe}</text></g></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function isBlockedShortcut(e: { ctrlKey: boolean; metaKey: boolean; key: string }): boolean {
  if (!e.ctrlKey && !e.metaKey) return false;
  return BLOCKED_KEYS.has(e.key.toLowerCase());
}
