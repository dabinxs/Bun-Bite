import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Home, PackageCheck, RotateCcw, ShoppingBag } from "lucide-react";
import Navbar from "@/components/navbar";
import { formatCartMoney } from "@/lib/cart";
import { useAuth } from "@/context/auth-context";
import { getStoredOrder, getUserOrder, type SavedOrder } from "@/lib/orders";

interface OrderSuccessPageProps {
  cartCount: number;
}

export default function OrderSuccessPage({ cartCount }: OrderSuccessPageProps) {
  const [location, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const orderId = decodeURIComponent(location.split("/").filter(Boolean)[1] || "");
  const [order, setOrder] = useState<SavedOrder | null>(null);
  const orderType = order?.orderType === "pickup" ? "Pick up" : "Delivery";
  const estimatedTime =
    order?.pickup?.estimatedTime?.toString() ||
    order?.delivery?.estimatedTime?.toString() ||
    "Pending branch confirmation";

  useEffect(() => {
    let cancelled = false;

    if (loading) {
      return () => {
        cancelled = true;
      };
    }

    if (!user || !orderId) {
      setOrder(null);
      return () => {
        cancelled = true;
      };
    }

    const storedOrder = getStoredOrder(orderId);

    if (storedOrder?.userId === user.uid) {
      setOrder(storedOrder);
      return () => {
        cancelled = true;
      };
    }

    getUserOrder(user.uid, orderId)
      .then((userOrder) => {
        if (!cancelled) setOrder(userOrder);
      })
      .catch(() => {
        if (!cancelled) setOrder(null);
      });

    return () => {
      cancelled = true;
    };
  }, [loading, orderId, user]);

  const goHome = () => setLocation("/");
  const viewOrderHistory = () => setLocation("/order-history");
  const orderAgain = () => {
    setLocation("/");
    window.setTimeout(() => {
      document.getElementById("menu")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#050505] text-white">
      <Navbar cartCount={cartCount} showSearch={false} />

      <main className="px-4 pb-16 pt-24 sm:px-6 md:pt-28">
        <section className="relative mx-auto flex max-w-5xl flex-col items-center overflow-hidden rounded-[2rem] border border-white/10 bg-[#111111]/90 p-6 text-center shadow-[0_24px_90px_rgba(0,0,0,0.45)] sm:p-8 md:p-10">
          <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-[#FF3B3B]/15 blur-[95px]" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#FF8A00]/10 blur-[100px]" />

          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 15 }}
            className="relative flex h-28 w-28 items-center justify-center rounded-full border border-[#FF3B3B]/30 bg-[#FF3B3B]/10 shadow-[0_0_50px_rgba(255,59,59,0.22)]"
          >
            <motion.span
              className="absolute inset-3 rounded-full border border-[#FF3B3B]/30"
              animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0.15, 0.8] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <CheckCircle2 className="relative h-14 w-14 text-[#FF4D2E]" />
          </motion.div>

          <div className="relative mt-7 max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FF8A80]">
              Checkout complete
            </p>
            <h1 className="mt-3 font-display text-3xl font-black leading-tight sm:text-5xl">
              Your order has been placed successfully!
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/50 sm:text-base">
              We received your Bun & Bite order. Your branch will confirm and prepare it shortly.
            </p>
          </div>

          <div className="relative mt-8 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryTile label="Order reference" value={orderId || "Unavailable"} icon={PackageCheck} />
            <SummaryTile label="Order type" value={orderType} icon={ShoppingBag} />
            <SummaryTile label="Status" value="Pending" icon={Clock} />
            <SummaryTile
              label="Total amount"
              value={order ? formatCartMoney(order.totals.total, "PHP") : "Pending"}
              icon={CheckCircle2}
            />
          </div>

          <div className="relative mt-5 w-full rounded-3xl border border-white/10 bg-black/25 p-5 text-left">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">
                  Estimated time
                </p>
                <p className="mt-2 font-display text-xl font-black text-white">{estimatedTime}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">
                  Customer
                </p>
                <p className="mt-2 text-sm font-bold text-white/75">
                  {order?.customer.name || "Saved to your account"}
                </p>
                {order?.customer.email && (
                  <p className="mt-1 text-xs text-white/35">{order.customer.email}</p>
                )}
              </div>
            </div>
          </div>

          <div className="relative mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={goHome}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 text-sm font-black text-white/70 transition-all hover:border-[#FF3B3B]/35 hover:text-white"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </button>
            <button
              type="button"
              onClick={viewOrderHistory}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 text-sm font-black text-white/70 transition-all hover:border-[#FF3B3B]/35 hover:text-white"
            >
              <PackageCheck className="h-4 w-4" />
              View Order History
            </button>
            <button
              type="button"
              onClick={orderAgain}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#FF3B3B] px-6 text-sm font-black text-white transition-all hover:bg-[#ff5252]"
            >
              <RotateCcw className="h-4 w-4" />
              Order Again
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/25 p-4 text-left">
      <Icon className="h-5 w-5 text-[#FF4D2E]" />
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-white sm:text-base">{value}</p>
    </div>
  );
}
