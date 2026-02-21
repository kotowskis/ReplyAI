"use client";

import { useState } from "react";
import { Star, Loader2, Sparkles, WifiOff, RefreshCw } from "lucide-react";

const PLATFORMS = [
  { value: "google", label: "Google" },
  { value: "facebook", label: "Facebook" },
  { value: "booking", label: "Booking.com" },
];

const FETCH_TIMEOUT_MS = 35_000; // 35s — slightly more than server's 30s Claude timeout

interface GeneratorFormProps {
  onGenerated: (reply: string, generationId: string | null) => void;
  onUsageUpdate: (used: number, limit: number) => void;
  disabled?: boolean;
}

export default function GeneratorForm({
  onGenerated,
  onUsageUpdate,
  disabled,
}: GeneratorFormProps) {
  const [reviewText, setReviewText] = useState("");
  const [platform, setPlatform] = useState("google");
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<"network" | "timeout" | "limit" | "server" | "">("");

  function handleRetry() {
    handleSubmit();
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!reviewText.trim() || loading || disabled) return;

    // Check online status before making request
    if (!navigator.onLine) {
      setError("Brak połączenia z internetem. Sprawdź swoje połączenie i spróbuj ponownie.");
      setErrorType("network");
      return;
    }

    setLoading(true);
    setError("");
    setErrorType("");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewText, rating, platform }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "limit_reached") {
          setError(
            "Osiągnięto limit generacji w tym miesiącu. Przejdź na plan Pro, aby mieć nieograniczone generacje."
          );
          setErrorType("limit");
        } else if (data.error === "ai_timeout") {
          setError(data.message || "Generowanie trwa zbyt długo. Spróbuj ponownie.");
          setErrorType("timeout");
        } else if (data.error === "ai_overloaded") {
          setError(data.message || "Serwer AI jest przeciążony. Spróbuj za minutę.");
          setErrorType("timeout");
        } else if (data.error === "ai_unavailable" || data.error === "db_error") {
          setError(data.message || "Usługa jest chwilowo niedostępna. Spróbuj za chwilę.");
          setErrorType("server");
        } else {
          setError(data.message || data.error || "Wystąpił błąd");
          setErrorType("server");
        }
        return;
      }

      onGenerated(data.reply, data.generationId ?? null);
      onUsageUpdate(data.usage.used, data.usage.limit);
      setReviewText("");
      setRating(null);
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Generowanie trwa zbyt długo. Sprawdź połączenie z internetem i spróbuj ponownie.");
        setErrorType("timeout");
      } else if (!navigator.onLine) {
        setError("Utracono połączenie z internetem. Sprawdź swoje połączenie i spróbuj ponownie.");
        setErrorType("network");
      } else {
        setError("Nie udało się połączyć z serwerem. Spróbuj ponownie.");
        setErrorType("network");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Review textarea */}
      <div>
        <label
          htmlFor="review"
          className="block text-sm font-medium text-zinc-700"
        >
          Treść opinii klienta
        </label>
        <textarea
          id="review"
          rows={5}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder='np. "Byłem tu wczoraj na obiedzie. Jedzenie było dobre, ale obsługa zostawiała wiele do życzenia..."'
          className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
          disabled={loading}
        />
      </div>

      {/* Platform and rating row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        {/* Platform select */}
        <div className="flex-1">
          <label
            htmlFor="platform"
            className="block text-sm font-medium text-zinc-700"
          >
            Platforma
          </label>
          <select
            id="platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
            disabled={loading}
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Star rating */}
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Ocena (opcjonalnie)
          </label>
          <div className="mt-1 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(rating === star ? null : star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(null)}
                className="rounded p-0.5 transition-colors hover:bg-zinc-100"
                disabled={loading}
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    star <= (hoveredStar ?? rating ?? 0)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-zinc-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            errorType === "limit"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <div className="flex items-start gap-2">
            {errorType === "network" && (
              <WifiOff className="mt-0.5 h-4 w-4 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p>{error}</p>
              {(errorType === "network" || errorType === "timeout" || errorType === "server") && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium underline underline-offset-2 hover:no-underline"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Spróbuj ponownie
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!reviewText.trim() || loading || disabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generuję...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generuj odpowiedź
          </>
        )}
      </button>
    </form>
  );
}
