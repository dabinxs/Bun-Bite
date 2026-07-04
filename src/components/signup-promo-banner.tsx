import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/auth-context";

const DISMISSED_KEY = "bnb_signup_promo_dismissed";

export default function SignupPromoBanner() {
  const { user, openAuthModal } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(DISMISSED_KEY) === "true";
  });

  const dismiss = () => {
    setDismissed(true);
    window.sessionStorage.setItem(DISMISSED_KEY, "true");
  };

  if (user || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-40"
      >
        <div className="pointer-events-auto mx-auto flex min-h-[72px] w-full items-center gap-3 rounded-t-[28px] border-t border-[#FF3B3B]/25 bg-[#050505]/98 px-3 py-3 text-white shadow-[0_-20px_70px_rgba(0,0,0,0.5),0_0_35px_rgba(255,59,59,0.12)] backdrop-blur-xl sm:min-h-[76px] sm:px-8 lg:px-12">
          <motion.div
            className="relative -mt-7 flex h-16 w-16 shrink-0 items-center justify-center sm:-mt-10 sm:h-24 sm:w-24"
            animate={{
              y: [0, -5, 0],
              rotate: [-2, 2, -2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <img
              src="/images/bunNbite.png"
              alt="Bun & Bite"
              className="h-full w-full object-contain drop-shadow-[0_12px_26px_rgba(255,77,46,0.28)]"
            />
          </motion.div>

          <div className="flex min-w-0 flex-1 items-center justify-start text-left sm:justify-center sm:text-center">
            <p className="max-w-3xl text-xs font-black leading-snug min-[380px]:text-sm sm:text-base md:text-lg">
              Welcome! Enjoy{" "}
              <span className="text-[#FF4D2E]">free delivery</span> and{" "}
              <span className="text-[#FF4D2E]">exclusive discount</span> on
              your first order.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openAuthModal("register")}
            className="hidden h-11 shrink-0 items-center rounded-xl bg-white px-6 text-sm font-black text-[#FF3B3B] shadow-[0_0_24px_rgba(255,255,255,0.12)] transition-all hover:bg-white/90 sm:inline-flex"
          >
            Sign up
          </button>

          <button
            type="button"
            onClick={() => openAuthModal("register")}
            className="inline-flex h-10 shrink-0 items-center rounded-xl bg-white px-4 text-xs font-black text-[#FF3B3B] transition-all hover:bg-white/90 sm:hidden"
          >
            Sign up
          </button>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss signup promo"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/70 transition-all hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
