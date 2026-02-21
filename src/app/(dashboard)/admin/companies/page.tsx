import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getUserRole, isAdmin } from "@/lib/roles";
import {
  ArrowLeft,
  Building2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { CompaniesSearch } from "./CompaniesSearch";

const PAGE_SIZE = 25;

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = await getUserRole(supabase, user.id);
  if (!isAdmin(role)) redirect("/dashboard");

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const planFilter = params.plan?.trim() ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = createAdminClient();

  // Build companies query
  let companiesQuery = admin
    .from("companies")
    .select("id, name, industry, tone, language, owner_id, created_at, owner_name, subscriptions(plan, status, generations_used, generations_limit)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (query) {
    companiesQuery = companiesQuery.or(
      `name.ilike.%${query}%,owner_name.ilike.%${query}%`
    );
  }

  const { data: companies, count: filteredCount } = await companiesQuery;

  // Gather owner IDs to fetch emails
  const ownerIds = [...new Set((companies ?? []).map((c) => c.owner_id))];
  const { data: owners } =
    ownerIds.length > 0
      ? await admin
          .from("profiles")
          .select("id, email, full_name")
          .in("id", ownerIds)
      : { data: [] as { id: string; email: string; full_name: string | null }[] };

  const ownerMap = new Map((owners ?? []).map((o) => [o.id, o]));

  // Client-side plan filter (subscriptions are nested, can't filter via PostgREST easily)
  let filtered = companies ?? [];
  if (planFilter) {
    filtered = filtered.filter((c) => {
      const subs = c.subscriptions as { plan: string }[] | null;
      return subs?.some((s) => s.plan === planFilter);
    });
  }

  const totalItems = planFilter ? filtered.length : (filteredCount ?? 0);
  const totalPages = Math.max(1, Math.ceil((filteredCount ?? 0) / PAGE_SIZE));

  function pageHref(p: number) {
    const hp = new URLSearchParams();
    if (query) hp.set("q", query);
    if (planFilter) hp.set("plan", planFilter);
    if (p > 1) hp.set("page", String(p));
    const qs = hp.toString();
    return `/admin/companies${qs ? `?${qs}` : ""}`;
  }

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
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold text-zinc-900">
            Zarządzanie firmami
          </h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Przeglądaj wszystkie firmy zarejestrowane w systemie.
        </p>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">
              Firmy
              {(query || planFilter) && (
                <span className="ml-2 font-normal text-zinc-400">
                  — {totalItems} wyników
                </span>
              )}
            </h2>
            <div className="w-full sm:max-w-lg">
              <CompaniesSearch />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-4 py-3 font-medium">Firma</th>
                <th className="px-4 py-3 font-medium">Branża</th>
                <th className="px-4 py-3 font-medium">Właściciel</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Generacje</th>
                <th className="px-4 py-3 font-medium">Ton / Język</th>
                <th className="px-4 py-3 font-medium">Data utworzenia</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((company) => {
                const owner = ownerMap.get(company.owner_id);
                const subs = company.subscriptions as {
                  plan: string;
                  status: string;
                  generations_used: number;
                  generations_limit: number;
                }[] | null;
                const sub = subs?.[0];

                return (
                  <tr
                    key={company.id}
                    className="border-b border-zinc-50 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">
                        {company.name}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {company.industry}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${company.owner_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {owner?.full_name || owner?.email || "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {sub ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              sub.plan === "pro"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {sub.plan}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              sub.status === "active"
                                ? "bg-green-50 text-green-700"
                                : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sub ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-200">
                            <div
                              className={`h-full rounded-full ${
                                sub.generations_used >= sub.generations_limit
                                  ? "bg-red-500"
                                  : sub.generations_used >= sub.generations_limit * 0.8
                                    ? "bg-amber-500"
                                    : "bg-green-500"
                              }`}
                              style={{
                                width: `${Math.min(100, sub.generations_limit > 0 ? (sub.generations_used / sub.generations_limit) * 100 : 0)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-zinc-500">
                            {sub.generations_used}/{sub.generations_limit}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">
                      {company.tone} / {company.language}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {new Date(company.created_at).toLocaleDateString("pl-PL", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${company.owner_id}`}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Szczegóły
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-zinc-400"
                  >
                    {query || planFilter
                      ? "Brak wyników dla tych filtrów"
                      : "Brak firm"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
            <span className="text-xs text-zinc-400">
              Strona {page} z {totalPages} ({filteredCount ?? 0} firm)
            </span>
            <div className="flex items-center gap-1">
              {page > 1 ? (
                <Link
                  href={pageHref(page - 1)}
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Poprzednia
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-300">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Poprzednia
                </span>
              )}
              {page < totalPages ? (
                <Link
                  href={pageHref(page + 1)}
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  Następna
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-300">
                  Następna
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
