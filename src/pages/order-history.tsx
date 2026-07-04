import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Clock, Home, PackageCheck, ReceiptText, ShoppingBag } from "lucide-react";
import Navbar from "@/components/navbar";
import { formatCartMoney } from "@/lib/cart";
import { useAuth } from "@/context/auth-context";
import { getStoredOrders, getUserOrders, type SavedOrder } from "@/lib/orders";

interface OrderHistoryPageProps {
  cartCount: number;
}

export default function OrderHistoryPage({ cartCount }: OrderHistoryPageProps) {
  const [, setLocation] = useLocation();
  const { user, loading, openAuthModal } = useAuth();
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (loading) return () => {
      cancelled = true;
    };

    if (!user) {
      setOrders([]);
      setLoadingOrders(false);
      return () => {
        cancelled = true;
      };
    }

    setLoadingOrders(true);
    getUserOrders(user.uid)
      .then((userOrders) => {
        if (!cancelled) setOrders(userOrders);
      })
      .catch(() => {
        if (!cancelled) setOrders(getStoredOrders(user.uid));
      })
      .finally(() => {
        if (!cancelled) setLoadingOrders(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#050505] text-white">
      <Navbar cartCount={cartCount} showSearch={false} />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 md:pt-28">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FF8A80]">
              Account orders
            </p>
            <h1 className="mt-2 font-display text-3xl font-black sm:text-5xl">
              Order History
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
              Your latest completed checkout confirmations are saved here for this browser session.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setLocation("/")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-black text-white/70 transition-all hover:border-[#FF3B3B]/35 hover:text-white"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </button>
        </div>

        {!user && !loading ? (
          <section className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-8 text-center shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#FF3B3B]/25 bg-[#FF3B3B]/10">
              <ReceiptText className="h-8 w-8 text-[#FF4D2E]" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-black">Login to view your orders</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/45">
              Order history is private and only loads from the currently logged-in account.
            </p>
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#FF3B3B] px-7 text-sm font-black text-white transition-all hover:bg-[#ff5252]"
            >
              Login
            </button>
          </section>
        ) : loadingOrders ? (
          <section className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-8 text-center shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
            <p className="font-black text-white">Loading your order history...</p>
          </section>
        ) : orders.length === 0 ? (
          <section className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-8 text-center shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#FF3B3B]/25 bg-[#FF3B3B]/10">
              <ReceiptText className="h-8 w-8 text-[#FF4D2E]" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-black">No orders yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/45">
              Once you place an order, the confirmation will appear here with its reference number.
            </p>
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#FF3B3B] px-7 text-sm font-black text-white transition-all hover:bg-[#ff5252]"
            >
              Start Ordering
            </button>
          </section>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <article
                key={order.orderId}
                className="rounded-[1.5rem] border border-white/10 bg-[#111111]/90 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.25)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">
                      Reference
                    </p>
                    <h2 className="mt-1 truncate font-display text-xl font-black text-white">
                      {order.orderId}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-white/55">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                        <ShoppingBag className="h-3.5 w-3.5 text-[#FF4D2E]" />
                        {order.orderType === "pickup" ? "Pick up" : "Delivery"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                        <Clock className="h-3.5 w-3.5 text-[#FF4D2E]" />
                        Pending
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                        <PackageCheck className="h-3.5 w-3.5 text-[#FF4D2E]" />
                        {order.items.length} item{order.items.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">
                        Total
                      </p>
                      <p className="mt-1 font-display text-2xl font-black text-[#FF4D2E]">
                        {formatCartMoney(order.totals.total, "PHP")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocation(`/order-success/${encodeURIComponent(order.orderId)}`)}
                      className="inline-flex h-11 items-center justify-center rounded-full bg-[#FF3B3B] px-5 text-sm font-black text-white transition-all hover:bg-[#ff5252]"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
