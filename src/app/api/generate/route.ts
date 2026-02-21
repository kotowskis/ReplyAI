import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/anthropic";
import { SYSTEM_PROMPT, buildPrompt } from "@/lib/prompts";
import { sendLimitReachedEmail } from "@/lib/emails";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

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
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, name, industry, tone, owner_name, description")
      .eq("owner_id", user.id)
      .limit(1);

    if (companiesError) {
      console.error("Supabase companies query error:", companiesError);
      return NextResponse.json(
        { error: "db_error", message: "Błąd połączenia z bazą danych. Spróbuj ponownie." },
        { status: 503 }
      );
    }

    if (!companies || companies.length === 0) {
      return NextResponse.json(
        { error: "Nie znaleziono firmy. Przejdź onboarding." },
        { status: 400 }
      );
    }

    const company = companies[0];

    // 4. Check subscription limit
    let { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("plan, generations_used, generations_limit")
      .eq("company_id", company.id)
      .single();

    if (subError && subError.code !== "PGRST116") {
      console.error("Supabase subscription query error:", subError);
      return NextResponse.json(
        { error: "db_error", message: "Błąd połączenia z bazą danych. Spróbuj ponownie." },
        { status: 503 }
      );
    }

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
      // Send limit-reached email only on first hit (used == limit exactly)
      if (subscription.generations_used === subscription.generations_limit) {
        const fullName =
          user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "";
        sendLimitReachedEmail(user.email!, fullName).catch((err) =>
          console.error("Limit-reached email failed:", err),
        );
      }

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

    let message;
    try {
      message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });
    } catch (aiError) {
      console.error("Claude API error:", aiError);

      if (aiError instanceof Anthropic.APIConnectionError) {
        return NextResponse.json(
          { error: "ai_unavailable", message: "Nie udało się połączyć z API. Spróbuj za chwilę." },
          { status: 502 }
        );
      }
      if (aiError instanceof Anthropic.APIConnectionTimeoutError) {
        return NextResponse.json(
          { error: "ai_timeout", message: "Generowanie trwa zbyt długo. Spróbuj ponownie." },
          { status: 504 }
        );
      }
      if (aiError instanceof Anthropic.RateLimitError) {
        return NextResponse.json(
          { error: "ai_overloaded", message: "Serwer AI jest przeciążony. Spróbuj za minutę." },
          { status: 429 }
        );
      }
      if (aiError instanceof Anthropic.APIError && aiError.status >= 500) {
        return NextResponse.json(
          { error: "ai_unavailable", message: "Serwer AI jest chwilowo niedostępny. Spróbuj za chwilę." },
          { status: 502 }
        );
      }

      return NextResponse.json(
        { error: "ai_error", message: "Błąd podczas generowania odpowiedzi. Spróbuj ponownie." },
        { status: 500 }
      );
    }

    const reply =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    if (!reply) {
      return NextResponse.json(
        { error: "ai_error", message: "AI nie wygenerowało odpowiedzi. Spróbuj ponownie." },
        { status: 500 }
      );
    }

    // 6. Save generation to database
    const { data: generation, error: insertError } = await supabase
      .from("generations")
      .insert({
        company_id: company.id,
        review_text: reviewText.trim(),
        review_rating: rating,
        review_platform: platform,
        reply_text: reply,
        tokens_used: message.usage.input_tokens + message.usage.output_tokens,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to save generation:", insertError);
      // Don't fail the request — the user got their reply, saving is secondary
    }

    // 7. Increment usage counter
    const { error: rpcError } = await supabase.rpc("increment_generations", {
      p_company_id: company.id,
    });

    if (rpcError) {
      console.error("Failed to increment generations counter:", rpcError);
    }

    return NextResponse.json({
      reply,
      generationId: generation?.id ?? null,
      usage: {
        used: subscription.generations_used + 1,
        limit: subscription.generations_limit,
      },
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie." },
      { status: 500 }
    );
  }
}
