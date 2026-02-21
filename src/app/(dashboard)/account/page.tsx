import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/stripe";
import AccountTabs from "@/components/AccountTabs";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch profile, company, and subscription data in parallel
  const [profileResult, companiesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single(),
    supabase
      .from("companies")
      .select("id, name, industry, tone, language, description, owner_name")
      .eq("owner_id", user.id)
      .limit(1),
  ]);

  const profile = profileResult.data;
  const companies = companiesResult.data;

  if (!companies || companies.length === 0) {
    redirect("/onboarding");
  }

  const company = companies[0];

  // Fetch subscription
  let { data: subscription } = await supabase
    .from("subscriptions")
    .select(
      "plan, status, generations_used, generations_limit, stripe_customer_id, current_period_end"
    )
    .eq("company_id", company.id)
    .single();

  if (!subscription) {
    const { data: newSub } = await supabase
      .from("subscriptions")
      .insert({
        company_id: company.id,
        plan: "free",
        status: "active",
        generations_limit: 5,
        generations_used: 0,
      })
      .select(
        "plan, status, generations_used, generations_limit, stripe_customer_id, current_period_end"
      )
      .single();

    subscription = newSub;
  }

  const plan = (subscription?.plan as keyof typeof PLANS) ?? "free";

  return (
    <AccountTabs
      profile={profile}
      userEmail={user.email ?? ""}
      company={company}
      billing={{
        currentPlan: plan,
        status: subscription?.status ?? "active",
        generationsUsed: subscription?.generations_used ?? 0,
        generationsLimit: subscription?.generations_limit ?? 5,
        hasStripeSubscription: !!subscription?.stripe_customer_id,
        currentPeriodEnd: subscription?.current_period_end ?? null,
        proPriceId: PLANS.pro.stripePriceId,
        agencyPriceId: PLANS.agency.stripePriceId,
      }}
    />
  );
}
