import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, industry, tone, language, description, owner_name")
    .eq("owner_id", user.id)
    .limit(1);

  if (!companies || companies.length === 0) {
    redirect("/onboarding");
  }

  const company = companies[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          Ustawienia firmy
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Zarządzaj profilem firmy i preferencjami generowania odpowiedzi.
        </p>
      </div>

      <SettingsForm company={company} />
    </div>
  );
}
