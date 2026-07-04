import { AuthProvider } from "@/context/auth-context";
import AccountModal from "@/components/account-modal";
import { useState, useCallback, useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CartDrawer from "@/components/cart-drawer";
import SignupPromoBanner from "@/components/signup-promo-banner";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/scroll-to-top";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import BuildYourBitePage from "@/pages/build-your-bite";
import DealsPage from "@/pages/deals";
import CartPage from "@/pages/cart";
import CheckoutTypePage from "@/pages/checkout-type";
import DeliveryReviewPage from "@/pages/delivery-review";
import FooterInfoPage from "@/pages/footer-info";
import OrderSuccessPage from "@/pages/order-success";
import PickupPage from "@/pages/pickup";
import PickupBranchMenuPage from "@/pages/pickup-branch-menu";
import PickupReviewPage from "@/pages/pickup-review";
import ProfilePage from "@/pages/profile";
import ProfileAddressesPage from "@/pages/profile-addresses";
import ProfileFavoritesPage from "@/pages/profile-favorites";
import ProfileOrdersPage from "@/pages/profile-orders";
import { useThemeMode } from "@/hooks/use-theme-mode";
import { auth, db } from "@/lib/firebase";
import { getCartItemSignature, normalizeCartItemCurrency, type CartItem } from "@/lib/cart";

const queryClient = new QueryClient();
const LEGACY_CART_KEY = "bnb_cart";

function getUserCartStorageKey(userId: string) {
  return `bnb_cart_${userId}`;
}

function getCartDocId(cartItemId: string) {
  return encodeURIComponent(cartItemId);
}

function removeUndefinedFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(removeUndefinedFields);

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, removeUndefinedFields(entryValue)]),
    );
  }

  return value;
}

function cleanCartItems(items: CartItem[]) {
  return items
    .map(normalizeCartItemCurrency)
    .filter((item) => !item.id.startsWith("demo-"));
}

