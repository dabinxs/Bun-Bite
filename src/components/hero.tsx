import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { ArrowRight, Star, Users, Heart } from "lucide-react";
import { PRODUCTS } from "./menu";
import { useAuth } from "@/context/auth-context";

const ROTATE_INTERVAL = 3000;

/* Per-product rating data for the hero carousel (maps to PRODUCTS[0..7]) */
const HERO_RATINGS = [
  { rating: "4.9", customers: "5K",    favorites: "3K+" },   // Classic Burger
  { rating: "4.8", customers: "4.2K",  favorites: "2.7K+" }, // Smoky BBQ
  { rating: "4.8", customers: "4.5K",  favorites: "3.1K+" }, // Spicy Fire
  { rating: "4.9", customers: "5.5K",  favorites: "3.5K+" }, // Crispy Chicken
  { rating: "4.8", customers: "4.8K",  favorites: "2.9K+" }, // Classic Cola
  { rating: "4.7", customers: "3.6K",  favorites: "2.1K+" }, // Iced Tea
  { rating: "4.9", customers: "6K",    favorites: "4K+" },   // Strawberry Shake
  { rating: "4.8", customers: "4.1K",  favorites: "2.8K+" }, // Orange Juice
];

export default function Hero() {
  const { user, profile } = useAuth();
  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<"in" | "out">("in");

  const heroProducts = PRODUCTS.slice(0, 8);
  const product = heroProducts[activeIdx];
  const ratingData = HERO_RATINGS[activeIdx];
  const firstName = getHeroFirstName(profile?.firstName, user?.displayName, profile?.email || user?.email);

  const goTo = useCallback(
    (idx: number) => {
      if (idx === activeIdx || isTransitioning) return;
      setDirection("out");
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIdx(idx);
        setDirection("in");
        setTimeout(() => setIsTransitioning(false), 700);
      }, 500);
    },
    [activeIdx, isTransitioning],
  );

  const next = useCallback(() => {
    goTo((activeIdx + 1) % heroProducts.length);
  }, [activeIdx, goTo, heroProducts.length]);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(next, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [isHovered, next]);

  const animClass = isTransitioning
    ? direction === "out"
      ? "animate-hero-out"
      : "animate-hero-in"
    : "animate-hero-in";

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[#000000]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-5 md:px-6 pt-20 md:pt-24 pb-6 sm:pb-8">
        {/* Top row: Welcome card + Flash Deals card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
          {/* Welcome card */}
          <div className="lg:col-span-8 relative">
            <div className="relative rounded-3xl md:rounded-[28px] border border-white/[0.12] bg-[#111111]/40 backdrop-blur-sm overflow-hidden min-h-[430px] sm:min-h-[390px] md:min-h-0 md:h-[340px]">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-[60%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#FF3B3B]/8 rounded-full blur-[100px]" />
              </div>

              <div className="relative h-full flex flex-col md:flex-row items-start md:items-center justify-between p-5 sm:p-6 md:p-8 gap-5 md:gap-0">
                {/* Left text */}
                <div className="flex-none md:flex-1 flex flex-col gap-3 z-10 max-w-full md:max-w-[40%] pt-2 md:pt-0">
                  <h1
                    className="font-display text-3xl md:text-[2.5rem] font-black tracking-[0.15em] uppercase leading-tight"
                    style={{
                      background:
                        "linear-gradient(135deg, #FF3B3B 0%, #FF6B6B 50%, #FF8A00 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    WELCOME
                  </h1>
                  {firstName ? (
                    <p className="relative -top-3 max-w-full truncate font-display text-xl font-black leading-tight text-[#FFB4AB] sm:text-2xl md:text-3xl">
                      {firstName}
                      
                    </p>
                  ) : (
                    <div className="w-14 h-[2px] bg-gradient-to-r from-[#FF3B3B] to-[#FF8A00] rounded-full" />
                  )}
                  <p className="text-[11px] text-[#999999] leading-relaxed max-w-[260px] md:max-w-[200px]">
                    Serving juicy, flame-grilled burgers packed with bold
                    flavor, fresh ingredients, and satisfying bites in every
                    stack.
                  </p>
                  <a
                    href="#menu"
                    className="group inline-flex items-center gap-2 h-10 px-6 text-xs font-bold text-white rounded-xl overflow-hidden hover:scale-[1.03] active:scale-[0.97] transition-transform w-fit mt-1"
                    style={{
                      background:
                        "linear-gradient(135deg, #FF3B3B 0%, #FF6B4A 100%)",
                    }}
                  >
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>

                {/* Right: product image with rating panel at bottom */}
                <div className="flex-1 w-full flex flex-col items-center justify-center relative">
                  {/* Product image + rating panel — wrapped together for synchronized fade */}
                  <div className={`flex flex-col items-center relative w-full max-w-[320px] sm:max-w-[380px] md:max-w-[420px] ${animClass}`}>
                    {/* Product image */}
                    <div className="animate-float h-[170px] sm:h-[190px] md:h-[210px] flex items-center justify-center">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain drop-shadow-[0_20px_60px_rgba(255,59,59,0.25)]"
                      />
                    </div>

                    {/* Rating panel — floating pill at bottom of product image, full width */}
                    <div className="absolute -bottom-4 sm:-bottom-2 left-0 right-0 grid grid-cols-3 items-center gap-1 px-2 sm:px-4 md:px-5 py-2 rounded-2xl bg-[#0A0A0A]/50 backdrop-blur-md border border-white/[0.06] z-10">
                      <div className="flex flex-col items-center gap-0">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 fill-[#FF8A00] text-[#FF8A00] shrink-0" />
                          <span className="font-display text-[13px] font-bold text-[#AAAAAA]">{ratingData.rating}</span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-[#666666] leading-tight text-center">Average Rating</span>
                      </div>
                      <div className="flex flex-col items-center gap-0 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-white/[0.08]" />
                        <div className="absolute right-0 top-0 bottom-0 w-px bg-white/[0.08]" />
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#FF3B3B] shrink-0" />
                          <span className="font-display text-[13px] font-bold text-[#AAAAAA]">{ratingData.customers}</span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-[#666666] leading-tight text-center">Happy Customers</span>
                      </div>
                      <div className="flex flex-col items-center gap-0">
                        <div className="flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 text-[#FF3B3B] shrink-0" />
                          <span className="font-display text-[13px] font-bold text-[#AAAAAA]">{ratingData.favorites}</span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-[#666666] leading-tight text-center">Customer Favorites</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Indicator dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {heroProducts.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="group"
                    aria-label={`Show product ${i + 1}`}
                  >
                    <div
                      className={`h-1 rounded-full transition-all duration-500 ${
                        i === activeIdx
                          ? "w-5 bg-[#FF3B3B]"
                          : "w-1 bg-white/20 group-hover:bg-white/40"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Flash Deals card */}
          <div className="lg:col-span-4">
            <Link
              href="/deals"
              aria-label="View today's Bun & Bite deals"
              className="relative block rounded-3xl md:rounded-[28px] border border-white/[0.12] bg-[#111111]/40 backdrop-blur-sm overflow-hidden min-h-[260px] sm:min-h-[280px] md:h-[340px] transition-all hover:border-[#FF3B3B]/45 hover:shadow-[0_0_35px_rgba(255,59,59,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3B3B]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-[#FF3B3B]/8 rounded-full blur-[80px]" />
              </div>
              <div className="relative h-full flex items-center justify-between p-6 sm:p-8 md:p-10 gap-4 sm:gap-6 md:gap-8">
                {/* Text block on left */}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  {/* Save 45% on same line */}
                  <h2 className="font-display text-4xl sm:text-5xl font-black text-white tracking-tight leading-none">
                    Save <span className="text-[#FF3B3B]">45%</span>
                  </h2>
                  {/* Flash Deals below */}
                  <p className="font-display text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight mt-3">
                    Flash Deals
                  </p>
                  {/* Limited time offers */}
                  <p className="text-sm text-[#888888] mt-1">Limited time offers</p>
                </div>
                {/* Icon on right - separate column, no overlap */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 shrink-0 animate-float">
                  <img
                    src="/images/flash-deals.png"
                    alt="Flash Deals"
                    className="w-full h-full object-contain drop-shadow-[0_8px_24px_rgba(255,59,59,0.25)]"
                  />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Bottom row: 4 feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {/* Deals Card */}
          <Link
            href="/deals"
            aria-label="View today's deals"
            className="group relative rounded-3xl md:rounded-[28px] border border-[#FF3B3B]/20 bg-[#111111]/40 backdrop-blur-sm overflow-hidden p-4 sm:p-5 xl:p-4 cursor-pointer hover:border-[#FF3B3B]/50 hover:shadow-[0_0_30px_rgba(255,59,59,0.15)] hover:bg-[#111111]/60 transition-all duration-300 min-h-[112px] sm:min-h-[124px] xl:h-[120px] flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3B3B]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 w-full">
              <div className="flex flex-col gap-1 min-w-0 pr-1">
                <h3 className="font-display text-base md:text-lg xl:text-base font-bold text-white">
                  Deals
                </h3>
                <p className="text-xs md:text-sm xl:text-xs text-[#888888] leading-snug break-words">
                  Enjoy our best offers
                </p>
              </div>
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 xl:w-24 xl:h-24 shrink-0">
                <img
                  src="/images/deals-icon.png"
                  alt="Deals"
                  className="w-full h-full object-contain scale-95 drop-shadow-[0_4px_12px_rgba(255,59,59,0.2)] group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </Link>

          {/* Build Your Bite Card */}
          <Link
            href="/build-your-bite"
            aria-label="Open Build Your Bite meal builder"
            className="group relative rounded-3xl md:rounded-[28px] border border-[#FF3B3B]/20 bg-[#111111]/40 backdrop-blur-sm overflow-hidden p-4 sm:p-5 xl:p-4 cursor-pointer hover:border-[#FF3B3B]/50 hover:shadow-[0_0_30px_rgba(255,59,59,0.15)] hover:bg-[#111111]/60 transition-all duration-300 min-h-[112px] sm:min-h-[124px] xl:h-[120px] flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3B3B]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 w-full">
              <div className="flex flex-col gap-1 min-w-0 pr-1">
                <h3 className="font-display text-base md:text-lg xl:text-base font-bold text-white">
                  Build Your Bite
                </h3>
                <p className="text-xs md:text-sm xl:text-xs text-[#888888] leading-snug break-words">
                  Create your perfect burger meal or choose a combo.
                </p>
              </div>
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 xl:w-24 xl:h-24 shrink-0">
                <img
                  src="/images/menu-icon.png"
                  alt="Build Your Bite"
                  className="w-full h-full object-contain scale-110 drop-shadow-[0_4px_12px_rgba(255,59,59,0.2)] group-hover:scale-125 transition-transform duration-300"
                />
              </div>
            </div>
          </Link>

          {/* Pick up Card */}
          <Link
            href="/pickup"
            aria-label="Choose a pickup branch"
            className="group relative rounded-3xl md:rounded-[28px] border border-[#FF3B3B]/20 bg-[#111111]/40 backdrop-blur-sm overflow-hidden p-4 sm:p-5 xl:p-4 cursor-pointer hover:border-[#FF3B3B]/50 hover:shadow-[0_0_30px_rgba(255,59,59,0.15)] hover:bg-[#111111]/60 transition-all duration-300 min-h-[112px] sm:min-h-[124px] xl:h-[120px] flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3B3B]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 w-full">
              <div className="flex flex-col gap-1 min-w-0 pr-1">
                <h3 className="font-display text-base md:text-lg xl:text-base font-bold text-white">
                  Pick up
                </h3>
                <p className="text-xs md:text-sm xl:text-xs text-[#888888] leading-snug break-words">
                  Fast & easy pickup
                </p>
              </div>
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 xl:w-24 xl:h-24 shrink-0">
                <img
                  src="/images/pickup-icon.png"
                  alt="Pick up"
                  className="w-full h-full object-contain scale-125 drop-shadow-[0_4px_12px_rgba(255,59,59,0.2)] group-hover:scale-[1.35] transition-transform duration-300"
                />
              </div>
            </div>
          </Link>

          {/* Shops Card */}
          <a
            href="#stores"
            aria-label="View Bun & Bite branches and store availability"
            className="group relative rounded-3xl md:rounded-[28px] border border-[#FF3B3B]/20 bg-[#111111]/40 backdrop-blur-sm overflow-hidden p-4 sm:p-5 xl:p-4 cursor-pointer hover:border-[#FF3B3B]/50 hover:shadow-[0_0_30px_rgba(255,59,59,0.15)] hover:bg-[#111111]/60 transition-all duration-300 min-h-[112px] sm:min-h-[124px] xl:h-[120px] flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3B3B]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 w-full">
              <div className="flex flex-col gap-1 min-w-0 pr-1">
                <h3 className="font-display text-base md:text-lg xl:text-base font-bold text-white">
                  Shops
                </h3>
                <p className="text-xs md:text-sm xl:text-xs text-[#888888] leading-snug break-words">
                  Find Stores near you
                </p>
              </div>
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 xl:w-24 xl:h-24 shrink-0">
                <img
                  src="/images/shops-icon.png"
                  alt="Shops"
                  className="w-full h-full object-contain scale-110 drop-shadow-[0_4px_12px_rgba(255,59,59,0.2)] group-hover:scale-125 transition-transform duration-300"
                />
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

function getHeroFirstName(firstName?: string, displayName?: string | null, email?: string | null) {
  const rawName = firstName?.trim() || displayName?.trim().split(/\s+/)[0] || email?.split("@")[0] || "";
  if (!rawName.trim()) return "";

  const cleanedName = rawName.trim().replace(/[._-]+/g, " ");
  return cleanedName
    .split(/\s+/)
    .map((namePart) => {
      if (!namePart) return "";

      const shouldNormalizeCase =
        namePart === namePart.toLowerCase() || namePart === namePart.toUpperCase();

      if (!shouldNormalizeCase) return namePart;

      return namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
    })
    .join(" ");
}
