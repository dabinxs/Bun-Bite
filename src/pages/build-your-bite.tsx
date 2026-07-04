import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  ChefHat,
  Clock,
  Dice5,
  Flame,
  PackageCheck,
  PencilLine,
  Plus,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import Navbar from "@/components/navbar";
import { PRODUCTS, type Product } from "@/components/menu";
import { useAuth } from "@/context/auth-context";
import {
  ADD_ON_OPTIONS,
  SPICE_LEVELS,
  formatCartMoney,
  getAddOnTotal,
  toPesoAmount,
  type CartItem,
  type SpiceLevel,
} from "@/lib/cart";

interface BuildYourBitePageProps {
  cartCount: number;
  addToCart: (item: Omit<CartItem, "id">) => void;
}

type ComboId = "solo" | "snack" | "sweet" | "family" | "student" | "premium";
type MoodId = "hungry" | "spicy" | "budget" | "sweet" | "sharing";

const combos: Record<ComboId, {
  name: string;
  description: string;
  includes: string;
  burgerQty: number;
  sideQty: number;
  drinkQty: number;
  dessertQty: number;
  savings: number;
  prepTime: string;
}> = {
  solo: {
    name: "Solo Combo",
    description: "A burger and drink for a quick bite.",
    includes: "1 burger + 1 drink",
    burgerQty: 1,
    sideQty: 0,
    drinkQty: 1,
    dessertQty: 0,
    savings: 20,
    prepTime: "10-15 minutes",
  },
  snack: {
    name: "Snack Combo",
    description: "Classic burger meal with fries and drink.",
    includes: "1 burger + fries + drink",
    burgerQty: 1,
    sideQty: 1,
    drinkQty: 1,
    dessertQty: 0,
    savings: 40,
    prepTime: "15-20 minutes",
  },
  sweet: {
    name: "Sweet Combo",
    description: "Burger meal with a dessert finish.",
    includes: "1 burger + drink + dessert",
    burgerQty: 1,
    sideQty: 0,
    drinkQty: 1,
    dessertQty: 1,
    savings: 45,
    prepTime: "15-20 minutes",
  },
  family: {
    name: "Family Combo",
    description: "A shareable set for four hungry people.",
    includes: "4 burgers + large fries + 4 drinks",
    burgerQty: 4,
    sideQty: 2,
    drinkQty: 4,
    dessertQty: 0,
    savings: 120,
    prepTime: "25-35 minutes",
  },
  student: {
    name: "Student Combo",
    description: "Budget-friendly burger, fries, and drink.",
    includes: "1 burger + fries + drink",
    burgerQty: 1,
    sideQty: 1,
    drinkQty: 1,
    dessertQty: 0,
    savings: 55,
    prepTime: "12-18 minutes",
  },
  premium: {
    name: "Premium Combo",
    description: "Signature burger, premium side, and shake.",
    includes: "1 signature burger + premium side + shake",
    burgerQty: 1,
    sideQty: 1,
    drinkQty: 1,
    dessertQty: 0,
    savings: 65,
    prepTime: "18-25 minutes",
  },
};

const moods: { id: MoodId; label: string; description: string; comboId: ComboId; spice: SpiceLevel }[] = [
  { id: "hungry", label: "Hungry", description: "Bigger combo", comboId: "premium", spice: "Medium" },
  { id: "spicy", label: "Spicy", description: "Heat-forward", comboId: "snack", spice: "Extra Spicy" },
  { id: "budget", label: "Budget", description: "Student-friendly", comboId: "student", spice: "Mild" },
  { id: "sweet", label: "Sweet", description: "Dessert combo", comboId: "sweet", spice: "Mild" },
  { id: "sharing", label: "Sharing", description: "Family-sized", comboId: "family", spice: "Medium" },
];

const comboIds = Object.keys(combos) as ComboId[];

function priceOf(product: Product | undefined) {
  return product ? toPesoAmount(product.price) : 0;
}

function productsIn(category: Product["category"]) {
  return PRODUCTS.filter((product) => product.category === category);
}

function firstProduct(category: Product["category"]) {
  return productsIn(category)[0] ?? PRODUCTS[0];
}

