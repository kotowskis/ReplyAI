import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import DeleteAccountSection from "@/components/DeleteAccountSection";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Konto</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Zarządzaj swoim kontem użytkownika.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-semibold text-zinc-900">
          Dane konta
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="block text-sm font-medium text-zinc-500">
              Imię i nazwisko
            </span>
            <span className="mt-1 block text-sm text-zinc-900">
              {profile?.full_name || "—"}
            </span>
          </div>
          <div>
            <span className="block text-sm font-medium text-zinc-500">
              Email
            </span>
            <span className="mt-1 block text-sm text-zinc-900">
              {profile?.email || user.email}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 space-y-5">
        <h2 className="text-base font-semibold text-zinc-900">
          Zmiana hasła
        </h2>
        <ChangePasswordForm />
      </div>

      <DeleteAccountSection />
    </div>
  );
}
