import { useEffect, useState } from "react";
import { Heart, Plus, Trash2 } from "lucide-react";
import ProfileShell from "@/components/profile-shell";
import { useAuth } from "@/context/auth-context";
import { formatCartMoney, type CartItem } from "@/lib/cart";
import {
  getUserFavorites,
  removeUserFavorite,
  type FavoriteProduct,
} from "@/lib/favorites";

interface ProfileFavoritesPageProps {
  cartCount: number;
  addToCart: (item: Omit<CartItem, "id">) => void;
}

export default function ProfileFavoritesPage({ cartCount, addToCart }: ProfileFavoritesPageProps) {
  const { user, requireAuth } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const loadFavorites = async () => {
    if (!user) return;
    setLoadingFavorites(true);
    try {
      setFavorites(await getUserFavorites(user.uid));
    } finally {
      setLoadingFavorites(false);
    }
  };

  useEffect(() => {
    void loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRemove = async (favoriteId: string) => {
    if (!user) return;
    await removeUserFavorite(user.uid, favoriteId);
    await loadFavorites();
  };

  const handleAddToCart = (favorite: FavoriteProduct) => {
    requireAuth(() => {
      addToCart({
        productId: favorite.productId,
        name: favorite.productName,
        image: favorite.image,
        badge: favorite.badge || "FAVORITE",
        size: "Regular",
        addOns: [],
        quantity: 1,
        unitPrice: favorite.price,
        baseUnitPrice: favorite.price,
        addOnTotal: 0,
        currency: "PHP",
        fulfillment: "delivery",
      });
      window.dispatchEvent(new CustomEvent("bnb:open-cart"));
    });
  };

  return (
    <ProfileShell cartCount={cartCount} title="Favorites" eyebrow="Saved menu picks">
      <section className="rounded-3xl border border-white/10 bg-[#111111]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.25)] sm:p-6">
        {loadingFavorites ? (
          <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm font-bold text-white/50">
            Loading favorites...
          </p>
        ) : favorites.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <Heart className="mx-auto h-10 w-10 text-[#FF4D2E]" />
            <p className="mt-3 font-black">No favorites yet.</p>
            <p className="mt-1 text-sm text-white/40">Tap the heart on products you want to save for later.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {favorites.map((favorite) => {
              const available = favorite.availability !== "Unavailable";

              return (
                <article key={favorite.favoriteId} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <div className="relative h-44 overflow-hidden">
                    <img src={favorite.image} alt={favorite.productName} className="h-full w-full object-cover" />
                    <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-black ${
                      available ? "bg-emerald-500/90 text-white" : "bg-white/15 text-white/70"
                    }`}>
                      {favorite.availability}
                    </span>
                  </div>

                  <div className="p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FF8A80]">
                      {favorite.category}
                    </p>
                    <h2 className="mt-1 line-clamp-2 font-display text-xl font-black">{favorite.productName}</h2>
                    {favorite.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/45">{favorite.description}</p>
                    )}
                    <p className="mt-3 font-display text-2xl font-black text-[#FF4D2E]">
                      {formatCartMoney(favorite.price, "PHP")}
                    </p>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(favorite)}
                        disabled={!available}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[#FF3B3B] text-xs font-black text-white transition-all hover:bg-[#ff5252] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
                      >
                        <Plus className="h-4 w-4" />
                        Add to cart
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(favorite.favoriteId)}
                        aria-label={`Remove ${favorite.productName} from favorites`}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#FF3B3B]/25 bg-[#FF3B3B]/10 text-[#FF8A80] transition-all hover:border-[#FF3B3B]/55 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </ProfileShell>
  );
}
