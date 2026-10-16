"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptQuoteAction,
  declineQuoteAction,
  saveMilestoneInputAction,
  sendMessageAction,
} from "@/server/requests/student-actions";
import { formatInr, formatDate } from "@/lib/format";

export function QuoteActions({
  requestId,
  totalInr,
  depositInr,
  validUntil,
}: {
  requestId: string;
  totalInr: number;
  depositInr: number;
  validUntil: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [ackIntegrity, setAckIntegrity] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balanceInr = Math.max(0, totalInr - depositInr);

  const isExpired = validUntil
    ? new Date(validUntil).getTime() < Date.now() - 24 * 60 * 60 * 1000
    : false;

  const handleAccept = () => {
    if (!ackIntegrity) {
      setError("Please check the agreement box before accepting the quote.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await acceptQuoteAction({ requestId, ackIntegrity: true });
        router.push(res.redirectUrl);
      } catch (err: any) {
        setError(err.message || "Failed to accept quote");
      }
    });
  };

  const handleDecline = () => {
    if (!window.confirm("Are you sure you want to decline this quote?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await declineQuoteAction({ requestId });
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to decline quote");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/10 p-5 shadow-xs">
      <h3 className="text-base font-display font-bold text-accent">Written Quote Ready</h3>
      <p className="mt-1 text-xs text-ink-2">
        Review the pricing breakdown and milestone schedule below. Work begins after the deposit is received.
      </p>

      <div className="my-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-rule bg-surface p-3.5 shadow-xs">
          <span className="text-xs text-ink-2">Total Price</span>
          <div className="text-lg font-bold text-ink">{formatInr(totalInr)}</div>
        </div>
        <div className="rounded-xl border border-rule bg-surface p-3.5 shadow-xs">
          <span className="text-xs text-ink-2">Deposit to Begin</span>
          <div className="text-lg font-bold text-accent">{formatInr(depositInr)}</div>
        </div>
        <div className="rounded-xl border border-rule bg-surface p-3.5 shadow-xs">
          <span className="text-xs text-ink-2">Balance on Completion</span>
          <div className="text-lg font-bold text-ink">{formatInr(balanceInr)}</div>
        </div>
      </div>

      {validUntil && (
        <p className="mb-4 text-xs text-ink-2">
          Quote valid until: <strong>{formatDate(validUntil)}</strong>
          {isExpired && <span className="ml-2 font-semibold text-rose-700 dark:text-rose-400">(Expired)</span>}
        </p>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400">
          {error}
        </div>
      )}

      {!isExpired ? (
        <div className="space-y-4">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={ackIntegrity}
              onChange={(e) => setAckIntegrity(e.target.checked)}
              className="mt-1 h-4 w-4 rounded-md border-rule text-accent focus:ring-accent"
            />
            <span className="text-xs leading-relaxed text-ink">
              I accept this scope and price and I will take part in each milestone.
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAccept}
              disabled={isPending || !ackIntegrity}
              className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-surface hover:bg-accent-hover disabled:opacity-50 transition-colors shadow-xs"
            >
              {isPending ? "Processing..." : "Accept quote and pay deposit"}
            </button>
            <button
              onClick={handleDecline}
              disabled={isPending}
              className="rounded-xl border border-rule bg-surface px-4 py-2.5 text-xs font-semibold text-ink-2 hover:bg-paper hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-50 transition-colors shadow-xs"
            >
              Decline quote
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-rose-700 dark:text-rose-400">
          This quote has expired. Please send a message below to request an updated quote.
        </p>
      )}
    </div>
  );
}

export function MilestoneInputForm({
  requestId,
  milestoneId,
  initialText,
  instructions,
}: {
  requestId: string;
  milestoneId: string;
  initialText: string | null;
  instructions: string | null;
}) {
  const router = useRouter();
  const [text, setText] = useState(initialText || "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!text.trim()) {
      setError("Input cannot be empty.");
      return;
    }

    startTransition(async () => {
      try {
        await saveMilestoneInputAction({
          requestId,
          milestoneId,
          inputText: text,
        });
        setSaved(true);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to save input");
      }
    });
  };

  return (
    <form onSubmit={handleSave} className="mt-3 space-y-2">
      {instructions && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          <strong>Requested input:</strong> {instructions}
        </div>
      )}

      <div>
        <textarea
          rows={3}
          maxLength={2000}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setSaved(false);
          }}
          placeholder="Provide the required details, preferences, or feedback..."
          className="w-full rounded-xl border border-rule bg-surface p-3 text-xs text-ink placeholder:text-ink-3 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-hidden"
        />
        <div className="flex items-center justify-between text-[11px] text-ink-3">
          <span>{text.length} / 2000 characters</span>
          {saved && <span className="font-semibold text-emerald-600 dark:text-emerald-400">Saved</span>}
        </div>
      </div>

      {error && <p className="text-xs text-rose-700 dark:text-rose-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !text.trim()}
        className="rounded-xl bg-accent px-3.5 py-1.5 text-xs font-semibold text-surface hover:bg-accent-hover transition-colors shadow-xs disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save input"}
      </button>
    </form>
  );
}

