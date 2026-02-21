"use client";

import { useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";

interface Props {
  userId: string;
  currentRole: string;
  isSelf: boolean;
}

export function RoleSwitcher({ userId, currentRole, isSelf }: Props) {
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = role === "admin";

  async function handleToggle() {
    const newRole = isAdmin ? "user" : "admin";

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/change-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Błąd");
      }
      setRole(newRole);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          isAdmin ? "bg-red-50 text-red-700" : "bg-zinc-100 text-zinc-600"
        }`}
      >
        {isAdmin ? "Admin" : "Użytkownik"}
      </span>

      <button
        onClick={handleToggle}
        disabled={loading || isSelf}
        title={isSelf ? "Nie możesz zmienić własnej roli" : undefined}
        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isAdmin
            ? "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            : "border-red-200 text-red-600 hover:bg-red-50"
        }`}
      >
        {loading ? (
          "Zapisywanie..."
        ) : isAdmin ? (
          <>
            <ShieldOff className="h-3.5 w-3.5" />
            Odbierz admina
          </>
        ) : (
          <>
            <ShieldCheck className="h-3.5 w-3.5" />
            Nadaj admina
          </>
        )}
      </button>

      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  );
}
