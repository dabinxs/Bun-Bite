import { useEffect, useState, type ComponentType } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Edit3, Mail, Phone, Save, User, X } from "lucide-react";
import ProfileShell from "@/components/profile-shell";
import { useAuth } from "@/context/auth-context";

interface ProfilePageProps {
  cartCount: number;
}

interface ProfileForm {
  firstName: string;
  lastName: string;
  mobile: string;
}

export default function ProfilePage({ cartCount }: ProfilePageProps) {
  const { user, profile, logout, updateProfileData } = useAuth();
  const [, setLocation] = useLocation();
  const userEmail = profile?.email || user?.email || "";
  const profileMobile = profile?.mobileNumber || profile?.mobile || "No mobile number added.";
  const profileName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() ||
    user?.displayName ||
    userEmail.split("@")[0] ||
    "Bun & Bite Member";

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    mobile: "",
  });

  useEffect(() => {
    if (editing) return;

    setForm({
      firstName: profile?.firstName || user?.displayName?.split(/\s+/)[0] || "",
      lastName: profile?.lastName || user?.displayName?.split(/\s+/).slice(1).join(" ") || "",
      mobile: profile?.mobileNumber || profile?.mobile || "",
    });
  }, [editing, profile, user]);

  const updateForm = (field: keyof ProfileForm, value: string) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setMessage("");
    setError("");
  };

  const handleSave = async () => {
    if (saving) return;

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const mobile = form.mobile.trim();

    if (!firstName) {
      setError("First name is required.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateProfileData({
        firstName,
        lastName,
        mobile,
        mobileNumber: mobile,
      });
      setEditing(false);
      setMessage("Profile details updated.");
    } catch {
      setError("We couldn't save your profile yet. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError("");
    setMessage("");
    setForm({
      firstName: profile?.firstName || user?.displayName?.split(/\s+/)[0] || "",
      lastName: profile?.lastName || user?.displayName?.split(/\s+/).slice(1).join(" ") || "",
      mobile: profile?.mobileNumber || profile?.mobile || "",
    });
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <ProfileShell cartCount={cartCount} title="My Profile" eyebrow="Account center">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-3xl border border-white/10 bg-[#111111]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.25)] sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-[#FF3B3B]/25 bg-[#FF3B3B]/15 font-display text-3xl font-black text-white shadow-[0_0_32px_rgba(255,59,59,0.16)]">
                {profileName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FF8A80]">
                  Bun & Bite Account
                </p>
                <h2 className="mt-2 truncate font-display text-3xl font-black">{profileName}</h2>
                <p className="mt-1 text-sm text-white/45">Manage your account details.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={editing ? handleCancel : () => setEditing(true)}
              className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-black text-white/70 transition-all hover:border-[#FF3B3B]/35 hover:text-white"
            >
              {editing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>

          {editing ? (
            <div className="mt-6 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <ProfileField
                  icon={User}
                  label="First name"
                  value={form.firstName}
                  onChange={(value) => updateForm("firstName", value)}
                  placeholder="First name"
                />
                <ProfileField
                  icon={User}
                  label="Last name"
                  value={form.lastName}
                  onChange={(value) => updateForm("lastName", value)}
                  placeholder="Last name"
                />
              </div>
              <ProfileField
                icon={Mail}
                label="Email"
                value={userEmail || "No email available"}
                readOnly
                placeholder="Email"
              />
              <ProfileField
                icon={Phone}
                label="Mobile number"
                value={form.mobile}
                onChange={(value) => updateForm("mobile", value)}
                placeholder="+63 9XX XXX XXXX"
              />

              {(message || error) && (
                <p
                  className={`rounded-2xl border px-4 py-3 text-xs font-bold ${
                    error
                      ? "border-[#FF3B3B]/25 bg-[#FF3B3B]/10 text-[#FFB4AB]"
                      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                  }`}
                >
                  {error || message}
                </p>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#FF3B3B] text-sm font-black text-white transition-all hover:bg-[#ff5252] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30 sm:w-fit sm:px-7"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <ProfileInfo icon={User} label="First name" value={profile?.firstName || "Not added"} />
                <ProfileInfo icon={User} label="Last name" value={profile?.lastName || "Not added"} />
                <ProfileInfo icon={Mail} label="Email" value={userEmail || "No email available"} />
                <ProfileInfo icon={Phone} label="Mobile number" value={profileMobile} />
              </div>

              {(message || error) && (
                <p
                  className={`mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold ${
                    error
                      ? "border-[#FF3B3B]/25 bg-[#FF3B3B]/10 text-[#FFB4AB]"
                      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                  }`}
                >
                  {!error && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {error || message}
                </p>
              )}
            </>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-white/10 bg-[#111111]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.25)]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
              Account
            </p>
            <h2 className="mt-2 font-display text-2xl font-black">Session</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/40">
              Sign out when you are done using this device.
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-5 h-12 w-full rounded-full bg-[#FF3B3B] text-sm font-black text-white transition-all hover:bg-[#ff5252]"
            >
              Logout
            </button>
          </section>
        </aside>
      </div>
    </ProfileShell>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder: string;
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/35">
        {label}
      </span>
      <span className="flex h-[52px] items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 transition-colors focus-within:border-[#FF3B3B]/45">
        <Icon className="h-4 w-4 shrink-0 text-[#FF4D2E]" />
        <input
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          className={`min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-white/25 ${
            readOnly ? "cursor-not-allowed text-white/45" : "text-white"
          }`}
        />
      </span>
    </label>
  );
}

function ProfileInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-[#FF4D2E]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-white/30">
          {label}
        </span>
        <span className="block truncate text-sm font-bold text-white/75">{value}</span>
      </span>
    </div>
  );
}
