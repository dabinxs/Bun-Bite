import { useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, Edit3, MapPin, Plus, Star, Trash2 } from "lucide-react";
import ProfileShell from "@/components/profile-shell";
import { useAuth } from "@/context/auth-context";
import {
  deleteUserAddress,
  getUserAddresses,
  saveUserAddress,
  setDefaultUserAddress,
  updateUserAddress,
  type SavedAddress,
} from "@/lib/addresses";

interface ProfileAddressesPageProps {
  cartCount: number;
}

const EMPTY_FORM = {
  label: "",
  fullAddress: "",
  landmark: "",
  contactNumber: "",
  noteToRider: "",
};

export default function ProfileAddressesPage({ cartCount }: ProfileAddressesPageProps) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setAddresses([]);
      setForm(EMPTY_FORM);
      setEditingId(null);
      setMessage("");
      setLoadingAddresses(false);
      return () => {
        cancelled = true;
      };
    }

    setLoadingAddresses(true);
    getUserAddresses(user.uid)
      .then((userAddresses) => {
        if (!cancelled) setAddresses(userAddresses);
      })
      .catch(() => {
        if (!cancelled) setAddresses([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingAddresses(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const refreshAddresses = async (userId: string) => {
    setLoadingAddresses(true);
    try {
      setAddresses(await getUserAddresses(userId));
    } finally {
      setLoadingAddresses(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!user || saving || !form.label.trim() || !form.fullAddress.trim()) return;
    setSaving(true);
    setMessage("");

    try {
      if (editingId) {
        await updateUserAddress(user.uid, editingId, {
          ...form,
          isDefault: addresses.find((address) => address.addressId === editingId)?.isDefault ?? false,
        });
        setMessage("Address updated.");
      } else {
        await saveUserAddress(user.uid, {
          ...form,
          isDefault: addresses.length === 0,
        });
        setMessage("Address saved.");
      }

      resetForm();
      await refreshAddresses(user.uid);
    } catch {
      setMessage("We couldn't save the address yet. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (address: SavedAddress) => {
    setEditingId(address.addressId);
    setForm({
      label: address.label,
      fullAddress: address.fullAddress,
      landmark: address.landmark,
      contactNumber: address.contactNumber,
      noteToRider: address.noteToRider,
    });
    setMessage("");
  };

  const handleDelete = async (addressId: string) => {
    if (!user) return;
    await deleteUserAddress(user.uid, addressId);
    if (editingId === addressId) resetForm();
    await refreshAddresses(user.uid);
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user) return;
    await setDefaultUserAddress(user.uid, addressId);
    await refreshAddresses(user.uid);
  };

  return (
    <ProfileShell cartCount={cartCount} title="Saved Addresses" eyebrow="Delivery details">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-3xl border border-white/10 bg-[#111111]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.25)] sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                Your addresses
              </p>
              <h2 className="mt-2 font-display text-2xl font-black">Delivery locations</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-white/45">
              {addresses.length}
            </span>
          </div>

          {loadingAddresses ? (
            <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm font-bold text-white/50">
              Loading addresses...
            </p>
          ) : addresses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
              <MapPin className="mx-auto h-9 w-9 text-[#FF4D2E]" />
              <p className="mt-3 font-black">No saved addresses yet.</p>
              <p className="mt-1 text-sm text-white/40">Add one so delivery checkout can load it automatically.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {addresses.map((address) => (
                <article key={address.addressId} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-xl font-black">{address.label}</h3>
                        {address.isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/60">{address.fullAddress}</p>
                      {address.landmark && <p className="mt-2 text-xs text-white/40">Landmark: {address.landmark}</p>}
                      {address.contactNumber && <p className="mt-1 text-xs text-white/40">Contact: {address.contactNumber}</p>}
                      {address.noteToRider && <p className="mt-1 text-xs text-white/40">Note: {address.noteToRider}</p>}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <IconButton label="Edit" onClick={() => handleEdit(address)} icon={<Edit3 className="h-4 w-4" />} />
                      <IconButton label="Delete" onClick={() => handleDelete(address.addressId)} icon={<Trash2 className="h-4 w-4" />} danger />
                      {!address.isDefault && (
                        <IconButton label="Default" onClick={() => handleSetDefault(address.addressId)} icon={<Star className="h-4 w-4" />} />
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-3xl border border-white/10 bg-[#111111]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.25)] sm:p-6 xl:sticky xl:top-24 xl:h-fit">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FF8A80]">
            {editingId ? "Edit address" : "Add address"}
          </p>
          <h2 className="mt-2 font-display text-2xl font-black">
            {editingId ? "Update delivery details" : "New delivery address"}
          </h2>

          <div className="mt-5 grid gap-3">
            <AddressField label="Label" value={form.label} onChange={(value) => setForm((current) => ({ ...current, label: value }))} placeholder="Home, School, Work" />
            <AddressArea label="Full address" value={form.fullAddress} onChange={(value) => setForm((current) => ({ ...current, fullAddress: value }))} placeholder="House/building, street, barangay, city" />
            <AddressField label="Landmark" value={form.landmark} onChange={(value) => setForm((current) => ({ ...current, landmark: value }))} placeholder="Nearby landmark" />
            <AddressField label="Contact number" value={form.contactNumber} onChange={(value) => setForm((current) => ({ ...current, contactNumber: value }))} placeholder="+63 9XX XXX XXXX" />
            <AddressArea label="Note to rider" value={form.noteToRider} onChange={(value) => setForm((current) => ({ ...current, noteToRider: value }))} placeholder="Gate code, leave at lobby, etc." small />
          </div>

          {message && <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs font-bold text-white/55">{message}</p>}

          <div className="mt-5 flex gap-2">
            {editingId && (
              <button type="button" onClick={resetForm} className="h-12 rounded-full border border-white/10 px-5 text-sm font-black text-white/60 transition-all hover:border-[#FF3B3B]/35 hover:text-white">
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.label.trim() || !form.fullAddress.trim()}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#FF3B3B] text-sm font-black text-white transition-all hover:bg-[#ff5252] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
            >
              <Plus className="h-4 w-4" />
              {saving ? "Saving..." : editingId ? "Save changes" : "Add address"}
            </button>
          </div>
        </aside>
      </div>
    </ProfileShell>
  );
}

function IconButton({ label, icon, onClick, danger = false }: { label: string; icon: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-black transition-all ${
        danger
          ? "border-[#FF3B3B]/25 bg-[#FF3B3B]/10 text-[#FF8A80] hover:border-[#FF3B3B]/55 hover:text-white"
          : "border-white/10 bg-white/[0.04] text-white/55 hover:border-[#FF3B3B]/35 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function AddressField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/35">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#FF3B3B]/45"
      />
    </label>
  );
}

function AddressArea({ label, value, onChange, placeholder, small = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; small?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-white/35">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${small ? "min-h-[80px]" : "min-h-[120px]"} w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#FF3B3B]/45`}
      />
    </label>
  );
}
