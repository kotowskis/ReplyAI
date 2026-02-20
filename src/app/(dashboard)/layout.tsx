import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/DashboardNav";
import { getUserRole } from "@/lib/roles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has a company (onboarding completed)
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .eq("owner_id", user.id)
    .limit(1);

  const hasCompany = !!(companies && companies.length > 0);
  const company = hasCompany ? companies[0] : null;

  const role = await getUserRole(supabase, user.id);

  return (
    <div className="min-h-screen bg-zinc-50">
      <DashboardNav
        userEmail={user.email ?? ""}
        companyName={company?.name}
        hasCompany={hasCompany}
        role={role}
      />
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
