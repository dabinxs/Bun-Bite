import { useLocation } from "wouter";
import { Bike, MapPin, ShoppingBag, Truck } from "lucide-react";
import Navbar from "@/components/navbar";
import { useAuth } from "@/context/auth-context";
import type { CartItem } from "@/lib/cart";

interface CheckoutTypePageProps {
  cartCount: number;
  cartItems: CartItem[];
}

export default function CheckoutTypePage({ cartCount, cartItems }: CheckoutTypePageProps) {
  const { requireAuth } = useAuth();
  const [, setLocation] = useLocation();
  const hasItems = cartItems.length > 0;

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#050505] text-white">
      <Navbar
        cartCount={cartCount}
        showSearch={false}
      />

      <main className="pb-16 pt-24 md:pt-28">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-[#FF3B3B]/8 blur-[150px]" />

          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto mb-8 max-w-3xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FF8A80]">
                Checkout
              </p>
              <h1 className="mt-3 font-display text-3xl font-black leading-tight sm:text-5xl">
                How would you like to receive your order?
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/50 sm:text-base">
                Choose delivery or pick up. Your cart items will stay saved while you finish the order.
              </p>
            </div>

            {!hasItems && (
              <div className="mx-auto mb-6 max-w-2xl rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-center">
                <ShoppingBag className="mx-auto h-8 w-8 text-[#FF4D2E]" />
                <p className="mt-3 font-black">Your cart is empty.</p>
                <p className="mt-1 text-sm text-white/40">Add items first before choosing a checkout type.</p>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <ChoiceCard
                icon={Truck}
                title="Delivery"
                description="Get your order delivered to your address."
                details={["Delivery address", "Delivery options", "Rider tip and vouchers"]}
                buttonLabel="Continue with Delivery"
                disabled={!hasItems}
                onClick={() => requireAuth(() => setLocation("/checkout/delivery"))}
              />

              <ChoiceCard
                icon={MapPin}
                title="Pick up"
                description="Choose a branch and pick up your order when it is ready."
                details={["Branch selection", "Standard prep time", "Pickup review page"]}
                buttonLabel="Choose Pick up Branch"
                disabled={!hasItems}
                onClick={() => requireAuth(() => setLocation("/checkout/pickup/branches"))}
              />
            </div>

            <button
              type="button"
              onClick={() => setLocation("/")}
              className="mx-auto mt-8 flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-black text-white/65 transition-all hover:border-[#FF3B3B]/35 hover:text-white"
            >
              Continue ordering
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function ChoiceCard({
  icon: Icon,
  title,
  description,
  details,
  buttonLabel,
  disabled,
  onClick,
}: {
  icon: typeof Bike;
  title: string;
  description: string;
  details: string[];
  buttonLabel: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[#111111]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.25)] transition-all hover:border-[#FF3B3B]/35 hover:shadow-[0_0_48px_rgba(255,59,59,0.12)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-black">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/50">{description}</p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#FF3B3B]/20 bg-[#FF3B3B]/12 text-[#FF4D2E]">
          <Icon className="h-7 w-7" />
        </div>
      </div>

      <div className="space-y-2">
        {details.map((detail) => (
          <div key={detail} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm font-bold text-white/65">
            {detail}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="mt-6 h-12 w-full rounded-full bg-[#FF3B3B] px-5 text-sm font-black text-white transition-all hover:bg-[#ff5252] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
      >
        {buttonLabel}
      </button>
    </article>
  );
}
