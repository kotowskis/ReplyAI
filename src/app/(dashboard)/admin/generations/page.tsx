import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getUserRole, isAdmin } from "@/lib/roles";
import {
  ArrowLeft,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { GenerationsSearch } from "./GenerationsSearch";
import { GenerationRow } from "./GenerationRow";

const PAGE_SIZE = 25;

export default async function AdminGenerationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; platform?: string; page?: string }>;
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
  const platform = params.platform?.trim() ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = createAdminClient();

  // Build query
  let gensQuery = admin
    .from("generations")
    .select(
      "id, review_text, review_rating, review_platform, reply_text, was_edited, tokens_used, created_at, company_id",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (platform) {
    gensQuery = gensQuery.eq("review_platform", platform);
  }

  if (query) {
    gensQuery = gensQuery.or(
      `review_text.ilike.%${query}%,reply_text.ilike.%${query}%`
    );
  }

  const { data: generations, count: filteredCount } = await gensQuery;

  // Gather unique company IDs and fetch company info with owners
  const companyIds = [
    ...new Set((generations ?? []).map((g) => g.company_id)),
  ];

  const { data: companies } = companyIds.length > 0
    ? await admin
        .from("companies")
        .select("id, name, owner_id")
        .in("id", companyIds)
    : { data: [] as { id: string; name: string; owner_id: string }[] };

  const companyMap = new Map(
    (companies ?? []).map((c) => [c.id, c])
  );

  const totalItems = filteredCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (platform) params.set("platform", platform);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/admin/generations${qs ? `?${qs}` : ""}`;
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
          <Zap className="h-6 w-6 text-amber-600" />
          <h1 className="text-2xl font-bold text-zinc-900">
            Przegląd generacji
          </h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Wszystkie wygenerowane odpowiedzi w systemie.
        </p>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">
              Generacje
              {(query || platform) && (
                <span className="ml-2 font-normal text-zinc-400">
                  — {totalItems} wyników
                </span>
              )}
            </h2>
            <div className="w-full sm:max-w-lg">
              <GenerationsSearch />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-4 py-3 font-medium">Platforma</th>
                <th className="px-4 py-3 font-medium">Firma</th>
                <th className="px-4 py-3 font-medium">Ocena</th>
                <th className="px-4 py-3 font-medium">Opinia</th>
                <th className="px-4 py-3 font-medium">Tokeny</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {generations?.map((gen) => {
                const company = companyMap.get(gen.company_id);
                return (
                  <GenerationRow
                    key={gen.id}
                    generation={gen}
                    companyName={company?.name ?? "—"}
                    ownerId={company?.owner_id ?? ""}
                  />
                );
              })}
              {(!generations || generations.length === 0) && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-zinc-400"
                  >
                    {query || platform
                      ? "Brak wyników dla tych filtrów"
                      : "Brak generacji"}
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
              Strona {page} z {totalPages} ({totalItems} generacji)
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
