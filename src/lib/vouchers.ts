import type { OrderType } from "@/lib/orders";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type VoucherType = "fixed" | "percentage" | "freeDelivery";

export interface VoucherDefinition {
  code: string;
  type: VoucherType;
  value: number;
  minSpend: number;
  maxDiscount?: number;
  isActive: boolean;
  deliveryOnly?: boolean;
  oneTime?: boolean;
  expiresAt?: string;
  usageLimit?: number;
  usedBy?: string[];
  label: string;
}

export interface AppliedVoucher extends VoucherDefinition {
  discountAmount: number;
}

interface ValidateVoucherInput {
  code: string;
  subtotal: number;
  deliveryFee?: number;
  orderType: OrderType;
  userId?: string;
}

export const VOUCHERS: VoucherDefinition[] = [
  {
    code: "BUNBITE50",
    type: "fixed",
    value: 50,
    minSpend: 300,
    isActive: true,
    label: "₱50 off orders ₱300+",
  },
  {
    code: "FREEDELIVERY",
    type: "freeDelivery",
    value: 0,
    minSpend: 0,
    isActive: true,
    deliveryOnly: true,
    label: "Free delivery fee",
  },
  {
    code: "FIRSTBITE20",
    type: "percentage",
    value: 20,
    minSpend: 0,
    maxDiscount: 100,
    isActive: true,
    oneTime: true,
    label: "20% off, up to ₱100",
  },
];

export function validateVoucher({
  code,
  subtotal,
  deliveryFee = 0,
  orderType,
  userId,
}: ValidateVoucherInput) {
  const cleanCode = code.trim().toUpperCase();

  if (!cleanCode) {
    return { ok: false, message: "Enter a voucher code first." } as const;
  }

  const voucher = VOUCHERS.find((item) => item.code === cleanCode);

  if (!voucher) {
    return { ok: false, message: "That voucher code is not valid." } as const;
  }

  if (!voucher.isActive) {
    return { ok: false, message: "That voucher is not active right now." } as const;
  }

  if (voucher.expiresAt && new Date(voucher.expiresAt).getTime() < Date.now()) {
    return { ok: false, message: "That voucher has expired." } as const;
  }

  if (voucher.deliveryOnly && orderType !== "delivery") {
    return { ok: false, message: "That voucher is only for delivery orders." } as const;
  }

  if (subtotal < voucher.minSpend) {
    return {
      ok: false,
      message: `Add ${formatVoucherMoney(voucher.minSpend - subtotal)} more to use ${voucher.code}.`,
    } as const;
  }

  if (userId && voucher.usedBy?.includes(userId)) {
    return { ok: false, message: "This voucher was already used by this account." } as const;
  }

  const discountAmount = calculateVoucherDiscount(voucher, subtotal, deliveryFee, orderType);

  if (discountAmount <= 0) {
    return { ok: false, message: "This voucher cannot be applied to this order." } as const;
  }

  return {
    ok: true,
    message: `${voucher.code} applied successfully.`,
    voucher: {
      ...voucher,
      discountAmount,
    },
  } as const;
}

export function calculateVoucherDiscount(
  voucher: VoucherDefinition | AppliedVoucher,
  subtotal: number,
  deliveryFee = 0,
  orderType: OrderType,
) {
  if (!voucher.isActive || subtotal < voucher.minSpend) return 0;
  if (voucher.deliveryOnly && orderType !== "delivery") return 0;

  if (voucher.type === "freeDelivery") {
    return Math.max(0, deliveryFee);
  }

  if (voucher.type === "percentage") {
    const discount = subtotal * (voucher.value / 100);
    return Math.min(discount, voucher.maxDiscount ?? discount, subtotal);
  }

  return Math.min(voucher.value, subtotal);
}

export async function hasUserRedeemedVoucher(userId: string, code: string) {
  const redemptionSnap = await getDoc(doc(db, "users", userId, "voucherRedemptions", code.toUpperCase()));
  return redemptionSnap.exists();
}

function formatVoucherMoney(value: number) {
  const amount = Math.max(0, Math.round((value + Number.EPSILON) * 100) / 100);
  return Number.isInteger(amount) ? `₱${amount}` : `₱${amount.toFixed(2)}`;
}
