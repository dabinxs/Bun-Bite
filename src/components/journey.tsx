import { motion } from "framer-motion";

const JOURNEY = [
  {
    year: "2023",
    label: "founded with a vision",
    title: "First Open Bun & Bite",
    desc: "Bun & Bite was founded with a simple vision: to serve high-quality burgers made with passion and fresh ingredients."
  },
  {
    year: "2025",
    label: "bringing Bun & Bite to more people",
    title: "Scaling Up",
    desc: "With growing support from customers, we expanded our reach and brought Bun & Bite to more burger lovers."
  },
  {
    year: "2026",
    label: "Became Local Favorite",
    title: "Growing Up",
    desc: "Became a local favorite, known for bold flavors, great service, and unforgettable burger experiences."
  }
];

export default function Journey() {
  return (
    <section id="journey" className="py-24 bg-[#0A0A0A] overflow-hidden scroll-mt-20">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-black">OUR JOURNEY</h2>
        </motion.div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2" />

          {JOURNEY.map((item, index) => (
            <div key={item.year} className="relative flex items-center mb-16 last:mb-0">
              {/* Dot marker */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full bg-[#FF3B3B] ring-4 ring-[#0A0A0A] -translate-x-1/2 z-10"
              />

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6 }}
                className={`w-full pl-12 md:pl-0 md:w-[45%] ${
                  index % 2 === 0
                    ? "md:mr-auto md:pr-12 md:text-right"
                    : "md:ml-auto md:pl-12"
                }`}
              >
                <span className="font-display text-4xl font-black text-[#FF3B3B]/30">{item.year}</span>
                <h3 className="font-display text-xl font-bold mt-1">{item.title}</h3>
                <p className="text-[#FF3B3B] text-sm font-medium mt-1">{item.label}</p>
                <p className="text-white/50 text-sm mt-2">{item.desc}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
