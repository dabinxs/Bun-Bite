import { Ticket, X } from "lucide-react";
import { formatCartMoney, type CartCurrency } from "@/lib/cart";
import type { AppliedVoucher } from "@/lib/vouchers";

interface VoucherBoxProps {
  code: string;
  currency?: CartCurrency;
  appliedVoucher: AppliedVoucher | null;
  discountAmount: number;
  error: string;
  message: string;
  disabled?: boolean;
  onCodeChange: (code: string) => void;
  onApply: () => void;
  onRemove: () => void;
}

export default function VoucherBox({
  code,
  currency = "PHP",
  appliedVoucher,
  discountAmount,
  error,
  message,
  disabled = false,
  onCodeChange,
  onApply,
  onRemove,
}: VoucherBoxProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-black text-white/75">
        <Ticket className="h-5 w-5 text-[#FF4D2E]" />
        Apply voucher
      </div>

      {appliedVoucher ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">{appliedVoucher.code}</p>
            <p className="mt-0.5 text-xs text-emerald-200">
              Saved {formatCartMoney(discountAmount, currency)}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/55 transition-all hover:border-[#FF3B3B]/45 hover:text-white"
            aria-label="Remove voucher"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={code}
            onChange={(event) => onCodeChange(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === "Enter") onApply();
            }}
            placeholder="BUNBITE50"
            className="h-11 min-w-0 flex-1 rounded-full border border-white/10 bg-black/30 px-4 text-sm font-black uppercase tracking-[0.06em] text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#FF3B3B]/45"
          />
          <button
            type="button"
            onClick={onApply}
            disabled={disabled}
            className="h-11 rounded-full border border-[#FF3B3B]/35 bg-[#FF3B3B]/15 px-5 text-sm font-black text-white transition-all hover:bg-[#FF3B3B]/25 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Apply
          </button>
        </div>
      )}

      {(message || error) && (
        <p className={`mt-2 text-xs font-bold ${error ? "text-[#FFB4AB]" : "text-emerald-200"}`}>
          {error || message}
        </p>
      )}
    </div>
  );
}
