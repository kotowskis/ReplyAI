"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  Zap,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { PLANS, type PlanKey } from "@/lib/stripe";

interface Props {
  currentPlan: PlanKey;
  status: string;
  generationsUsed: number;
  generationsLimit: number;
  hasStripeSubscription: boolean;
  currentPeriodEnd: string | null;
  proPriceId: string;
  agencyPriceId: string;
}

const planFeatures: Record<PlanKey, string[]> = {
  free: [
    "5 odpowiedzi miesięcznie",
    "1 profil firmy",
    "Google + Facebook",
  ],
  pro: [
    "Nieograniczone odpowiedzi",
    "1 profil firmy",
    "Google + Facebook + Booking",
    "Historia odpowiedzi",
    "Priorytetowe wsparcie",
  ],
  agency: [
    "Nieograniczone odpowiedzi",
    "Do 10 profili firm",
    "Wszystkie platformy",
    "Historia odpowiedzi",
    "Priorytetowe wsparcie",
  ],
};

export function BillingClient({
  currentPlan,
  status,
  generationsUsed,
  generationsLimit,
  hasStripeSubscription,
  currentPeriodEnd,
  proPriceId,
  agencyPriceId,
}: Props) {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const isUnlimited = generationsLimit === -1;
  const planInfo = PLANS[currentPlan];

  async function handleCheckout(priceId: string) {
    setLoadingPlan(priceId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoadingPlan(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setPortalLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Success / canceled banners */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Subskrypcja została aktywowana! Dziękujemy.
        </div>
      )}
      {canceled && (
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          <AlertCircle className="h-4 w-4" />
          Płatność została anulowana. Możesz spróbować ponownie.
        </div>
      )}

      {/* Current plan card */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Aktualny plan
            </p>
            <p className="mt-1 text-xl font-bold text-zinc-900">
              {planInfo.name}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              status === "active"
                ? "bg-green-50 text-green-700"
                : status === "past_due"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {status === "active"
              ? "Aktywny"
              : status === "past_due"
                ? "Zaległa płatność"
                : status === "canceled"
                  ? "Anulowany"
                  : status}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-6 text-sm text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4" />
            <span>
              {isUnlimited
                ? `${generationsUsed} generacji (bez limitu)`
                : `${generationsUsed}/${generationsLimit} generacji`}
            </span>
          </div>
          {currentPeriodEnd && (
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" />
              <span>
                Odnowienie:{" "}
                {new Date(currentPeriodEnd).toLocaleDateString("pl-PL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {hasStripeSubscription && (
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
          >
            {portalLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Zarządzaj w Stripe
          </button>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {(Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][]).map(
          ([key, plan]) => {
            const isCurrent = key === currentPlan;
            const isHighlighted = key === "pro";
            const features = planFeatures[key];
            const priceId =
              key === "pro"
                ? proPriceId
                : key === "agency"
                  ? agencyPriceId
                  : null;

            return (
              <div
                key={key}
                className={`rounded-lg border p-5 ${
                  isHighlighted
                    ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                    : "border-zinc-200 bg-white"
                }`}
              >
                {isHighlighted && (
                  <span className="mb-3 inline-block rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-medium text-white">
                    Najpopularniejszy
                  </span>
                )}
                <h3 className="text-base font-bold text-zinc-900">
                  {plan.name}
                </h3>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-zinc-900">
                    {plan.price} zł
                  </span>
                  <span className="text-sm text-zinc-500">/mies.</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-zinc-600"
                    >
                      <Check className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  {isCurrent ? (
                    <span className="inline-flex w-full items-center justify-center rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-500">
                      Aktualny plan
                    </span>
                  ) : priceId ? (
                    <button
                      onClick={() => handleCheckout(priceId)}
                      disabled={loadingPlan !== null}
                      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                        isHighlighted
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {loadingPlan === priceId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      {currentPlan === "free"
                        ? "Wybierz plan"
                        : key === "agency"
                          ? "Zmień na Agencję"
                          : "Zmień na Pro"}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
