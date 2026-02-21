"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check, Pencil, X, Loader2 } from "lucide-react";

interface ReplyOutputProps {
  reply: string;
  generationId: string | null;
  onReplySaved?: (newReply: string) => void;
}

export default function ReplyOutput({
  reply,
  generationId,
  onReplySaved,
}: ReplyOutputProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(reply);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditedText(reply);
    setEditing(false);
  }, [reply]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      el.selectionStart = el.value.length;
    }
  }, [editing]);

  async function handleCopy() {
    const textToCopy = editing ? editedText : reply;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleSave() {
    if (!generationId || editedText.trim() === reply) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/generations/${generationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply_text: editedText.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        onReplySaved?.(data.reply_text);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditedText(reply);
    setEditing(false);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <h3 className="text-sm font-medium text-zinc-700">
          Wygenerowana odpowiedź
        </h3>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Anuluj
              </button>
              <button
                onClick={handleSave}
                disabled={saving || editedText.trim().length === 0}
                className="inline-flex items-center gap-1.5 rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Zapisuję...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Zapisz
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {generationId && (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
                >
                  <Pencil className="h-4 w-4" />
                  Edytuj
                </button>
              )}
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    Skopiowano!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Kopiuj
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
      <div className="px-4 py-4">
        {editing ? (
          <textarea
            ref={textareaRef}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            disabled={saving}
            rows={6}
            className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm leading-relaxed text-zinc-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
            {reply}
          </p>
        )}
      </div>
    </div>
  );
}
