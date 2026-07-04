import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface SavedAddress {
  addressId: string;
  label: string;
  fullAddress: string;
  landmark: string;
  contactNumber: string;
  noteToRider: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type SaveAddressInput = Omit<SavedAddress, "addressId" | "createdAt" | "updatedAt"> & {
  addressId?: string;
};

export async function getUserAddresses(userId: string) {
  const snapshot = await getDocs(collection(db, "users", userId, "addresses"));

  return snapshot.docs.map((addressDoc) => normalizeAddress(addressDoc.id, addressDoc.data()));
}

export async function getDefaultUserAddress(userId: string) {
  const defaultSnapshot = await getDocs(
    query(collection(db, "users", userId, "addresses"), where("isDefault", "==", true), limit(1)),
  );

  if (!defaultSnapshot.empty) {
    const addressDoc = defaultSnapshot.docs[0];
    return normalizeAddress(addressDoc.id, addressDoc.data());
  }

  const addresses = await getUserAddresses(userId);
  return addresses[0] || null;
}

export async function saveUserAddress(userId: string, input: SaveAddressInput) {
  const addressId = input.addressId || createAddressId();
  const addressRef = doc(db, "users", userId, "addresses", addressId);

  if (input.isDefault) {
    const snapshot = await getDocs(collection(db, "users", userId, "addresses"));
    const batch = writeBatch(db);

    snapshot.docs.forEach((addressDoc) => {
      if (addressDoc.id !== addressId) {
        batch.update(addressDoc.ref, {
          isDefault: false,
          updatedAt: serverTimestamp(),
        });
      }
    });

    await batch.commit();
  }

  await setDoc(
    addressRef,
    {
      addressId,
      label: input.label,
      fullAddress: input.fullAddress,
      landmark: input.landmark,
      contactNumber: input.contactNumber,
      noteToRider: input.noteToRider,
      isDefault: input.isDefault,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return {
    addressId,
    label: input.label,
    fullAddress: input.fullAddress,
    landmark: input.landmark,
    contactNumber: input.contactNumber,
    noteToRider: input.noteToRider,
    isDefault: input.isDefault,
  } satisfies SavedAddress;
}

export async function deleteUserAddress(userId: string, addressId: string) {
  await deleteDoc(doc(db, "users", userId, "addresses", addressId));
}

export async function setDefaultUserAddress(userId: string, addressId: string) {
  const snapshot = await getDocs(collection(db, "users", userId, "addresses"));
  const batch = writeBatch(db);

  snapshot.docs.forEach((addressDoc) => {
    batch.update(addressDoc.ref, {
      isDefault: addressDoc.id === addressId,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function updateUserAddress(userId: string, addressId: string, input: SaveAddressInput) {
  await updateDoc(doc(db, "users", userId, "addresses", addressId), {
    label: input.label,
    fullAddress: input.fullAddress,
    landmark: input.landmark,
    contactNumber: input.contactNumber,
    noteToRider: input.noteToRider,
    isDefault: input.isDefault,
    updatedAt: serverTimestamp(),
  });

  return {
    addressId,
    label: input.label,
    fullAddress: input.fullAddress,
    landmark: input.landmark,
    contactNumber: input.contactNumber,
    noteToRider: input.noteToRider,
    isDefault: input.isDefault,
  } satisfies SavedAddress;
}

function normalizeAddress(addressId: string, data: Record<string, unknown>): SavedAddress {
  return {
    addressId: String(data.addressId || addressId),
    label: String(data.label || "Home"),
    fullAddress: String(data.fullAddress || ""),
    landmark: String(data.landmark || ""),
    contactNumber: String(data.contactNumber || ""),
    noteToRider: String(data.noteToRider || ""),
    isDefault: Boolean(data.isDefault),
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

function createAddressId() {
  return `address-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
