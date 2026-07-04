import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowDownUp,
  ChevronDown,
  CheckCircle2,
  Clock,
  Flame,
  Heart,
  MapPin,
  Minus,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Star,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import Navbar from "@/components/navbar";
import { CustomizeModal, PRODUCTS, type Product } from "@/components/menu";
import { useAuth } from "@/context/auth-context";
import {
  buildCustomizationSummary,
  calcCartTotals,
  formatCartMoney,
  toPesoAmount,
  type CartCurrency,
  type CartCustomization,
  type CartItem,
} from "@/lib/cart";
import { getPickupBranch } from "@/lib/pickup";
import { getUserFavoriteIds, toggleUserFavorite } from "@/lib/favorites";

type PickupCategory = "popular" | "burgers" | "drinks" | "sides" | "desserts" | "family";
type PickupSort = "recommended" | "priceAsc" | "priceDesc" | "rating" | "newest";

const PICKUP_CATEGORIES: { key: PickupCategory; label: string }[] = [
  { key: "popular", label: "Popular" },
  { key: "burgers", label: "Burgers" },
  { key: "drinks", label: "Drinks" },
  { key: "sides", label: "Sides" },
  { key: "desserts", label: "Desserts" },
  { key: "family", label: "Family Meals" },
];

const PICKUP_SORT_OPTIONS: { key: PickupSort; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "priceAsc", label: "Price: Low to High" },
  { key: "priceDesc", label: "Price: High to Low" },
  { key: "rating", label: "Top Rated" },
  { key: "newest", label: "Newest" },
];

function getPickupProductPrice(price: string) {
  return toPesoAmount(price);
}

interface PickupBranchMenuPageProps {
  cartCount: number;
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "id">) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
}

