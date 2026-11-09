import Link from "next/link";
import { DATA_END, DATA_START } from "@/data/dashboard";
import { presets } from "@/lib/range";

export function DateRangeFilter({ from, to }: { from: string; to: string }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-4">
      <nav className="flex flex-wrap gap-2" aria-label="Date range presets">
        {presets.map((p) => {
          const active = p.from === from && p.to === to;
          return (
            <Link
              key={p.key}
              href={`/?from=${p.from}&to=${p.to}`}
              aria-current={active ? "true" : undefined}
              className={`inline-flex h-9 items-center rounded-full border px-3 text-sm transition ${
                active
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-zinc-300 bg-white hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              }`}
            >
              {p.label}
            </Link>
          );
        })}
      </nav>

      {/* Plain GET form: submitting updates the URL and the server re-renders. */}
      <form action="/" method="get" className="flex flex-wrap items-end gap-2">
        {[
          { name: "from", label: "From", value: from },
          { name: "to", label: "To", value: to },
        ].map((f) => (
          <label key={f.name} className="text-xs text-zinc-500">
            {f.label}
            <input
              type="date"
              name={f.name}
              defaultValue={f.value}
              min={DATA_START}
              max={DATA_END}
              required
              className="mt-0.5 block h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </label>
        ))}
        <button
          type="submit"
          className="h-9 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Apply
        </button>
      </form>
    </div>
  );
}
