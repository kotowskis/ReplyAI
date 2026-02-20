import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { History, Star, Copy, Check } from "lucide-react";
import Link from "next/link";
import CopyButton from "@/components/CopyButton";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: companies } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1);

  if (!companies || companies.length === 0) {
    redirect("/onboarding");
  }

  const { data: generations } = await supabase
    .from("generations")
    .select("id, review_text, review_rating, review_platform, reply_text, created_at")
    .eq("company_id", companies[0].id)
    .order("created_at", { ascending: false })
    .limit(30);

  const platformLabels: Record<string, string> = {
    google: "Google",
    facebook: "Facebook",
    booking: "Booking.com",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          Historia odpowiedzi
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Przeglądaj wcześniej wygenerowane odpowiedzi.
        </p>
      </div>

      {!generations || generations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center">
          <History className="mx-auto h-12 w-12 text-zinc-300" />
          <h3 className="mt-4 text-lg font-medium text-zinc-900">
            Brak odpowiedzi
          </h3>
          <p className="mt-2 text-sm text-zinc-500">
            Historia pojawi się po wygenerowaniu pierwszej odpowiedzi.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Przejdź do generatora &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {generations.map((gen) => (
            <div
              key={gen.id}
              className="rounded-lg border border-zinc-200 bg-white"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                    {platformLabels[gen.review_platform] ?? gen.review_platform}
                  </span>
                  {gen.review_rating && (
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < gen.review_rating!
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-zinc-200"
                          }`}
                        />
                      ))}
                    </span>
                  )}
                  <span>
                    {new Date(gen.created_at).toLocaleDateString("pl-PL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <CopyButton text={gen.reply_text} />
              </div>

              {/* Review */}
              <div className="border-b border-zinc-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Opinia klienta
                </p>
                <p className="mt-1 text-sm text-zinc-600 line-clamp-3">
                  {gen.review_text}
                </p>
              </div>

              {/* Reply */}
              <div className="px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Odpowiedź
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
                  {gen.reply_text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
