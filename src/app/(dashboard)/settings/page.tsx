import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          Ustawienia firmy
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Zarządzaj profilem firmy i preferencjami.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center">
        <Settings className="mx-auto h-12 w-12 text-zinc-300" />
        <h3 className="mt-4 text-lg font-medium text-zinc-900">
          Edycja profilu firmy
        </h3>
        <p className="mt-2 text-sm text-zinc-500">
          Pełna edycja profilu firmy zostanie dodana w Tygodniu 7.
        </p>
      </div>
    </div>
  );
}
