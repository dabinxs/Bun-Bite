import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  Lock,
  Shield,
  Truck,
  Leaf,
  HeadphonesIcon,
  ChevronRight,
  Tag,
  Edit3,
  Banknote,
  CreditCard,
  Wallet,
  Landmark,
  Check,
} from "lucide-react";
import Navbar from "@/components/navbar";
import { CustomizeModal } from "@/components/menu";
import { PRODUCTS } from "@/components/menu";
import { useAuth } from "@/context/auth-context";
import {
  buildCartItemSummary,
  calcCartTotals,
  formatCartMoney,
  type CartCurrency,
  type CartCustomization,
  type CartItem,
} from "@/lib/cart";

interface CartPageProps {
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  cartCount: number;
}

type PaymentMethod = "cod" | "card" | "ewallet" | "bank";

const PAYMENT_OPTIONS: {
  key: PaymentMethod;
  label: string;
  icon: React.ReactNode;
  sub: string;
}[] = [
  { key: "cod", label: "Cash on Delivery", icon: <Banknote className="w-5 h-5" />, sub: "Pay when you receive" },
  { key: "card", label: "Credit / Debit Card", icon: <CreditCard className="w-5 h-5" />, sub: "Visa, Mastercard, JCB" },
  { key: "ewallet", label: "E-Wallet", icon: <Wallet className="w-5 h-5" />, sub: "GCash, PayMaya" },
  { key: "bank", label: "Online Banking", icon: <Landmark className="w-5 h-5" />, sub: "Bank transfer" },
];

