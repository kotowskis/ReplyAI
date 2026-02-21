"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { User, Settings, CreditCard, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import DeleteAccountSection from "@/components/DeleteAccountSection";
import SettingsForm from "@/components/SettingsForm";
import GoogleConnectionSection from "@/components/GoogleConnectionSection";
import { BillingClient } from "@/app/(dashboard)/billing/BillingClient";
import type { PlanKey } from "@/lib/stripe";

interface Company {
  id: string;
  name: string;
  industry: string;
  tone: string;
  language: string;
  description: string | null;
  owner_name: string | null;
  google_location_name: string | null;
  google_connected_at: string | null;
  google_oauth_tokens: string | null;
}

interface AccountTabsProps {
  profile: { full_name: string | null; email: string } | null;
  userEmail: string;
  company: Company;
  billing: {
    currentPlan: PlanKey;
    status: string;
    generationsUsed: number;
    generationsLimit: number;
    hasStripeSubscription: boolean;
    currentPeriodEnd: string | null;
    proPriceId: string;
    agencyPriceId: string;
  };
}

const tabs = [
  { key: "profil", label: "Profil", icon: User },
  { key: "ustawienia", label: "Ustawienia", icon: Settings },
  { key: "google", label: "Google", icon: Link2 },
  { key: "subskrypcja", label: "Subskrypcja", icon: CreditCard },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function AccountTabs({
  profile,
  userEmail,
  company,
  billing,
}: AccountTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentTab = (searchParams.get("tab") as TabKey) || "profil";

  function switchTab(tab: TabKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "profil") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.push(`/account${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Konto</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Zarządzaj swoim profilem, ustawieniami firmy i subskrypcją.
        </p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-zinc-200">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => switchTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      {currentTab === "profil" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 space-y-4">
            <h2 className="text-base font-semibold text-zinc-900">
              Dane konta
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="block text-sm font-medium text-zinc-500">
                  Imię i nazwisko
                </span>
                <span className="mt-1 block text-sm text-zinc-900">
                  {profile?.full_name || "—"}
                </span>
              </div>
              <div>
                <span className="block text-sm font-medium text-zinc-500">
                  Email
                </span>
                <span className="mt-1 block text-sm text-zinc-900">
                  {profile?.email || userEmail}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 space-y-5">
            <h2 className="text-base font-semibold text-zinc-900">
              Zmiana hasła
            </h2>
            <ChangePasswordForm />
          </div>

          <DeleteAccountSection />
        </div>
      )}

      {currentTab === "ustawienia" && <SettingsForm company={company} />}

      {currentTab === "google" && (
        <GoogleConnectionSection
          companyId={company.id}
          isConnected={!!company.google_oauth_tokens}
          locationName={company.google_location_name}
          connectedAt={company.google_connected_at}
          showSelector={searchParams.get("step") === "select"}
          oauthError={searchParams.get("error")}
        />
      )}

      {currentTab === "subskrypcja" && (
        <BillingClient
          currentPlan={billing.currentPlan}
          status={billing.status}
          generationsUsed={billing.generationsUsed}
          generationsLimit={billing.generationsLimit}
          hasStripeSubscription={billing.hasStripeSubscription}
          currentPeriodEnd={billing.currentPeriodEnd}
          proPriceId={billing.proPriceId}
          agencyPriceId={billing.agencyPriceId}
        />
      )}
    </div>
  );
}
