"use client";

import { useActionState, useState } from "react";
import { bookSlotAction, type BookSlotState } from "./actions";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatInr, formatISTSlotRange } from "@/lib/format";

export interface SlotGroup {
  dateLabel: string;
  slots: {
    id: string;
    starts_at: string;
    ends_at: string;
  }[];
}

interface BookingFormProps {
  tierId: string;
  tierName: string;
  priceInr: number;
  sessionMinutes: number;
  slotGroups: SlotGroup[];
}

export function BookingForm({
  tierId,
  tierName,
  priceInr,
  sessionMinutes,
  slotGroups,
}: BookingFormProps) {
  const [state, formAction, isPending] = useActionState<BookSlotState, FormData>(
    bookSlotAction,
    { status: "idle" }
  );

  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [acknowledged, setAcknowledged] = useState<boolean>(false);

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="tierId" value={tierId} />
      <input type="hidden" name="slotId" value={selectedSlotId} />
      <input
        type="hidden"
        name="ack_integrity"
        value={acknowledged ? "true" : "false"}
      />

      {state.status === "error" && state.errorMessage && (
        <Alert variant="error" title="Could not complete booking">
          {state.errorMessage}
        </Alert>
      )}

      {/* Summary card */}
      <Card className="p-6 bg-paper border border-rule">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-ink">{tierName}</h2>
            <p className="text-sm text-ink-2 mt-1">
              Live one-to-one session - {sessionMinutes} minutes
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-mono font-bold text-ink">
              {formatInr(priceInr)}
            </span>
          </div>
        </div>
      </Card>

      {/* Slot selection */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-serif font-bold text-ink">
            Choose a date and time (IST)
          </h2>
          <p className="text-sm text-ink-2 mt-1">
            All session timings are displayed in Indian Standard Time (IST). Select a convenient slot below:
          </p>
        </div>

        {slotGroups.length === 0 ? (
          <Card className="p-8 text-center bg-paper border border-rule">
            <p className="text-sm text-ink-2">
              No available slots in the next 30 days. Please check back later.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {slotGroups.map((group) => (
              <div key={group.dateLabel} className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-3">
                  {group.dateLabel}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {group.slots.map((slot) => {
                    const isSelected = selectedSlotId === slot.id;
                    const timeRangeLabel = formatISTSlotRange(
                      slot.starts_at,
                      slot.ends_at
                    );

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`text-left p-3.5 rounded-md border text-sm font-mono transition-colors min-h-[44px] ${
                          isSelected
                            ? "border-accent bg-accent-weak text-ink font-semibold"
                            : "border-rule bg-surface text-ink hover:border-rule-strong"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{timeRangeLabel}</span>
                          <span
                            className={`inline-block w-3.5 h-3.5 rounded-sm border ${
                              isSelected
                                ? "border-accent bg-accent"
                                : "border-rule bg-surface"
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Academic integrity acknowledgement checkbox */}
      <div className="border-t border-rule pt-6 space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="ack_integrity"
            checked={acknowledged}
            onCheckedChange={(checked) => setAcknowledged(Boolean(checked))}
            className="mt-0.5"
          />
          <label
            htmlFor="ack_integrity"
            className="text-sm text-ink-2 cursor-pointer leading-normal select-none"
          >
            I confirm that I will follow my college and VTU rules, that this work is for learning and reference, and that I will write and explain my own project submission.
          </label>
        </div>

        <p className="text-xs text-ink-3">
          Note: Selecting a time holds the slot for 2 hours while you complete UPI payment. The meeting link is released once our team verifies your payment.
        </p>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isPending}
          disabled={!selectedSlotId || !acknowledged || isPending}
          className="w-full sm:w-auto"
        >
          {isPending ? "Holding slot..." : "Continue to UPI payment"}
        </Button>
      </div>
    </form>
  );
}
