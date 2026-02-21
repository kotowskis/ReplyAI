import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRole, isAdmin } from "@/lib/roles";
import { logAdminAction } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getUserRole(supabase, user.id);
    if (!isAdmin(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, password } = await request.json();
    if (!userId || !password) {
      return NextResponse.json(
        { error: "userId and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Hasło musi mieć min. 8 znaków" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: "Nie udało się zmienić hasła" },
        { status: 500 }
      );
    }

    await logAdminAction({
      adminId: user.id,
      action: "change_password",
      targetType: "user",
      targetId: userId,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 }
    );
  }
}
