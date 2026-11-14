/** Money is stored in millimes (1 TND = 1000). */
export function formatPrice(minor: number): string {
  const tnd = minor / 1000;
  return (
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: Number.isInteger(tnd) ? 0 : 3,
      maximumFractionDigits: 3,
    }).format(tnd) + " DT"
  );
}

/** "75,500" or "75.5" → 75500 millimes. Returns null for invalid input. */
export function parsePrice(input: string | null | undefined): number | null {
  if (input == null) return null;
  const s = String(input).trim().replace(/\s/g, "").replace(",", ".");
  if (s === "") return null;
  if (!/^\d+(\.\d{1,3})?$/.test(s)) return null;
  return Math.round(Number(s) * 1000);
}

export const toInputPrice = (minor: number | null | undefined) => (minor == null ? "" : String(minor / 1000));

export function formatDate(d: Date | string, withTime = false): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Africa/Tunis",
  }).format(new Date(d));
}

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function discountPercent(price: number, compareAt: number | null | undefined): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round((1 - price / compareAt) * 100);
}
