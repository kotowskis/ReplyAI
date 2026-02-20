"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Save, CheckCircle } from "lucide-react";

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
  { value: "formal", label: "Formalny", description: "Profesjonalny, oficjalny ton" },
  { value: "friendly", label: "Przyjazny", description: "Ciepły i otwarty ton" },
  { value: "casual", label: "Casualowy", description: "Bezpośredni, luźny ton" },
];

interface Company {
  id: string;
  name: string;
  industry: string;
  tone: string;
  language: string;
  description: string | null;
  owner_name: string | null;
}

export default function SettingsForm({ company }: { company: Company }) {
  const supabase = createClient();
  const [name, setName] = useState(company.name);
  const [industry, setIndustry] = useState(company.industry);
  const [tone, setTone] = useState(company.tone);
  const [language, setLanguage] = useState(company.language);
  const [ownerName, setOwnerName] = useState(company.owner_name ?? "");
  const [description, setDescription] = useState(company.description ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const { error: updateError } = await supabase
        .from("companies")
        .update({
          name,
          industry,
          tone,
          language,
          owner_name: ownerName || null,
          description: description || null,
        })
        .eq("id", company.id);

      if (updateError) throw new Error(updateError.message);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company name */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 space-y-5">
        <h2 className="text-base font-semibold text-zinc-900">Dane firmy</h2>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
            Nazwa firmy *
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-zinc-700">
            Branża *
          </label>
          <select
            id="industry"
            required
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Wybierz branżę</option>
            {INDUSTRIES.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ownerName" className="block text-sm font-medium text-zinc-700">
            Imię właściciela (do podpisu odpowiedzi)
          </label>
          <input
            id="ownerName"
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="np. Marcin"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-700">
            Opis firmy (dodatkowy kontekst dla AI)
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="np. Rodzinna pizzeria działająca od 15 lat w centrum Krakowa..."
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Tone and language */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 space-y-5">
        <h2 className="text-base font-semibold text-zinc-900">
          Preferencje odpowiedzi
        </h2>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Ton komunikacji *
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            {TONES.map((t) => (
              <label
                key={t.value}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  tone === t.value
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <input
                  type="radio"
                  name="tone"
                  value={t.value}
                  checked={tone === t.value}
                  onChange={(e) => setTone(e.target.value)}
                  className="sr-only"
                />
                <span className="block text-sm font-medium text-zinc-900">
                  {t.label}
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  {t.description}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="language" className="block text-sm font-medium text-zinc-700">
            Język odpowiedzi
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm sm:w-48"
          >
            <option value="pl">Polski</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" />
          Zmiany zostały zapisane.
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !name || !industry}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Zapisuję...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Zapisz zmiany
          </>
        )}
      </button>
    </form>
  );
}
