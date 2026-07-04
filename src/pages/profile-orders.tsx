import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CalendarClock, MapPin, PackageCheck, RotateCcw, ShoppingBag } from "lucide-react";
import ProfileShell from "@/components/profile-shell";
import { formatCartMoney } from "@/lib/cart";
import { useAuth } from "@/context/auth-context";
import { getStoredOrders, getUserOrders, type SavedOrder } from "@/lib/orders";

interface ProfileOrdersPageProps {
  cartCount: number;
}

export default function ProfileOrdersPage({ cartCount }: ProfileOrdersPageProps) {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (loading) return () => {
      cancelled = true;
    };

    if (!user) {
      setOrders([]);
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
    <ProfileShell cartCount={cartCount} title="Order History" eyebrow="Past Bun & Bite orders">
      <section className="rounded-3xl border border-white/10 bg-[#111111]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.25)] sm:p-6">
        {loadingOrders ? (
          <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm font-bold text-white/50">
            Loading your orders...
          </p>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <PackageCheck className="mx-auto h-10 w-10 text-[#FF4D2E]" />
            <p className="mt-3 font-black">No orders yet.</p>
            <p className="mt-1 text-sm text-white/40">Your completed checkout confirmations will appear here.</p>
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="mt-5 h-11 rounded-full bg-[#FF3B3B] px-6 text-sm font-black text-white transition-all hover:bg-[#ff5252]"
            >
              Start Ordering
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <article key={order.orderId} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl font-black">{order.orderId}</h2>
                      <StatusBadge status={order.status || "pending"} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-white/50">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                        <ShoppingBag className="h-3.5 w-3.5 text-[#FF4D2E]" />
                        {order.orderType === "pickup" ? "Pick up" : "Delivery"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                        <CalendarClock className="h-3.5 w-3.5 text-[#FF4D2E]" />
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="rounded-xl border border-white/8 bg-[#111111]/70 px-3 py-2">
                          <p className="text-sm font-black text-white">
                            {item.quantity} x {item.name}
                          </p>
                          {item.summary?.length > 0 && (
                            <p className="mt-1 text-xs leading-relaxed text-white/35">
                              {item.summary.join(" / ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-white/45">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4D2E]" />
                      {getOrderLocation(order)}
                    </p>
                  </div>

                  <div className="shrink-0 rounded-2xl border border-white/10 bg-[#111111]/70 p-4 xl:w-56">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">Total</p>
                    <p className="mt-1 font-display text-2xl font-black text-[#FF4D2E]">
                      {formatCartMoney(order.totals.total, "PHP")}
                    </p>
                    <div className="mt-4 grid gap-2">
                      <button
                        type="button"
                        onClick={() => setLocation(`/order-success/${encodeURIComponent(order.orderId)}`)}
                        className="h-10 rounded-full bg-[#FF3B3B] text-xs font-black text-white transition-all hover:bg-[#ff5252]"
                      >
                        View details
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocation("/")}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] text-xs font-black text-white/60 transition-all hover:border-[#FF3B3B]/35 hover:text-white"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Order again
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </ProfileShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full border border-[#FF3B3B]/25 bg-[#FF3B3B]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#FFB4AB]">
      {status.replace(/-/g, " ")}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date pending";
  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getOrderLocation(order: SavedOrder) {
  if (order.orderType === "pickup") {
    return String(order.pickup?.branchName || order.pickup?.branchAddress || "Pickup branch pending");
  }

  const deliveryAddress = (order.delivery?.address || {}) as Record<string, unknown>;
  return String(deliveryAddress.fullAddress || deliveryAddress.line1 || "Delivery address pending");
}
