import { History } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          Historia odpowiedzi
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Przeglądaj wcześniej wygenerowane odpowiedzi.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center">
        <History className="mx-auto h-12 w-12 text-zinc-300" />
        <h3 className="mt-4 text-lg font-medium text-zinc-900">
          Brak odpowiedzi
        </h3>
        <p className="mt-2 text-sm text-zinc-500">
          Historia pojawi się po wygenerowaniu pierwszej odpowiedzi.
        </p>
      </div>
    </div>
  );
}
