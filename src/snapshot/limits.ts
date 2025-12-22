export const DEFAULT_MAX_ELEMENTS = (() => {
  const raw = process.env.UBROWSER_MAX_ELEMENTS;
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
})();
