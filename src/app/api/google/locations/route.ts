import { createClient } from "@/lib/supabase/server";
import {
  getValidAccessToken,
  listLocations,
  GoogleTokenExpiredError,
} from "@/lib/google/client";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/google/locations?accountId=accounts/123456789
 * Pobiera listę lokalizacji dla wybranego konta GBP.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        { error: "Parametr accountId jest wymagany" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: companies } = await supabase
      .from("companies")
      .select("id, google_oauth_tokens")
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
        { error: "google_not_connected", message: "Google nie jest połączony" },
        { status: 400 }
      );
    }

    const { accessToken, updatedEncryptedTokens } =
      await getValidAccessToken(company.google_oauth_tokens);

    if (updatedEncryptedTokens) {
      await supabase
        .from("companies")
        .update({ google_oauth_tokens: updatedEncryptedTokens })
        .eq("id", company.id);
    }

    const locations = await listLocations(accessToken, accountId);

    return NextResponse.json({
      locations: locations.map((loc) => ({
        id: loc.name,
        title: loc.title,
        address: loc.storefrontAddress
          ? [
              ...(loc.storefrontAddress.addressLines ?? []),
              loc.storefrontAddress.locality,
              loc.storefrontAddress.postalCode,
            ]
              .filter(Boolean)
              .join(", ")
          : null,
        websiteUri: loc.websiteUri ?? null,
      })),
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

    console.error("Google locations error:", error);
    return NextResponse.json(
      {
        error: "server_error",
        message: "Nie udało się pobrać lokalizacji Google.",
      },
      { status: 500 }
    );
  }
}
