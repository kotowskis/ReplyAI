import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getUserRole, isAdmin } from "@/lib/roles";
import {
  ArrowLeft,
  ScrollText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { LogsSearch } from "./LogsSearch";

const PAGE_SIZE = 30;

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  change_role: { label: "Zmiana roli", color: "bg-purple-50 text-purple-700" },
  change_password: {
    label: "Zmiana hasła",
    color: "bg-red-50 text-red-700",
  },
  reset_password: {
    label: "Reset hasła",
    color: "bg-orange-50 text-orange-700",
  },
  change_plan: { label: "Zmiana planu", color: "bg-blue-50 text-blue-700" },
  reset_usage: {
    label: "Reset limitu",
    color: "bg-amber-50 text-amber-700",
  },
  set_limit: {
    label: "Ustawienie limitu",
    color: "bg-green-50 text-green-700",
  },
};

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; page?: string }>;
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
  const actionFilter = params.action?.trim() ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = createAdminClient();

  // Build logs query
  let logsQuery = admin
    .from("audit_logs")
    .select("id, admin_id, action, target_type, target_id, details, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (actionFilter) {
    logsQuery = logsQuery.eq("action", actionFilter);
  }

  const { data: logs, count: filteredCount } = await logsQuery;

  // Resolve admin profiles
  const adminIds = [...new Set((logs ?? []).map((l) => l.admin_id))];
  const { data: admins } =
    adminIds.length > 0
      ? await admin
          .from("profiles")
          .select("id, email, full_name")
          .in("id", adminIds)
      : { data: [] as { id: string; email: string; full_name: string | null }[] };

  const adminMap = new Map((admins ?? []).map((a) => [a.id, a]));

  // Client-side search filter (by admin email)
  let filtered = logs ?? [];
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter((log) => {
      const a = adminMap.get(log.admin_id);
      return (
        a?.email?.toLowerCase().includes(q) ||
        a?.full_name?.toLowerCase().includes(q) ||
        log.target_id?.toLowerCase().includes(q)
      );
    });
  }

  const totalItems = filteredCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  function pageHref(p: number) {
    const hp = new URLSearchParams();
    if (query) hp.set("q", query);
    if (actionFilter) hp.set("action", actionFilter);
    if (p > 1) hp.set("page", String(p));
    const qs = hp.toString();
    return `/admin/logs${qs ? `?${qs}` : ""}`;
  }

  function formatDetails(details: Record<string, unknown>): string {
    return Object.entries(details)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
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
          <ScrollText className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-zinc-900">Logi audytu</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Historia wszystkich akcji administracyjnych.
        </p>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">
              Logi
              {(query || actionFilter) && (
                <span className="ml-2 font-normal text-zinc-400">
                  — {query ? `${filtered.length} na stronie` : `${totalItems} wyników`}
                </span>
              )}
            </h2>
            <div className="w-full sm:max-w-lg">
              <LogsSearch />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Akcja</th>
                <th className="px-4 py-3 font-medium">Cel</th>
                <th className="px-4 py-3 font-medium">Szczegóły</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const adm = adminMap.get(log.admin_id);
                const actionInfo = ACTION_LABELS[log.action] ?? {
                  label: log.action,
                  color: "bg-zinc-100 text-zinc-600",
                };
                const details =
                  log.details && typeof log.details === "object"
                    ? (log.details as Record<string, unknown>)
                    : {};

                return (
                  <tr
                    key={log.id}
                    className="border-b border-zinc-50 last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {new Date(log.created_at).toLocaleDateString("pl-PL", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${log.admin_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {adm?.full_name || adm?.email || log.admin_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${actionInfo.color}`}
                      >
                        {actionInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      <span className="text-xs text-zinc-400">
                        {log.target_type}:
                      </span>{" "}
                      {log.target_type === "user" ? (
                        <Link
                          href={`/admin/users/${log.target_id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {log.target_id.slice(0, 8)}…
                        </Link>
                      ) : (
                        <span className="font-mono text-xs">
                          {log.target_id.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs text-zinc-500">
                      {Object.keys(details).length > 0
                        ? formatDetails(details)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-zinc-400"
                  >
                    {query || actionFilter
                      ? "Brak wyników dla tych filtrów"
                      : "Brak logów"}
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
              Strona {page} z {totalPages} ({totalItems} logów)
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
