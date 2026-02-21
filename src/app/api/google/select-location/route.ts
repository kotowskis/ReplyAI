import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/google/select-location
 * Zapisuje wybraną lokalizację Google w profilu firmy.
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
    const { accountId, locationId, locationName } = body as {
      accountId: string;
      locationId: string;
      locationName: string;
    };

    if (!accountId || !locationId || !locationName) {
      return NextResponse.json(
        { error: "accountId, locationId i locationName są wymagane" },
        { status: 400 }
      );
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

    if (!companies[0].google_oauth_tokens) {
      return NextResponse.json(
        { error: "google_not_connected", message: "Najpierw połącz konto Google" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("companies")
      .update({
        google_account_id: accountId,
        google_location_id: locationId,
        google_location_name: locationName,
      })
      .eq("id", companies[0].id);

    if (updateError) {
      console.error("Failed to save Google location:", updateError);
      return NextResponse.json(
        { error: "Nie udało się zapisać lokalizacji" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Select location error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Wystąpił nieoczekiwany błąd." },
      { status: 500 }
    );
  }
}
