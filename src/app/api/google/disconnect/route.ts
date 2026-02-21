import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/google/disconnect
 * Odłącza konto Google Business Profile — usuwa tokeny i dane lokalizacji.
 */
export async function POST() {
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
      .select("id")
      .eq("owner_id", user.id)
      .limit(1);

    if (!companies || companies.length === 0) {
      return NextResponse.json(
        { error: "Nie znaleziono firmy" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("companies")
      .update({
        google_account_id: null,
        google_location_id: null,
        google_location_name: null,
        google_oauth_tokens: null,
        google_connected_at: null,
      })
      .eq("id", companies[0].id);

    if (updateError) {
      console.error("Failed to disconnect Google:", updateError);
      return NextResponse.json(
        { error: "Nie udało się odłączyć konta Google" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Google disconnect error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Wystąpił nieoczekiwany błąd." },
      { status: 500 }
    );
  }
}
