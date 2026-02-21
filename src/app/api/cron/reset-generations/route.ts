import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase.rpc("reset_monthly_generations");

  if (error) {
    return NextResponse.json(
      { error: "Failed to reset generations", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: "Monthly generations reset" });
}
