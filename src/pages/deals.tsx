import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Flame,
  Plus,
  Sparkles,
  Star,
  Tag,
  XCircle,
} from "lucide-react";
import Navbar from "@/components/navbar";
import { useAuth } from "@/context/auth-context";
import { formatCartMoney, type CartItem } from "@/lib/cart";

type DealCategory = "all" | "burger" | "drink" | "family" | "combo";
type DealStatus = "Available" | "Limited" | "Sold out" | "Expired";

interface DealsPageProps {
  cartCount: number;
  addToCart: (item: Omit<CartItem, "id">) => void;
}

interface DealProduct {
  id: number;
  name: string;
  description: string;
  includes: string;
  image: string;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  status: DealStatus;
  category: Exclude<DealCategory, "all">;
  badge: string;
  endsLabel: string;
}

const DEAL_TABS: Array<{ id: DealCategory; label: string }> = [
  { id: "all", label: "All Deals" },
  { id: "burger", label: "Burger Deals" },
  { id: "drink", label: "Drink Deals" },
  { id: "family", label: "Family Deals" },
  { id: "combo", label: "Combo Deals" },
];

const DEAL_PRODUCTS: DealProduct[] = [
  {
    id: 9001,
    name: "Classic Burger Combo",
    description: "A complete Bun & Bite favorite with crispy sides and a cool drink.",
    includes: "Classic Burger + Fries + Iced Tea",
    image: "/images/classic.jpg",
    originalPrice: 199,
    discountedPrice: 149,
    discount: 25,
    status: "Available",
    category: "combo",
    badge: "Combo deal",
    endsLabel: "Ends soon",
  },
  {
    id: 9002,
    name: "Spicy Burger Deal",
    description: "A bold spicy burger paired with a refreshing drink.",
    includes: "Spicy Burger + Drink",
    image: "/images/spicy.jpg",
    originalPrice: 179,
    discountedPrice: 129,
    discount: 28,
    status: "Available",
    category: "burger",
    badge: "Hot pick",
    endsLabel: "Today only",
  },
  {
    id: 9003,
    name: "Family Burger Bundle",
    description: "Built for sharing with big servings and better value.",
    includes: "4 Burgers + Large Fries + 4 Drinks",
    image: "/images/family/feast.png",
    originalPrice: 699,
    discountedPrice: 499,
    discount: 29,
    status: "Limited",
    category: "family",
    badge: "Limited bundle",
    endsLabel: "Few left",
  },
  {
    id: 9004,
    name: "Sweet Treat Combo",
    description: "Dessert and shake favorites for a sweet finish.",
    includes: "Brownies + Sundae + Chocolate Shake",
    image: "/images/desserts/sundae.png",
    originalPrice: 249,
    discountedPrice: 189,
    discount: 24,
    status: "Available",
    category: "drink",
    badge: "Sweet deal",
    endsLabel: "Limited time",
  },
  {
    id: 9005,
    name: "Double Burger Saver",
    description: "Two stacked burgers with a deal price for hungry days.",
    includes: "2 Smoky BBQ Burgers + Regular Fries",
    image: "/images/smoky.jpg",
    originalPrice: 299,
    discountedPrice: 229,
    discount: 23,
    status: "Sold out",
    category: "burger",
    badge: "Sold out",
    endsLabel: "Returns soon",
  },
];

