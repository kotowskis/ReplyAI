"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface TimelinePoint {
  date: string;
  users: number;
  generations: number;
}

interface PlanPoint {
  name: string;
  value: number;
}

interface AnalyticsData {
  timeline: TimelinePoint[];
  planDistribution: PlanPoint[];
  days: number;
}

const RANGE_OPTIONS = [
  { label: "7 dni", value: 7 },
  { label: "30 dni", value: 30 },
  { label: "90 dni", value: 90 },
];

const PLAN_COLORS: Record<string, string> = {
  "free (active)": "#a1a1aa",
  "pro (active)": "#3b82f6",
  "free (canceled)": "#e4e4e7",
  "pro (canceled)": "#93c5fd",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

export function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/analytics?days=${days}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Nie udało się pobrać danych");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-zinc-400">
        Ładowanie wykresów…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-red-500">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const totalNewUsers = data.timeline.reduce((s, p) => s + p.users, 0);
  const totalGenerations = data.timeline.reduce((s, p) => s + p.generations, 0);

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex items-center gap-1">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setDays(opt.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              days === opt.value
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-400">
            Nowi użytkownicy ({days}d)
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {totalNewUsers}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-400">
            Generacje ({days}d)
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {totalGenerations}
          </p>
        </div>
      </div>

      {/* Users trend */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900">
          Nowi użytkownicy dziennie
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.timeline}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                width={30}
              />
              <Tooltip
                labelFormatter={(label) => formatDate(label as string)}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e4e4e7",
                }}
              />
              <Area
                type="monotone"
                dataKey="users"
                name="Użytkownicy"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorUsers)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Generations trend */}
      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900">
          Generacje dziennie
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.timeline}>
              <defs>
                <linearGradient id="colorGens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                width={30}
              />
              <Tooltip
                labelFormatter={(label) => formatDate(label as string)}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e4e4e7",
                }}
              />
              <Area
                type="monotone"
                dataKey="generations"
                name="Generacje"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#colorGens)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Plan distribution */}
      {data.planDistribution.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900">
            Rozkład planów
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.planDistribution} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f4f4f5"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#a1a1aa" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e4e4e7",
                  }}
                />
                <Bar dataKey="value" name="Subskrypcje" radius={[0, 4, 4, 0]}>
                  {data.planDistribution.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={PLAN_COLORS[entry.name] ?? "#a1a1aa"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
