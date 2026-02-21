import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, encryptTokens } from "@/lib/google/client";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * GET /api/auth/google/callback
 * Callback po autoryzacji Google OAuth.
 * Wymienia code na tokeny i zapisuje w profilu firmy.
 */
export async function GET(request: NextRequest) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Użytkownik anulował autoryzację
    if (error) {
      return NextResponse.redirect(
        new URL(`/account?tab=google&error=oauth_cancelled`, appUrl)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`/account?tab=google&error=missing_params`, appUrl)
      );
    }

    // 1. Sprawdź CSRF state token
    const cookieStore = await cookies();
    const savedState = cookieStore.get("google_oauth_state")?.value;
    cookieStore.delete("google_oauth_state");

    if (!savedState || savedState !== state) {
      return NextResponse.redirect(
        new URL(`/account?tab=google&error=invalid_state`, appUrl)
      );
    }

    // 2. Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/login", appUrl));
    }

    // 3. Wymień code na tokeny
    const tokens = await exchangeCodeForTokens(code);

    // 4. Zaszyfruj i zapisz tokeny w firmie użytkownika
    const { data: companies } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1);

    if (!companies || companies.length === 0) {
      return NextResponse.redirect(
        new URL(`/account?tab=google&error=no_company`, appUrl)
      );
    }

    const encryptedTokens = encryptTokens(tokens);

    const { error: updateError } = await supabase
      .from("companies")
      .update({
        google_oauth_tokens: encryptedTokens,
        google_connected_at: new Date().toISOString(),
      })
      .eq("id", companies[0].id);

    if (updateError) {
      console.error("Failed to save Google tokens:", updateError);
      return NextResponse.redirect(
        new URL(`/account?tab=google&error=save_failed`, appUrl)
      );
    }

    // 5. Redirect do wyboru konta/lokalizacji
    return NextResponse.redirect(
      new URL(`/account?tab=google&step=select`, appUrl)
    );
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      new URL(`/account?tab=google&error=callback_failed`, appUrl)
    );
  }
}