export default function DealsPage({ cartCount, addToCart }: DealsPageProps) {
  const { requireAuth } = useAuth();
  const [activeCategory, setActiveCategory] = useState<DealCategory>("all");
  const [addedDealId, setAddedDealId] = useState<number | null>(null);
  const [expandedDealIds, setExpandedDealIds] = useState<Set<number>>(new Set());
  const [touchedDealExpand, setTouchedDealExpand] = useState<Set<number>>(new Set());

  const visibleDeals = useMemo(() => {
    return DEAL_PRODUCTS.filter((deal) => {
      if (deal.status === "Expired") return false;
      return activeCategory === "all" || deal.category === activeCategory;
    });
  }, [activeCategory]);

  const counts = useMemo(() => {
    return DEAL_TABS.reduce<Record<DealCategory, number>>(
      (result, tab) => {
        result[tab.id] = DEAL_PRODUCTS.filter((deal) => {
          if (deal.status === "Expired") return false;
          return tab.id === "all" || deal.category === tab.id;
        }).length;
        return result;
      },
      { all: 0, burger: 0, drink: 0, family: 0, combo: 0 },
    );
  }, []);

  const toggleDealExpand = (id: number) => {
    setExpandedDealIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setTouchedDealExpand((prev) => new Set(prev).add(id));
  };

  const addDeal = (deal: DealProduct) => {
    if (deal.status === "Sold out" || deal.status === "Expired") return;

    addToCart({
      productId: deal.id,
      name: deal.name,
      image: deal.image,
      badge: deal.badge,
      size: "Promo Deal",
      addOns: [deal.includes],
      quantity: 1,
      unitPrice: deal.discountedPrice,
      originalPrice: deal.originalPrice,
      isDeal: true,
      discountLabel: `Save ${deal.discount}%`,
      currency: "PHP",
      branchName: "Bun & Bite Deals",
      fulfillment: "delivery",
    });

    setAddedDealId(deal.id);
    window.setTimeout(() => setAddedDealId(null), 1400);
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#050505] text-white">
      <Navbar cartCount={cartCount} showSearch={false} />

      <main className="pb-16 pt-24 md:pt-28">
        <section className="relative overflow-hidden border-b border-white/8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-6 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-[#FF3B3B]/10 blur-[110px]" />
            <div className="absolute right-0 top-24 h-[240px] w-[240px] rounded-full bg-[#FF8A00]/8 blur-[95px]" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FF3B3B]/25 bg-[#FF3B3B]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#FFB4AB]">
                <Flame className="h-4 w-4" />
                Flash promos
              </div>
              <h1 className="mt-5 font-display text-4xl font-black leading-none sm:text-5xl md:text-6xl">
                Today’s Deals
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/50 sm:text-base">
                Grab limited-time Bun & Bite offers before they’re gone.
              </p>
            </div>

            <div className="rounded-3xl border border-[#FF3B3B]/20 bg-[#111111]/80 p-5 shadow-[0_24px_80px_rgba(255,59,59,0.08)]">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FF3B3B]/15 text-[#FF4D2E]">
                  <Clock3 className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display text-xl font-black">Limited-time prices</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/45">
                    Active deals use the discounted price in your cart and checkout summary.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="rounded-3xl border border-white/10 bg-[#111111]/80 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.25)] sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/35">
              <Tag className="h-4 w-4 text-[#FF4D2E]" />
              Deal categories
            </div>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
              {DEAL_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`h-12 shrink-0 rounded-full border px-5 text-sm font-black transition-all ${
                    activeCategory === tab.id
                      ? "border-[#FF3B3B] bg-[#FF3B3B] text-white shadow-[0_14px_35px_rgba(255,59,59,0.22)]"
                      : "border-white/10 bg-white/[0.04] text-white/55 hover:border-[#FF3B3B]/35 hover:text-white"
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 text-xs opacity-60">{counts[tab.id]}</span>
                </button>
              ))}
            </div>
          </div>

          {visibleDeals.length > 0 ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:gap-8">
              {visibleDeals.map((deal, index) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  index={index}
                  added={addedDealId === deal.id}
                  expanded={expandedDealIds.has(deal.id)}
                  touchedExpand={touchedDealExpand.has(deal.id)}
                  onAdd={() => requireAuth(() => addDeal(deal))}
                  onToggleExpand={() => toggleDealExpand(deal.id)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-[#111111]/65 px-6 py-14 text-center">
              <Sparkles className="mx-auto h-9 w-9 text-[#FF4D2E]" />
              <h2 className="mt-4 font-display text-2xl font-black">No deals in this category yet.</h2>
              <p className="mt-2 text-sm text-white/45">Check another deal category for today’s active promos.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function DealCard({
  deal,
  index,
  added,
  expanded,
  touchedExpand,
  onAdd,
  onToggleExpand,
}: {
  deal: DealProduct;
  index: number;
  added: boolean;
  expanded: boolean;
  touchedExpand: boolean;
  onAdd: () => void;
  onToggleExpand: () => void;
}) {
  const isDisabled = deal.status === "Sold out" || deal.status === "Expired";

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#111111] transition-all duration-500 hover:-translate-y-1 hover:border-[#FF3B3B]/30 hover:shadow-[0_0_40px_rgba(255,77,46,0.1)]"
    >
      <div className="relative h-[220px] w-full overflow-hidden">
        <img
          src={deal.image}
          alt={deal.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 z-10 rounded bg-red-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          Save {deal.discount}%
        </div>
        <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
          <div className="flex h-8 items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm">
            <Star className="h-3 w-3 fill-[#FF8A00] text-[#FF8A00]" />
            <span className="text-xs font-bold text-white">{deal.status}</span>
          </div>
        </div>
        <div className="absolute bottom-3 right-3 z-10 flex justify-end gap-2">
          <span className="rounded-full border border-[#FFB000]/30 bg-[#FFB000]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FFD66B] backdrop-blur-sm">
            {deal.badge}
          </span>
          <span className="rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-300 backdrop-blur-sm">
            {deal.endsLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-bold leading-snug text-white">
            {deal.name}
          </h2>
          <div className="shrink-0 text-right">
            <span className="text-xl font-black text-[#FF3B3B]">
              {formatDealPrice(deal.discountedPrice)}
            </span>
            <div className="text-xs text-white/30 line-through">
              {formatDealPrice(deal.originalPrice)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <Clock3 className="h-3 w-3" />
            {deal.endsLabel}
          </span>
          <span className="text-white/10">|</span>
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3" />
            Limited-time offer
          </span>
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-white/50">
          {deal.description}
        </p>


        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/60">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Original <span className="font-bold text-white">{formatDealPrice(deal.originalPrice)}</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Deal <span className="font-bold text-white">{formatDealPrice(deal.discountedPrice)}</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            Save <span className="font-bold text-white">{deal.discount}%</span>
          </span>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onAdd}
            disabled={isDisabled}
            className="flex h-10 flex-1 items-center justify-center gap-1 rounded-full text-xs font-bold uppercase tracking-[0.1em] text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
            style={isDisabled ? undefined : { background: "linear-gradient(135deg, #FF3B3B 0%, #E62E2E 100%)" }}
          >
            {added ? (
              <>
                Added to cart
                <CheckCircle2 className="h-3.5 w-3.5" />
              </>
            ) : isDisabled ? (
              <>
                Sold out
                <XCircle className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Add deal
                <Plus className="h-3.5 w-3.5" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onToggleExpand}
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#1a1a1a] text-white/50 transition-all hover:border-white/20 hover:text-white ${expanded ? "rotate-180" : ""}`}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {touchedExpand && (
          <div className={expanded ? "animate-expand-open" : "animate-expand-close"}>
            <div className="space-y-3 border-t border-white/5 pb-1 pt-3">
              <div>
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-white/30">Promo Includes</p>
                <p className="text-xs leading-relaxed text-white/50">{deal.includes}</p>
              </div>
              <div>
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-white/30">Deal Status</p>
                <p className="text-xs leading-relaxed text-white/50">{deal.status} - {deal.endsLabel}</p>
              </div>
              <div className="rounded-lg border border-[#FF3B3B]/10 bg-[#FF3B3B]/5 px-3 py-2">
                <p className="text-[11px] leading-relaxed text-[#FF4D2E]">
                  Discounted price is used in your cart and checkout total.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.article>
  );
}

function StatusPill({ status }: { status: DealStatus }) {
  const styles: Record<DealStatus, string> = {
    Available: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    Limited: "border-[#FF8A00]/30 bg-[#FF8A00]/10 text-[#FFD399]",
    "Sold out": "border-white/10 bg-white/[0.04] text-white/35",
    Expired: "border-white/10 bg-white/[0.04] text-white/35",
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${styles[status]}`}>
      {status}
    </span>
  );
}

function formatDealPrice(value: number) {
  return formatCartMoney(value, "PHP");
}
