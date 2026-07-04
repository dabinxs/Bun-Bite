import { motion } from "framer-motion";
import { Truck, ShieldCheck, Lock, RotateCcw } from "lucide-react";

const features = [
  { icon: Truck, title: "Free Delivery", desc: "no extra charges" },
  { icon: ShieldCheck, title: "Freshness Guaranteed", desc: "Premium Quality" },
  { icon: Lock, title: "Protected Payments", desc: "100% Secure Payment" },
  { icon: RotateCcw, title: "Easy Refunds", desc: "15-day policy" },
];

export default function Features() {
  return (
    <section className="py-14 bg-[#0A0A0A] border-t border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {features.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-[#FF3B3B]/10 flex items-center justify-center text-[#FF3B3B]">
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{item.title}</h4>
                <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