function loadUserCartFromLocalStorage(userId: string) {
  try {
    const raw = localStorage.getItem(getUserCartStorageKey(userId));
    return raw ? cleanCartItems(JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

async function loadUserCartFromFirestore(userId: string) {
  const snapshot = await getDocs(collection(db, "users", userId, "cart"));
  return cleanCartItems(
    snapshot.docs.map((cartDoc) => ({
      id: cartDoc.id,
      ...(cartDoc.data() as Omit<CartItem, "id">),
    })),
  );
}

async function saveUserCartToFirestore(userId: string, items: CartItem[]) {
  const cartRef = collection(db, "users", userId, "cart");
  const snapshot = await getDocs(cartRef);
  const batch = writeBatch(db);
  let writeCount = 0;

  snapshot.docs.forEach((cartDoc) => {
    batch.delete(cartDoc.ref);
    writeCount += 1;
  });

  items.forEach((item) => {
    const cartDocument = {
      ...(removeUndefinedFields(item) as Record<string, unknown>),
      productName: item.name,
      price: item.unitPrice,
      category: item.badge,
      customizations: item.customization ?? item.addOns,
      discountInfo: item.isDeal
        ? {
            originalPrice: item.originalPrice ?? item.unitPrice,
            discountedPrice: item.unitPrice,
            discountLabel: item.discountLabel ?? "",
          }
        : null,
      branchId: item.branchId ?? null,
      orderType: item.fulfillment ?? null,
      updatedAt: serverTimestamp(),
    };

    batch.set(
      doc(db, "users", userId, "cart", getCartDocId(item.id)),
      cartDocument,
    );
    writeCount += 1;
  });

  if (writeCount > 0) {
    await batch.commit();
  }
}

function App() {
  useThemeMode();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const cartLoadTokenRef = useRef(0);
  const cartMutationVersionRef = useRef(0);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      localStorage.removeItem(LEGACY_CART_KEY);
    } catch { /* ignore */ }
    return [];
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const loadToken = ++cartLoadTokenRef.current;
      cartMutationVersionRef.current += 1;
      const mutationVersionAtLoadStart = cartMutationVersionRef.current;

      setCartItems([]);

      try {
        localStorage.removeItem(LEGACY_CART_KEY);
      } catch { /* ignore */ }

      if (!currentUser) {
        return;
      }

      try {
        const firestoreItems = await loadUserCartFromFirestore(currentUser.uid);

        if (
          cartLoadTokenRef.current !== loadToken ||
          cartMutationVersionRef.current !== mutationVersionAtLoadStart
        ) {
          return;
        }

        setCartItems(firestoreItems);
        localStorage.setItem(getUserCartStorageKey(currentUser.uid), JSON.stringify(firestoreItems));
      } catch {
        if (
          cartLoadTokenRef.current !== loadToken ||
          cartMutationVersionRef.current !== mutationVersionAtLoadStart
        ) {
          return;
        }

        setCartItems(loadUserCartFromLocalStorage(currentUser.uid));
      }
    });

    return unsubscribe;
  }, []);

  const persist = useCallback((items: CartItem[]) => {
    const currentUser = auth.currentUser;
    const cleanItems = cleanCartItems(items);

    cartMutationVersionRef.current += 1;
    setCartItems(cleanItems);

    try {
      localStorage.removeItem(LEGACY_CART_KEY);
    } catch { /* ignore */ }

    if (!currentUser) {
      return;
    }

    localStorage.setItem(getUserCartStorageKey(currentUser.uid), JSON.stringify(cleanItems));
    void saveUserCartToFirestore(currentUser.uid, cleanItems).catch(() => {
      // Keep the user-specific local cart if Firestore is temporarily unavailable.
    });
  }, []);

  const addItem = useCallback(
    (item: Omit<CartItem, "id">) => {
      const signature = getCartItemSignature(item);
      const existingItem = cartItems.find((cartItem) => getCartItemSignature(cartItem) === signature);

      if (existingItem) {
        persist(
          cartItems.map((cartItem) =>
            cartItem.id === existingItem.id
              ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
              : cartItem,
          ),
        );
        return;
      }

      const id = `${item.productId}-${Date.now()}`;
      persist([...cartItems, { ...item, id }]);
    },
    [cartItems]
  );

  const removeItem = useCallback(
    (id: string) => {
      persist(cartItems.filter((i) => i.id !== id));
    },
    [cartItems]
  );

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      if (quantity <= 0) {
        persist(cartItems.filter((i) => i.id !== id));
        return;
      }

      persist(
        cartItems.map((i) => (i.id === id ? { ...i, quantity } : i))
      );
    },
    [cartItems]
  );

  const updateItem = useCallback(
    (id: string, updates: Partial<CartItem>) => {
      persist(
        cartItems.map((i) => (i.id === id ? { ...i, ...updates } : i))
      );
    },
    [cartItems]
  );

  const clearCart = useCallback(() => {
    persist([]);
  }, [persist]);

  const cartCount = cartItems.reduce((c, i) => c + i.quantity, 0);

  useEffect(() => {
    const openCartDrawer = () => setCartDrawerOpen(true);

    window.addEventListener("bnb:open-cart", openCartDrawer);
    return () => window.removeEventListener("bnb:open-cart", openCartDrawer);
  }, []);

 return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ScrollToTop />
          <SignupPromoBanner />
          <div className="min-h-[100dvh] overflow-x-hidden bg-[#050505] text-white">
            <Switch>
              <Route path="/">
                <Home
                  cartCount={cartCount}
                  addToCart={addItem}
                />
              </Route>
              <Route path="/deals">
                <DealsPage
                  cartCount={cartCount}
                  addToCart={addItem}
                />
              </Route>
              <Route path="/build-your-bite">
                <BuildYourBitePage
                  cartCount={cartCount}
                  addToCart={addItem}
                />
              </Route>
              <Route path="/faqs">
                <FooterInfoPage cartCount={cartCount} variant="faqs" />
              </Route>
              <Route path="/careers">
                <FooterInfoPage cartCount={cartCount} variant="careers" />
              </Route>
              <Route path="/privacy-policy">
                <FooterInfoPage cartCount={cartCount} variant="privacy" />
              </Route>
              <Route path="/terms-of-service">
                <FooterInfoPage cartCount={cartCount} variant="terms" />
              </Route>
              <Route path="/cookie-policy">
                <FooterInfoPage cartCount={cartCount} variant="cookies" />
              </Route>
              <Route path="/cart">
                <CartPage
                  cartItems={cartItems}
                  updateQuantity={updateQuantity}
                  removeItem={removeItem}
                  updateItem={updateItem}
                  cartCount={cartCount}
                />
              </Route>
              <Route path="/checkout/delivery">
                <DeliveryReviewPage
                  cartCount={cartCount}
                  cartItems={cartItems}
                  updateItem={updateItem}
                  removeItem={removeItem}
                  clearCart={clearCart}
                />
              </Route>
              <Route path="/checkout/pickup/:branchId/review">
                <PickupReviewPage
                  cartCount={cartCount}
                  cartItems={cartItems}
                  updateItem={updateItem}
                  removeItem={removeItem}
                  clearCart={clearCart}
                  checkoutMode
                />
              </Route>
              <Route path="/order-success/:orderId">
                <OrderSuccessPage cartCount={cartCount} />
              </Route>
              <Route path="/order-history">
                <ProfileOrdersPage cartCount={cartCount} />
              </Route>
              <Route path="/profile/orders">
                <ProfileOrdersPage cartCount={cartCount} />
              </Route>
              <Route path="/profile/addresses">
                <ProfileAddressesPage cartCount={cartCount} />
              </Route>
              <Route path="/profile/favorites">
                <ProfileFavoritesPage cartCount={cartCount} addToCart={addItem} />
              </Route>
              <Route path="/profile">
                <ProfilePage cartCount={cartCount} />
              </Route>
              <Route path="/checkout/pickup/branches">
                <PickupPage cartCount={cartCount} checkoutMode />
              </Route>
              <Route path="/checkout/type">
                <CheckoutTypePage
                  cartCount={cartCount}
                  cartItems={cartItems}
                />
              </Route>
              <Route path="/checkout">
                <CheckoutTypePage
                  cartCount={cartCount}
                  cartItems={cartItems}
                />
            </Route>
            <Route path="/pickup/:branchId/review">
              <PickupReviewPage
                cartCount={cartCount}
                cartItems={cartItems}
                updateItem={updateItem}
                removeItem={removeItem}
                clearCart={clearCart}
              />
            </Route>
              <Route path="/pickup/:branchId">
                <PickupBranchMenuPage
                  cartCount={cartCount}
                  cartItems={cartItems}
                  addToCart={addItem}
                  updateQuantity={updateQuantity}
                  removeItem={removeItem}
                />
              </Route>
              <Route path="/pickup">
                <PickupPage cartCount={cartCount} />
              </Route>
              <Route component={NotFound} />
            </Switch>
            <Footer />
          </div>
          <CartDrawer
            isOpen={cartDrawerOpen}
            cartItems={cartItems}
            updateQuantity={updateQuantity}
            updateItem={updateItem}
            removeItem={removeItem}
            onClose={() => setCartDrawerOpen(false)}
          />
          <AccountModal />
        </WouterRouter>
      </AuthProvider>
      <Toaster />
    </TooltipProvider>
  </QueryClientProvider>
  
  );
}

export default App;
