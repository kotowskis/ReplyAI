import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/emails";
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

    // Only send to users whose account was created within the last hour
    const createdAt = new Date(user.created_at);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    if (createdAt < oneHourAgo) {
      return NextResponse.json({ skipped: true });
    }

    const fullName =
      user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "";

    await sendWelcomeEmail(user.email!, fullName);

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Welcome email error:", error);
    // Don't fail the flow — email is secondary
    return NextResponse.json({ error: "email_failed" }, { status: 500 });
  }
}
