import type { Car } from "@/types/domain";
import { formatDateTime } from "@/utils/date";
import { guestLink } from "@/services/sms";

/**
 * Printable white ticket slip (legacy design). Rendered inside the ticket
 * modal; the `print-slip` class scopes what window.print() outputs.
 */
export function TicketSlip({ car }: { car: Car }) {
  return (
    <div className="print-slip relative overflow-hidden rounded-lg bg-white p-5 font-mono text-neutral-900">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold via-gold-light to-gold" />

      <div className="mb-3 flex items-center justify-between border-b border-dashed border-neutral-300 pb-2.5">
        <div>
          <div className="font-serif text-[15px] font-semibold uppercase tracking-[0.25em]">
            Valet
          </div>
          <div className="mt-0.5 text-[7px] uppercase tracking-[0.2em] text-neutral-400">
            Premium Car Service
          </div>
        </div>
        <div className="text-[9px] text-neutral-400">
          {formatDateTime(new Date(car.timestamp))}
        </div>
      </div>

      <div className="mb-2.5 grid grid-cols-2 gap-2.5">
        <SlipField label="Ticket" value={`#${car.id}`} />
        <SlipField label="Slot" value={car.slot} gold />
        <SlipField label="Guest" value={car.guest} />
        <SlipField label="Room" value={`Room ${car.room}`} />
        <SlipField label="Plate" value={car.plate} />
        <SlipField label="Vehicle" value={`${car.make} ${car.model} · ${car.color}`} />
      </div>

      <div className="mb-2.5 rounded-md bg-neutral-900 px-3 py-2.5 text-center">
        <div className="mb-1 text-[7px] uppercase tracking-[0.2em] text-neutral-400">
          One-Time Password
        </div>
        <div className="text-[28px] font-bold tracking-[0.3em] text-gold">
          {car.otp}
        </div>
      </div>

      <div className="mb-2.5 rounded border border-dashed border-neutral-300 bg-neutral-50 px-2.5 py-2">
        <div className="mb-0.5 text-[7px] uppercase tracking-[0.2em] text-neutral-400">
          Guest Checkout Link
        </div>
        <div className="break-all text-[9px] text-neutral-500">
          {guestLink(car.id)}
        </div>
      </div>

      <div className="border-t border-dashed border-neutral-300 pt-2 text-center text-[8px] text-neutral-400">
        SMS sent to guest · Staff copy
      </div>
    </div>
  );
}

function SlipField({
  label,
  value,
  gold,
}: {
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[7px] uppercase tracking-[0.2em] text-neutral-400">
        {label}
      </span>
      <span
        className={
          gold ? "text-[15px] font-semibold text-gold-dim" : "text-[11px] font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}
