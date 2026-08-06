import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { buildCartItemSummary, type CartItem } from "@/lib/cart";
import type { AppliedVoucher } from "@/lib/vouchers";

export type OrderType = "delivery" | "pickup";
export type PaymentMethod = "cash_on_delivery" | "cash_on_pickup" | "xendit" | "paymongo";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed";
export type OrderStatus = "pending" | "waiting_payment" | "preparing";

export interface OrderTotals {
  subtotal: number;
  deliveryFee?: number;
  serviceFee: number;
  vat: number;
  tipAmount?: number;
  voucherDiscount?: number;
  total: number;
}

export interface OrderCustomer {
  name: string;
  email: string;
  mobile: string;
}

export interface SavedOrder {
  orderId: string;
  userId: string;
  customer: OrderCustomer;
  orderType: OrderType;
  delivery?: Record<string, unknown>;
  pickup?: Record<string, unknown>;
  items: Array<CartItem & { lineTotal: number; summary: string[] }>;
  totals: OrderTotals;
  voucher?: AppliedVoucher | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  status: "pending";
  createdAt: string;
}

interface CreateOrderInput {
  userId: string;
  customer: OrderCustomer;
  orderType: OrderType;
  delivery?: Record<string, unknown>;
  pickup?: Record<string, unknown>;
  items: CartItem[];
  totals: OrderTotals;
  voucher?: AppliedVoucher | null;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  orderStatus?: OrderStatus;
}

const ORDER_SESSION_PREFIX = "bnb_order_success_";

export function getStoredOrder(orderId: string) {
  try {
    const raw = window.sessionStorage.getItem(`${ORDER_SESSION_PREFIX}${orderId}`);
    return raw ? (JSON.parse(raw) as SavedOrder) : null;
  } catch {
    return null;
  }
}

