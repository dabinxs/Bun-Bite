import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  ShoppingCart,
  Menu,
  X,
  Search,
  User,
  LogOut,
  Heart,
  MapPin,
  PackageCheck,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { getDefaultUserAddress } from "@/lib/addresses";

interface NavbarProps {
  cartCount: number;
  activeSection?: string;
  showSearch?: boolean;
}

export default function Navbar({ cartCount, activeSection = "home", showSearch = true }: NavbarProps) {
  const { openAuthModal, user, profile, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const isCartPage = location === "/cart";
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [userAddressText, setUserAddressText] = useState<string>("New address");

  useEffect(() => {
    if (!user) {
      setUserAddressText("New address");
      return;
    }

    let cancelled = false;
    getDefaultUserAddress(user.uid)
      .then((address) => {
        if (cancelled) return;
        if (address) {
          const firstLine = address.fullAddress.split("\n")[0]?.trim();
          setUserAddressText(address.label || firstLine || "New address");
        } else {
          setUserAddressText("New address");
        }
      })
      .catch(() => {
        if (!cancelled) setUserAddressText("New address");
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleNavClick = (path: string, scrollTo?: string) => {
    setMobileMenuOpen(false);

    const isSamePage = location === path;
    const activateNavTarget = () => {
      if (!scrollTo) return;

      window.dispatchEvent(
        new CustomEvent("bnb:set-active-nav", { detail: scrollTo })
      );
    };

    if (!isSamePage) {
      setLocation(path);
    }

    if (scrollTo) {
      if (isSamePage) {
        activateNavTarget();
      }

      setTimeout(() => {
        activateNavTarget();
        const el = document.getElementById(scrollTo);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, isSamePage ? 0 : 150);
      return; 
    }
    if (isSamePage && path === "/") {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  const navItems = [
    { name: "HOME", path: "/", scrollTo: "home" },
    { name: "MENU", path: "/", scrollTo: "menu" },
    { name: "ABOUT", path: "/", scrollTo: "about" },
    { name: "CONTACT", path: "/", scrollTo: "contact" },
  ];

  const userEmail = profile?.email || user?.email || "";
  const profileName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() ||
    user?.displayName ||
    userEmail.split("@")[0] ||
    "Bun & Bite Member";
  const profileMobile = profile?.mobileNumber?.trim() || profile?.mobile?.trim() || "No mobile number added.";
  const profileInitial = profileName.charAt(0).toUpperCase();

  const isAdmin =
    userEmail?.includes("admin") ||
    userEmail === "admin@bunbite.com" ||
    profile?.isAdmin === true ||
    (profile as any)?.role === "admin";

  if (!user) {
    return (
      <motion.header
        className="fixed left-0 right-0 top-0 z-50 border-b border-white/8 bg-[#0B0B0B]/95 text-white shadow-[0_10px_35px_rgba(0,0,0,0.28)] backdrop-blur-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex h-16 items-center justify-between gap-3">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick("/", "home");
              }}
              className="flex min-w-0 shrink-0 items-center gap-2.5"
            >
              <div className="relative h-9 w-9 overflow-hidden rounded-full">
                <img src="/images/logo.png" alt="BB Logo" className="h-full w-full object-cover" />
              </div>
              <span className="truncate font-display text-sm font-bold tracking-wider text-white md:text-base">
                BUN &rsquo;N BITE
              </span>
            </a>

            <button
              type="button"
              onClick={() => (user ? setLocation("/profile/addresses") : openAuthModal("intro"))}
              className="hidden min-w-0 flex-1 items-center justify-center gap-2 text-sm font-bold text-white/75 transition-colors hover:text-white md:flex"
              aria-label="Choose delivery address"
            >
              <MapPin className="h-5 w-5 shrink-0 text-[#FF4D2E]" />
              <span className="truncate">{userAddressText}</span>
            </button>

            <div className="hidden shrink-0 items-center gap-3 lg:flex">
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="h-10 rounded-full border border-white/15 bg-white/[0.04] px-5 text-sm font-black text-white transition-all hover:border-[#FF3B3B]/35 hover:bg-white/[0.07]"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => openAuthModal("register")}
                className="h-10 rounded-full bg-[#FF3B3B] px-5 text-sm font-black text-white shadow-[0_0_24px_rgba(255,59,59,0.25)] transition-all hover:bg-[#ff5252]"
              >
                Sign up for free delivery
              </button>
              <button
                type="button"
                onClick={() => openAuthModal("intro")}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-all hover:bg-white/[0.05] hover:text-white"
                aria-label="Favorites require an account"
              >
                <Heart className="h-5 w-5" />
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => openAuthModal("intro")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/65 transition-all hover:border-[#FF3B3B]/35 hover:text-white md:hidden"
                aria-label="Choose address"
              >
                <MapPin className="h-4 w-4" />
              </button>

              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => window.dispatchEvent(new CustomEvent("bnb:open-cart"))}
                className="flex items-center gap-2 text-xs font-bold tracking-[0.15em] text-white transition-colors duration-200 hover:text-white/80"
                aria-label="Open cart"
              >
                <div className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF3B3B] text-[9px] font-bold text-white"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>

              <button
                type="button"
                className="text-white p-2 lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Open guest navigation"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/8 bg-[#0B0B0B]/98 backdrop-blur-xl lg:hidden"
            >
              <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4">
                <button
                  type="button"
                  onClick={() => (user ? setLocation("/profile/addresses") : openAuthModal("intro"))}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-bold text-white/75"
                >
                  <MapPin className="h-5 w-5 text-[#FF4D2E]" />
                  {userAddressText}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openAuthModal("login")}
                    className="h-11 rounded-full border border-white/15 bg-white/[0.04] text-sm font-black text-white"
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuthModal("register")}
                    className="h-11 rounded-full bg-[#FF3B3B] text-sm font-black text-white"
                  >
                    Sign up
                  </button>
                </div>
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.path, item.scrollTo);
                    }}
                    className="rounded-xl px-4 py-3 text-sm font-bold tracking-widest text-white/65 transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    );
  }

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0B0B0B]/80 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Main row */}
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); handleNavClick("/", "home"); }}
            className="flex items-center gap-2.5 group shrink-0"
          >
            <div className="relative w-9 h-9 rounded-full overflow-hidden">
              <img src="/images/logo.png" alt="BB Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-display text-sm md:text-base font-bold tracking-wider text-white">
              BUN &rsquo;N BITE
            </span>
          </a>

          {/* Center: Nav + Search (desktop) */}
          <div className={`hidden lg:flex items-center gap-3 flex-1 justify-center ${showSearch ? "max-w-2xl" : "max-w-md"}`}>
            {/* Nav links */}
            <nav className="flex items-center gap-0.5 shrink-0">
              {navItems.map((item) => {
                const isActive = location === "/" && activeSection === item.scrollTo;
                return (
                  <a
                    key={item.name}
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.path, item.scrollTo);
                    }}
                    className={`relative overflow-hidden px-4 py-2 text-xs font-bold tracking-[0.12em] rounded-full transition-colors duration-300 cursor-pointer ${
                      isActive
                        ? "text-white shadow-[0_0_20px_rgba(255,59,59,0.4)]"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="desktop-nav-indicator"
                        className="absolute inset-0 rounded-full bg-[#FF3B3B]"
                        transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
                      />
                    )}
                    <span className="relative z-10">{item.name}</span>
                  </a>
                );
              })}
            </nav>

            {showSearch && (
              <>
                {/* Divider */}
                <div className="w-px h-5 bg-white/10 mx-1" />

                {/* Search bar */}
                <div className="relative flex items-center">
                  <div
                    className={`flex items-center rounded-full border transition-all duration-300 ${
                      searchFocused
                        ? "border-[#FF3B3B]/50 bg-white/[0.06] shadow-[0_0_20px_rgba(255,59,59,0.15)] w-64"
                        : "border-white/10 bg-white/[0.02] w-52 hover:border-white/20"
                    }`}
                  >
                    <Search className="w-3.5 h-3.5 text-white/30 ml-3 shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      placeholder="Search burgers, drinks..."
                      className="bg-transparent text-white/70 text-xs font-medium placeholder:text-white/20 px-2 py-2 w-full focus:outline-none"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="mr-2 text-white/20 hover:text-white/50 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right: Mobile search toggle + Account + Cart + Hamburger */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Mobile search toggle */}
            {showSearch && (
              <button
                className="lg:hidden w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-all"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </button>
            )}

            {/* Account dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  if (user) {
                    setAccountOpen(!accountOpen);
                  } else {
                    openAuthModal("intro");
                  }
                }}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-all"
                aria-label={user ? "Open account menu" : "Open login options"}
              >
                <User className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {accountOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className="fixed left-4 right-4 top-20 z-50 overflow-hidden rounded-3xl border border-white/10 bg-[#111111]/95 shadow-[0_24px_80px_rgba(0,0,0,0.62)] backdrop-blur-xl sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-[360px]"
                    >
                      <div className="relative overflow-hidden border-b border-white/8 p-5">
                        <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-[#FF3B3B]/18 blur-3xl" />
                        <div className="relative flex items-center gap-4">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-[#FF3B3B]/25 bg-[#FF3B3B]/15 text-2xl font-black text-white shadow-[0_0_28px_rgba(255,59,59,0.16)]">
                            {profileInitial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-display text-xl font-black leading-tight text-white">
                              {profileName}
                            </p>
                            <p className="mt-1 truncate text-xs font-bold text-[#FF8A80]">
                              Bun & Bite Account
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 p-4">
                        <ProfileInfoRow
                          icon={<Mail className="h-4 w-4" />}
                          label="Email"
                          value={userEmail || "No email available"}
                        />
                        <ProfileInfoRow
                          icon={<Phone className="h-4 w-4" />}
                          label="Mobile"
                          value={profileMobile}
                        />
                      </div>

                      <div className="border-t border-white/8 p-2">
                        {isAdmin && (
                          <DropdownItem
                            icon={<ShieldCheck className="w-4 h-4" />}
                            label="Admin Panel"
                            onClick={() => {
                              setAccountOpen(false);
                              setLocation("/admin");
                            }}
                          />
                        )}
                        <DropdownItem
                          icon={<User className="w-4 h-4" />}
                          label="My Profile"
                          onClick={() => {
                            setAccountOpen(false);
                            setLocation("/profile");
                          }}
                        />
                        <DropdownItem
                          icon={<PackageCheck className="w-4 h-4" />}
                          label="Order history"
                          onClick={() => {
                            setAccountOpen(false);
                            setLocation("/profile/orders");
                          }}
                        />
                        <DropdownItem
                          icon={<MapPin className="w-4 h-4" />}
                          label="Saved addresses"
                          onClick={() => {
                            setAccountOpen(false);
                            setLocation("/profile/addresses");
                          }}
                        />
                        <DropdownItem
                          icon={<Heart className="w-4 h-4" />}
                          label="Favorites"
                          onClick={() => {
                            setAccountOpen(false);
                            setLocation("/profile/favorites");
                          }}
                        />
                        <DropdownItem
                          icon={<LogOut className="w-4 h-4" />}
                          label="Logout"
                          onClick={async () => {
                            setAccountOpen(false);
                            await logout();
                            setLocation("/");
                          }}
                        />
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Cart */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => window.dispatchEvent(new CustomEvent("bnb:open-cart"))}
              className={`flex items-center gap-2 text-xs font-bold tracking-[0.15em] transition-colors duration-200 ${
                isCartPage
                  ? "text-[#FF3B3B]"
                  : "text-white hover:text-white/80"
              }`}
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-1.5 bg-[#FF3B3B] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <span className="hidden sm:inline">CART</span>
            </motion.button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile search overlay */}
        <AnimatePresence>
          {showSearch && searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden pb-3"
            >
              <div
                className={`flex items-center rounded-xl border transition-all duration-300 ${
                  searchFocused
                    ? "border-[#FF3B3B]/50 bg-white/[0.06] shadow-[0_0_20px_rgba(255,59,59,0.15)]"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <Search className="w-4 h-4 text-white/30 ml-3 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search burgers, drinks, desserts..."
                  className="bg-transparent text-white/70 text-sm placeholder:text-white/20 px-2 py-2.5 w-full focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mr-3 text-white/20 hover:text-white/50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-[#0B0B0B]/95 backdrop-blur-xl border-b border-white/5 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = location === "/" && activeSection === item.scrollTo;
                return (
                  <a
                    key={item.name}
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.path, item.scrollTo);
                    }}
                    className={`text-sm font-bold tracking-widest py-3 px-4 rounded-xl transition-colors cursor-pointer ${
                      isActive ? "bg-[#FF3B3B] text-white" : "hover:text-[#FF3B3B] text-white/70"
                    }`}
                  >
                    {item.name}
                  </a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

function DropdownItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/55 hover:text-white hover:bg-white/5 transition-all text-sm font-bold"
    >
      <span className="text-[#FF4D2E]">{icon}</span>
      {label}
    </button>
  );
}

function ProfileInfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-[#FF4D2E]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-white/30">
          {label}
        </span>
        <span className="block truncate text-sm font-bold text-white/75">
          {value}
        </span>
      </span>
    </div>
  );
}
