import Link from "next/link";
import { MessageSquareReply, Zap, Shield, Star } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="text-xl font-bold text-zinc-900">ReplyAI</span>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Cennik
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Zaloguj się
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          Odpowiadaj na opinie klientów
          <br />
          <span className="text-blue-600">w kilka sekund</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-600">
          ReplyAI generuje profesjonalne, spersonalizowane odpowiedzi na opinie
          z Google i Facebooka. Oszczędź czas i buduj reputację firmy.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            Zacznij za darmo
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Zobacz cennik
          </Link>
        </div>
        <p className="mt-4 text-xs text-zinc-400">
          5 darmowych odpowiedzi miesięcznie. Bez karty kredytowej.
        </p>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-100 bg-zinc-50 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center text-2xl font-bold text-zinc-900">
            Jak to działa?
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <MessageSquareReply className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 font-semibold text-zinc-900">
                1. Wklej opinię
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Skopiuj treść opinii z Google Maps lub Facebooka i wklej do
                ReplyAI.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 font-semibold text-zinc-900">
                2. Generuj odpowiedź
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                AI tworzy spersonalizowaną odpowiedź w tonie Twojej firmy w
                kilka sekund.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 font-semibold text-zinc-900">
                3. Kopiuj i publikuj
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Przejrzyj odpowiedź, opcjonalnie edytuj i wklej bezpośrednio w
                Google.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Shield key={i} className="h-5 w-5 text-blue-600" />
            ))}
          </div>
          <p className="mt-4 text-lg font-medium text-zinc-900">
            Bezpieczne i zgodne z RODO
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Dane przechowywane w UE. Nie zapisujemy danych klientów Twojej
            firmy.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-4 px-4 text-sm text-zinc-400">
          <span>&copy; 2026 ReplyAI. Wszystkie prawa zastrzeżone.</span>
          <span className="text-zinc-200">|</span>
          <Link
            href="/regulamin"
            className="hover:text-zinc-600 transition-colors"
          >
            Regulamin
          </Link>
          <span className="text-zinc-200">|</span>
          <Link
            href="/polityka-prywatnosci"
            className="hover:text-zinc-600 transition-colors"
          >
            Polityka prywatności
          </Link>
        </div>
      </footer>
    </div>
  );
}
