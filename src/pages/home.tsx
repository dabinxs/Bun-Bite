import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import MenuSection from "@/components/menu";
import Stores from "@/components/stores";
import About from "@/components/about";
import Journey from "@/components/journey";
import Contact from "@/components/contact";
import Features from "@/components/features";
import type { CartItem } from "@/lib/cart";

interface HomePageProps {
  cartCount: number;
  addToCart: (item: Omit<CartItem, "id">) => void;
}

export default function Home({ cartCount, addToCart }: HomePageProps) {
  const [activeSection, setActiveSection] = useState("home");
  const navScrollLockRef = useRef(false);
  const navScrollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const sectionIds = ["home", "menu", "about", "contact"];

    const updateActiveSection = () => {
      if (navScrollLockRef.current) return;

      const checkpoint = window.scrollY + window.innerHeight * 0.35;
      let currentSection = "home";

      sectionIds.forEach((id) => {
        const section = document.getElementById(id);
        if (section && section.offsetTop <= checkpoint) {
          currentSection = id;
        }
      });

      setActiveSection(currentSection);
    };

    const handleNavTarget = (event: Event) => {
      const targetSection = (event as CustomEvent<string>).detail;

      if (!sectionIds.includes(targetSection)) return;

      if (navScrollTimeoutRef.current) {
        window.clearTimeout(navScrollTimeoutRef.current);
      }

      navScrollLockRef.current = true;
      setActiveSection(targetSection);

      navScrollTimeoutRef.current = window.setTimeout(() => {
        navScrollLockRef.current = false;
      }, 1400);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    window.addEventListener("bnb:set-active-nav", handleNavTarget);

    return () => {
      if (navScrollTimeoutRef.current) {
        window.clearTimeout(navScrollTimeoutRef.current);
      }

      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
      window.removeEventListener("bnb:set-active-nav", handleNavTarget);
    };
  }, []);

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      <Navbar
        cartCount={cartCount}
        showSearch={false}
        activeSection={activeSection}
      />

      <main>
        <Hero />
        <MenuSection onAddToCart={addToCart} />
        <Stores />
        <About />
        <Journey />
        <Contact />
        <Features />
      </main>
    </div>
  );
}
