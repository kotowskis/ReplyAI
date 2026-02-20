import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/anthropic";
import { SYSTEM_PROMPT, buildPrompt } from "@/lib/prompts";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const { reviewText, rating, platform } = body as {
      reviewText: string;
      rating: number | null;
      platform: string;
    };

    if (!reviewText || reviewText.trim().length === 0) {
      return NextResponse.json(
        { error: "Treść opinii jest wymagana" },
        { status: 400 }
      );
    }

    // 3. Get user's company
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name, industry, tone, owner_name, description")
      .eq("owner_id", user.id)
      .limit(1);

    if (!companies || companies.length === 0) {
      return NextResponse.json(
        { error: "Nie znaleziono firmy. Przejdź onboarding." },
        { status: 400 }
      );
    }

    const company = companies[0];

    // 4. Check subscription limit
    let { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan, generations_used, generations_limit")
      .eq("company_id", company.id)
      .single();

    // Auto-create free subscription if missing (trigger may not have fired)
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
        .select("plan, generations_used, generations_limit")
        .single();

      subscription = newSub;

      if (!subscription) {
        return NextResponse.json(
          { error: "Nie udało się utworzyć subskrypcji" },
          { status: 500 }
        );
      }
    }

    const isUnlimited = subscription.generations_limit === -1;
    if (
      !isUnlimited &&
      subscription.generations_used >= subscription.generations_limit
    ) {
      return NextResponse.json(
        {
          error: "limit_reached",
          message: "Osiągnięto limit generacji. Przejdź na plan Pro.",
        },
        { status: 402 }
      );
    }

    // 5. Build prompt and call Claude API
    const userPrompt = buildPrompt({
      review: reviewText.trim(),
      rating,
      platform,
      company: {
        name: company.name,
        industry: company.industry,
        tone: company.tone,
        ownerName: company.owner_name,
        description: company.description,
      },
    });

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const reply =
      message.content[0].type === "text" ? message.content[0].text : "";

    // 6. Save generation to database
    await supabase.from("generations").insert({
      company_id: company.id,
      review_text: reviewText.trim(),
      review_rating: rating,
      review_platform: platform,
      reply_text: reply,
      tokens_used: message.usage.input_tokens + message.usage.output_tokens,
    });

    // 7. Increment usage counter
    await supabase.rpc("increment_generations", {
      p_company_id: company.id,
    });

    return NextResponse.json({
      reply,
      usage: {
        used: subscription.generations_used + 1,
        limit: subscription.generations_limit,
      },
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas generowania odpowiedzi" },
      { status: 500 }
    );
  }
}
