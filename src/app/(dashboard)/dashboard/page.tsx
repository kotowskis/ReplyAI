import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MessageSquareReply } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if onboarding is completed
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .eq("owner_id", user.id)
    .limit(1);

  if (!companies || companies.length === 0) {
    redirect("/onboarding");
  }

  const company = companies[0];

  // Get subscription info
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, generations_used, generations_limit")
    .eq("company_id", company.id)
    .single();

  const used = subscription?.generations_used ?? 0;
  const limit = subscription?.generations_limit ?? 5;
  const plan = subscription?.plan ?? "free";
  const isUnlimited = limit === -1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          Generator odpowiedzi
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Wklej opinię klienta i wygeneruj profesjonalną odpowiedź.
        </p>
      </div>

      {/* Usage bar */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600">
            Wykorzystane:{" "}
            <span className="font-medium text-zinc-900">
              {used}
              {isUnlimited ? "" : `/${limit}`}
            </span>{" "}
            generacji
          </span>
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
            Plan {plan === "free" ? "Starter" : plan === "pro" ? "Pro" : "Agency"}
          </span>
        </div>
        {!isUnlimited && (
          <div className="mt-2 h-2 rounded-full bg-zinc-100">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all"
              style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Generator placeholder — will be built in Week 3-4 */}
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center">
        <MessageSquareReply className="mx-auto h-12 w-12 text-zinc-300" />
        <h3 className="mt-4 text-lg font-medium text-zinc-900">
          Generator odpowiedzi
        </h3>
        <p className="mt-2 text-sm text-zinc-500">
          Formularz generatora zostanie zbudowany w Tygodniu 3-4.
          <br />
          Na razie fundament (auth + DB + onboarding) jest gotowy.
        </p>
      </div>
    </div>
  );
}
