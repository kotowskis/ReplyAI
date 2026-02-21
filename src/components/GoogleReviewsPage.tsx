"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Star,
  RefreshCw,
  MessageSquare,
  Filter,
  MapPin,
  Link2Off,
  Sparkles,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import CopyButton from "@/components/CopyButton";

interface GoogleReview {
  id: string;
  google_review_id: string;
  reviewer_name: string;
  reviewer_photo_url: string | null;
  star_rating: number;
  comment: string | null;
  review_created_at: string;
  review_updated_at: string;
  reply_text: string | null;
  reply_updated_at: string | null;
  reply_source: string | null;
  generation_id: string | null;
  synced_at: string;
}

interface ReviewsResponse {
  reviews: GoogleReview[];
  total: number;
  page: number;
  perPage: number;
  lastSyncedAt: string | null;
}

type FilterType = "all" | "unreplied" | "replied";
type RatingFilter = null | 1 | 2 | 3 | 4 | 5;

export function GoogleReviewsPage({
  isGoogleConnected,
  locationName,
}: {
  isGoogleConnected: boolean;
  locationName: string | null;
}) {
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI reply state
  const [generatingForId, setGeneratingForId] = useState<string | null>(null);
  const [generatedReply, setGeneratedReply] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [editedReply, setEditedReply] = useState<string>("");
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  const fetchReviews = useCallback(
    async (sync = false) => {
      if (sync) setSyncing(true);
      else setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (sync) params.set("sync", "true");
        params.set("filter", filter);
        if (ratingFilter) params.set("rating", String(ratingFilter));
        params.set("page", String(page));

        const res = await fetch(`/api/google/reviews?${params.toString()}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message ?? "Nie udało się pobrać opinii.");
        }

        const data: ReviewsResponse = await res.json();
        setReviews(data.reviews);
        setTotal(data.total);
        setPerPage(data.perPage);
        if (data.lastSyncedAt) setLastSyncedAt(data.lastSyncedAt);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd."
        );
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    [filter, ratingFilter, page]
  );

  useEffect(() => {
    if (isGoogleConnected) {
      fetchReviews();
    } else {
      setLoading(false);
    }
  }, [isGoogleConnected, fetchReviews]);

  function handleSync() {
    fetchReviews(true);
  }

  function handleFilterChange(newFilter: FilterType) {
    setFilter(newFilter);
    setPage(1);
  }

  function handleRatingFilter(rating: RatingFilter) {
    setRatingFilter(ratingFilter === rating ? null : rating);
    setPage(1);
  }

  // AI Generation for a review
  async function handleGenerateReply(review: GoogleReview) {
    setGeneratingForId(review.id);
    setGeneratedReply(null);
    setGenerationId(null);
    setEditedReply("");
    setPublishSuccess(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewText: review.comment ?? "",
          rating: review.star_rating,
          platform: "google",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Nie udało się wygenerować odpowiedzi.");
      }

      const data = await res.json();
      setGeneratedReply(data.reply);
      setEditedReply(data.reply);
      setGenerationId(data.generationId ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Błąd generowania odpowiedzi."
      );
      setGeneratingForId(null);
    }
  }

  async function handlePublishReply(reviewId: string) {
    if (!editedReply.trim()) return;

    setPublishing(true);
    setError(null);

    try {
      const res = await fetch("/api/google/reviews/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          comment: editedReply.trim(),
          generationId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.message ?? "Nie udało się opublikować odpowiedzi."
        );
      }

      // Update local state
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                reply_text: editedReply.trim(),
                reply_updated_at: new Date().toISOString(),
                reply_source: "replyai",
              }
            : r
        )
      );

      setPublishSuccess(reviewId);
      setGeneratingForId(null);
      setGeneratedReply(null);
      setEditedReply("");
      setGenerationId(null);

      setTimeout(() => setPublishSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się opublikować odpowiedzi."
      );
    } finally {
      setPublishing(false);
    }
  }

  function cancelGeneration() {
    setGeneratingForId(null);
    setGeneratedReply(null);
    setEditedReply("");
    setGenerationId(null);
  }

  const totalPages = Math.ceil(total / perPage);

  // Not connected state
  if (!isGoogleConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Opinie Google</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Przeglądaj i odpowiadaj na opinie z Google Maps.
          </p>
        </div>
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center">
          <Link2Off className="mx-auto h-12 w-12 text-zinc-300" />
          <h3 className="mt-4 text-lg font-medium text-zinc-900">
            Połącz konto Google
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            Aby przeglądać opinie, musisz najpierw połączyć swoje konto Google
            Business Profile i wybrać lokalizację.
          </p>
          <Link
            href="/account?tab=google"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Przejdź do ustawień Google
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Opinie Google</h1>
          {locationName && (
            <p className="mt-1 flex items-center gap-1 text-sm text-zinc-500">
              <MapPin className="h-3.5 w-3.5" />
              {locationName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastSyncedAt && (
            <span className="text-xs text-zinc-400">
              Ostatnia sync:{" "}
              {new Date(lastSyncedAt).toLocaleString("pl-PL", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            <RefreshCw
              className={cn("h-4 w-4", syncing && "animate-spin")}
            />
            {syncing ? "Synchronizuję..." : "Synchronizuj"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-sm text-zinc-500">
          <Filter className="h-4 w-4" />
          Status:
        </div>
        <div className="flex gap-1">
          {(
            [
              { key: "all", label: "Wszystkie" },
              { key: "unreplied", label: "Bez odpowiedzi" },
              { key: "replied", label: "Z odpowiedzią" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-blue-100 text-blue-700"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mx-2 h-4 w-px bg-zinc-200" />

        <div className="flex items-center gap-1 text-sm text-zinc-500">
          <Star className="h-4 w-4" />
          Ocena:
        </div>
        <div className="flex gap-1">
          {([1, 2, 3, 4, 5] as const).map((r) => (
            <button
              key={r}
              onClick={() => handleRatingFilter(r)}
              className={cn(
                "flex items-center gap-0.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                ratingFilter === r
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {r}
              <Star className="h-3 w-3 fill-current" />
            </button>
          ))}
        </div>

        {(filter !== "all" || ratingFilter) && (
          <button
            onClick={() => {
              setFilter("all");
              setRatingFilter(null);
              setPage(1);
            }}
            className="ml-1 text-xs text-zinc-400 hover:text-zinc-600"
          >
            Wyczyść filtry
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="text-sm text-zinc-500">
        {total > 0 ? (
          <>
            Znaleziono <span className="font-medium text-zinc-700">{total}</span>{" "}
            {total === 1 ? "opinię" : total < 5 ? "opinie" : "opinii"}
          </>
        ) : loading ? null : (
          "Brak opinii pasujących do filtrów."
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      )}

      {/* Empty state */}
      {!loading && reviews.length === 0 && total === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-zinc-300" />
          <h3 className="mt-4 text-lg font-medium text-zinc-900">
            Brak opinii
          </h3>
          <p className="mt-2 text-sm text-zinc-500">
            Kliknij &ldquo;Synchronizuj&rdquo; aby pobrać opinie z Google.
          </p>
        </div>
      )}

      {/* Reviews list */}
      {!loading && reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isGenerating={generatingForId === review.id && !generatedReply}
              generatedReply={
                generatingForId === review.id ? generatedReply : null
              }
              editedReply={generatingForId === review.id ? editedReply : ""}
              onEditReply={setEditedReply}
              onGenerate={() => handleGenerateReply(review)}
              onPublish={() => handlePublishReply(review.id)}
              onCancel={cancelGeneration}
              publishing={publishing && generatingForId === review.id}
              publishSuccess={publishSuccess === review.id}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
          <span className="text-sm text-zinc-500">
            Strona {page} z {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Poprzednia
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
            >
              Następna
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ReviewCard — pojedyncza opinia
// ============================================================

function ReviewCard({
  review,
  isGenerating,
  generatedReply,
  editedReply,
  onEditReply,
  onGenerate,
  onPublish,
  onCancel,
  publishing,
  publishSuccess,
}: {
  review: GoogleReview;
  isGenerating: boolean;
  generatedReply: string | null;
  editedReply: string;
  onEditReply: (text: string) => void;
  onGenerate: () => void;
  onPublish: () => void;
  onCancel: () => void;
  publishing: boolean;
  publishSuccess: boolean;
}) {
  const hasReply = !!review.reply_text;
  const isReplyAI = review.reply_source === "replyai";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-zinc-100 px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-zinc-600">
            {review.reviewer_name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div>
            <span className="text-sm font-medium text-zinc-900">
              {review.reviewer_name ?? "Anonimowy"}
            </span>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3.5 w-3.5",
                      i < review.star_rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-zinc-200"
                    )}
                  />
                ))}
              </span>
              <span className="text-xs text-zinc-400">
                {new Date(review.review_created_at).toLocaleDateString(
                  "pl-PL",
                  { day: "numeric", month: "long", year: "numeric" }
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Status badge */}
        {hasReply ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              isReplyAI
                ? "bg-blue-50 text-blue-600"
                : "bg-green-50 text-green-600"
            )}
          >
            <CheckCircle2 className="h-3 w-3" />
            {isReplyAI ? "Odpowiedź AI" : "Odpowiedź"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
            Brak odpowiedzi
          </span>
        )}
      </div>

      {/* Review text */}
      <div className="px-4 py-3">
        {review.comment ? (
          <p className="text-sm leading-relaxed text-zinc-700">
            {review.comment}
          </p>
        ) : (
          <p className="text-sm italic text-zinc-400">
            (Opinia bez komentarza — tylko ocena)
          </p>
        )}
      </div>

      {/* Existing reply */}
      {hasReply && !generatedReply && (
        <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Odpowiedź właściciela
            </p>
            <CopyButton text={review.reply_text!} />
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
            {review.reply_text}
          </p>
          {review.reply_updated_at && (
            <p className="mt-1 text-xs text-zinc-400">
              {new Date(review.reply_updated_at).toLocaleDateString("pl-PL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      )}

      {/* Generated reply editor */}
      {generatedReply && (
        <div className="border-t border-blue-100 bg-blue-50/30 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1 text-xs font-medium text-blue-600">
              <Sparkles className="h-3.5 w-3.5" />
              Wygenerowana odpowiedź — edytuj i opublikuj
            </p>
            <button
              onClick={onCancel}
              className="text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <textarea
            value={editedReply}
            onChange={(e) => onEditReply(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={onPublish}
              disabled={publishing || !editedReply.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {publishing ? "Publikuję..." : "Opublikuj w Google"}
            </button>
            <CopyButton text={editedReply} />
          </div>
        </div>
      )}

      {/* Publish success message */}
      {publishSuccess && (
        <div className="border-t border-green-100 bg-green-50 px-4 py-2">
          <p className="flex items-center gap-1 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Odpowiedź opublikowana w Google!
          </p>
        </div>
      )}

      {/* Action bar */}
      {!generatedReply && review.comment && (
        <div className="border-t border-zinc-100 px-4 py-2">
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGenerating
              ? "Generuję..."
              : hasReply
                ? "Wygeneruj nową odpowiedź"
                : "Wygeneruj odpowiedź AI"}
          </button>
        </div>
      )}
    </div>
  );
}
