import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/stripe";
import { BillingClient } from "./BillingClient";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: companies } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1);

  if (!companies || companies.length === 0) redirect("/onboarding");

  const companyId = companies[0].id;

  let { data: subscription } = await supabase
    .from("subscriptions")
    .select(
      "plan, status, generations_used, generations_limit, stripe_customer_id, current_period_end"
    )
    .eq("company_id", companyId)
    .single();

  if (!subscription) {
    const { data: newSub } = await supabase
      .from("subscriptions")
      .insert({
        company_id: companyId,
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
  const hasStripeSubscription = !!subscription?.stripe_customer_id;

  return (
    <BillingClient
      currentPlan={plan}
      status={subscription?.status ?? "active"}
      generationsUsed={subscription?.generations_used ?? 0}
      generationsLimit={subscription?.generations_limit ?? 5}
      hasStripeSubscription={hasStripeSubscription}
      currentPeriodEnd={subscription?.current_period_end ?? null}
      proPriceId={PLANS.pro.stripePriceId}
      agencyPriceId={PLANS.agency.stripePriceId}
    />
  );
}
