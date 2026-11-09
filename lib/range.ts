import { DATA_END, DATA_START, dailyData, type DailyRecord } from "@/data/dashboard";

export function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000) + 1; // inclusive
}

const isIso = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

const clamp = (s: string) => (s < DATA_START ? DATA_START : s > DATA_END ? DATA_END : s);

export const presets = [
  { key: "7d", label: "Last 7 days", from: addDays(DATA_END, -6), to: DATA_END },
  { key: "30d", label: "Last 30 days", from: addDays(DATA_END, -29), to: DATA_END },
  { key: "90d", label: "Last 90 days", from: addDays(DATA_END, -89), to: DATA_END },
  { key: "ytd", label: "Year to date", from: DATA_START, to: DATA_END },
];

/** Parse ?from=&to= into a valid, clamped range (defaults to last 30 days). */
export function resolveRange(from?: string | string[], to?: string | string[]) {
  const def = presets[1];
  let f = isIso(from) ? clamp(from) : def.from;
  let t = isIso(to) ? clamp(to) : def.to;
  if (f > t) [f, t] = [t, f];
  return { from: f, to: t };
}

export function sliceRange(from: string, to: string): DailyRecord[] {
  return dailyData.filter((d) => d.date >= from && d.date <= to);
}

export type Totals = { revenue: number; orders: number; customers: number; refunds: number };

export function totals(rows: DailyRecord[]): Totals {
  return rows.reduce(
    (a, r) => ({
      revenue: a.revenue + r.revenue,
      orders: a.orders + r.orders,
      customers: a.customers + r.customers,
      refunds: a.refunds + r.refunds,
    }),
    { revenue: 0, orders: 0, customers: 0, refunds: 0 },
  );
}

/** Group rows into days / weeks / months depending on the range length. */
export function bucket(rows: DailyRecord[], span: number) {
  const unit = span <= 62 ? "day" : span <= 200 ? "week" : "month";
  const map = new Map<string, { label: string; revenue: number; orders: number }>();
  for (const r of rows) {
    let key = r.date;
    if (unit === "week") {
      const dow = (new Date(`${r.date}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday start
      key = addDays(r.date, -dow);
    } else if (unit === "month") key = r.date.slice(0, 7);
    const b = map.get(key) ?? { label: key, revenue: 0, orders: 0 };
    b.revenue += r.revenue;
    b.orders += r.orders;
    map.set(key, b);
  }
  return { unit, points: [...map.values()] };
}

const fmt = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", ...o });

export function bucketLabel(key: string, unit: string) {
  if (unit === "month") return fmt(`${key}-01`, { month: "short" });
  return fmt(key, { month: "short", day: "numeric" });
}

export const formatDate = (iso: string) => fmt(iso, { month: "short", day: "numeric", year: "numeric" });
