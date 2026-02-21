import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRole, isAdmin } from "@/lib/roles";
import { logAdminAction } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";

const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  pro: 100,
};

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

    const body = await request.json();
    const { subscriptionId, action, plan, generationsLimit } = body as {
      subscriptionId: string;
      action: "change_plan" | "reset_usage" | "set_limit";
      plan?: string;
      generationsLimit?: number;
    };

    if (!subscriptionId || !action) {
      return NextResponse.json(
        { error: "subscriptionId and action are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    if (action === "change_plan") {
      if (!plan || !PLAN_LIMITS[plan]) {
        return NextResponse.json(
          { error: "Invalid plan" },
          { status: 400 }
        );
      }

      const { error } = await admin
        .from("subscriptions")
        .update({
          plan,
          generations_limit: PLAN_LIMITS[plan],
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId);

      if (error) {
        return NextResponse.json(
          { error: "Nie udało się zmienić planu" },
          { status: 500 }
        );
      }

      await logAdminAction({
        adminId: user.id,
        action: "change_plan",
        targetType: "subscription",
        targetId: subscriptionId,
        details: { plan, generations_limit: PLAN_LIMITS[plan] },
      });

      return NextResponse.json({
        success: true,
        plan,
        generations_limit: PLAN_LIMITS[plan],
      });
    }

    if (action === "reset_usage") {
      const { error } = await admin
        .from("subscriptions")
        .update({
          generations_used: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId);

      if (error) {
        return NextResponse.json(
          { error: "Nie udało się zresetować limitu" },
          { status: 500 }
        );
      }

      await logAdminAction({
        adminId: user.id,
        action: "reset_usage",
        targetType: "subscription",
        targetId: subscriptionId,
      });

      return NextResponse.json({ success: true, generations_used: 0 });
    }

    if (action === "set_limit") {
      if (generationsLimit == null || generationsLimit < 0) {
        return NextResponse.json(
          { error: "Invalid generations limit" },
          { status: 400 }
        );
      }

      const { error } = await admin
        .from("subscriptions")
        .update({
          generations_limit: generationsLimit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId);

      if (error) {
        return NextResponse.json(
          { error: "Nie udało się ustawić limitu" },
          { status: 500 }
        );
      }

      await logAdminAction({
        adminId: user.id,
        action: "set_limit",
        targetType: "subscription",
        targetId: subscriptionId,
        details: { generations_limit: generationsLimit },
      });

      return NextResponse.json({
        success: true,
        generations_limit: generationsLimit,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 }
    );
  }
}
