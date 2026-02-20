"use client";

import Link from "next/link";

interface UsageBarProps {
  used: number;
  limit: number;
  plan: string;
}

export default function UsageBar({ used, limit, plan }: UsageBarProps) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isAtLimit = !isUnlimited && used >= limit;

  const planLabel =
    plan === "free" ? "Starter" : plan === "pro" ? "Pro" : "Agency";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-600">
          Wykorzystane:{" "}
          <span className="font-medium text-zinc-900">
            {used}
            {isUnlimited ? "" : `/${limit}`}
          </span>{" "}
          generacji
        </span>
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
          Plan {planLabel}
        </span>
      </div>
      {!isUnlimited && (
        <div className="mt-2 h-2 rounded-full bg-zinc-100">
          <div
            className={`h-2 rounded-full transition-all ${
              isAtLimit ? "bg-red-500" : "bg-blue-600"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {isAtLimit && (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-red-600">
            Limit osiągnięty na ten miesiąc
          </p>
          <Link
            href="/billing"
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Upgrade do Pro &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
