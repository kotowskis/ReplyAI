import { CreditCard } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Subskrypcja</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Zarządzaj swoim planem i płatnościami.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center">
        <CreditCard className="mx-auto h-12 w-12 text-zinc-300" />
        <h3 className="mt-4 text-lg font-medium text-zinc-900">
          Płatności Stripe
        </h3>
        <p className="mt-2 text-sm text-zinc-500">
          Integracja Stripe zostanie dodana w Tygodniu 5-6.
        </p>
      </div>
    </div>
  );
}