export function getStoredOrders(userId?: string) {
  try {
    return Object.keys(window.sessionStorage)
      .filter((key) => key.startsWith(ORDER_SESSION_PREFIX))
      .map((key) => JSON.parse(window.sessionStorage.getItem(key) || "") as SavedOrder)
      .filter((order) => !userId || order.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function getUserOrder(userId: string, orderId: string) {
  const orderSnap = await getDoc(doc(db, "users", userId, "orders", orderId));
  return orderSnap.exists() ? normalizeSavedOrder(orderSnap.id, orderSnap.data()) : null;
}

export async function getUserOrders(userId: string) {
  const ordersSnap = await getDocs(
    query(collection(db, "users", userId, "orders"), orderBy("createdAt", "desc")),
  );

  return ordersSnap.docs.map((orderDoc) => normalizeSavedOrder(orderDoc.id, orderDoc.data()));
}

export async function createOrder(input: CreateOrderInput) {
  const orderId = createOrderId();
  const createdAt = new Date().toISOString();
  const order: SavedOrder = {
    orderId,
    userId: input.userId,
    customer: input.customer,
    orderType: input.orderType,
    ...(input.delivery ? { delivery: input.delivery } : {}),
    ...(input.pickup ? { pickup: input.pickup } : {}),
    items: input.items.map((item) => ({
      ...item,
      lineTotal: item.unitPrice * item.quantity,
      summary: buildCartItemSummary(item),
    })),
    totals: input.totals,
    voucher: input.voucher ?? null,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentStatus ?? getDefaultPaymentStatus(input.paymentMethod),
    orderStatus: input.orderStatus ?? getDefaultOrderStatus(input.paymentMethod),
    status: "pending",
    createdAt,
  };

  const firestoreOrder = {
    ...(stripUndefined(order) as Record<string, unknown>),
    customerName: order.customer.name,
    email: order.customer.email,
    mobileNumber: order.customer.mobile,
    deliveryAddress: stripUndefined(input.delivery?.address ?? null),
    selectedBranch: stripUndefined(input.pickup ?? null),
    subtotal: input.totals.subtotal,
    deliveryFee: input.totals.deliveryFee ?? 0,
    serviceFee: input.totals.serviceFee,
    vat: input.totals.vat,
    voucher: input.voucher ?? null,
    voucherCode: input.voucher?.code ?? null,
    voucherDiscount: input.totals.voucherDiscount ?? 0,
    total: input.totals.total,
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, "orders", orderId), firestoreOrder);
  await setDoc(doc(db, "users", input.userId, "orders", orderId), firestoreOrder);

  if (input.voucher?.oneTime) {
    await setDoc(doc(db, "users", input.userId, "voucherRedemptions", input.voucher.code), {
      code: input.voucher.code,
      orderId,
      discountAmount: input.totals.voucherDiscount ?? input.voucher.discountAmount,
      redeemedAt: serverTimestamp(),
    });
  }

  window.sessionStorage.setItem(`${ORDER_SESSION_PREFIX}${orderId}`, JSON.stringify(order));

  return order;
}

function normalizeSavedOrder(orderId: string, data: Record<string, unknown>): SavedOrder {
  const rawCustomer = (data.customer || {}) as Partial<OrderCustomer>;
  const rawTotals = (data.totals || {}) as Partial<OrderTotals>;

  return {
    ...(data as Partial<SavedOrder>),
    orderId: String(data.orderId || orderId),
    userId: String(data.userId || ""),
    customer: {
      name: rawCustomer.name || String(data.customerName || ""),
      email: rawCustomer.email || String(data.email || ""),
      mobile: rawCustomer.mobile || String(data.mobileNumber || ""),
    },
    orderType: data.orderType === "pickup" ? "pickup" : "delivery",
    items: Array.isArray(data.items) ? (data.items as SavedOrder["items"]) : [],
    totals: {
      subtotal: Number(rawTotals.subtotal ?? data.subtotal ?? 0),
      deliveryFee: Number(rawTotals.deliveryFee ?? data.deliveryFee ?? 0),
      serviceFee: Number(rawTotals.serviceFee ?? data.serviceFee ?? 0),
      vat: Number(rawTotals.vat ?? data.vat ?? 0),
      tipAmount: Number(rawTotals.tipAmount ?? 0),
      voucherDiscount: Number(rawTotals.voucherDiscount ?? data.voucherDiscount ?? 0),
      total: Number(rawTotals.total ?? data.total ?? 0),
    },
    voucher: (data.voucher as AppliedVoucher | null | undefined) ?? null,
    paymentMethod: normalizePaymentMethod(data.paymentMethod),
    paymentStatus: normalizePaymentStatus(data.paymentStatus),
    orderStatus: normalizeOrderStatus(data.orderStatus),
    status: "pending",
    createdAt: timestampToString(data.createdAt) || new Date().toISOString(),
  };
}

function timestampToString(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return undefined;
}

export async function clearUserFirestoreCart(userId: string) {
  try {
    const cartSnapshot = await getDocs(collection(db, "users", userId, "cart"));
    await Promise.all(cartSnapshot.docs.map((cartDoc) => deleteDoc(cartDoc.ref)));
  } catch {
    // Firestore cart persistence is optional; do not block a completed order if it is absent.
  }
}

function createOrderId() {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `BB-${timePart}-${randomPart}`;
}

function getDefaultPaymentStatus(paymentMethod: PaymentMethod): PaymentStatus {
  return paymentMethod === "xendit" || paymentMethod === "paymongo" ? "pending" : "unpaid";
}

function getDefaultOrderStatus(paymentMethod: PaymentMethod): OrderStatus {
  return paymentMethod === "xendit" || paymentMethod === "paymongo" ? "waiting_payment" : "pending";
}

function normalizePaymentMethod(value: unknown): PaymentMethod {
  if (value === "cash_on_delivery" || value === "cash_on_pickup" || value === "xendit" || value === "paymongo") {
    return value;
  }

  if (value === "Online Payment" || value === "Xendit") return "xendit";
  if (value === "Cash on Delivery") return "cash_on_delivery";
  if (value === "Cash on Pickup") return "cash_on_pickup";
  return "cash_on_delivery";
}

function normalizePaymentStatus(value: unknown): PaymentStatus {
  if (value === "unpaid" || value === "pending" || value === "paid" || value === "failed") {
    return value;
  }

  return "unpaid";
}

function normalizeOrderStatus(value: unknown): OrderStatus {
  if (value === "pending" || value === "waiting_payment" || value === "preparing") {
    return value;
  }

  return "pending";
}

function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripUndefined);

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, stripUndefined(entryValue)]),
    );
  }

  return value;
}
