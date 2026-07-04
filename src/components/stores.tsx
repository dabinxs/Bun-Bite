import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const branches = [
  {
    name: "Bun & Bite - Bi\u00f1an Main Branch",
    address: "Barangay Langkiwa, Bi\u00f1an City, Laguna",
    hours: "Monday to Sunday, 9:00 AM - 10:00 PM",
    phone: "+63 912 345 6789",
    pickup: "Available",
    delivery: "Available",
  },
  {
    name: "Bun & Bite - Pavilion Branch",
    address: "Pavilion Mall Area, Bi\u00f1an City, Laguna",
    hours: "Monday to Sunday, 10:00 AM - 9:00 PM",
    phone: "+63 917 222 3344",
    pickup: "Available",
    delivery: "Limited nearby areas",
  },
  {
    name: "Bun & Bite - Sta. Rosa Branch",
    address: "Sta. Rosa, Laguna",
    hours: "Monday to Sunday, 10:00 AM - 10:00 PM",
    phone: "+63 918 555 7788",
    pickup: "Available",
    delivery: "Available",
  },
];

export default function Stores() {
  return (
    <section id="stores" className="py-20 md:py-24 bg-[#0d0d0d] border-t border-white/5 relative overflow-hidden scroll-mt-20">
      <div className="absolute left-1/2 top-0 h-[360px] w-[520px] -translate-x-1/2 rounded-full bg-[#FF3B3B]/6 blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[#FF3B3B] font-bold tracking-[0.2em] uppercase text-xs mb-2">
              Pickup & Delivery
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-black leading-tight">
              Find Your Nearest Bun & Bite
            </h2>
            <p className="mt-4 text-white/50 text-sm md:text-base leading-relaxed">
              Choose a branch for fast pickup, nearby delivery, store hours, and direct contact details.
            </p>
          </div>

          <div className="rounded-2xl border border-[#FF3B3B]/20 bg-[#FF3B3B]/8 px-4 py-3 text-sm text-white/60 w-full lg:w-auto">
            <span className="font-bold text-white">{branches.length}</span> branches serving Laguna
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
          {branches.map((branch, index) => (
            <motion.article
              key={branch.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              className="group rounded-3xl border border-white/8 bg-[#111111]/85 p-5 sm:p-6 hover:border-[#FF3B3B]/35 hover:shadow-[0_0_40px_rgba(255,59,59,0.1)] transition-all duration-300"
            >
              <div className="mb-5 flex items-start gap-4">
                <div className="h-12 w-12 shrink-0 rounded-2xl bg-[#FF3B3B]/12 border border-[#FF3B3B]/20 flex items-center justify-center text-[#FF4D2E]">
                  <Store className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-xl font-black leading-tight text-white">
                    {branch.name}
                  </h3>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Open for orders
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <InfoRow icon={MapPin} label="Address" value={branch.address} />
                <InfoRow icon={Clock} label="Opening Hours" value={branch.hours} />
                <InfoRow icon={Phone} label="Contact Number" value={branch.phone} />
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AvailabilityCard
                  icon={ShoppingBag}
                  title="Pickup"
                  value={branch.pickup}
                  available
                />
                <AvailabilityCard
                  icon={Truck}
                  title="Delivery"
                  value={branch.delivery}
                  available={branch.delivery === "Available"}
                />
              </div>

              <a
                href={`tel:${branch.phone.replace(/\s/g, "")}`}
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#FF3B3B] px-5 text-sm font-bold text-white hover:bg-[#ff5252] active:scale-[0.98] transition-all"
              >
                Call Branch
              </a>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 h-9 w-9 shrink-0 rounded-xl bg-white/[0.04] border border-white/8 flex items-center justify-center text-[#FF4D2E]">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">
          {label}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-white/70 break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

function AvailabilityCard({
  icon: Icon,
  title,
  value,
  available,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  available: boolean;
}) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${
      available
        ? "border-[#FF3B3B]/20 bg-[#FF3B3B]/8"
        : "border-yellow-500/20 bg-yellow-500/8"
    }`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${available ? "text-[#FF4D2E]" : "text-yellow-400"}`} />
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/40">
          {title}
        </p>
      </div>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
    </div>
  );
}
