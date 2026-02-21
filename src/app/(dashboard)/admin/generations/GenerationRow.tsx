"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Star } from "lucide-react";
import Link from "next/link";

interface Props {
  generation: {
    id: string;
    review_text: string;
    review_rating: number | null;
    review_platform: string;
    reply_text: string;
    was_edited: boolean;
    tokens_used: number | null;
    created_at: string;
    company_id: string;
  };
  companyName: string;
  ownerId: string;
}

export function GenerationRow({ generation: gen, companyName, ownerId }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="border-b border-zinc-50 last:border-0 cursor-pointer hover:bg-zinc-50/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 text-zinc-700">
          <span className="inline-flex items-center gap-1">
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            )}
            {gen.review_platform}
          </span>
        </td>
        <td className="px-4 py-3 text-zinc-500">
          <Link
            href={`/admin/users/${ownerId}`}
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {companyName}
          </Link>
        </td>
        <td className="px-4 py-3">
          {gen.review_rating != null && (
            <span className="inline-flex items-center gap-0.5 text-zinc-600">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {gen.review_rating}
            </span>
          )}
        </td>
        <td className="max-w-xs truncate px-4 py-3 text-zinc-500">
          {gen.review_text}
        </td>
        <td className="px-4 py-3 text-zinc-500">{gen.tokens_used ?? "—"}</td>
        <td className="px-4 py-3">
          {gen.was_edited && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              edytowana
            </span>
          )}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
          {new Date(gen.created_at).toLocaleDateString("pl-PL", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-zinc-100 bg-zinc-50/70">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Opinia klienta
                </p>
                <p className="whitespace-pre-wrap text-sm text-zinc-700">
                  {gen.review_text}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Wygenerowana odpowiedź
                </p>
                <p className="whitespace-pre-wrap text-sm text-zinc-700">
                  {gen.reply_text}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
