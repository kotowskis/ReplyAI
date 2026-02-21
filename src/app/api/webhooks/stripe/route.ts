import { stripe, PLANS } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendProConfirmationEmail, sendPaymentFailedEmail } from "@/lib/emails";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
]);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  if (!relevantEvents.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode !== "subscription" || !session.subscription) break;

        const companyId = session.metadata?.company_id;
        if (!companyId) {
          console.error("checkout.session.completed: missing company_id in metadata");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const firstItem = subscription.items.data[0];
        const priceId = firstItem?.price.id;

        // Determine plan from price ID
        const plan =
          priceId === process.env.STRIPE_PRO_PRICE_ID
            ? "pro"
            : priceId === process.env.STRIPE_AGENCY_PRICE_ID
              ? "agency"
              : "pro";

        const periodEnd = firstItem?.current_period_end;

        const { error } = await supabase
          .from("subscriptions")
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            plan,
            status: "active",
            generations_limit: -1,
            current_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("company_id", companyId);

        if (error) {
          console.error("checkout.session.completed: DB update failed", error);
        }

        // Send Pro/Agency confirmation email
        try {
          const { data: company } = await supabase
            .from("companies")
            .select("owner_id")
            .eq("id", companyId)
            .single();

          if (company) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, full_name")
              .eq("id", company.owner_id)
              .single();

            if (profile?.email) {
              const planName = plan === "agency" ? PLANS.agency.name : PLANS.pro.name;
              sendProConfirmationEmail(
                profile.email,
                profile.full_name ?? "",
                planName,
              ).catch((err) =>
                console.error("Pro confirmation email failed:", err),
              );
            }
          }
        } catch (emailErr) {
          console.error("Pro confirmation email lookup failed:", emailErr);
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const firstItem = subscription.items.data[0];
        const priceId = firstItem?.price.id;

        const plan =
          priceId === process.env.STRIPE_PRO_PRICE_ID
            ? "pro"
            : priceId === process.env.STRIPE_AGENCY_PRICE_ID
              ? "agency"
              : "pro";

        const status = subscription.status === "active" ? "active" : subscription.status;
        const periodEnd = firstItem?.current_period_end;

        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan,
            status,
            generations_limit: -1,
            current_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("customer.subscription.updated: DB update failed", error);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan: "free",
            status: "canceled",
            stripe_subscription_id: null,
            generations_limit: 5,
            current_period_end: null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("customer.subscription.deleted: DB update failed", error);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        // Find subscription via line items or customer
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (customerId) {
          const { error } = await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId);

          if (error) {
            console.error("invoice.payment_failed: DB update failed", error);
          }

          // Send payment failed alert email
          try {
            const { data: sub } = await supabase
              .from("subscriptions")
              .select("company_id")
              .eq("stripe_customer_id", customerId)
              .single();

            if (sub) {
              const { data: company } = await supabase
                .from("companies")
                .select("owner_id")
                .eq("id", sub.company_id)
                .single();

              if (company) {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("email, full_name")
                  .eq("id", company.owner_id)
                  .single();

                if (profile?.email) {
                  sendPaymentFailedEmail(
                    profile.email,
                    profile.full_name ?? "",
                  ).catch((err) =>
                    console.error("Payment failed email error:", err),
                  );
                }
              }
            }
          } catch (emailErr) {
            console.error("Payment failed email lookup error:", emailErr);
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
