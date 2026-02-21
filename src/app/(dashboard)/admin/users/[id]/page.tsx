import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, isAdmin } from "@/lib/roles";
import {
  ArrowLeft,
  Mail,
  User,
  Shield,
  Calendar,
  Building2,
  Zap,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { PasswordManagement } from "./PasswordManagement";
import { RoleSwitcher } from "./RoleSwitcher";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) redirect("/login");

  const role = await getUserRole(supabase, currentUser.id);
  if (!isAdmin(role)) redirect("/dashboard");

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) redirect("/admin");

  // Fetch user's companies with subscriptions
  const { data: companies } = await supabase
    .from("companies")
    .select("*, subscriptions(*)")
    .eq("owner_id", id)
    .order("created_at", { ascending: false });

  // Fetch total generations count for this user
  const { count: totalGenerations } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true })
    .in(
      "company_id",
      (companies ?? []).map((c) => c.id)
    );

  // Fetch recent generations
  const { data: recentGenerations } = await supabase
    .from("generations")
    .select("id, review_platform, tokens_used, created_at, company_id")
    .in(
      "company_id",
      (companies ?? []).map((c) => c.id)
    )
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin"
          className="mb-3 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Powrót do panelu
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">
          Szczegóły użytkownika
        </h1>
      </div>

      {/* User info card */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Informacje podstawowe
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-400">Email</p>
              <p className="text-sm font-medium text-zinc-900">
                {profile.email}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="mt-0.5 h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-400">Imię i nazwisko</p>
              <p className="text-sm font-medium text-zinc-900">
                {profile.full_name || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-400">Rola</p>
              <RoleSwitcher
                userId={id}
                currentRole={profile.role ?? "user"}
                isSelf={id === currentUser.id}
              />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-4 w-4 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-400">Data rejestracji</p>
              <p className="text-sm font-medium text-zinc-900">
                {new Date(profile.created_at).toLocaleDateString("pl-PL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-zinc-500">Firmy</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {companies?.length ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-zinc-500">
              Generacje łącznie
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {totalGenerations ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-zinc-500">
              Aktywne subskrypcje
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {companies?.filter((c) =>
              c.subscriptions?.some(
                (s: { status: string }) => s.status === "active"
              )
            ).length ?? 0}
          </p>
        </div>
      </div>

      {/* Companies & subscriptions */}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">
            Firmy i subskrypcje
          </h2>
        </div>
        {companies && companies.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            {companies.map((company) => (
              <div key={company.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {company.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {company.industry} &middot; Ton: {company.tone} &middot;
                      Język: {company.language}
                    </p>
                  </div>
                </div>
                {company.subscriptions && company.subscriptions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {company.subscriptions.map(
                      (sub: {
                        id: string;
                        plan: string;
                        status: string;
                        generations_used: number;
                        generations_limit: number;
                        stripe_subscription_id: string | null;
                      }) => (
                        <div
                          key={sub.id}
                          className="flex flex-wrap items-center gap-2 text-xs"
                        >
                          <span
                            className={`rounded-full px-2 py-0.5 font-medium ${
                              sub.plan === "free"
                                ? "bg-zinc-100 text-zinc-600"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {sub.plan}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 font-medium ${
                              sub.status === "active"
                                ? "bg-green-50 text-green-700"
                                : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            {sub.status}
                          </span>
                          <span className="text-zinc-500">
                            Generacje: {sub.generations_used}/
                            {sub.generations_limit}
                          </span>
                          {sub.stripe_subscription_id && (
                            <span className="text-zinc-400">
                              Stripe: {sub.stripe_subscription_id}
                            </span>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-zinc-400">
            Użytkownik nie ma żadnych firm
          </p>
        )}
      </div>

      {/* Recent generations */}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">
            Ostatnie generacje
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-4 py-3 font-medium">Platforma</th>
                <th className="px-4 py-3 font-medium">Firma</th>
                <th className="px-4 py-3 font-medium">Tokeny</th>
                <th className="px-4 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {recentGenerations?.map((gen) => {
                const company = companies?.find(
                  (c) => c.id === gen.company_id
                );
                return (
                  <tr
                    key={gen.id}
                    className="border-b border-zinc-50 last:border-0"
                  >
                    <td className="px-4 py-3 text-zinc-700">
                      {gen.review_platform}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {company?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {gen.tokens_used ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(gen.created_at).toLocaleDateString("pl-PL", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                );
              })}
              {(!recentGenerations || recentGenerations.length === 0) && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-zinc-400"
                  >
                    Brak generacji
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password management */}
      <PasswordManagement userId={id} userEmail={profile.email} />
    </div>
  );
}
