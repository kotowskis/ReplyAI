"use client";

import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  MapPin,
  Building2,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface Account {
  id: string;
  name: string;
  type: string;
}

interface Location {
  id: string;
  title: string;
  address: string | null;
  websiteUri: string | null;
}

interface GoogleLocationSelectorProps {
  onSelect: (locationName: string) => void;
  onClose: () => void;
}

export default function GoogleLocationSelector({
  onSelect,
  onClose,
}: GoogleLocationSelectorProps) {
  const [step, setStep] = useState<"accounts" | "locations">("accounts");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);

  // Pobierz konta GBP
  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/google/accounts");
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "google_token_expired") {
          setTokenExpired(true);
          return;
        }
        throw new Error(data.message ?? "Nie udało się pobrać kont");
      }

      setAccounts(data.accounts);

      // Jeśli jest tylko jedno konto, przejdź od razu do lokalizacji
      if (data.accounts.length === 1) {
        handleSelectAccount(data.accounts[0]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się pobrać kont Google"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectAccount(account: Account) {
    setSelectedAccount(account);
    setStep("locations");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/google/locations?accountId=${encodeURIComponent(account.id)}`
      );
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "google_token_expired") {
          setTokenExpired(true);
          return;
        }
        throw new Error(data.message ?? "Nie udało się pobrać lokalizacji");
      }

      setLocations(data.locations);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się pobrać lokalizacji"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectLocation(location: Location) {
    if (!selectedAccount) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/google/select-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccount.id,
          locationId: location.id,
          locationName: location.title,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Nie udało się zapisać lokalizacji");
      }

      onSelect(location.title);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się zapisać lokalizacji"
      );
    } finally {
      setSaving(false);
    }
  }

  // Token wygasł — komunikat z linkiem do ponownego połączenia
  if (tokenExpired) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="mx-4 w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-zinc-900">
              Sesja wygasła
            </h3>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <span className="text-sm text-amber-800">
              Sesja Google wygasła lub została odwołana. Połącz konto ponownie.
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Anuluj
            </button>
            <a
              href="/api/auth/google"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Połącz ponownie
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg rounded-xl border border-zinc-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">
              {step === "accounts"
                ? "Wybierz konto Google"
                : "Wybierz lokalizację"}
            </h3>
            {step === "locations" && selectedAccount && (
              <button
                onClick={() => {
                  setStep("accounts");
                  setLocations([]);
                }}
                className="mt-0.5 text-xs text-blue-600 hover:text-blue-700"
              >
                &larr; Wróć do wyboru konta
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 hover:text-zinc-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-8 text-zinc-500">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">
                {step === "accounts"
                  ? "Pobieranie kont Google..."
                  : "Pobieranie lokalizacji..."}
              </span>
            </div>
          )}

          {error && !loading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
              <button
                onClick={
                  step === "accounts"
                    ? fetchAccounts
                    : () =>
                        selectedAccount &&
                        handleSelectAccount(selectedAccount)
                }
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                Spróbuj ponownie
              </button>
            </div>
          )}

          {/* Lista kont */}
          {step === "accounts" && !loading && !error && (
            <div className="space-y-2">
              {accounts.length === 0 ? (
                <p className="text-sm text-zinc-500 py-4 text-center">
                  Nie znaleziono kont Google Business Profile powiązanych z tym
                  kontem Google.
                </p>
              ) : (
                accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleSelectAccount(account)}
                    className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
                  >
                    <Building2 className="h-5 w-5 text-zinc-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-zinc-900 truncate">
                        {account.name}
                      </span>
                      <span className="block text-xs text-zinc-500">
                        {account.type === "PERSONAL"
                          ? "Konto osobiste"
                          : account.type === "ORGANIZATION"
                            ? "Organizacja"
                            : "Grupa lokalizacji"}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}

          {/* Lista lokalizacji */}
          {step === "locations" && !loading && !error && (
            <div className="space-y-2">
              {locations.length === 0 ? (
                <p className="text-sm text-zinc-500 py-4 text-center">
                  Nie znaleziono lokalizacji dla tego konta.
                </p>
              ) : (
                locations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => handleSelectLocation(location)}
                    disabled={saving}
                    className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
                  >
                    <MapPin className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-zinc-900 truncate">
                        {location.title}
                      </span>
                      {location.address && (
                        <span className="block text-xs text-zinc-500 truncate">
                          {location.address}
                        </span>
                      )}
                    </div>
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
