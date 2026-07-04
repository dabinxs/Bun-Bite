import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface FavoriteProduct {
  favoriteId: string;
  productId: number;
  productName: string;
  image: string;
  category: string;
  price: number;
  availability: "Available" | "Unavailable";
  badge?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SaveFavoriteInput = Omit<FavoriteProduct, "favoriteId" | "createdAt" | "updatedAt">;

export function getFavoriteId(productId: number) {
  return `product-${productId}`;
}

export async function getUserFavorites(userId: string) {
  const snapshot = await getDocs(collection(db, "users", userId, "favorites"));
  return snapshot.docs.map((favoriteDoc) => normalizeFavorite(favoriteDoc.id, favoriteDoc.data()));
}

export async function getUserFavoriteIds(userId: string) {
  const favorites = await getUserFavorites(userId);
  return new Set(favorites.map((favorite) => favorite.productId));
}

export async function saveUserFavorite(userId: string, favorite: SaveFavoriteInput) {
  const favoriteId = getFavoriteId(favorite.productId);

  await setDoc(
    doc(db, "users", userId, "favorites", favoriteId),
    {
      favoriteId,
      productId: favorite.productId,
      productName: favorite.productName,
      image: favorite.image,
      category: favorite.category,
      price: favorite.price,
      availability: favorite.availability,
      badge: favorite.badge || "",
      description: favorite.description || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { ...favorite, favoriteId } satisfies FavoriteProduct;
}

export async function removeUserFavorite(userId: string, favoriteId: string) {
  await deleteDoc(doc(db, "users", userId, "favorites", favoriteId));
}

export async function toggleUserFavorite(userId: string, favorite: SaveFavoriteInput) {
  const favoriteId = getFavoriteId(favorite.productId);
  const favoriteRef = doc(db, "users", userId, "favorites", favoriteId);
  const favoriteSnap = await getDoc(favoriteRef);

  if (favoriteSnap.exists()) {
    await deleteDoc(favoriteRef);
    return false;
  }

  await saveUserFavorite(userId, favorite);
  return true;
}

function normalizeFavorite(favoriteId: string, data: Record<string, unknown>): FavoriteProduct {
  return {
    favoriteId: String(data.favoriteId || favoriteId),
    productId: Number(data.productId || 0),
    productName: String(data.productName || data.name || "Favorite item"),
    image: String(data.image || "/images/classic.jpg"),
    category: String(data.category || "Menu"),
    price: Number(data.price || 0),
    availability: data.availability === "Unavailable" ? "Unavailable" : "Available",
    badge: data.badge ? String(data.badge) : undefined,
    description: data.description ? String(data.description) : undefined,
    createdAt: timestampToString(data.createdAt),
    updatedAt: timestampToString(data.updatedAt),
  };
}

function timestampToString(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return undefined;
}
