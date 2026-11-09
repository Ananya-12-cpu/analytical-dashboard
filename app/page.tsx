import { Suspense, type ReactNode } from "react";
import { AreaChart, BarChart } from "@/components/charts";
import { DateRangeFilter } from "@/components/date-range-filter";
import { categories, DATA_START, orders, type OrderStatus } from "@/data/dashboard";
import {
  addDays,
  bucket,
  bucketLabel,
  daysBetween,
  formatDate,
  resolveRange,
  sliceRange,
  totals,
} from "@/lib/range";

const statusStyle: Record<OrderStatus, string> = {
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  Refunded: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
};

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

function Card({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>
      <h2 className="mb-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300">{title}</h2>
      {children}
    </section>
  );
}

export default function Page({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-zinc-500">Loading dashboard…</p>}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const sp = await searchParams;
  const { from, to } = resolveRange(sp.from, sp.to);

  const span = daysBetween(from, to);
  const rows = sliceRange(from, to);
  const cur = totals(rows);

  // Previous period of equal length, immediately before `from` (only if data exists).
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(from, -span);
  const hasPrev = prevTo >= DATA_START;
  const prev = hasPrev ? totals(sliceRange(prevFrom < DATA_START ? DATA_START : prevFrom, prevTo)) : null;

  const pct = (c: number, p?: number) => (p ? ((c - p) / p) * 100 : null);

  const kpis = [
    { label: "Total Revenue", value: usd(cur.revenue), change: pct(cur.revenue, prev?.revenue), invert: false },
    { label: "Orders", value: cur.orders.toLocaleString("en-US"), change: pct(cur.orders, prev?.orders), invert: false },
    {
      label: "Avg. Order Value",
      value: `$${(cur.orders ? cur.revenue / cur.orders : 0).toFixed(2)}`,
      change: pct(cur.orders ? cur.revenue / cur.orders : 0, prev && prev.orders ? prev.revenue / prev.orders : undefined),
      invert: false,
    },
    {
      label: "Refund Rate",
      value: `${(cur.orders ? (cur.refunds / cur.orders) * 100 : 0).toFixed(1)}%`,
      change: pct(cur.orders ? cur.refunds / cur.orders : 0, prev && prev.orders ? prev.refunds / prev.orders : undefined),
      invert: true, // lower is better
    },
  ];

  const { unit, points } = bucket(rows, span);
  const revenueSeries = points.map((p) => ({ label: bucketLabel(p.label, unit), value: p.revenue }));
  const ordersSeries = points.map((p) => ({ label: bucketLabel(p.label, unit), value: p.orders }));
  const grain = unit === "day" ? "Daily" : unit === "week" ? "Weekly" : "Monthly";

  const byCategory = categories
    .map((c) => ({ label: c, value: rows.reduce((s, r) => s + r.byCategory[c], 0) }))
    .sort((a, b) => b.value - a.value);

  const rangeOrders = orders.filter((o) => o.date >= from && o.date <= to).slice(0, 8);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-zinc-500">
            {formatDate(from)} – {formatDate(to)} · {span} {span === 1 ? "day" : "days"}
          </p>
        </div>
        <DateRangeFilter from={from} to={to} />
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const good = k.change === null ? true : k.invert ? k.change < 0 : k.change > 0;
          return (
            <div key={k.label} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">{k.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{k.value}</p>
              {k.change === null ? (
                <p className="mt-1 text-xs text-zinc-400">No earlier period to compare</p>
              ) : (
                <p className={`mt-1 text-xs font-medium ${good ? "text-emerald-600" : "text-rose-600"}`}>
                  {k.change >= 0 ? "▲" : "▼"} {Math.abs(k.change).toFixed(1)}% vs previous {span} days
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={`${grain} Revenue`}>
          <AreaChart data={revenueSeries} prefix="$" label={`${grain} revenue chart`} />
        </Card>
        <Card title={`${grain} Orders`}>
          <AreaChart data={ordersSeries} color="#06b6d4" label={`${grain} orders chart`} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Revenue by Category">
          <BarChart data={byCategory} />
        </Card>
        <Card title="Recent Orders in Range" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-zinc-500">
                <tr>
                  {["Order", "Date", "Customer", "Product", "Amount", "Status"].map((h) => (
                    <th key={h} className="pb-2 pr-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {rangeOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2.5 pr-3 font-medium">{o.id}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-500">{formatDate(o.date)}</td>
                    <td className="py-2.5 pr-3">{o.customer}</td>
                    <td className="py-2.5 pr-3 text-zinc-500">{o.product}</td>
                    <td className="py-2.5 pr-3 tabular-nums">${o.amount.toFixed(2)}</td>
                    <td className="py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[o.status]}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}
