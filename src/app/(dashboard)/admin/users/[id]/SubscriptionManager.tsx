"use client";

import { useState } from "react";
import { RotateCcw, ArrowUpCircle, Save } from "lucide-react";

interface Subscription {
  id: string;
  plan: string;
  status: string;
  generations_used: number;
  generations_limit: number;
  stripe_subscription_id: string | null;
}

interface Props {
  subscription: Subscription;
  companyName: string;
}

export function SubscriptionManager({ subscription, companyName }: Props) {
  const [plan, setPlan] = useState(subscription.plan);
  const [used, setUsed] = useState(subscription.generations_used);
  const [limit, setLimit] = useState(subscription.generations_limit);
  const [editLimit, setEditLimit] = useState(false);
  const [limitInput, setLimitInput] = useState(String(subscription.generations_limit));
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function call(body: Record<string, unknown>) {
    const res = await fetch("/api/admin/subscriptions/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionId: subscription.id, ...body }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Błąd");
    return data;
  }

  async function handleChangePlan(newPlan: string) {
    if (newPlan === plan) return;
    setLoading("plan");
    setMessage(null);
    try {
      const data = await call({ action: "change_plan", plan: newPlan });
      setPlan(newPlan);
      setLimit(data.generations_limit);
      setLimitInput(String(data.generations_limit));
      setMessage({ type: "ok", text: `Plan zmieniony na ${newPlan}` });
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Błąd" });
    } finally {
      setLoading(null);
    }
  }

  async function handleResetUsage() {
    setLoading("reset");
    setMessage(null);
    try {
      await call({ action: "reset_usage" });
      setUsed(0);
      setMessage({ type: "ok", text: "Licznik zresetowany" });
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Błąd" });
    } finally {
      setLoading(null);
    }
  }

  async function handleSetLimit() {
    const val = parseInt(limitInput, 10);
    if (isNaN(val) || val < 0) {
      setMessage({ type: "err", text: "Podaj poprawną liczbę" });
      return;
    }
    setLoading("limit");
    setMessage(null);
    try {
      await call({ action: "set_limit", generationsLimit: val });
      setLimit(val);
      setEditLimit(false);
      setMessage({ type: "ok", text: `Limit ustawiony na ${val}` });
    } catch (e) {
      setMessage({ type: "err", text: e instanceof Error ? e.message : "Błąd" });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-4">
      {/* Company name + plan badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-zinc-900">{companyName}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            plan === "free"
              ? "bg-zinc-100 text-zinc-600"
              : "bg-blue-50 text-blue-700"
          }`}
        >
          {plan}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            subscription.status === "active"
              ? "bg-green-50 text-green-700"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {subscription.status}
        </span>
        {subscription.stripe_subscription_id && (
          <span className="text-xs text-zinc-400">
            Stripe: {subscription.stripe_subscription_id}
          </span>
        )}
      </div>

      {/* Usage bar */}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
          <span>Generacje: {used} / {limit}</span>
          <span>{limit > 0 ? Math.round((used / limit) * 100) : 0}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
          <div
            className={`h-full rounded-full transition-all ${
              used >= limit ? "bg-red-500" : used >= limit * 0.8 ? "bg-amber-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(100, limit > 0 ? (used / limit) * 100 : 0)}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Plan toggle */}
        <button
          onClick={() => handleChangePlan(plan === "free" ? "pro" : "free")}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          <ArrowUpCircle className="h-3.5 w-3.5" />
          {loading === "plan"
            ? "Zmieniam..."
            : plan === "free"
              ? "Upgrade do Pro"
              : "Downgrade do Free"}
        </button>

        {/* Reset usage */}
        <button
          onClick={handleResetUsage}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {loading === "reset" ? "Resetuję..." : "Resetuj licznik"}
        </button>

        {/* Set custom limit */}
        {editLimit ? (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              className="w-20 rounded-md border border-zinc-200 px-2 py-1.5 text-xs text-zinc-900"
            />
            <button
              onClick={handleSetLimit}
              disabled={loading !== null}
              className="inline-flex items-center gap-1 rounded-md border border-green-200 px-2.5 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {loading === "limit" ? "..." : "Zapisz"}
            </button>
            <button
              onClick={() => {
                setEditLimit(false);
                setLimitInput(String(limit));
              }}
              className="rounded-md px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-600"
            >
              Anuluj
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditLimit(true)}
            disabled={loading !== null}
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            Ustaw limit
          </button>
        )}
      </div>

      {/* Feedback message */}
      {message && (
        <p
          className={`text-xs ${
            message.type === "ok" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
