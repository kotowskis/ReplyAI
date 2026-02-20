"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface ReplyOutputProps {
  reply: string;
}

export default function ReplyOutput({ reply }: ReplyOutputProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = reply;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <h3 className="text-sm font-medium text-zinc-700">
          Wygenerowana odpowiedź
        </h3>
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
              Kopiuj do schowka
            </>
          )}
        </button>
      </div>
      <div className="px-4 py-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
          {reply}
        </p>
      </div>
    </div>
  );
}
