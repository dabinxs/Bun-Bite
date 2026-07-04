import { motion } from "framer-motion";
import { SiFacebook, SiInstagram, SiX } from "react-icons/si";
import { useLocation } from "wouter";

type HomeSection = "home" | "menu" | "stores" | "about" | "journey" | "contact";
type MenuCategory = "burgers" | "drinks" | "family" | "sides" | "desserts";

const companyLinks: {
  label: string;
  type: "section" | "route";
  target: HomeSection | string;
}[] = [
  { label: "About Us", type: "section", target: "about" },
  { label: "Our Journey", type: "section", target: "journey" },
  { label: "Locations", type: "section", target: "stores" },
  { label: "FAQs", type: "route", target: "/faqs" },
  { label: "Careers", type: "route", target: "/careers" },
  { label: "Support", type: "section", target: "contact" },
];

const productLinks: { label: string; category: MenuCategory }[] = [
  { label: "Burgers", category: "burgers" },
  { label: "Drinks", category: "drinks" },
  { label: "Family Meal", category: "family" },
  { label: "Sides", category: "sides" },
  { label: "Desserts", category: "desserts" },
];

const socialLinks = [
  // TODO: Replace these placeholder profile URLs with the official Bun & Bite social pages.
  { label: "Facebook", href: "https://www.facebook.com/bunandbite", icon: SiFacebook },
  { label: "Instagram", href: "https://www.instagram.com/bunandbite", icon: SiInstagram },
  { label: "X", href: "https://x.com/bunandbite", icon: SiX },
];

const policyLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Cookie Policy", href: "/cookie-policy" },
];

const footerLinkClass = "w-fit text-left hover:text-[#FF3B3B] transition-colors";

export default function Footer() {
  const [location, setLocation] = useLocation();

  const dispatchActiveNav = (sectionId: HomeSection) => {
    if (["home", "menu", "about", "contact"].includes(sectionId)) {
      window.dispatchEvent(new CustomEvent("bnb:set-active-nav", { detail: sectionId }));
    }
  };

  const scrollToHomeSection = (sectionId: HomeSection, category?: MenuCategory) => {
    if (category) {
      window.sessionStorage.setItem("bnb_menu_category", category);
    }

    const scrollToTarget = () => {
      if (category) {
        window.dispatchEvent(new CustomEvent("bnb:set-menu-category", { detail: category }));
      }

      dispatchActiveNav(sectionId);
      const target = document.getElementById(sectionId);

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (sectionId === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    if (location !== "/") {
      setLocation("/");
      window.setTimeout(scrollToTarget, 180);
      return;
    }

    window.setTimeout(scrollToTarget, 0);
  };

  const navigateToRoute = (href: string) => {
    setLocation(href);
  };

  return (
    <footer className="bg-[#0d0d0d] pt-20 pb-24 border-t border-white/5 lg:pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="Bun N Bite logo" className="w-12 h-12 object-contain" />
              <div>
                <h3 className="font-display text-2xl font-black text-white">BUN AND BITE</h3>
                <p className="text-xs font-bold text-[#FF3B3B] tracking-widest">EST. 2023</p>
              </div>
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              Serving fresh, flavorful burgers made with passion and quality ingredients. Every bite is crafted to deliver satisfaction and bold taste.
            </p>
            <div>
              <p className="text-xs font-bold mb-3 text-white/70">Follow us for juicy updates</p>
              <div className="flex gap-3">
                {socialLinks.map(({ label, href, icon: Icon }) => (
                  <motion.a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open Bun & Bite on ${label}`}
                    whileHover={{ scale: 1.15, color: "#FF3B3B" }}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Company */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="font-display text-lg font-bold mb-6">Company</h4>
            <ul className="flex flex-col gap-3 text-white/50 text-sm">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() =>
                      link.type === "section"
                        ? scrollToHomeSection(link.target as HomeSection)
                        : navigateToRoute(link.target)
                    }
                    className={footerLinkClass}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Products */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-display text-lg font-bold mb-6">Products</h4>
            <ul className="flex flex-col gap-3 text-white/50 text-sm">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => scrollToHomeSection("menu", link.category)}
                    className={footerLinkClass}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="font-display text-lg font-bold mb-6">Contact Us</h4>
            <ul className="flex flex-col gap-3 text-white/50 text-sm">
              <li>
                <span className="text-white block mb-0.5 text-xs font-bold">Phone:</span>
                <a href="tel:+639123456789" className="hover:text-[#FF3B3B] transition-colors">
                  +63 912 345 6789
                </a>
              </li>
              <li>
                <span className="text-white block mb-0.5 text-xs font-bold">Email:</span>
                <a href="mailto:support@bunandbite.com" className="hover:text-[#FF3B3B] transition-colors">
                  support@bunandbite.com
                </a>
              </li>
              <li>
                <span className="text-white block mb-0.5 text-xs font-bold">Address:</span>
                <button
                  type="button"
                  onClick={() => scrollToHomeSection("stores")}
                  className="text-left hover:text-[#FF3B3B] transition-colors"
                >
                  Barangay Langkiwa, Binan City, Laguna
                </button>
              </li>
              <li>
                <span className="text-white block mb-0.5 text-xs font-bold">Hours:</span>
                <div>Mon–Fri: 9AM – 10PM</div>
                <div>Sat–Sun: 10AM – 11PM</div>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/30">
          <p>&copy; 2026 Bun & Bite. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {policyLinks.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => navigateToRoute(link.href)}
                className="hover:text-white/60 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
