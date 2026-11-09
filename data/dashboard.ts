// Static data for the analytics dashboard.
// Daily records are generated deterministically (no Math.random) so server
// and client renders always agree.

export type OrderStatus = "Completed" | "Pending" | "Refunded";

export type DailyRecord = {
  date: string; // YYYY-MM-DD
  orders: number;
  revenue: number;
  customers: number; // unique customers that day
  refunds: number; // number of refunded orders
  byCategory: Record<string, number>; // revenue per category
};

export type Order = {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: OrderStatus;
  date: string;
};

export const DATA_START = "2026-01-01";
export const DATA_END = "2026-11-08";

export const categories = ["Electronics", "Apparel", "Home", "Beauty", "Sports", "Books"];
const categoryWeights = [0.32, 0.22, 0.17, 0.13, 0.11, 0.05];

// Small deterministic pseudo-random in [0, 1)
function rand(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function buildDaily(): DailyRecord[] {
  const out: DailyRecord[] = [];
  let date = DATA_START;
  for (let i = 0; date <= DATA_END; i++, date = addDays(DATA_START, i)) {
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
    const weekend = dow === 0 || dow === 6 ? 1.18 : 1;
    const trend = 1 + i / 330; // growth over the year
    const orders = Math.round((9 + rand(i + 1) * 8) * trend * weekend);
    const aov = 52 + rand(i + 500) * 26;
    const revenue = Math.round(orders * aov);
    const byCategory: Record<string, number> = {};
    categories.forEach((c, k) => {
      byCategory[c] = Math.round(revenue * categoryWeights[k] * (0.85 + rand(i * 7 + k) * 0.3));
    });
    out.push({
      date,
      orders,
      revenue,
      customers: Math.max(1, Math.round(orders * (0.75 + rand(i + 900) * 0.15))),
      refunds: Math.round(orders * rand(i + 1300) * 0.05),
      byCategory,
    });
  }
  return out;
}

export const dailyData: DailyRecord[] = buildDaily();

const names = ["Olivia Martin", "Liam Johnson", "Emma Davis", "Noah Wilson", "Ava Brown", "Ethan Clark", "Mia Lopez", "Lucas Young"];
const products = ["Wireless Headphones", "Running Shoes", "Smart Lamp", "Yoga Mat", "Skincare Set", "Bluetooth Speaker", "Novel Bundle", "Desk Organizer"];
const statuses: OrderStatus[] = ["Completed", "Completed", "Completed", "Pending", "Refunded"];

// ~2 sample orders per day, newest first
export const orders: Order[] = dailyData
  .flatMap((d, i) =>
    [0, 1].map((k) => {
      const s = i * 2 + k;
      return {
        id: `#${10000 + s}`,
        customer: names[Math.floor(rand(s + 3) * names.length)],
        product: products[Math.floor(rand(s + 77) * products.length)],
        amount: Math.round((20 + rand(s + 200) * 180) * 100) / 100,
        status: statuses[Math.floor(rand(s + 400) * statuses.length)],
        date: d.date,
      };
    }),
  )
  .reverse();
