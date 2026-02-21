import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { reply_text } = (await req.json()) as { reply_text: string };

  if (!reply_text || reply_text.trim().length === 0) {
    return NextResponse.json(
      { error: "Treść odpowiedzi jest wymagana" },
      { status: 400 }
    );
  }

  // Verify ownership: generation must belong to user's company
  const { data: companies } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id);

  if (!companies || companies.length === 0) {
    return NextResponse.json({ error: "Brak firmy" }, { status: 403 });
  }

  const companyIds = companies.map((c) => c.id);

  const { data: generation, error } = await supabase
    .from("generations")
    .update({
      reply_text: reply_text.trim(),
      was_edited: true,
    })
    .eq("id", id)
    .in("company_id", companyIds)
    .select("id, reply_text, was_edited")
    .single();

  if (error || !generation) {
    return NextResponse.json(
      { error: "Nie znaleziono generacji" },
      { status: 404 }
    );
  }

  return NextResponse.json(generation);
}
