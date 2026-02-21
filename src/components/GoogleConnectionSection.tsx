"use client";

import { useState } from "react";
import {
  Link2,
  Unlink,
  MapPin,
  Loader2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import GoogleLocationSelector from "./GoogleLocationSelector";

interface GoogleConnectionProps {
  companyId: string;
  isConnected: boolean;
  locationName: string | null;
  connectedAt: string | null;
  /** Jeśli true, po callback OAuth automatycznie otworzy selekcję lokalizacji */
  showSelector?: boolean;
  /** Błąd z query string (?error=...) */
  oauthError?: string | null;
}

const ERROR_MESSAGES: Record<string, string> = {
  oauth_cancelled: "Autoryzacja została anulowana.",
  oauth_start_failed: "Nie udało się rozpocząć autoryzacji Google.",
  missing_params: "Brakujące parametry w odpowiedzi Google.",
  invalid_state: "Nieprawidłowy token bezpieczeństwa. Spróbuj ponownie.",
  no_company: "Nie znaleziono firmy. Przejdź onboarding.",
  save_failed: "Nie udało się zapisać tokenów. Spróbuj ponownie.",
  callback_failed: "Wystąpił błąd podczas autoryzacji. Spróbuj ponownie.",
};

export default function GoogleConnectionSection({
  companyId,
  isConnected,
  locationName,
  connectedAt,
  showSelector = false,
  oauthError,
}: GoogleConnectionProps) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const [error, setError] = useState<string | null>(
    oauthError ? ERROR_MESSAGES[oauthError] ?? "Wystąpił nieznany błąd." : null
  );
  const [selectorOpen, setSelectorOpen] = useState(showSelector);
  const [currentLocationName, setCurrentLocationName] = useState(locationName);
  const [connected, setConnected] = useState(isConnected);

  async function handleDisconnect() {
    if (
      !confirm(
        "Czy na pewno chcesz odłączyć konto Google? Synchronizacja opinii zostanie zatrzymana."
      )
    ) {
      return;
    }

    setDisconnecting(true);
    setError(null);

    try {
      const res = await fetch("/api/google/disconnect", { method: "POST" });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Błąd odłączania");
      }

      setDisconnected(true);
      setConnected(false);
      setCurrentLocationName(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się odłączyć konta"
      );
    } finally {
      setDisconnecting(false);
    }
  }

  function handleLocationSelected(name: string) {
    setCurrentLocationName(name);
    setSelectorOpen(false);
    setConnected(true);
  }

  // Po odłączeniu — czysty stan
  if (disconnected && !connected) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-base font-semibold text-zinc-900">
            Google Business Profile
          </h2>
          <p className="text-sm text-zinc-500">
            Połącz swój profil Google, aby automatycznie pobierać opinie i
            publikować odpowiedzi.
          </p>

          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <span className="text-sm text-amber-800">
              Konto Google zostało odłączone.
            </span>
          </div>

          <a
            href="/api/auth/google"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Link2 className="h-4 w-4" />
            Połącz z Google
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-semibold text-zinc-900">
          Google Business Profile
        </h2>
        <p className="text-sm text-zinc-500">
          Połącz swój profil Google, aby automatycznie pobierać opinie i
          publikować odpowiedzi.
        </p>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {connected ? (
          <div className="space-y-4">
            {/* Status połączenia */}
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-green-800">
                  Połączono z Google Business Profile
                </span>
                {connectedAt && (
                  <span className="block text-xs text-green-600">
                    Połączono:{" "}
                    {new Date(connectedAt).toLocaleDateString("pl-PL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Wybrana lokalizacja */}
            {currentLocationName ? (
              <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                <MapPin className="h-5 w-5 text-blue-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-zinc-900">
                    {currentLocationName}
                  </span>
                  <span className="block text-xs text-zinc-500">
                    Wybrana lokalizacja
                  </span>
                </div>
                <button
                  onClick={() => setSelectorOpen(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Zmień
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSelectorOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
              >
                <MapPin className="h-4 w-4" />
                Wybierz lokalizację
              </button>
            )}

            {/* Przycisk odłączenia */}
            <div className="pt-2 border-t border-zinc-200">
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
              >
                {disconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unlink className="h-4 w-4" />
                )}
                {disconnecting ? "Odłączanie..." : "Odłącz konto Google"}
              </button>
            </div>
          </div>
        ) : (
          <a
            href="/api/auth/google"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Link2 className="h-4 w-4" />
            Połącz z Google
          </a>
        )}
      </div>

      {/* Modal wyboru lokalizacji */}
      {selectorOpen && (
        <GoogleLocationSelector
          onSelect={handleLocationSelected}
          onClose={() => setSelectorOpen(false)}
        />
      )}
    </div>
  );
}
