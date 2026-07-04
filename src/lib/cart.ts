export type CartCurrency = "PHP";

export type SpiceLevel = "Mild" | "Medium" | "Spicy" | "Extra Spicy";

export interface CartCustomization {
  addOns: string[];
  removeIngredients: string[];
  spiceLevel: SpiceLevel;
  drinkOption: string;
  sideOption: string;
  notes: string;
}

export interface CartComboDetails {
  comboId: string;
  comboType: string;
  includedItems: string[];
  burger: string;
  side: string;
  drink: string;
  dessert?: string;
  addOns: string[];
  flavorLevel: SpiceLevel;
  specialInstructions: string;
  savings: number;
  prepTime: string;
  customName?: string;
  mood?: string;
}

export interface CartItem {
  id: string;
  productId: number;
  name: string;
  image: string;
  badge: string;
  size: string;
  addOns: string[];
  quantity: number;
  unitPrice: number;
  baseUnitPrice?: number;
  addOnTotal?: number;
  customization?: CartCustomization;
  originalPrice?: number;
  isDeal?: boolean;
  isCombo?: boolean;
  discountLabel?: string;
  comboDetails?: CartComboDetails;
  currency?: CartCurrency;
  branchId?: string;
  branchName?: string;
  fulfillment?: "delivery" | "pickup";
}

export interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
}

export function calcCartTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const deliveryFee = items.length > 0 ? 59 : 0;
  const serviceFee = items.length > 0 ? 15 : 0;
  const total = subtotal + deliveryFee + serviceFee;
  return { subtotal, deliveryFee, serviceFee, total, itemCount: items.reduce((c, i) => c + i.quantity, 0) };
}

export const ADD_ON_OPTIONS = [
  { label: "Extra cheese", price: 20 },
  { label: "Extra patty", price: 60 },
  { label: "Bacon", price: 40 },
  { label: "Extra sauce", price: 15 },
] as const;

export const REMOVE_INGREDIENT_OPTIONS = [
  "No onions",
  "No pickles",
  "No lettuce",
  "No tomato",
] as const;

export const SPICE_LEVELS: SpiceLevel[] = ["Mild", "Medium", "Spicy", "Extra Spicy"];

export const DRINK_OPTIONS = ["No drink", "Classic Cola", "Iced Tea Lemon", "Fresh Orange Juice"] as const;
export const SIDE_OPTIONS = ["No side", "Classic Fries", "Onion Rings", "Chicken Nuggets"] as const;

export function getDefaultCustomization(): CartCustomization {
  return {
    addOns: [],
    removeIngredients: [],
    spiceLevel: "Mild",
    drinkOption: "No drink",
    sideOption: "No side",
    notes: "",
  };
}

export function getAddOnTotal(addOns: string[]) {
  return addOns.reduce((total, addon) => {
    return total + (ADD_ON_OPTIONS.find((option) => option.label === addon)?.price ?? 0);
  }, 0);
}

export function buildCustomizationSummary(customization?: CartCustomization, fallbackAddOns: string[] = []) {
  const summary: string[] = [];
  const addOns = customization?.addOns ?? fallbackAddOns;

  summary.push(...addOns);

  if (customization) {
    summary.push(...customization.removeIngredients);
    if (customization.spiceLevel) summary.push(customization.spiceLevel);
    if (customization.drinkOption && customization.drinkOption !== "No drink") summary.push(customization.drinkOption);
    if (customization.sideOption && customization.sideOption !== "No side") summary.push(customization.sideOption);
    if (customization.notes.trim()) summary.push(`Note: ${customization.notes.trim()}`);
  }

  return summary;
}

export function buildCartItemSummary(item: CartItem) {
  if (item.comboDetails) {
    const combo = item.comboDetails;
    const summary = [
      combo.comboType,
      `Burger: ${combo.burger}`,
      `Side: ${combo.side}`,
      `Drink: ${combo.drink}`,
    ];

    if (combo.dessert) summary.push(`Dessert: ${combo.dessert}`);
    if (combo.addOns.length > 0) summary.push(`Add-ons: ${combo.addOns.join(", ")}`);
    summary.push(`Flavor: ${combo.flavorLevel}`);
    if (combo.specialInstructions.trim()) {
      summary.push(`Note: ${combo.specialInstructions.trim()}`);
    }

    return summary;
  }

  return buildCustomizationSummary(item.customization, item.addOns);
}

export function getCartItemSignature(item: Omit<CartItem, "id"> | CartItem) {
  const customization = item.customization;
  const addOns = [...(customization?.addOns ?? item.addOns ?? [])].sort();
  const removed = [...(customization?.removeIngredients ?? [])].sort();
  const combo = item.comboDetails;

  return [
    item.productId,
    item.name,
    item.size,
    item.branchId ?? "",
    item.branchName ?? "",
    item.fulfillment ?? "",
    item.isCombo ? "combo" : "single",
    item.isDeal ? "deal" : "regular",
    item.currency ?? "",
    item.unitPrice.toFixed(2),
    combo?.comboId ?? "",
    combo?.comboType ?? "",
    combo?.includedItems.join("|") ?? "",
    combo?.burger ?? "",
    combo?.side ?? "",
    combo?.drink ?? "",
    combo?.dessert ?? "",
    combo?.addOns.slice().sort().join("|") ?? "",
    combo?.flavorLevel ?? "",
    combo?.specialInstructions.trim().toLowerCase() ?? "",
    combo?.customName?.trim().toLowerCase() ?? "",
    combo?.mood ?? "",
    addOns.join("|"),
    removed.join("|"),
    customization?.spiceLevel ?? "",
    customization?.drinkOption ?? "",
    customization?.sideOption ?? "",
    customization?.notes.trim().toLowerCase() ?? "",
  ].join("::");
}

export function toPesoAmount(value: number | string | undefined) {
  const amount = typeof value === "string" ? Number.parseFloat(value) : value ?? 0;
  if (!Number.isFinite(amount)) return 0;
  if (amount > 0 && amount < 50) return Math.round(amount * 50);
  return Math.round(amount * 100) / 100;
}

export function formatPrice(value: number) {
  const amount = Math.round((value + Number.EPSILON) * 100) / 100;
  return Number.isInteger(amount) ? `\u20b1${amount}` : `\u20b1${amount.toFixed(2)}`;
}

export function formatCartMoney(value: number, _currency: CartCurrency = "PHP") {
  return formatPrice(value);
}

export function normalizeCartItemCurrency(item: CartItem): CartItem {
  const legacyCurrency = (item as CartItem & { currency?: string }).currency;
  const shouldConvert = legacyCurrency !== "PHP";

  if (!shouldConvert) {
    return { ...item, currency: "PHP" };
  }

  return {
    ...item,
    unitPrice: toPesoAmount(item.unitPrice),
    baseUnitPrice: item.baseUnitPrice === undefined ? undefined : toPesoAmount(item.baseUnitPrice),
    addOnTotal: item.addOnTotal === undefined ? undefined : toPesoAmount(item.addOnTotal),
    originalPrice: item.originalPrice === undefined ? undefined : toPesoAmount(item.originalPrice),
    currency: "PHP",
  };
}
