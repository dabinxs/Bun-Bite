import { motion } from "framer-motion";

export default function About() {
  return (
    <section id="about" className="py-24 bg-[#0d0d0d] border-t border-white/5 relative overflow-hidden scroll-mt-20">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF3B3B]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-black mb-6">OUR STORY</h2>
          <p className="text-lg text-white/50 leading-relaxed">
            From a simple idea to serve better burgers, Bun & Bite was built on passion, flavor, and quality. We believe every burger should be more than just a meal — it should be an experience worth coming back for.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "OUR MISSION",
              desc: "To serve fresh, flavorful burgers made with quality ingredients, delivering satisfaction in every bite without compromise."
            },
            {
              title: "OUR PASSION",
              desc: "We're dedicated to crafting burgers that bring people together — combining bold flavors, creativity, and consistency in every order."
            },
            {
              title: "OUR COMMUNITY",
              desc: "Proudly serving thousands of happy customers, we continue to grow with the support of our community who shares our love for great food."
            }
          ].map((col, index) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-[#111111] p-8 rounded-2xl border border-white/5 hover:border-[#FF3B3B]/20 transition-all duration-300"
            >
              <h3 className="font-display text-2xl font-bold mb-4">{col.title}</h3>
              <p className="text-white/50 leading-relaxed text-sm">{col.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
