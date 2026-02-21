import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRole, isAdmin } from "@/lib/roles";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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

    const daysParam = request.nextUrl.searchParams.get("days");
    const days = Math.min(90, Math.max(7, parseInt(daysParam ?? "30", 10) || 30));

    const admin = createAdminClient();
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    // Fetch all data in parallel
    const [
      { data: users },
      { data: generations },
      { data: subscriptions },
    ] = await Promise.all([
      admin
        .from("profiles")
        .select("created_at")
        .gte("created_at", sinceISO)
        .order("created_at", { ascending: true }),
      admin
        .from("generations")
        .select("created_at")
        .gte("created_at", sinceISO)
        .order("created_at", { ascending: true }),
      admin
        .from("subscriptions")
        .select("plan, status"),
    ]);

    // Build day-indexed map for last N days
    const dayMap: Record<string, { users: number; generations: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = { users: 0, generations: 0 };
    }

    for (const u of users ?? []) {
      const key = u.created_at.slice(0, 10);
      if (dayMap[key]) dayMap[key].users++;
    }

    for (const g of generations ?? []) {
      const key = g.created_at.slice(0, 10);
      if (dayMap[key]) dayMap[key].generations++;
    }

    const timeline = Object.entries(dayMap).map(([date, counts]) => ({
      date,
      ...counts,
    }));

    // Plan distribution
    const plans: Record<string, number> = {};
    for (const s of subscriptions ?? []) {
      const label = `${s.plan} (${s.status})`;
      plans[label] = (plans[label] || 0) + 1;
    }

    const planDistribution = Object.entries(plans).map(([name, value]) => ({
      name,
      value,
    }));

    return NextResponse.json({ timeline, planDistribution, days });
  } catch {
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 }
    );
  }
}