function productByKeyword(category: Product["category"], keyword: string) {
  return (
    productsIn(category).find((product) => product.name.toLowerCase().includes(keyword.toLowerCase())) ??
    firstProduct(category)
  );
}

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export default function BuildYourBitePage({ cartCount, addToCart }: BuildYourBitePageProps) {
  const { requireAuth } = useAuth();
  const [, setLocation] = useLocation();
  const burgers = useMemo(() => productsIn("burgers"), []);
  const sides = useMemo(() => productsIn("sides"), []);
  const drinks = useMemo(() => productsIn("drinks"), []);
  const desserts = useMemo(() => productsIn("desserts"), []);

  const [comboId, setComboId] = useState<ComboId>("snack");
  const [burgerId, setBurgerId] = useState(firstProduct("burgers").id);
  const [sideId, setSideId] = useState(firstProduct("sides").id);
  const [drinkId, setDrinkId] = useState(firstProduct("drinks").id);
  const [dessertId, setDessertId] = useState<number | "none">("none");
  const [addOns, setAddOns] = useState<string[]>([]);
  const [flavorLevel, setFlavorLevel] = useState<SpiceLevel>("Medium");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [comboName, setComboName] = useState("");
  const [selectedMood, setSelectedMood] = useState<MoodId | null>(null);

  const combo = combos[comboId];
  const burger = burgers.find((product) => product.id === burgerId) ?? burgers[0];
  const side = sides.find((product) => product.id === sideId) ?? sides[0];
  const drink = drinks.find((product) => product.id === drinkId) ?? drinks[0];
  const dessert = dessertId === "none" ? undefined : desserts.find((product) => product.id === dessertId);
  const addOnTotal = getAddOnTotal(addOns) * combo.burgerQty;
  const regularTotal =
    priceOf(burger) * combo.burgerQty +
    priceOf(side) * combo.sideQty +
    priceOf(drink) * combo.drinkQty +
    (dessert ? priceOf(dessert) * Math.max(1, combo.dessertQty) : 0) +
    addOnTotal;
  const finalTotal = Math.max(0, regularTotal - combo.savings);
  const displayName = comboName.trim() || combo.name;
  const includedItems = [
    `${combo.burgerQty}x ${burger.name}`,
    combo.sideQty > 0 ? `${combo.sideQty}x ${side.name}` : null,
    `${combo.drinkQty}x ${drink.name}`,
    dessert ? `${Math.max(1, combo.dessertQty)}x ${dessert.name}` : null,
  ].filter(Boolean) as string[];

  const applyCombo = (nextComboId: ComboId) => {
    const nextCombo = combos[nextComboId];
    setComboId(nextComboId);
    if (nextCombo.dessertQty > 0 && dessertId === "none") setDessertId(firstProduct("desserts").id);
    if (nextCombo.dessertQty === 0 && nextComboId !== "sweet") setDessertId("none");
    if (nextComboId === "student") {
      setBurgerId(productByKeyword("burgers", "classic").id);
      setSideId(productByKeyword("sides", "fries").id);
      setDrinkId(productByKeyword("drinks", "cola").id);
    }
    if (nextComboId === "premium") {
      setBurgerId(productByKeyword("burgers", "smoky").id);
      setDrinkId(productByKeyword("drinks", "shake").id);
    }
  };

  const applyMood = (moodId: MoodId) => {
    const mood = moods.find((option) => option.id === moodId);
    if (!mood) return;
    setSelectedMood(moodId);
    setFlavorLevel(mood.spice);
    applyCombo(mood.comboId);
    if (moodId === "spicy") setBurgerId(productByKeyword("burgers", "spicy").id);
    if (moodId === "sweet") setDessertId(firstProduct("desserts").id);
    if (moodId === "budget") setComboName("Student Saver Combo");
    if (moodId === "sharing") setComboName("Share Box Combo");
  };

  const surpriseMe = () => {
    const nextComboId = randomItem(comboIds);
    setSelectedMood(null);
    applyCombo(nextComboId);
    setBurgerId(randomItem(burgers).id);
    setSideId(randomItem(sides).id);
    setDrinkId(randomItem(drinks).id);
    setDessertId(Math.random() > 0.5 ? randomItem(desserts).id : "none");
    setFlavorLevel(randomItem(SPICE_LEVELS));
    setAddOns(randomItem([[], ["Extra cheese"], ["Extra sauce"], ["Bacon"]]));
    setComboName("Surprise Bite Combo");
  };

  const toggleAddOn = (label: string) => {
    setAddOns((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label]);
  };

  const addComboToCart = () => {
    addToCart({
      productId: 9000 + comboIds.indexOf(comboId),
      name: displayName,
      image: burger.image,
      badge: "BUILD",
      size: combo.name,
      addOns,
      quantity: 1,
      unitPrice: finalTotal,
      baseUnitPrice: regularTotal,
      addOnTotal,
      originalPrice: regularTotal,
      isCombo: true,
      currency: "PHP",
      comboDetails: {
        comboId,
        comboType: combo.name,
        includedItems,
        burger: burger.name,
        side: combo.sideQty > 0 ? side.name : "No side",
        drink: drink.name,
        dessert: dessert?.name,
        addOns,
        flavorLevel,
        specialInstructions,
        savings: combo.savings,
        prepTime: combo.prepTime,
        customName: comboName.trim() || undefined,
        mood: selectedMood || undefined,
      },
    });
    window.dispatchEvent(new CustomEvent("bnb:open-cart"));
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#050505] text-white">
      <Navbar cartCount={cartCount} showSearch={false} />

      <main className="px-4 pb-16 pt-24 sm:px-6 md:pt-28">
        <div className="mx-auto max-w-7xl">
          <section className="mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[#111111]/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-7 md:p-9">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FF8A80]">
                  Interactive meal builder
                </p>
                <h1 className="mt-3 font-display text-4xl font-black leading-tight sm:text-5xl">
                  Build Your Bite
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">
                  Create your perfect burger meal, choose a combo, or let Bun & Bite surprise you with a ready-made match.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={surpriseMe}
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-[#FF3B3B] px-5 text-sm font-black text-white transition-all hover:bg-[#ff5252]"
                  >
                    <Dice5 className="h-4 w-4" />
                    Surprise Me
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocation("/")}
                    className="inline-flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-black text-white/70 transition-all hover:border-[#FF3B3B]/35 hover:text-white"
                  >
                    View Regular Menu
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="relative min-h-[220px] rounded-3xl border border-[#FF3B3B]/20 bg-black/25 p-5">
                <div className="absolute inset-0 rounded-3xl bg-[#FF3B3B]/10 blur-3xl" />
                <img
                  src={burger.image}
                  alt={burger.name}
                  className="relative mx-auto h-48 w-full object-contain drop-shadow-[0_24px_55px_rgba(255,59,59,0.24)]"
                />
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_430px]">
            <div className="min-w-0 space-y-6">
              <BuilderCard title="Choose combo type" icon={PackageCheck}>
                <div className="grid gap-3 md:grid-cols-2">
                  {comboIds.map((id) => {
                    const option = combos[id];
                    const active = comboId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setSelectedMood(null);
                          applyCombo(id);
                        }}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          active
                            ? "border-[#FF3B3B]/55 bg-[#FF3B3B]/12 shadow-[0_0_28px_rgba(255,59,59,0.12)]"
                            : "border-white/10 bg-black/20 hover:border-[#FF3B3B]/35"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-display text-lg font-black">{option.name}</p>
                            <p className="mt-1 text-xs text-white/45">{option.includes}</p>
                          </div>
                          <span className="rounded-full border border-[#FF3B3B]/25 bg-[#FF3B3B]/10 px-2.5 py-1 text-[11px] font-black text-[#FFB4AB]">
                            Save {formatCartMoney(option.savings)}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-white/50">{option.description}</p>
                      </button>
                    );
                  })}
                </div>
              </BuilderCard>

              <BuilderCard title="Choose by mood" icon={Sparkles}>
                <div className="flex flex-wrap gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood.id}
                      type="button"
                      onClick={() => applyMood(mood.id)}
                      className={`rounded-full border px-4 py-2.5 text-sm font-black transition-all ${
                        selectedMood === mood.id
                          ? "border-[#FF3B3B]/60 bg-[#FF3B3B]/15 text-white"
                          : "border-white/10 bg-black/20 text-white/55 hover:border-[#FF3B3B]/35 hover:text-white"
                      }`}
                    >
                      {mood.label}
                      <span className="ml-2 text-xs font-bold text-white/35">{mood.description}</span>
                    </button>
                  ))}
                </div>
              </BuilderCard>

              <BuilderCard title="Choose your meal" icon={UtensilsCrossed}>
                <div className="grid gap-5">
                  <OptionGrid title="1. Choose your burger" products={burgers} selectedId={burgerId} onSelect={setBurgerId} />
                  <OptionGrid title="2. Choose your side" products={sides} selectedId={sideId} onSelect={setSideId} />
                  <OptionGrid title="3. Choose your drink" products={drinks} selectedId={drinkId} onSelect={setDrinkId} />

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white/45">
                        4. Choose dessert, optional
                      </h3>
                      <button
                        type="button"
                        onClick={() => setDessertId("none")}
                        className="text-xs font-bold text-white/35 transition-colors hover:text-white"
                      >
                        No dessert
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {desserts.map((product) => (
                        <ProductOption
                          key={product.id}
                          product={product}
                          selected={dessertId === product.id}
                          onClick={() => setDessertId(product.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </BuilderCard>

              <BuilderCard title="Customize add-ons" icon={ChefHat}>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <p className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-white/45">
                      Add-ons
                    </p>
                    <div className="grid gap-2">
                      {ADD_ON_OPTIONS.map((addon) => (
                        <button
                          key={addon.label}
                          type="button"
                          onClick={() => toggleAddOn(addon.label)}
                          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition-all ${
                            addOns.includes(addon.label)
                              ? "border-[#FF3B3B]/55 bg-[#FF3B3B]/12 text-white"
                              : "border-white/10 bg-black/20 text-white/60 hover:border-[#FF3B3B]/35 hover:text-white"
                          }`}
                        >
                          <span>{addon.label}</span>
                          <span>{formatCartMoney(addon.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-white/45">
                      Flavor level
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {SPICE_LEVELS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFlavorLevel(level)}
                          className={`rounded-2xl border px-4 py-3 text-sm font-black transition-all ${
                            flavorLevel === level
                              ? "border-[#FF3B3B]/55 bg-[#FF3B3B]/12 text-white"
                              : "border-white/10 bg-black/20 text-white/55 hover:border-[#FF3B3B]/35 hover:text-white"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>

                    <label className="mt-5 block">
                      <span className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-white/45">
                        <PencilLine className="h-4 w-4 text-[#FF4D2E]" />
                        Save your combo name
                      </span>
                      <input
                        value={comboName}
                        onChange={(event) => setComboName(event.target.value)}
                        placeholder="e.g. Jenz Spicy Combo"
                        className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-bold text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#FF3B3B]/45"
                      />
                    </label>
                  </div>
                </div>

                <label className="mt-5 block">
                  <span className="mb-2 block text-sm font-black uppercase tracking-[0.16em] text-white/45">
                    Special instructions
                  </span>
                  <textarea
                    value={specialInstructions}
                    onChange={(event) => setSpecialInstructions(event.target.value)}
                    placeholder="Less sauce, extra toasted bun, no ice, etc."
                    className="min-h-[110px] w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#FF3B3B]/45"
                  />
                </label>
              </BuilderCard>
            </div>

            <aside className="min-w-0 lg:sticky lg:top-24 lg:h-fit">
              <section className="rounded-3xl border border-white/10 bg-[#111111]/95 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-6">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FF8A80]">
                  Live meal summary
                </p>
                <h2 className="mt-2 font-display text-2xl font-black">{displayName}</h2>

                <div className="mt-5 space-y-3 rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-white/60">
                  {includedItems.map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Plus className="h-3.5 w-3.5 text-[#FF4D2E]" />
                      <span>{item}</span>
                    </div>
                  ))}
                  {addOns.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Flame className="h-3.5 w-3.5 text-[#FF4D2E]" />
                      <span>{addOns.join(", ")}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#FF3B3B]/20 bg-[#FF3B3B]/8 px-4 py-3">
                  <Clock className="h-5 w-5 text-[#FF4D2E]" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-white/35">
                      Estimated prep time
                    </p>
                    <p className="font-black">{combo.prepTime}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <SummaryLine label="Regular price" value={formatCartMoney(regularTotal)} muted />
                  <SummaryLine label="Combo savings" value={`-${formatCartMoney(combo.savings)}`} />
                  <SummaryLine label="Flavor level" value={flavorLevel} muted />
                  <div className="flex items-end justify-between gap-4 border-t border-white/8 pt-4">
                    <div>
                      <p className="font-display text-2xl font-black">Total</p>
                      <p className="text-xs text-white/35">Grouped combo price</p>
                    </div>
                    <p className="text-3xl font-black text-[#FF4D2E]">{formatCartMoney(finalTotal)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => requireAuth(addComboToCart)}
                  className="mt-6 h-12 w-full rounded-full bg-[#FF3B3B] text-sm font-black text-white transition-all hover:bg-[#ff5252]"
                >
                  Add combo to cart
                </button>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function BuilderCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#111111]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#FF3B3B]/25 bg-[#FF3B3B]/10 text-[#FF4D2E]">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="font-display text-2xl font-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function OptionGrid({
  title,
  products,
  selectedId,
  onSelect,
}: {
  title: string;
  products: Product[];
  selectedId: number;
  onSelect: (id: number) => void;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-white/45">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <ProductOption
            key={product.id}
            product={product}
            selected={selectedId === product.id}
            onClick={() => onSelect(product.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ProductOption({
  product,
  selected,
  onClick,
}: {
  product: Product;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-0 overflow-hidden rounded-2xl border bg-black/20 text-left transition-all ${
        selected
          ? "border-[#FF3B3B]/55 shadow-[0_0_24px_rgba(255,59,59,0.12)]"
          : "border-white/10 hover:border-[#FF3B3B]/35"
      }`}
    >
      <div className="h-24 bg-[#090909]">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
      </div>
      <div className="p-3">
        <p className="line-clamp-2 min-h-[2.25rem] text-sm font-black leading-tight">{product.name}</p>
        <p className="mt-2 text-sm font-black text-[#FF4D2E]">{formatCartMoney(priceOf(product))}</p>
      </div>
    </button>
  );
}

function SummaryLine({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-white/55">
      <span>{label}</span>
      <span className={`text-right font-bold ${muted ? "text-white/60" : "text-[#FFB4AB]"}`}>{value}</span>
    </div>
  );
}
