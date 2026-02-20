"use client";

import { useState } from "react";
import { Star, Loader2, Sparkles } from "lucide-react";

const PLATFORMS = [
  { value: "google", label: "Google" },
  { value: "facebook", label: "Facebook" },
  { value: "booking", label: "Booking.com" },
];

interface GeneratorFormProps {
  onGenerated: (reply: string) => void;
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewText.trim() || loading || disabled) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewText, rating, platform }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "limit_reached") {
          setError(
            "Osiągnięto limit generacji w tym miesiącu. Przejdź na plan Pro, aby mieć nieograniczone generacje."
          );
        } else {
          setError(data.error || "Wystąpił błąd");
        }
        return;
      }

      onGenerated(data.reply);
      onUsageUpdate(data.usage.used, data.usage.limit);
      setReviewText("");
      setRating(null);
    } catch {
      setError("Nie udało się połączyć z serwerem. Spróbuj ponownie.");
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
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
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
