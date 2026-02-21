"use client";

import { useState } from "react";
import GeneratorForm from "./GeneratorForm";
import ReplyOutput from "./ReplyOutput";
import UsageBar from "./UsageBar";

interface GeneratorPageProps {
  initialUsed: number;
  initialLimit: number;
  plan: string;
}

export default function GeneratorPage({
  initialUsed,
  initialLimit,
  plan,
}: GeneratorPageProps) {
  const [reply, setReply] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [used, setUsed] = useState(initialUsed);
  const [limit] = useState(initialLimit);

  const isUnlimited = limit === -1;
  const isAtLimit = !isUnlimited && used >= limit;

  function handleGenerated(newReply: string, newGenerationId: string | null) {
    setReply(newReply);
    setGenerationId(newGenerationId);
  }

  function handleUsageUpdate(newUsed: number) {
    setUsed(newUsed);
  }

  function handleReplySaved(newReply: string) {
    setReply(newReply);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          Generator odpowiedzi
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Wklej opinię klienta i wygeneruj profesjonalną odpowiedź.
        </p>
      </div>

      <UsageBar used={used} limit={limit} plan={plan} />

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <GeneratorForm
          onGenerated={handleGenerated}
          onUsageUpdate={handleUsageUpdate}
          disabled={isAtLimit}
        />
      </div>

      {reply && (
        <ReplyOutput
          reply={reply}
          generationId={generationId}
          onReplySaved={handleReplySaved}
        />
      )}
    </div>
  );
}
