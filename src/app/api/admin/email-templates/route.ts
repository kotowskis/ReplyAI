import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRole, isAdmin } from "@/lib/roles";
import { NextRequest, NextResponse } from "next/server";
import type { EmailTemplateType } from "@/lib/emails";

const VALID_TYPES: EmailTemplateType[] = [
  "welcome",
  "limit_reached",
  "pro_confirmation",
  "payment_failed",
];

export async function POST(request: NextRequest) {
  try {
    // Auth + admin check
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
    const { type, subject, body_html } = body as {
      type: string;
      subject: string;
      body_html: string;
    };

    if (!type || !subject || !body_html) {
      return NextResponse.json(
        { error: "Pola type, subject i body_html są wymagane" },
        { status: 400 },
      );
    }

    if (!VALID_TYPES.includes(type as EmailTemplateType)) {
      return NextResponse.json(
        { error: "Nieprawidłowy typ szablonu" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Upsert — insert or update if type already exists
    const { data, error } = await admin
      .from("email_templates")
      .upsert(
        {
          type,
          subject,
          body_html,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        },
        { onConflict: "type" },
      )
      .select()
      .single();

    if (error) {
      console.error("Email template upsert error:", error);
      return NextResponse.json(
        { error: "Nie udało się zapisać szablonu" },
        { status: 500 },
      );
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error("Email template API error:", error);
    return NextResponse.json(
      { error: "Wystąpił nieoczekiwany błąd" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Auth + admin check
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type || !VALID_TYPES.includes(type as EmailTemplateType)) {
      return NextResponse.json(
        { error: "Nieprawidłowy typ szablonu" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("email_templates")
      .delete()
      .eq("type", type);

    if (error) {
      console.error("Email template delete error:", error);
      return NextResponse.json(
        { error: "Nie udało się usunąć szablonu" },
        { status: 500 },
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Email template delete API error:", error);
    return NextResponse.json(
      { error: "Wystąpił nieoczekiwany błąd" },
      { status: 500 },
    );
  }
}
