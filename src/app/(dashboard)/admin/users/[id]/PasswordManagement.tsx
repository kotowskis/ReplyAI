"use client";

import { useState } from "react";
import { KeyRound, Send, Lock, Eye, EyeOff } from "lucide-react";

interface Props {
  userId: string;
  userEmail: string;
}

export function PasswordManagement({ userId, userEmail }: Props) {
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeDone, setChangeDone] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function handleResetPassword() {
    setError(null);
    setResetLoading(true);
    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Błąd");
      }
      setResetDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wystąpił błąd");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleChangePassword() {
    setError(null);
    if (password.length < 8) {
      setError("Hasło musi mieć min. 8 znaków");
      return;
    }
    setChangeLoading(true);
    try {
      const res = await fetch("/api/admin/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Błąd");
      }
      setChangeDone(true);
      setPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wystąpił błąd");
    } finally {
      setChangeLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-zinc-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Zarządzanie hasłem
        </h2>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Option 1: Send reset email */}
        <div className="rounded-lg border border-zinc-100 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Send className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-medium text-zinc-900">
              Reset przez email
            </h3>
          </div>
          <p className="mb-4 text-xs text-zinc-500">
            Użytkownik otrzyma email z linkiem do zmiany hasła.
          </p>
          {resetDone ? (
            <p className="text-sm font-medium text-green-600">
              Email wysłany na {userEmail}
            </p>
          ) : (
            <button
              onClick={handleResetPassword}
              disabled={resetLoading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {resetLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
            </button>
          )}
        </div>

        {/* Option 2: Manual password change */}
        <div className="rounded-lg border border-zinc-100 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-medium text-zinc-900">
              Ręczna zmiana hasła
            </h3>
          </div>
          <p className="mb-4 text-xs text-zinc-500">
            Ustaw nowe hasło bezpośrednio. Min. 8 znaków.
          </p>
          {changeDone ? (
            <div>
              <p className="mb-2 text-sm font-medium text-green-600">
                Hasło zostało zmienione
              </p>
              <button
                onClick={() => setChangeDone(false)}
                className="text-xs text-zinc-500 hover:text-zinc-700 underline"
              >
                Zmień ponownie
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nowe hasło"
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 pr-10 text-sm focus:border-zinc-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <button
                onClick={handleChangePassword}
                disabled={changeLoading || password.length < 8}
                className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {changeLoading ? "Zapisywanie..." : "Zmień hasło"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
