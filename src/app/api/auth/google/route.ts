import { createClient } from "@/lib/supabase/server";
import { buildGoogleAuthUrl } from "@/lib/google/client";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";

/**
 * GET /api/auth/google
 * Redirect do Google OAuth consent screen.
 * Wymaga zalogowanego użytkownika.
 */
export async function GET() {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Generuj CSRF state token
    const state = randomBytes(32).toString("hex");

    // 3. Zapisz state w cookie (HttpOnly, 10 min TTL)
    const cookieStore = await cookies();
    cookieStore.set("google_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 min
      path: "/",
    });

    // 4. Redirect do Google
    const authUrl = buildGoogleAuthUrl(state);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Google OAuth redirect error:", error);
    return NextResponse.redirect(
      new URL(
        "/account?tab=google&error=oauth_start_failed",
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      )
    );
  }
}
