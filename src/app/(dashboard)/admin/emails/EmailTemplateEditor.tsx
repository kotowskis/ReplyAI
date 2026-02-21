"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
} from "lucide-react";
import type { EmailTemplateType } from "@/lib/emails";

interface EmailTemplateEditorProps {
  type: EmailTemplateType;
  name: string;
  description: string;
  variables: string[];
  isCustomized: boolean;
  subject: string;
  bodyHtml: string;
  defaultSubject: string;
  defaultBodyHtml: string;
}

export function EmailTemplateEditor({
  type,
  name,
  description,
  variables,
  isCustomized: initialIsCustomized,
  subject: initialSubject,
  bodyHtml: initialBodyHtml,
  defaultSubject,
  defaultBodyHtml,
}: EmailTemplateEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [subject, setSubject] = useState(initialSubject);
  const [bodyHtml, setBodyHtml] = useState(initialBodyHtml);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [isCustomized, setIsCustomized] = useState(initialIsCustomized);

  const hasChanges =
    subject !== initialSubject || bodyHtml !== initialBodyHtml;

  async function handleSave() {
    setSaving(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, subject, body_html: bodyHtml }),
      });

      if (!res.ok) throw new Error("Save failed");

      setStatus("saved");
      setIsCustomized(true);
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetToDefault() {
    if (
      !confirm("Czy na pewno chcesz przywrócić domyślny szablon? Twoje zmiany zostaną usunięte.")
    ) {
      return;
    }

    setResetting(true);
    setStatus("idle");

    try {
      const res = await fetch(
        `/api/admin/email-templates?type=${type}`,
        { method: "DELETE" },
      );

      if (!res.ok) throw new Error("Delete failed");

      setSubject(defaultSubject);
      setBodyHtml(defaultBodyHtml);
      setIsCustomized(false);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
    } finally {
      setResetting(false);
    }
  }

  // Build preview HTML with sample variables replaced
  const previewHtml = bodyHtml
    .replaceAll("{{firstName}}", "Jan")
    .replaceAll("{{planName}}", "Pro")
    .replaceAll("{{appUrl}}", "https://replyai.pl");

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
      >
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">{name}</h3>
            {isCustomized && (
              <span className="rounded-full bg-pink-50 px-2 py-0.5 text-xs font-medium text-pink-700">
                Zmieniony
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
          <p className="mt-1 text-xs text-zinc-400">
            Temat: {subject}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-zinc-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
        )}
      </button>

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t border-zinc-100 px-5 py-4 space-y-4">
          {/* Variables reference */}
          <div className="rounded-lg bg-zinc-50 px-4 py-3">
            <p className="text-xs font-medium text-zinc-500 mb-1.5">
              Dostępne zmienne:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {variables.map((v) => (
                <code
                  key={v}
                  className="rounded bg-white border border-zinc-200 px-2 py-0.5 text-xs text-pink-700 font-mono"
                >
                  {v}
                </code>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Temat emaila
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Body HTML / Preview toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-zinc-700">
                {showPreview ? "Podgląd" : "Treść HTML"}
              </label>
              <button
                onClick={() => setShowPreview((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" /> Edycja
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" /> Podgląd
                  </>
                )}
              </button>
            </div>

            {showPreview ? (
              <div className="rounded-lg border border-zinc-200 bg-white p-4 min-h-[200px]">
                <div
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            ) : (
              <textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                rows={16}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-xs font-mono text-zinc-800 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {isCustomized && (
                <button
                  onClick={handleResetToDefault}
                  disabled={resetting}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  {resetting ? "Przywracanie..." : "Przywróć domyślny"}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {status === "saved" && (
                <span className="inline-flex items-center gap-1 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  Zapisano
                </span>
              )}
              {status === "error" && (
                <span className="inline-flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  Błąd zapisu
                </span>
              )}

              <button
                onClick={handleSave}
                disabled={saving || (!hasChanges && isCustomized)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {saving ? "Zapisywanie..." : "Zapisz szablon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
