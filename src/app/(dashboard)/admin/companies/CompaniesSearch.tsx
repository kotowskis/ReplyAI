"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { Search, X } from "lucide-react";

const PLAN_OPTIONS = [
  { value: "", label: "Wszystkie plany" },
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
];

export function CompaniesSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const currentPlan = searchParams.get("plan") ?? "";
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function push(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    params.delete("page");
    router.push(`/admin/companies?${params.toString()}`);
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => push({ q: value }), 300);
  }

  function handleClear() {
    push({ q: "" });
  }

  function handlePlan(e: React.ChangeEvent<HTMLSelectElement>) {
    push({ plan: e.target.value });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          defaultValue={currentQuery}
          onChange={handleSearch}
          placeholder="Szukaj po nazwie firmy lub właścicielu…"
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-9 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        {currentQuery && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-400 hover:text-zinc-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <select
        value={currentPlan}
        onChange={handlePlan}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      >
        {PLAN_OPTIONS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
}
