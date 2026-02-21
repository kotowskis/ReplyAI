import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRole, isAdmin, UserRole } from "@/lib/roles";
import { logAdminAction } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";

const VALID_ROLES: UserRole[] = ["user", "admin"];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentRole = await getUserRole(supabase, user.id);
    if (!isAdmin(currentRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, role } = await request.json();
    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId and role are required" },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Prevent admin from removing their own admin role
    if (userId === user.id && role !== "admin") {
      return NextResponse.json(
        { error: "Nie możesz odebrać sobie roli admina" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (error) {
      return NextResponse.json(
        { error: "Nie udało się zmienić roli" },
        { status: 500 }
      );
    }

    await logAdminAction({
      adminId: user.id,
      action: "change_role",
      targetType: "user",
      targetId: userId,
      details: { role },
    });

    return NextResponse.json({ success: true, role });
  } catch {
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 }
    );
  }
}
