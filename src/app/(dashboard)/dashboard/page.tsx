import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GeneratorPage from "@/components/GeneratorPage";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if onboarding is completed
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .eq("owner_id", user.id)
    .limit(1);

  if (!companies || companies.length === 0) {
    redirect("/onboarding");
  }

  const company = companies[0];

  // Get subscription info
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, generations_used, generations_limit")
    .eq("company_id", company.id)
    .single();

  const used = subscription?.generations_used ?? 0;
  const limit = subscription?.generations_limit ?? 5;
  const plan = subscription?.plan ?? "free";

  return (
    <GeneratorPage
      initialUsed={used}
      initialLimit={limit}
      plan={plan}
    />
  );
}