export function DownloadFileButton({
  requestId,
  fileId,
  filename,
  isFinal,
  isUnlocked,
}: {
  requestId: string;
  fileId: string;
  filename: string;
  isFinal: boolean;
  isUnlocked: boolean;
}) {
  if (isFinal && !isUnlocked) {
    return (
      <span className="text-xs font-medium text-ink-3 italic">
        Final files are released after the balance is paid.
      </span>
    );
  }

  return (
    <form
      action={`/api/requests/${requestId}/download/${fileId}`}
      method="POST"
      className="inline-block"
    >
      <button
        type="submit"
        className="inline-flex items-center rounded-xl border border-accent/40 bg-surface px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/10 transition-colors shadow-xs"
      >
        Download {filename}
      </button>
    </form>
  );
}

export function MessageThread({
  requestId,
  messages,
  currentUserId,
}: {
  requestId: string;
  messages: Array<{
    id: string;
    sender_id: string;
    body: string;
    created_at: string;
  }>;
  currentUserId: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        await sendMessageAction({
          requestId,
          body,
        });
        setBody("");
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to send message");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-display font-bold text-ink">Discussion Thread</h3>
        <button
          onClick={() => router.refresh()}
          className="text-xs font-semibold text-accent hover:underline"
        >
          Refresh
        </button>
      </div>

      <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-xl border border-rule bg-paper/60 p-4">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-ink-2">
            No messages yet. Use the box below to ask questions or give updates.
          </p>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === currentUserId;
            return (
              <div
                key={m.id}
                className={`rounded-xl border p-3 ${
                  isMe
                    ? "border-accent/30 bg-accent/10 ml-6"
                    : "border-rule bg-surface mr-6"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-ink-3">
                  <span className="font-semibold text-ink">
                    {isMe ? "You" : "Collaborator"}
                  </span>
                  <span>{formatDate(m.created_at)}</span>
                </div>
                <div className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-ink">
                  {m.body}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="space-y-2">
        {error && <p className="text-xs text-rose-700 dark:text-rose-400">{error}</p>}

        <textarea
          rows={3}
          maxLength={4000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message to your project coordinator and builder (up to 4000 characters)..."
          className="w-full rounded-xl border border-rule bg-surface p-3 text-xs text-ink placeholder:text-ink-3 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-hidden"
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-ink-3">
            {body.length} / 4000 characters · Max 20 messages per hour
          </span>
          <button
            type="submit"
            disabled={isPending || !body.trim()}
            className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-surface hover:bg-accent-hover transition-colors shadow-xs disabled:opacity-50"
          >
            {isPending ? "Sending..." : "Send message"}
          </button>
        </div>
      </form>
    </div>
  );
}
