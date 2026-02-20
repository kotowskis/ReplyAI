"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INDUSTRIES = [
  { value: "restaurant", label: "Restauracja / Gastronomia" },
  { value: "hotel", label: "Hotel / Noclegi" },
  { value: "salon", label: "Salon urody / Fryzjer" },
  { value: "medical", label: "Gabinet lekarski / Stomatolog" },
  { value: "automotive", label: "Warsztat / Motoryzacja" },
  { value: "retail", label: "Sklep / Handel" },
  { value: "services", label: "Usługi lokalne" },
  { value: "other", label: "Inna branża" },
];

const TONES = [
  {
    value: "formal",
    label: "Formalny",
    description: "Profesjonalny, oficjalny ton",
  },
  {
    value: "friendly",
    label: "Przyjazny",
    description: "Ciepły i otwarty ton",
  },
  {
    value: "casual",
    label: "Casualowy",
    description: "Bezpośredni, luźny ton",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [tone, setTone] = useState("friendly");
  const [ownerName, setOwnerName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("pl");

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Nie jesteś zalogowany");

      const { error: insertError } = await supabase.from("companies").insert({
        owner_id: user.id,
        name,
        industry,
        tone,
        owner_name: ownerName || null,
        description: description || null,
        language,
      });

      if (insertError) throw insertError;

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-sm border border-zinc-200">
        {/* Progress indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-colors ${
                s <= step ? "bg-blue-600" : "bg-zinc-200"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Company basics */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">
                Krok 1/3 — Opowiedz nam o firmie
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Te informacje pomogą AI generować lepsze odpowiedzi.
              </p>
            </div>

            <div>
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-zinc-700"
              >
                Nazwa firmy *
              </label>
              <input
                id="companyName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="np. Pizzeria Da Vinci"
                required
              />
            </div>

            <div>
              <label
                htmlFor="industry"
                className="block text-sm font-medium text-zinc-700"
              >
                Branża *
              </label>
              <select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Wybierz branżę...</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind.value} value={ind.value}>
                    {ind.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!name || !industry}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Dalej
            </button>
          </div>
        )}

        {/* Step 2: Tone and language */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">
                Krok 2/3 — Ton komunikacji
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Jak chcesz, żeby brzmiały Twoje odpowiedzi?
              </p>
            </div>

            <div className="space-y-2">
              {TONES.map((t) => (
                <label
                  key={t.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    tone === t.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="tone"
                    value={t.value}
                    checked={tone === t.value}
                    onChange={(e) => setTone(e.target.value)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-zinc-900">
                      {t.label}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {t.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div>
              <label
                htmlFor="language"
                className="block text-sm font-medium text-zinc-700"
              >
                Język odpowiedzi
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="pl">Polski</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Wstecz
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Dalej
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Additional details */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">
                Krok 3/3 — Szczegóły (opcjonalne)
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Dodatkowe informacje pomagają spersonalizować odpowiedzi.
              </p>
            </div>

            <div>
              <label
                htmlFor="ownerName"
                className="block text-sm font-medium text-zinc-700"
              >
                Imię właściciela (do podpisu)
              </label>
              <input
                id="ownerName"
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="np. Marcin"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-zinc-700"
              >
                Dodatkowy opis firmy
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="np. Rodzinna pizzeria z 15-letnią tradycją, specjalizujemy się w pizzy neapolitańskiej"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Wstecz
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Tworzenie..." : "Zakończ konfigurację"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
