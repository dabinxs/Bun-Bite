import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { Heart, Home, LogOut, MapPin, PackageCheck, User } from "lucide-react";
import Navbar from "@/components/navbar";
import { useAuth } from "@/context/auth-context";

interface ProfileShellProps {
  cartCount: number;
  title: string;
  eyebrow: string;
  children: ReactNode;
}

const PROFILE_LINKS = [
  { href: "/profile", label: "My Profile", icon: User },
  { href: "/profile/orders", label: "Order History", icon: PackageCheck },
  { href: "/profile/addresses", label: "Saved Addresses", icon: MapPin },
  { href: "/profile/favorites", label: "Favorites", icon: Heart },
];

export default function ProfileShell({ cartCount, title, eyebrow, children }: ProfileShellProps) {
  const [location, setLocation] = useLocation();
  const { user, loading, openAuthModal, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#050505] text-white">
      <Navbar cartCount={cartCount} showSearch={false} />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 md:pt-28">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FF8A80]">
              {eyebrow}
            </p>
            <h1 className="mt-2 font-display text-3xl font-black leading-tight sm:text-5xl">
              {title}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setLocation("/")}
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-black text-white/70 transition-all hover:border-[#FF3B3B]/35 hover:text-white"
          >
            <Home className="h-4 w-4" />
            Home
          </button>
        </div>

        {loading ? (
          <section className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-8 text-center shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
            <p className="font-black text-white">Loading your account...</p>
          </section>
        ) : !user ? (
          <section className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-8 text-center shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#FF3B3B]/25 bg-[#FF3B3B]/10">
              <User className="h-8 w-8 text-[#FF4D2E]" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-black">Login required</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/45">
              Your profile is private. Login to view your account, orders, addresses, and favorites.
            </p>
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#FF3B3B] px-7 text-sm font-black text-white transition-all hover:bg-[#ff5252]"
            >
              Login
            </button>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <div className="rounded-3xl border border-white/10 bg-[#111111]/90 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
                {PROFILE_LINKS.map((link) => {
                  const Icon = link.icon;
                  const active = location === link.href;

                  return (
                    <button
                      key={link.href}
                      type="button"
                      onClick={() => setLocation(link.href)}
                      className={`mb-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition-all ${
                        active
                          ? "bg-[#FF3B3B] text-white shadow-[0_0_24px_rgba(255,59,59,0.2)]"
                          : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-[#FF3B3B]/20 bg-[#FF3B3B]/10 px-4 py-3 text-left text-sm font-black text-[#FFB4AB] transition-all hover:border-[#FF3B3B]/45 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </aside>

            <section className="min-w-0">{children}</section>
          </div>
        )}
      </main>
    </div>
  );
}
