"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { Search, X } from "lucide-react";

export function AdminUsersSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function push(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    params.delete("page"); // reset to page 1 on new search
    router.push(`/admin?${params.toString()}`);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => push(value), 300);
  }

  function handleClear() {
    push("");
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        type="text"
        defaultValue={currentQuery}
        onChange={handleChange}
        placeholder="Szukaj po email lub nazwisku…"
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
  );
}
