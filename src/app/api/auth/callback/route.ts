import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/emails";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as "recovery" | "email",
      token_hash,
    });

    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(new URL("/reset-password", request.url));
      }

      // Send welcome email for new email confirmations (not password resets)
      if (type === "email") {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const createdAt = new Date(user.created_at);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

            if (createdAt > fiveMinutesAgo) {
              const fullName =
                user.user_metadata?.full_name ??
                user.email?.split("@")[0] ??
                "";
              sendWelcomeEmail(user.email!, fullName).catch((err) =>
                console.error("Welcome email failed:", err),
              );
            }
          }
        } catch (emailErr) {
          console.error("Welcome email error:", emailErr);
        }
      }

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // If verification fails, redirect to login with error
  return NextResponse.redirect(
    new URL("/login?error=invalid_link", request.url)
  );
}
