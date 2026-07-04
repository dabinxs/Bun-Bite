import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Edit3, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { CustomizeModal, PRODUCTS } from "@/components/menu";
import { useAuth } from "@/context/auth-context";
import {
  buildCartItemSummary,
  formatCartMoney,
  type CartCurrency,
  type CartItem,
} from "@/lib/cart";

interface CartDrawerProps {
  isOpen: boolean;
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  removeItem: (id: string) => void;
  onClose: () => void;
}

export default function CartDrawer({
  isOpen,
  cartItems,
  updateQuantity,
  updateItem,
  removeItem,
  onClose,
}: CartDrawerProps) {
  const { requireAuth } = useAuth();
  const [, setLocation] = useLocation();
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cartItems]
  );
  const summaryCurrency = useMemo(() => getCartCurrency(cartItems), [cartItems]);
  const editingProduct = useMemo(() => {
    if (!editingItem || editingItem.isDeal || editingItem.isCombo) return null;
    return PRODUCTS.find((product) => product.id === editingItem.productId) || null;
  }, [editingItem]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    requireAuth(() => {
      onClose();
      setLocation("/checkout/type");
    });
  };

  const getSizeIdx = (sizeLabel: string) => {
    if (!editingProduct) return 0;
    const idx = editingProduct.sizes?.findIndex((size) => size.label === sizeLabel) ?? -1;
    return idx >= 0 ? idx : 0;
  };

  const handleEditConfirm = (data: {
    size: string;
    addOns: string[];
    quantity: number;
    unitPrice: number;
    baseUnitPrice: number;
    addOnTotal: number;
    customization: CartItem["customization"];
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] overflow-hidden">
          <motion.button
            type="button"
            aria-label="Close cart drawer"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Your cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 260 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col border-l border-white/10 bg-[#0B0B0B] text-white shadow-[0_0_80px_rgba(0,0,0,0.75)] sm:w-[440px]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/8 px-5 py-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FF8A80]">
                  Bun & Bite
                </p>
                <h2 className="font-display text-2xl font-black">Your Cart</h2>
              </div>
              <button
                type="button"
                aria-label="Close cart"
                onClick={onClose}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/55 transition-all hover:border-[#FF3B3B]/35 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bunbite-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {cartItems.length > 0 ? (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <CartDrawerItem
                      key={item.id}
                      item={item}
                      updateQuantity={updateQuantity}
                      removeItem={removeItem}
                      onEdit={() => requireAuth(() => setEditingItem(item))}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[55vh] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-[#FF3B3B]/25 bg-[#FF3B3B]/10 text-[#FF4D2E]">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <h3 className="mt-5 font-display text-2xl font-black">Your cart is empty.</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/45">
                    Add burgers, drinks, sides, or desserts and they will appear here.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-6 h-11 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-black text-white transition-all hover:border-[#FF3B3B]/35"
                  >
                    Continue ordering
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-white/8 bg-[#111111]/95 px-5 py-5">
              <div className="space-y-3 text-sm">
                <SummaryRow label="Subtotal" value={formatMoney(subtotal, summaryCurrency)} />
                <SummaryRow label="Estimated fees" value="Calculated at checkout" muted />
                <div className="flex items-end justify-between gap-4 pt-2">
                  <div>
                    <p className="font-display text-2xl font-black">Total</p>
                    <p className="text-xs text-white/35">Before delivery or pickup fees</p>
                  </div>
                  <p className="text-2xl font-black text-[#FF4D2E]">{formatMoney(subtotal, summaryCurrency)}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
                className="mt-5 h-12 w-full rounded-full bg-[#FF3B3B] text-sm font-black text-white transition-all hover:bg-[#ff5252] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
              >
                Go to checkout
              </button>
            </div>
          </motion.aside>

          {editingItem && editingProduct && (
            <CustomizeModal
              product={editingProduct}
              onClose={() => setEditingItem(null)}
              onConfirm={handleEditConfirm}
              mode="edit"
              initialSizeIdx={getSizeIdx(editingItem.size)}
              initialAddOns={editingItem.addOns}
              initialQuantity={editingItem.quantity}
              initialCustomization={editingItem.customization}
              currency={editingItem.currency || "PHP"}
            />
          )}
        </div>
      )}
    </AnimatePresence>
  );
}

function CartDrawerItem({
  item,
  updateQuantity,
  removeItem,
  onEdit,
}: {
  item: CartItem;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  onEdit: () => void;
}) {
  const customizationSummary = buildCartItemSummary(item);
  const canEdit = !item.isDeal && !item.isCombo && Boolean(PRODUCTS.find((product) => product.id === item.productId));

  const decreaseQuantity = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
      return;
    }

    removeItem(item.id);
  };

  return (
    <article className="rounded-3xl border border-white/10 bg-[#111111] p-3 shadow-[0_20px_45px_rgba(0,0,0,0.2)]">
      <div className="grid grid-cols-[70px_minmax(0,1fr)_auto] gap-3">
        <img
          src={item.image}
          alt={item.name}
          className="h-[70px] w-[70px] rounded-2xl object-cover"
        />

        <div className="min-w-0">
          <p className="truncate font-display text-base font-black leading-tight">{item.name}</p>
          <p className="mt-1 truncate text-xs font-bold text-[#FF8A80]">
            {item.branchName || "Bun & Bite Menu"}
          </p>
          {(item.isDeal || item.isCombo) && (
            <p className="mt-1 inline-flex w-fit rounded-full border border-[#FF3B3B]/25 bg-[#FF3B3B]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#FFB4AB]">
              {item.isCombo ? "Build Your Bite" : item.discountLabel || "Deal price"}
            </p>
          )}
          <p className="mt-1 truncate text-xs text-white/35">
            {item.fulfillment === "pickup" ? "Pickup item" : "Delivery or pickup available"} - {item.size}
          </p>
          {customizationSummary.length > 0 && (
            <p className="mt-1 line-clamp-3 text-xs text-white/30">
              {customizationSummary.join(" / ")}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {canEdit && (
            <button
              type="button"
              aria-label={`Edit ${item.name}`}
              onClick={onEdit}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/45 transition-all hover:border-[#FF3B3B]/35 hover:text-white"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            aria-label={`Remove ${item.name}`}
            onClick={() => removeItem(item.id)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/45 transition-all hover:border-[#FF3B3B]/35 hover:text-[#FF4D2E]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          {item.originalPrice && (
            <p className="text-xs font-bold text-white/30 line-through">
              {formatMoney(item.originalPrice * item.quantity, item.currency)}
            </p>
          )}
          <p className="text-sm font-black text-[#FF4D2E]">
            {formatMoney(item.unitPrice * item.quantity, item.currency)}
          </p>
        </div>

        <div className="flex h-10 items-center overflow-hidden rounded-full border border-white/10 bg-black/25">
          <button
            type="button"
            aria-label={`Decrease ${item.name}`}
            onClick={decreaseQuantity}
            className="flex h-full w-10 items-center justify-center text-white/55 transition-colors hover:text-white"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-9 text-center text-sm font-black">{item.quantity}</span>
          <button
            type="button"
            aria-label={`Increase ${item.name}`}
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="flex h-full w-10 items-center justify-center text-white/75 transition-colors hover:text-white"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function SummaryRow({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-white/55">
      <span>{label}</span>
      <span className={`text-right font-bold ${muted ? "text-white/35" : "text-white/80"}`}>{value}</span>
    </div>
  );
}

function getCartCurrency(items: CartItem[]) {
  return items.find((item) => item.currency === "PHP")?.currency || items.find((item) => item.currency)?.currency || "PHP";
}

function formatMoney(value: number, currency: CartCurrency = "PHP") {
  return formatCartMoney(value, currency);
}
