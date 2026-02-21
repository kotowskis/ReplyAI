import { createClient } from "@/lib/supabase/server";
import {
  getValidAccessToken,
  replyToReview,
  GoogleTokenExpiredError,
} from "@/lib/google/client";
import { NextResponse } from "next/server";

/**
 * POST /api/google/reviews/reply
 * Publikuje odpowiedź na opinię Google i aktualizuje cache.
 *
 * Body: { reviewId: string, comment: string, generationId?: string }
 * - reviewId: UUID rekordu z google_reviews
 * - comment: treść odpowiedzi
 * - generationId: opcjonalne powiązanie z generacją AI
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { reviewId, comment, generationId } = body as {
      reviewId: string;
      comment: string;
      generationId?: string;
    };

    if (!reviewId || !comment?.trim()) {
      return NextResponse.json(
        { error: "reviewId i comment są wymagane" },
        { status: 400 }
      );
    }

    // Get company with Google tokens
    const { data: companies } = await supabase
      .from("companies")
      .select(
        "id, google_oauth_tokens, google_account_id, google_location_id"
      )
      .eq("owner_id", user.id)
      .limit(1);

    if (!companies || companies.length === 0) {
      return NextResponse.json(
        { error: "Nie znaleziono firmy" },
        { status: 400 }
      );
    }

    const company = companies[0];

    if (!company.google_oauth_tokens) {
      return NextResponse.json(
        {
          error: "google_not_connected",
          message: "Google nie jest połączony",
        },
        { status: 400 }
      );
    }

    if (!company.google_account_id || !company.google_location_id) {
      return NextResponse.json(
        {
          error: "no_location",
          message: "Nie wybrano lokalizacji Google.",
        },
        { status: 400 }
      );
    }

    // Get the review from cache to obtain google_review_id
    const { data: review } = await supabase
      .from("google_reviews")
      .select("id, google_review_id")
      .eq("id", reviewId)
      .eq("company_id", company.id)
      .single();

    if (!review) {
      return NextResponse.json(
        { error: "Nie znaleziono opinii" },
        { status: 404 }
      );
    }

    // Get valid access token
    const { accessToken, updatedEncryptedTokens } =
      await getValidAccessToken(company.google_oauth_tokens);

    if (updatedEncryptedTokens) {
      await supabase
        .from("companies")
        .update({ google_oauth_tokens: updatedEncryptedTokens })
        .eq("id", company.id);
    }

    // Build the full review resource name for Google API
    const reviewName = `${company.google_account_id}/${company.google_location_id}/reviews/${review.google_review_id}`;

    // Publish reply to Google
    await replyToReview(accessToken, reviewName, comment.trim());

    // Update local cache
    const { error: updateError } = await supabase
      .from("google_reviews")
      .update({
        reply_text: comment.trim(),
        reply_updated_at: new Date().toISOString(),
        reply_source: "replyai",
        generation_id: generationId ?? null,
      })
      .eq("id", reviewId);

    if (updateError) {
      console.error("Failed to update review cache:", updateError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof GoogleTokenExpiredError) {
      return NextResponse.json(
        {
          error: "google_token_expired",
          message: "Sesja Google wygasła. Połącz konto ponownie.",
        },
        { status: 401 }
      );
    }

    console.error("Google review reply error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        message: "Nie udało się opublikować odpowiedzi.",
      },
      { status: 500 }
    );
  }
}
