import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "0 zł",
    period: "/miesiąc",
    description: "Na start — przetestuj ReplyAI",
    features: [
      "5 odpowiedzi miesięcznie",
      "1 profil firmy",
      "Google + Facebook",
      "Kopiowanie do schowka",
    ],
    cta: "Zacznij za darmo",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "79 zł",
    period: "/miesiąc",
    description: "Dla aktywnych firm",
    features: [
      "Nieograniczone odpowiedzi",
      "1 profil firmy",
      "Google + Facebook + Booking",
      "Kopiowanie do schowka",
      "Historia odpowiedzi",
      "Priorytetowe wsparcie",
    ],
    cta: "Wybierz Pro",
    highlighted: true,
  },
  {
    name: "Agencja",
    price: "199 zł",
    period: "/miesiąc",
    description: "Dla sieci i agencji marketingowych",
    features: [
      "Nieograniczone odpowiedzi",
      "Do 10 profili firm",
      "Wszystkie platformy",
      "Kopiowanie do schowka",
      "Historia odpowiedzi",
      "Priorytetowe wsparcie",
    ],
    cta: "Wybierz Agencję",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-zinc-900">
            ReplyAI
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Zaloguj się
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-zinc-900">
            Prosty, przejrzysty cennik
          </h1>
          <p className="mt-3 text-zinc-500">
            Zacznij za darmo. Przejdź na Pro gdy potrzebujesz więcej.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 ${
                plan.highlighted
                  ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                  : "border-zinc-200 bg-white"
              }`}
            >
              {plan.highlighted && (
                <span className="mb-4 inline-block rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                  Najpopularniejszy
                </span>
              )}
              <h3 className="text-lg font-bold text-zinc-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">{plan.description}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-zinc-900">
                  {plan.price}
                </span>
                <span className="text-sm text-zinc-500">{plan.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-zinc-600"
                  >
                    <Check className="h-4 w-4 flex-shrink-0 text-blue-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className={`mt-6 block rounded-lg px-4 py-2.5 text-center text-sm font-medium ${
                  plan.highlighted
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
