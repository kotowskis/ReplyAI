import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Delete user's companies (cascade should handle generations)
    await admin.from("companies").delete().eq("owner_id", user.id);

    // Delete user's profile
    await admin.from("profiles").delete().eq("id", user.id);

    // Delete the auth user
    const { error } = await admin.auth.admin.deleteUser(user.id);

    if (error) {
      return NextResponse.json(
        { error: "Nie udało się usunąć konta" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 }
    );
  }
}
