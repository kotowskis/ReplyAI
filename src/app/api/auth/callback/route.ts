import { createClient } from "@/lib/supabase/server";
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
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // If verification fails, redirect to login with error
  return NextResponse.redirect(
    new URL("/login?error=invalid_link", request.url)
  );
}
