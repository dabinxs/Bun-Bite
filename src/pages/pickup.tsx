import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShoppingBag,
  Truck,
} from "lucide-react";
import Navbar from "@/components/navbar";
import { useAuth } from "@/context/auth-context";
import { PICKUP_BRANCHES } from "@/lib/pickup";

interface PickupPageProps {
  cartCount: number;
  checkoutMode?: boolean;
}

export default function PickupPage({ cartCount, checkoutMode = false }: PickupPageProps) {
  const { requireAuth } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white overflow-x-hidden">
      <Navbar cartCount={cartCount} showSearch={false} />

      <main className="pt-24 pb-16">
        <section className="relative overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-[#FF3B3B]/8 blur-[150px] pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="max-w-3xl">
                <p className="text-[#FF3B3B] font-bold tracking-[0.2em] uppercase text-xs mb-2">
                  {checkoutMode ? "Pickup Checkout" : "Pickup Branches"}
                </p>
                <h1 className="font-display text-4xl md:text-6xl font-black leading-tight">
                  {checkoutMode ? "Choose a pickup branch" : "Pick up your order"}
                </h1>
                <p className="mt-4 max-w-2xl text-white/50 text-sm md:text-base leading-relaxed">
                  {checkoutMode
                    ? "Select where you want to pick up the cart items you are checking out."
                    : "Choose your nearest Bun & Bite branch and pick up your food when it is ready."}
                </p>
              </div>

              <div className="inline-flex w-full rounded-full border border-white/10 bg-[#111111]/80 p-1 sm:w-auto">
                <button className="flex-1 rounded-full bg-[#FF3B3B] px-5 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(255,59,59,0.28)] sm:flex-none">
                  {checkoutMode ? "Checkout pickup" : "Pickup"}
                </button>
                <button
                  onClick={() => checkoutMode && setLocation("/checkout/type")}
                  className="flex-1 rounded-full px-5 py-3 text-sm font-bold text-white/40 hover:text-white/60 sm:flex-none"
                >
                  {checkoutMode ? "Change type" : "Delivery"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {PICKUP_BRANCHES.map((branch, index) => (
                <motion.article
                  key={branch.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.45 }}
                  className="group rounded-3xl border border-white/8 bg-[#111111]/85 p-5 sm:p-6 hover:border-[#FF3B3B]/35 hover:shadow-[0_0_44px_rgba(255,59,59,0.12)] transition-all duration-300"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="font-display text-xl font-black leading-tight">
                        {branch.name}
                      </h2>
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {branch.status}
                      </div>
                    </div>
                    <div className="h-12 w-12 shrink-0 rounded-2xl border border-[#FF3B3B]/20 bg-[#FF3B3B]/12 flex items-center justify-center text-[#FF4D2E]">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <BranchInfo icon={MapPin} label="Address" value={branch.address} />
                    <BranchInfo icon={Clock} label="Hours" value={branch.hours} />
                    <BranchInfo icon={Phone} label="Contact" value={branch.contact} />
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <StatusTile icon={ShoppingBag} label="Pickup" value={branch.pickup} />
                    <StatusTile icon={Clock} label="Prep Time" value={branch.prepTime} />
                  </div>

                  <div className="mt-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-[#FF4D2E]" />
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/35">
                        Delivery
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-bold text-white">{branch.delivery}</p>
                  </div>

                  <button
                    onClick={() =>
                      requireAuth(() =>
                        setLocation(
                          checkoutMode
                            ? `/checkout/pickup/${branch.id}/review`
                            : `/pickup/${branch.id}`
                        )
                      )
                    }
                    className="mt-6 h-12 w-full rounded-full bg-[#FF3B3B] px-5 text-sm font-black text-white hover:bg-[#ff5252] active:scale-[0.98] transition-all"
                  >
                    {checkoutMode ? "Review pickup order" : "Choose Branch"}
                  </button>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function BranchInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 h-9 w-9 shrink-0 rounded-xl border border-white/8 bg-white/[0.04] flex items-center justify-center text-[#FF4D2E]">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">
          {label}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-white/70 break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatusTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShoppingBag;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#FF3B3B]/20 bg-[#FF3B3B]/8 px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#FF4D2E]" />
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/35">
          {label}
        </p>
      </div>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
    </div>
  );
}
