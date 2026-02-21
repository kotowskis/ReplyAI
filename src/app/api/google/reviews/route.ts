import { createClient } from "@/lib/supabase/server";
import {
  getValidAccessToken,
  listReviews,
  starRatingToNumber,
  GoogleTokenExpiredError,
  type GBPReview,
} from "@/lib/google/client";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/google/reviews?filter=all|unreplied|replied&rating=1-5&page=1
 * Synchronizuje opinie z Google i zwraca listę z bazy (cache).
 * Query param `sync=true` wymusza pobranie z Google API.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
          message:
            "Nie wybrano lokalizacji Google. Przejdź do Konto → Google.",
        },
        { status: 400 }
      );
    }

    // Parse query params
    const searchParams = req.nextUrl.searchParams;
    const shouldSync = searchParams.get("sync") === "true";
    const filterParam = searchParams.get("filter") ?? "all";
    const ratingParam = searchParams.get("rating");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const perPage = 20;

    // Sync with Google if requested
    if (shouldSync) {
      const { accessToken, updatedEncryptedTokens } =
        await getValidAccessToken(company.google_oauth_tokens);

      if (updatedEncryptedTokens) {
        await supabase
          .from("companies")
          .update({ google_oauth_tokens: updatedEncryptedTokens })
          .eq("id", company.id);
      }

      // Fetch all reviews (paginated from Google)
      let allReviews: GBPReview[] = [];
      let pageToken: string | undefined;

      do {
        const result = await listReviews(
          accessToken,
          company.google_account_id,
          company.google_location_id,
          pageToken
        );
        if (result.reviews) {
          allReviews = allReviews.concat(result.reviews);
        }
        pageToken = result.nextPageToken;
      } while (pageToken);

      // Upsert reviews into database
      if (allReviews.length > 0) {
        const rows = allReviews.map((review) => ({
          company_id: company.id,
          google_review_id: review.reviewId,
          reviewer_name: review.reviewer.displayName,
          reviewer_photo_url: review.reviewer.profilePhotoUrl ?? null,
          star_rating: starRatingToNumber(review.starRating),
          comment: review.comment ?? null,
          review_created_at: review.createTime,
          review_updated_at: review.updateTime,
          reply_text: review.reviewReply?.comment ?? null,
          reply_updated_at: review.reviewReply?.updateTime ?? null,
          reply_source: review.reviewReply ? "google" : null,
          synced_at: new Date().toISOString(),
        }));

        // Upsert — update existing, insert new
        const { error: upsertError } = await supabase
          .from("google_reviews")
          .upsert(rows, {
            onConflict: "company_id,google_review_id",
            ignoreDuplicates: false,
          });

        if (upsertError) {
          console.error("Failed to sync reviews:", upsertError);
        }
      }
    }

    // Build query for cached reviews
    let query = supabase
      .from("google_reviews")
      .select("*", { count: "exact" })
      .eq("company_id", company.id);

    // Apply filters
    if (filterParam === "unreplied") {
      query = query.is("reply_text", null);
    } else if (filterParam === "replied") {
      query = query.not("reply_text", "is", null);
    }

    if (ratingParam) {
      const rating = parseInt(ratingParam, 10);
      if (rating >= 1 && rating <= 5) {
        query = query.eq("star_rating", rating);
      }
    }

    // Order and paginate
    query = query
      .order("review_created_at", { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1);

    const { data: reviews, count, error: queryError } = await query;

    if (queryError) {
      console.error("Failed to query reviews:", queryError);
      return NextResponse.json(
        {
          error: "db_error",
          message: "Błąd pobierania opinii z bazy danych.",
        },
        { status: 503 }
      );
    }

    // Get last sync time
    const { data: lastSyncRow } = await supabase
      .from("google_reviews")
      .select("synced_at")
      .eq("company_id", company.id)
      .order("synced_at", { ascending: false })
      .limit(1);

    return NextResponse.json({
      reviews: reviews ?? [],
      total: count ?? 0,
      page,
      perPage,
      lastSyncedAt: lastSyncRow?.[0]?.synced_at ?? null,
    });
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

    console.error("Google reviews error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        message: "Nie udało się pobrać opinii Google.",
      },
      { status: 500 }
    );
  }
}