export default function PickupBranchMenuPage({
  cartCount,
  cartItems,
  addToCart,
  updateQuantity,
  removeItem,
}: PickupBranchMenuPageProps) {
  const { requireAuth, user } = useAuth();
  const [location, setLocation] = useLocation();
  const branchId = location.split("/").filter(Boolean)[1];
  const branch = getPickupBranch(branchId);
  const [activeCategory, setActiveCategory] = useState<PickupCategory>("popular");
  const [selectedSort, setSelectedSort] = useState<PickupSort>("recommended");
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteBranch, setFavoriteBranch] = useState(false);
  const [favoriteProducts, setFavoriteProducts] = useState<Set<number>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [touchedExpand, setTouchedExpand] = useState<Set<number>>(new Set());
  const [customizeProduct, setCustomizeProduct] = useState<Product | null>(null);
  const [includeCutlery, setIncludeCutlery] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setFavoriteProducts(new Set());
      return () => {
        cancelled = true;
      };
    }

    getUserFavoriteIds(user.uid)
      .then((ids) => {
        if (!cancelled) setFavoriteProducts(ids);
      })
      .catch(() => {
        if (!cancelled) setFavoriteProducts(new Set());
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const branchProducts = useMemo(() => {
    if (!branch) return [];
    return PRODUCTS.filter((product) => branch.availableProductIds.includes(product.id));
  }, [branch]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const visibleProducts = branchProducts.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query);

      const matchesCategory =
        activeCategory === "popular"
          ? product.tags?.includes("popular") || product.badges.includes("POPULAR")
          : product.category === activeCategory;

      return matchesSearch && matchesCategory;
    });

    return [...visibleProducts].sort((a, b) => {
      if (selectedSort === "priceAsc") {
        return Number.parseFloat(a.price) - Number.parseFloat(b.price);
      }
      if (selectedSort === "priceDesc") {
        return Number.parseFloat(b.price) - Number.parseFloat(a.price);
      }
      if (selectedSort === "rating") {
        return Number.parseFloat(b.rating) - Number.parseFloat(a.rating);
      }
      if (selectedSort === "newest") {
        return b.id - a.id;
      }

      const aPopular = a.tags?.includes("popular") || a.badges.includes("POPULAR") ? 1 : 0;
      const bPopular = b.tags?.includes("popular") || b.badges.includes("POPULAR") ? 1 : 0;
      if (aPopular !== bPopular) return bPopular - aPopular;
      return Number.parseFloat(b.rating) - Number.parseFloat(a.rating);
    });
  }, [activeCategory, branchProducts, searchQuery, selectedSort]);

  const pickupSubtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const pickupServiceFee = cartItems.length > 0 ? 15 : 0;
  const pickupTotal = pickupSubtotal + pickupServiceFee;
  const { itemCount } = calcCartTotals(cartItems);

  const handleAddProduct = (product: (typeof PRODUCTS)[number]) => {
    if (!branch) return;

    addToCart({
      productId: product.id,
      name: product.name,
      image: product.image,
      badge: product.badges[0] || "PICKUP",
      size: product.sizes?.[0]?.label || "Regular",
      addOns: [],
      quantity: 1,
      unitPrice: getPickupProductPrice(product.price),
      baseUnitPrice: getPickupProductPrice(product.price),
      addOnTotal: 0,
      currency: "PHP",
      branchId: branch.id,
      branchName: branch.name,
      fulfillment: "pickup",
    });
  };

  const handleCustomizeProduct = (data: {
    productId: number;
    name: string;
    image: string;
    badge: string;
    size: string;
    addOns: string[];
    quantity: number;
    unitPrice: number;
    baseUnitPrice: number;
    addOnTotal: number;
    customization: CartCustomization;
    currency: CartCurrency;
  }) => {
    if (!branch) return;

    addToCart({
      ...data,
      branchId: branch.id,
      branchName: branch.name,
      fulfillment: "pickup",
    });
  };

  const toggleProductFavorite = async (product: Product) => {
    if (!user) return;

    setFavoriteProducts((prev) => {
      const next = new Set(prev);
      if (next.has(product.id)) next.delete(product.id);
      else next.add(product.id);
      return next;
    });

    try {
      const active = await toggleUserFavorite(user.uid, {
        productId: product.id,
        productName: product.name,
        image: product.image,
        category: product.category,
        price: toPesoAmount(product.price),
        availability: "Available",
        badge: product.badges[0],
        description: product.description,
      });

      setFavoriteProducts((prev) => {
        const next = new Set(prev);
        if (active) next.add(product.id);
        else next.delete(product.id);
        return next;
      });
    } catch {
      setFavoriteProducts((prev) => {
        const next = new Set(prev);
        if (next.has(product.id)) next.delete(product.id);
        else next.add(product.id);
        return next;
      });
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setTouchedExpand((prev) => new Set(prev).add(id));
  };

  if (!branch) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] text-white">
        <Navbar cartCount={cartCount} showSearch={false} />
        <main className="pt-28 px-4">
          <div className="max-w-xl mx-auto rounded-3xl border border-white/10 bg-[#111111] p-8 text-center">
            <h1 className="font-display text-3xl font-black">Branch not found</h1>
            <p className="mt-3 text-white/50">Choose another pickup branch to continue your order.</p>
            <button
              onClick={() => setLocation("/pickup")}
              className="mt-6 h-11 rounded-full bg-[#FF3B3B] px-6 text-sm font-bold text-white"
            >
              Back to Pickup
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white overflow-x-hidden">
      <Navbar cartCount={cartCount} showSearch={false} />

      <main className="pt-20 pb-28 lg:pb-16">
        <section className="border-b border-white/5 bg-[#080808]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
            <Link
              href="/pickup"
              className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Change branch
            </Link>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="max-w-3xl">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Pickup {branch.pickup}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF3B3B]/20 bg-[#FF3B3B]/10 px-3 py-1 text-xs font-bold text-[#FF8A80]">
                    <Clock className="h-3.5 w-3.5" />
                    {branch.prepTime}
                  </span>
                </div>

                <h1 className="font-display text-3xl md:text-5xl font-black leading-tight">
                  {branch.name}
                </h1>

                <div className="mt-5 grid gap-3 text-sm text-white/55 md:grid-cols-3">
                  <HeaderInfo icon={MapPin} text={branch.address} />
                  <HeaderInfo icon={Clock} text={branch.fullHours} />
                  <HeaderInfo icon={Phone} text={branch.contact} />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={branch.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-bold text-white/75 hover:border-[#FF3B3B]/35 hover:text-white transition-all"
                >
                  <MapPin className="h-4 w-4 text-[#FF4D2E]" />
                  Open in Maps
                </a>
                <button
                  onClick={() => requireAuth(() => setFavoriteBranch((favorite) => !favorite))}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-bold transition-all ${
                    favoriteBranch
                      ? "border-[#FF3B3B]/40 bg-[#FF3B3B]/15 text-white"
                      : "border-white/10 bg-white/[0.04] text-white/75 hover:border-[#FF3B3B]/35 hover:text-white"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${favoriteBranch ? "fill-[#FF3B3B] text-[#FF3B3B]" : "text-[#FF4D2E]"}`} />
                  Favorite
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0 space-y-6">
              <div className="sticky top-16 z-20 -mx-4 border-b border-white/5 bg-[#050505]/90 px-4 py-4 backdrop-blur-xl sm:mx-0 sm:rounded-3xl sm:border sm:border-white/8 sm:bg-[#111111]/80">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search this branch menu"
                      className="h-12 w-full rounded-full border border-white/10 bg-black/25 pl-11 pr-4 text-sm font-medium text-white placeholder:text-white/25 outline-none focus:border-[#FF3B3B]/45"
                    />
                  </div>

                  <label className="relative flex h-12 items-center rounded-full border border-white/10 bg-black/25 px-4 focus-within:border-[#FF3B3B]/45">
                    <ArrowDownUp className="mr-2 h-4 w-4 shrink-0 text-[#FF4D2E]" />
                    <span className="mr-2 text-xs font-bold uppercase tracking-[0.12em] text-white/30">
                      Sort
                    </span>
                    <select
                      value={selectedSort}
                      onChange={(event) => setSelectedSort(event.target.value as PickupSort)}
                      className="h-full min-w-0 flex-1 appearance-none bg-transparent pr-2 text-sm font-bold text-white outline-none"
                    >
                      {PICKUP_SORT_OPTIONS.map((option) => (
                        <option key={option.key} value={option.key} className="bg-[#111111] text-white">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
                  <div className="flex w-max gap-2 sm:w-full sm:flex-wrap">
                    {PICKUP_CATEGORIES.map((category) => {
                      const isActive = activeCategory === category.key;
                      return (
                        <button
                          key={category.key}
                          onClick={() => setActiveCategory(category.key)}
                          className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-bold transition-all ${
                            isActive
                              ? "border-transparent bg-[#FF3B3B] text-white shadow-[0_0_22px_rgba(255,59,59,0.28)]"
                              : "border-white/10 bg-black/20 text-white/55 hover:border-[#FF3B3B]/35 hover:text-white"
                          }`}
                        >
                          {category.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
                {filteredProducts.map((product, index) => (
                  <motion.article
                    key={product.id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ delay: index * 0.03 }}
                    className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#111111] transition-all duration-500 hover:-translate-y-1 hover:border-[#FF3B3B]/30 hover:shadow-[0_0_40px_rgba(255,77,46,0.1)]"
                  >
                    <div className="relative h-[220px] w-full overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute left-3 top-3 z-10 rounded bg-red-500 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white">
                        SAVE 20%
                      </div>
                      <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                        <div className="flex h-8 items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm">
                          <Star className="h-3 w-3 fill-[#FF8A00] text-[#FF8A00]" />
                          <span className="text-xs font-bold text-white">{product.rating}</span>
                          {product.reviews && (
                            <span className="text-[10px] text-white/50">({product.reviews})</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => requireAuth(() => void toggleProductFavorite(product))}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              favoriteProducts.has(product.id) ? "fill-[#FF3B3B] text-[#FF3B3B]" : "text-white/70"
                            }`}
                          />
                        </button>
                      </div>
                      <div className="absolute bottom-3 right-3 z-10 flex justify-end gap-2">
                        {product.badges.map((badge) => (
                          <span
                            key={badge}
                            className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-wider backdrop-blur-sm ${getBadgeClass(badge)}`}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-lg font-bold leading-snug text-white">{product.name}</h3>
                        <div className="shrink-0 text-right">
                          <span className="text-xl font-black text-[#FF3B3B]">
                            {formatCartMoney(getPickupProductPrice(product.price), "PHP")}
                          </span>
                          <div className="text-xs text-white/30 line-through">
                            {formatCartMoney(getPickupProductPrice(product.oldPrice), "PHP")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {product.time}
                        </span>
                        <span className="text-white/10">|</span>
                        <span className="flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {product.detailLine}
                        </span>
                      </div>

                      <p className="line-clamp-2 text-sm leading-relaxed text-white/50">{product.description}</p>

                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/60">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          {product.detail1.label} <span className="font-bold text-white">{product.detail1.value}</span>
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {product.detail2.label} <span className="font-bold text-white">{product.detail2.value}</span>
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="h-2 w-2 rounded-full bg-yellow-500" />
                          {product.detail3.label} <span className="font-bold text-white">{product.detail3.value}</span>
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => requireAuth(() => setCustomizeProduct(product))}
                          className="flex h-10 flex-1 items-center justify-center gap-1 rounded-full text-xs font-bold tracking-[0.1em] text-white transition-all hover:opacity-90 active:scale-[0.98]"
                          style={{
                            background: "linear-gradient(135deg, #FF3B3B 0%, #E62E2E 100%)",
                          }}
                        >
                          CUSTOMIZE
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleExpand(product.id)}
                          className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#1a1a1a] text-white/50 transition-all hover:border-white/20 hover:text-white ${
                            expandedIds.has(product.id) ? "rotate-180" : ""
                          }`}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>

                      {product.expandContent && touchedExpand.has(product.id) && (
                        <div className={expandedIds.has(product.id) ? "animate-expand-open" : "animate-expand-close"}>
                          <div className="space-y-3 border-t border-white/5 pb-1 pt-3">
                            {product.expandContent.ingredients && (
                              <div>
                                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30">Ingredients</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {product.expandContent.ingredients.map((ingredient) => (
                                    <span key={ingredient} className="rounded-md border border-white/5 bg-white/5 px-2 py-0.5 text-[11px] text-white/60">
                                      {ingredient}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {product.expandContent.flavor && (
                              <DetailBlock title="Flavor Profile" value={product.expandContent.flavor} />
                            )}
                            {product.expandContent.texture && (
                              <DetailBlock title="Texture" value={product.expandContent.texture} />
                            )}
                            {product.expandContent.pairing && (
                              <DetailBlock title="Perfect Pairing" value={product.expandContent.pairing} />
                            )}
                            {product.expandContent.note && (
                              <div className="rounded-lg border border-[#FF3B3B]/10 bg-[#FF3B3B]/5 px-3 py-2">
                                <p className="text-[11px] leading-relaxed text-[#FF4D2E]">{product.expandContent.note}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.article>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center">
                  <h2 className="font-display text-2xl font-black">No products found</h2>
                  <p className="mt-2 text-sm text-white/45">Try another category or search term.</p>
                </div>
              )}
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-3xl border border-white/10 bg-[#111111]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
                <OrderSummary
                  cartItems={cartItems}
                  prepTime={branch.prepTime}
                  pickupSubtotal={pickupSubtotal}
                  pickupServiceFee={pickupServiceFee}
                  pickupTotal={pickupTotal}
                  includeCutlery={includeCutlery}
                  setIncludeCutlery={setIncludeCutlery}
                  updateQuantity={updateQuantity}
                  removeItem={removeItem}
                  onCheckout={() => requireAuth(() => setLocation(`/pickup/${branch.id}/review`))}
                />
              </div>
            </aside>
          </div>
        </section>
      </main>

      {mobileSummaryOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close order summary"
            onClick={() => setMobileSummaryOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="bunbite-scrollbar absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-[#111111] p-4 shadow-[0_-20px_60px_rgba(0,0,0,0.45)]">
            <div className="mb-3 flex items-center justify-between">
              <div className="h-1.5 w-12 rounded-full bg-white/15" />
              <button
                type="button"
                onClick={() => setMobileSummaryOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <OrderSummary
              cartItems={cartItems}
              prepTime={branch.prepTime}
              pickupSubtotal={pickupSubtotal}
              pickupServiceFee={pickupServiceFee}
              pickupTotal={pickupTotal}
              includeCutlery={includeCutlery}
              setIncludeCutlery={setIncludeCutlery}
              updateQuantity={updateQuantity}
              removeItem={removeItem}
              onCheckout={() => requireAuth(() => setLocation(`/pickup/${branch.id}/review`))}
            />
          </div>
        </div>
      )}

      <button
        onClick={() => setMobileSummaryOpen(true)}
        className="fixed bottom-4 left-4 right-4 z-40 flex h-14 items-center justify-between rounded-full bg-[#FF3B3B] px-5 text-sm font-black text-white shadow-[0_18px_45px_rgba(255,59,59,0.28)] lg:hidden"
      >
        <span>{itemCount > 0 ? `${itemCount} items` : "Pickup summary"}</span>
        <span>{formatCartMoney(pickupTotal, "PHP")}</span>
      </button>

      {customizeProduct && (
        <CustomizeModal
          product={customizeProduct}
          onClose={() => setCustomizeProduct(null)}
          onConfirm={handleCustomizeProduct}
          currency="PHP"
        />
      )}
    </div>
  );
}

function HeaderInfo({ icon: Icon, text }: { icon: typeof MapPin; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4D2E]" />
      <span className="leading-relaxed">{text}</span>
    </div>
  );
}

function DetailBlock({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-white/30">{title}</p>
      <p className="text-xs leading-relaxed text-white/50">{value}</p>
    </div>
  );
}

const BADGE_COLORS: Record<string, string> = {
  POPULAR: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  SIGNATURE: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  PREMIUM: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  HOT: "bg-red-500/15 text-red-400 border border-red-500/30",
  "BEST SELLER": "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  REFRESHING: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
  CREAMY: "bg-pink-500/15 text-pink-400 border border-pink-500/30",
  FRESH: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  HEALTHY: "bg-teal-500/15 text-teal-400 border border-teal-500/30",
  "BEST FOR SHARING": "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  VALUE: "bg-lime-500/15 text-lime-400 border border-lime-500/30",
  "BEST VALUE": "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  NEW: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
  "KIDS FAV": "bg-violet-500/15 text-violet-400 border border-violet-500/30",
  SHAREABLE: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
  CRISPY: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
};

function getBadgeClass(badge: string) {
  return BADGE_COLORS[badge] || "bg-white/5 text-white/60 border border-white/10";
}

function OrderSummary({
  cartItems,
  prepTime,
  pickupSubtotal,
  pickupServiceFee,
  pickupTotal,
  includeCutlery,
  setIncludeCutlery,
  updateQuantity,
  removeItem,
  onCheckout,
}: {
  cartItems: CartItem[];
  prepTime: string;
  pickupSubtotal: number;
  pickupServiceFee: number;
  pickupTotal: number;
  includeCutlery: boolean;
  setIncludeCutlery: (value: boolean) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  onCheckout: () => void;
}) {
  return (
    <div>
      <div className="mb-5 grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        <div className="flex min-h-[70px] flex-col items-center justify-center border-r border-white/8 px-3 text-center">
          <span className="text-sm font-bold text-white/45">Delivery</span>
          <span className="mt-1 text-xs text-white/25">Unavailable</span>
        </div>
        <div className="flex min-h-[70px] flex-col items-center justify-center bg-white/[0.04] px-3 text-center">
          <span className="text-sm font-black text-white">Pick-up</span>
          <span className="mt-1 text-xs text-[#FF8A80]">Standard ({prepTime})</span>
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#FF8A80]">
            Pickup Order
          </p>
          <h2 className="font-display text-2xl font-black">Order Summary</h2>
        </div>
        <ShoppingBag className="h-6 w-6 text-[#FF4D2E]" />
      </div>

      <div className="bunbite-scrollbar max-h-[330px] space-y-3 overflow-y-auto pr-1">
        {cartItems.length > 0 ? (
          cartItems.map((item) => (
            <div key={item.id} className="rounded-2xl bg-black/20 p-2">
              <div className="grid grid-cols-[48px_minmax(0,1fr)_auto] gap-3">
              <img src={item.image} alt={item.name} className="h-12 w-12 rounded-xl object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{item.name}</p>
                <p className="text-xs text-white/35">Qty {item.quantity} - {item.size}</p>
                {buildCustomizationSummary(item.customization, item.addOns).length > 0 && (
                  <p className="mt-1 line-clamp-2 text-xs text-white/30">
                    {buildCustomizationSummary(item.customization, item.addOns).join(" / ")}
                  </p>
                )}
              </div>
              <p className="text-sm font-black text-[#FF4D2E]">
                {formatCartMoney(item.unitPrice * item.quantity, item.currency || "PHP")}
              </p>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/45 hover:border-[#FF3B3B]/35 hover:text-[#FF4D2E] transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="flex h-9 items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id)}
                    aria-label={`Decrease ${item.name}`}
                    className="flex h-full w-9 items-center justify-center text-white/45 hover:text-white"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-black text-white">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label={`Add one more ${item.name}`}
                    className="flex h-full w-9 items-center justify-center text-white/70 hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
            <p className="font-bold text-white">Your pickup basket is empty</p>
            <p className="mt-1 text-sm text-white/40">Add items from this branch menu.</p>
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-white/8 pt-5">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-[#FF4D2E]">
                <Utensils className="h-[18px] w-[18px]" />
              </div>
              <div>
                <p className="text-sm font-black text-white">Cutlery</p>
                <p className="mt-1 text-xs leading-relaxed text-white/45">
                  {includeCutlery
                    ? "If supplies are available, your pickup order will include cutlery."
                    : "No cutlery included. Thanks for helping us reduce waste."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIncludeCutlery(!includeCutlery)}
              aria-pressed={includeCutlery}
              className={`relative h-8 w-14 shrink-0 rounded-full border transition-all ${
                includeCutlery
                  ? "border-[#FF3B3B]/50 bg-[#FF3B3B]"
                  : "border-white/10 bg-white/20"
              }`}
            >
              <span
                className={`absolute left-0 top-1 h-6 w-6 rounded-full bg-white transition-transform ${
                  includeCutlery ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3 border-t border-white/8 pt-5 text-sm">
        <SummaryRow label="Subtotal" value={formatCartMoney(pickupSubtotal, "PHP")} />
        <SummaryRow label="Pickup fee" value={formatCartMoney(0, "PHP")} />
        <SummaryRow label="Service fee" value={formatCartMoney(pickupServiceFee, "PHP")} />
        <div className="flex items-center justify-between pt-2 text-lg font-black">
          <span>Total</span>
          <span className="text-[#FF4D2E]">{formatCartMoney(pickupTotal, "PHP")}</span>
        </div>
      </div>

      <button
        onClick={onCheckout}
        disabled={cartItems.length === 0}
        className="mt-5 h-12 w-full rounded-full bg-[#FF3B3B] text-sm font-black text-white hover:bg-[#ff5252] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30 transition-all"
      >
        Go to checkout
      </button>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-white/55">
      <span>{label}</span>
      <span className="font-bold text-white/80">{value}</span>
    </div>
  );
}
