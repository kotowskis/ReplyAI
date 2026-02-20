import { createClient } from "@/lib/supabase/server";
import { stripe, PLANS } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceId } = await request.json();

    // Validate that priceId matches one of our plans
    const validPriceIds = [
      PLANS.pro.stripePriceId,
      PLANS.agency.stripePriceId,
    ];
    if (!priceId || !validPriceIds.includes(priceId)) {
      return NextResponse.json(
        { error: "Nieprawidłowy plan" },
        { status: 400 }
      );
    }

    // Get user's company
    const { data: companies } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1);

    if (!companies || companies.length === 0) {
      return NextResponse.json(
        { error: "Nie znaleziono firmy" },
        { status: 400 }
      );
    }

    const companyId = companies[0].id;

    // Check if user already has a Stripe customer ID
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("company_id", companyId)
      .single();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/billing?success=true`,
      cancel_url: `${appUrl}/billing?canceled=true`,
      metadata: { company_id: companyId },
      subscription_data: {
        metadata: { company_id: companyId },
      },
    };

    // Reuse existing Stripe customer if available
    if (subscription?.stripe_customer_id) {
      sessionParams.customer = subscription.stripe_customer_id;
    } else {
      sessionParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Nie udało się utworzyć sesji płatności" },
      { status: 500 }
    );
  }
}
