"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Trash2 } from "lucide-react";

export default function DeleteAccountSection() {
  const router = useRouter();
  const supabase = createClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Wystąpił błąd");
      }

      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-red-200 bg-white p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-red-600">
          Usuwanie konta
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Po usunięciu konta wszystkie Twoje dane (firma, historia odpowiedzi)
          zostaną trwale usunięte. Tej operacji nie można cofnąć.
        </p>
      </div>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Usuń konto
        </button>
      ) : (
        <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            Wpisz <span className="font-bold">USUŃ</span> aby potwierdzić
            usunięcie konta:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="USUŃ"
            className="block w-full rounded-lg border border-red-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 sm:w-48"
          />

          {error && (
            <div className="rounded-lg border border-red-200 bg-white px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={confirmText !== "USUŃ" || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Usuwanie...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Potwierdź usunięcie
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowConfirm(false);
                setConfirmText("");
                setError("");
              }}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