export default function CartPage({
  cartItems,
  updateQuantity,
  removeItem,
  updateItem,
  cartCount,
}: CartPageProps) {
  const { requireAuth } = useAuth();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [, setLocation] = useLocation();

  const { subtotal, deliveryFee, serviceFee, total, itemCount } =
    calcCartTotals(cartItems);

  const handleRemove = (id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      removeItem(id);
      setRemovingId(null);
    }, 300);
  };

  const editingProduct = useMemo(() => {
    if (!editingItem || editingItem.isCombo) return null;
    return PRODUCTS.find((p) => p.id === editingItem.productId) || null;
  }, [editingItem]);

  const handleEditConfirm = (data: {
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
    if (!editingItem) return;
    updateItem(editingItem.id, {
      size: data.size,
      addOns: data.addOns,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      baseUnitPrice: data.baseUnitPrice,
      addOnTotal: data.addOnTotal,
      customization: data.customization,
      currency: data.currency,
    });
    setEditingItem(null);
  };

  const getSizeIdx = (product: typeof PRODUCTS[0], sizeLabel: string) => {
    const idx = product.sizes?.findIndex((s) => s.label === sizeLabel) ?? -1;
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#0A0A0A] text-white font-sans selection:bg-[#FF3B3B] selection:text-white">
      <Navbar cartCount={cartCount} />

      <main className="pt-24 pb-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="mb-8 animate-fade-in">
            <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight">
              YOUR CART
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Review your items and proceed to checkout
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            {/* Left: Cart Items */}
            <div className="space-y-4">
              {cartItems.length === 0 ? (
                <div className="bg-[#111111] border border-white/5 rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-7 h-7 text-white/20" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-white/60 mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-white/30 text-sm mb-6">
                    Add some delicious items from our menu
                  </p>
                  <button
                    onClick={() => setLocation("/")}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FF3B3B] text-white text-sm font-bold hover:opacity-90 transition-opacity"
                  >
                    Browse Menu
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className={`group bg-[#111111] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 hover:shadow-[0_0_40px_rgba(255,59,59,0.06)] transition-all duration-300 ${
                      removingId === item.id
                        ? "opacity-0 scale-95 translate-x-4"
                        : "opacity-100 scale-100 translate-x-0"
                    }`}
                    style={{ transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)" }}
                  >
                    {/* Image */}
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-[#0d0d0d] shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-[#FF3B3B]/15 text-[#FF3B3B] text-[10px] font-bold tracking-wider uppercase">
                          {item.badge}
                        </span>
                      </div>
                      <h3 className="font-display text-sm md:text-base font-bold truncate">
                        {item.name}
                      </h3>
                      <div className="text-white/30 text-xs mt-1 space-y-0.5">
                        <p>
                          <span className="text-white/20">Size:</span>{" "}
                          {item.size}
                        </p>
                        {buildCartItemSummary(item).length > 0 && (
                          <p>
                            <span className="text-white/20">{item.isCombo ? "Combo:" : "Custom:"}</span>{" "}
                            {buildCartItemSummary(item).join(" / ")}
                          </p>
                        )}
                        {buildCartItemSummary(item).length === 0 && (
                          <p>
                            <span className="text-white/20">Add-ons:</span> —
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Price + Qty + Actions */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <span className="text-lg font-black text-[#FF3B3B]">
                        {formatCartMoney(item.unitPrice * item.quantity, item.currency || "PHP")}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              Math.max(1, item.quantity - 1)
                            )
                          }
                          className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all"
                        >
                          <Minus className="w-3 h-3 text-white/50" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all"
                        >
                          <Plus className="w-3 h-3 text-white/50" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {!item.isCombo && (
                          <button
                            onClick={() => requireAuth(() => setEditingItem(item))}
                            className="text-white/20 hover:text-[#FF8A00] hover:drop-shadow-[0_0_6px_rgba(255,138,0,0.5)] transition-all"
                            title="Edit item"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="text-white/20 hover:text-[#FF3B3B] transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Continue Shopping */}
              {cartItems.length > 0 && (
                <button
                  onClick={() => setLocation("/")}
                  className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm font-medium transition-colors mt-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  CONTINUE SHOPPING
                </button>
              )}
            </div>

            {/* Right: Order Summary */}
            <div className="lg:sticky lg:top-24 space-y-4 h-fit">
              <div className="bg-[#111111] border border-white/5 rounded-2xl p-6">
                <h2 className="font-display text-lg font-bold mb-5 tracking-tight">
                  ORDER SUMMARY
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-white/50">
                    <span>
                      Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})
                    </span>
                    <span className="font-medium text-white/70">
                      {formatCartMoney(subtotal, "PHP")}
                    </span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>Delivery Fee</span>
                    <span className="font-medium text-white/70">
                      {formatCartMoney(deliveryFee, "PHP")}
                    </span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>Service Fee</span>
                    <span className="font-medium text-white/70">
                      {formatCartMoney(serviceFee, "PHP")}
                    </span>
                  </div>
                </div>

                <div className="my-4 border-t border-white/5" />

                <div className="flex justify-between items-end mb-5">
                  <span className="font-display text-sm font-bold tracking-wider">
                    TOTAL
                  </span>
                  <span className="text-2xl font-black text-[#FF3B3B]">
                    {formatCartMoney(total, "PHP")}
                  </span>
                </div>

                {/* Payment Method */}
                <div className="mb-5">
                  <p className="text-[10px] font-bold tracking-wider text-white/30 uppercase mb-3">
                    Mode of Payment
                  </p>
                  <div className="space-y-2">
                    {PAYMENT_OPTIONS.map((opt) => {
                      const active = paymentMethod === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => setPaymentMethod(opt.key)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                            active
                              ? "bg-[#FF3B3B]/10 border-[#FF3B3B]/40 shadow-[0_0_20px_rgba(255,59,59,0.1)]"
                              : "bg-white/[0.02] border-white/5 hover:border-white/10"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                              active ? "bg-[#FF3B3B]/20 text-[#FF3B3B]" : "bg-white/5 text-white/30"
                            }`}
                          >
                            {opt.icon}
                          </div>
                          <div className="text-left flex-1">
                            <p className={`text-xs font-bold ${active ? "text-white" : "text-white/60"}`}>
                              {opt.label}
                            </p>
                            <p className="text-[10px] text-white/30">{opt.sub}</p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              active
                                ? "border-[#FF3B3B] bg-[#FF3B3B]"
                                : "border-white/20"
                            }`}
                          >
                            {active && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Promo code */}
                <button
                  onClick={() => setPromoOpen(!promoOpen)}
                  className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors mb-4"
                >
                  <div className="flex items-center gap-2 text-white/40 text-sm">
                    <Tag className="w-4 h-4 text-[#FF3B3B]" />
                    Have a promo code?
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-white/30 transition-transform ${promoOpen ? "rotate-90" : ""}`}
                  />
                </button>
                {promoOpen && (
                  <div className="mb-4 animate-expand-open">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter promo code"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#FF3B3B]/40 transition-colors"
                    />
                  </div>
                )}

                {/* Checkout */}
                <button
                  onClick={() => requireAuth(() => setLocation("/checkout/type"))}
                  className={`w-full h-12 rounded-xl font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition-all ${
                    cartItems.length > 0
                      ? "bg-[#FF3B3B] hover:bg-[#ff5252] text-white shadow-[0_0_30px_rgba(255,59,59,0.3)] hover:shadow-[0_0_40px_rgba(255,59,59,0.5)]"
                      : "bg-white/5 text-white/30 cursor-not-allowed"
                  }`}
                  disabled={cartItems.length === 0}
                >
                  <Lock className="w-4 h-4" />
                  CHECKOUT
                </button>

                <div className="flex items-center justify-center gap-1.5 mt-3 text-white/25 text-xs">
                  <Shield className="w-3.5 h-3.5" />
                  Secure Checkout
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-4 gap-3">
                <TrustBadge
                  icon={<Truck className="w-5 h-5" />}
                  title="Fast Delivery"
                  desc="30-40 min"
                />
                <TrustBadge
                  icon={<Leaf className="w-5 h-5" />}
                  title="Fresh Ingredients"
                  desc="100% Quality"
                />
                <TrustBadge
                  icon={<Shield className="w-5 h-5" />}
                  title="Secure Payment"
                  desc="100% Safe"
                />
                <TrustBadge
                  icon={<HeadphonesIcon className="w-5 h-5" />}
                  title="24/7 Support"
                  desc="We're here"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editingItem && editingProduct && (
        <CustomizeModal
          product={editingProduct}
          onClose={() => setEditingItem(null)}
          onConfirm={handleEditConfirm}
          mode="edit"
          initialSizeIdx={getSizeIdx(editingProduct, editingItem.size)}
          initialAddOns={editingItem.addOns}
          initialQuantity={editingItem.quantity}
          initialCustomization={editingItem.customization}
          currency={editingItem.currency || "PHP"}
        />
      )}
    </div>
  );
}

function TrustBadge({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-[#111111] border border-white/5 rounded-xl p-3 flex flex-col items-center text-center hover:border-white/10 hover:shadow-[0_0_20px_rgba(255,59,59,0.06)] transition-all duration-300 group">
      <div className="w-9 h-9 rounded-full bg-[#FF3B3B]/10 flex items-center justify-center mb-2 text-[#FF3B3B] group-hover:bg-[#FF3B3B]/20 transition-colors">
        {icon}
      </div>
      <p className="text-[10px] font-bold text-white/70 leading-tight">{title}</p>
      <p className="text-[9px] text-white/30 mt-0.5 leading-tight">{desc}</p>
    </div>
  );
}
