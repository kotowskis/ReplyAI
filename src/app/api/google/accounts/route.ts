import { createClient } from "@/lib/supabase/server";
import {
  getValidAccessToken,
  listAccounts,
  GoogleTokenExpiredError,
} from "@/lib/google/client";
import { NextResponse } from "next/server";

/**
 * GET /api/google/accounts
 * Pobiera listę kont Google Business Profile użytkownika.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pobierz tokeny z firmy
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

    // Pobierz ważny access token (odśwież jeśli wygasł)
    const { accessToken, updatedEncryptedTokens } =
      await getValidAccessToken(company.google_oauth_tokens);

    // Jeśli token został odświeżony, zapisz nowe tokeny
    if (updatedEncryptedTokens) {
      await supabase
        .from("companies")
        .update({ google_oauth_tokens: updatedEncryptedTokens })
        .eq("id", company.id);
    }

    // Pobierz konta GBP
    const accounts = await listAccounts(accessToken);

    return NextResponse.json({
      accounts: accounts.map((acc) => ({
        id: acc.name,
        name: acc.accountName,
        type: acc.type,
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

    console.error("Google accounts error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Nie udało się pobrać kont Google." },
      { status: 500 }
    );
  }
}
