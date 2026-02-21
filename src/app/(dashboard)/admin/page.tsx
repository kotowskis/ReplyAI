import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, isAdmin } from "@/lib/roles";
import {
  ShieldCheck,
  Users,
  Building2,
  Zap,
  Eye,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { AdminUsersSearch } from "./AdminUsersSearch";

const PAGE_SIZE = 20;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
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
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Build users query with optional search
  let usersQuery = supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (query) {
    usersQuery = usersQuery.or(
      `email.ilike.%${query}%,full_name.ilike.%${query}%`
    );
  }

  // Fetch stats + paginated users
  const [
    { count: usersCount },
    { count: companiesCount },
    { count: generationsCount },
    { data: users, count: filteredCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("generations").select("*", { count: "exact", head: true }),
    usersQuery,
  ]);

  const totalUsers = filteredCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));

  // Build pagination href helper
  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/admin${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-red-600" />
            <h1 className="text-2xl font-bold text-zinc-900">
              Panel administratora
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Przegląd systemu i zarządzanie użytkownikami.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/generations"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <Zap className="h-4 w-4 text-amber-600" />
            Generacje
          </Link>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <BarChart3 className="h-4 w-4 text-blue-600" />
            Analityka
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-zinc-500">
              Użytkownicy
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {usersCount ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-zinc-500">Firmy</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {companiesCount ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-zinc-500">
              Generacje
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {generationsCount ?? 0}
          </p>
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">
            Użytkownicy
            {query && (
              <span className="ml-2 font-normal text-zinc-400">
                — wyniki dla &ldquo;{query}&rdquo; ({totalUsers})
              </span>
            )}
          </h2>
          <div className="w-full sm:w-72">
            <AdminUsersSearch />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Imię</th>
                <th className="px-4 py-3 font-medium">Rola</th>
                <th className="px-4 py-3 font-medium">Data rejestracji</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-zinc-50 last:border-0"
                >
                  <td className="px-4 py-3 text-zinc-700">{u.email}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {u.full_name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-red-50 text-red-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {u.role === "admin" ? "Admin" : "Użytkownik"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(u.created_at).toLocaleDateString("pl-PL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Szczegóły
                    </Link>
                  </td>
                </tr>
              ))}
              {(!users || users.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-zinc-400"
                  >
                    {query
                      ? "Brak wyników dla tego wyszukiwania"
                      : "Brak użytkowników"}
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
              Strona {page} z {totalPages} ({totalUsers} użytkowników)
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
