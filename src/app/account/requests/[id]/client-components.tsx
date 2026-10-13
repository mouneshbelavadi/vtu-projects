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
    <div className="rounded-[6px] border border-[#DDD9D0] bg-[#E6F3EA] p-5">
      <h3 className="text-[16px] font-bold text-[#1E6B3C]">Written Quote Ready</h3>
      <p className="mt-1 text-[13px] text-[#4A5058]">
        Review the pricing breakdown and milestone schedule below. Work begins after the deposit is received.
      </p>

      <div className="my-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[4px] border border-[#DDD9D0] bg-[#FFFFFF] p-3">
          <span className="text-[12px] text-[#5F6670]">Total Price</span>
          <div className="text-[18px] font-bold text-[#17191C]">{formatInr(totalInr)}</div>
        </div>
        <div className="rounded-[4px] border border-[#DDD9D0] bg-[#FFFFFF] p-3">
          <span className="text-[12px] text-[#5F6670]">Deposit to Begin</span>
          <div className="text-[18px] font-bold text-[#0B5D4B]">{formatInr(depositInr)}</div>
        </div>
        <div className="rounded-[4px] border border-[#DDD9D0] bg-[#FFFFFF] p-3">
          <span className="text-[12px] text-[#5F6670]">Balance on Completion</span>
          <div className="text-[18px] font-bold text-[#17191C]">{formatInr(balanceInr)}</div>
        </div>
      </div>

      {validUntil && (
        <p className="mb-4 text-[12px] text-[#5F6670]">
          Quote valid until: <strong>{formatDate(validUntil)}</strong>
          {isExpired && <span className="ml-2 font-semibold text-[#A12B2B]">(Expired)</span>}
        </p>
      )}

      {error && (
        <div className="mb-4 rounded-[4px] border border-[#DDD9D0] bg-[#FBE9E7] p-3 text-[13px] text-[#A12B2B]">
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
              className="mt-1 h-4 w-4 rounded border-[#DDD9D0] text-[#0B5D4B] focus:ring-[#0B5D4B]"
            />
            <span className="text-[13px] leading-relaxed text-[#17191C]">
              I accept this scope and price and I will take part in each milestone.
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAccept}
              disabled={isPending || !ackIntegrity}
              className="rounded-[6px] bg-[#0B5D4B] px-5 py-2.5 text-[14px] font-semibold text-[#FFFFFF] hover:bg-[#084A3C] disabled:opacity-50"
            >
              {isPending ? "Processing..." : "Accept quote and pay deposit"}
            </button>
            <button
              onClick={handleDecline}
              disabled={isPending}
              className="rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] px-4 py-2.5 text-[14px] font-semibold text-[#5F6670] hover:bg-[#FBFAF7] hover:text-[#A12B2B] disabled:opacity-50"
            >
              Decline quote
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-[#A12B2B]">
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
        <div className="rounded-[4px] border border-[#DDD9D0] bg-[#FFF4D6] p-2.5 text-[12px] text-[#6B4700]">
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
          className="w-full rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-2.5 text-[13px] text-[#17191C] focus:border-[#0B5D4B] focus:outline-none"
        />
        <div className="flex items-center justify-between text-[11px] text-[#5F6670]">
          <span>{text.length} / 2000 characters</span>
          {saved && <span className="font-semibold text-[#1E6B3C]">Saved</span>}
        </div>
      </div>

      {error && <p className="text-[12px] text-[#A12B2B]">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !text.trim()}
        className="rounded-[4px] bg-[#0B5D4B] px-3 py-1.5 text-[12px] font-semibold text-[#FFFFFF] hover:bg-[#084A3C] disabled:opacity-50"
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
      <span className="text-[12px] font-medium text-[#5F6670] italic">
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
        className="inline-flex items-center rounded-[4px] border border-[#0B5D4B] bg-[#FFFFFF] px-3 py-1 text-[12px] font-semibold text-[#0B5D4B] hover:bg-[#FBFAF7]"
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
        <h3 className="text-[15px] font-bold text-[#17191C]">Discussion Thread</h3>
        <button
          onClick={() => router.refresh()}
          className="text-[12px] font-semibold text-[#0B5D4B] hover:underline"
        >
          Refresh
        </button>
      </div>

      <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-[6px] border border-[#DDD9D0] bg-[#FBFAF7] p-4">
        {messages.length === 0 ? (
          <p className="text-center text-[13px] text-[#5F6670]">
            No messages yet. Use the box below to ask questions or give updates.
          </p>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === currentUserId;
            return (
              <div
                key={m.id}
                className={`rounded-[4px] border p-3 ${
                  isMe
                    ? "border-[#DDD9D0] bg-[#E4F0EC] ml-6"
                    : "border-[#DDD9D0] bg-[#FFFFFF] mr-6"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-[#5F6670]">
                  <span className="font-semibold text-[#17191C]">
                    {isMe ? "You" : "Collaborator"}
                  </span>
                  <span>{formatDate(m.created_at)}</span>
                </div>
                <div className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-[#17191C]">
                  {m.body}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="space-y-2">
        {error && <p className="text-[12px] text-[#A12B2B]">{error}</p>}

        <textarea
          rows={3}
          maxLength={4000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message to your project coordinator and builder (up to 4000 characters)..."
          className="w-full rounded-[6px] border border-[#DDD9D0] bg-[#FFFFFF] p-2.5 text-[13px] text-[#17191C] focus:border-[#0B5D4B] focus:outline-none"
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#5F6670]">
            {body.length} / 4000 characters · Max 20 messages per hour
          </span>
          <button
            type="submit"
            disabled={isPending || !body.trim()}
            className="rounded-[6px] bg-[#0B5D4B] px-4 py-1.5 text-[13px] font-semibold text-[#FFFFFF] hover:bg-[#084A3C] disabled:opacity-50"
          >
            {isPending ? "Sending..." : "Send message"}
          </button>
        </div>
      </form>
    </div>
  );
}
