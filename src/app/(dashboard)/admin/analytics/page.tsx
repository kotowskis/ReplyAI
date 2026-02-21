import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, isAdmin } from "@/lib/roles";
import { ArrowLeft, BarChart3 } from "lucide-react";
import Link from "next/link";
import { AnalyticsCharts } from "./AnalyticsCharts";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = await getUserRole(supabase, user.id);
  if (!isAdmin(role)) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="mb-3 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Powrót do panelu
        </Link>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-zinc-900">Analityka</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Trendy rejestracji, generacji i rozkład planów.
        </p>
      </div>

      <AnalyticsCharts />
    </div>
  );
}
