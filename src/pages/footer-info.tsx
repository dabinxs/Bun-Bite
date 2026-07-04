import { Briefcase, Cookie, FileText, HelpCircle, ShieldCheck } from "lucide-react";
import Navbar from "@/components/navbar";

interface FooterInfoPageProps {
  cartCount: number;
  variant: "faqs" | "careers" | "privacy" | "terms" | "cookies";
}

const pageContent = {
  faqs: {
    eyebrow: "Help center",
    title: "Frequently Asked Questions",
    description: "Quick answers about ordering, pickup, delivery, payments, and Bun & Bite store support.",
    icon: HelpCircle,
    sections: [
      {
        title: "How do I place an order?",
        body: "Choose items from the menu, customize them if needed, add them to your cart, then continue to delivery or pickup checkout.",
      },
      {
        title: "Can I edit items before checkout?",
        body: "Yes. Use the Edit option in the cart drawer or checkout order summary to update add-ons, spice level, removed ingredients, notes, and quantity.",
      },
      {
        title: "Where can I pick up my order?",
        body: "Use the Locations link or Pickup flow to choose the branch that is most convenient for you.",
      },
      {
        title: "Who do I contact for order issues?",
        body: "Use the Support link in the footer or the contact form on the homepage. For urgent pickup concerns, call the selected branch directly.",
      },
    ],
  },
  careers: {
    eyebrow: "Join the team",
    title: "Careers at Bun & Bite",
    description: "We are building a friendly, fast-moving local food brand for people who care about service and great burgers.",
    icon: Briefcase,
    sections: [
      {
        title: "Store Crew",
        body: "Help prepare orders, welcome customers, keep stations clean, and support smooth pickup and delivery operations.",
      },
      {
        title: "Kitchen Assistant",
        body: "Work with fresh ingredients, follow food safety standards, and help the team serve consistent Bun & Bite favorites.",
      },
      {
        title: "Shift Lead",
        body: "Guide daily store operations, coordinate staff, monitor quality, and make sure customers get quick, friendly service.",
      },
      {
        title: "How to apply",
        body: "Send your resume to support@bunandbite.com with the role and preferred branch in the subject line.",
      },
    ],
  },
  privacy: {
    eyebrow: "Policy",
    title: "Privacy Policy",
    description: "This sample policy explains how Bun & Bite may handle customer information for ordering and support.",
    icon: ShieldCheck,
    sections: [
      {
        title: "Information we collect",
        body: "We may collect contact details, order details, pickup or delivery preferences, and support messages you provide while using the website.",
      },
      {
        title: "How we use information",
        body: "Information is used to process orders, prepare pickup or delivery, respond to support requests, and improve the ordering experience.",
      },
      {
        title: "Data safety",
        body: "We aim to keep customer information limited, relevant, and protected. Do not submit sensitive payment details through open text fields.",
      },
      {
        title: "Contact",
        body: "For privacy questions, email support@bunandbite.com.",
      },
    ],
  },
  terms: {
    eyebrow: "Policy",
    title: "Terms of Service",
    description: "These sample terms outline basic rules for using the Bun & Bite ordering website.",
    icon: FileText,
    sections: [
      {
        title: "Orders",
        body: "Orders are subject to branch availability, product availability, and confirmation from Bun & Bite.",
      },
      {
        title: "Pricing",
        body: "Displayed prices, fees, and promos may change. Checkout totals should be reviewed before placing an order.",
      },
      {
        title: "Pickup and delivery",
        body: "Estimated times are provided for convenience and may change depending on branch load, traffic, weather, or product preparation time.",
      },
      {
        title: "Responsible use",
        body: "Please provide accurate contact details and avoid submitting false, abusive, or misleading order information.",
      },
    ],
  },
  cookies: {
    eyebrow: "Policy",
    title: "Cookie Policy",
    description: "This sample cookie policy explains how the website may remember cart and preference details.",
    icon: Cookie,
    sections: [
      {
        title: "Local storage",
        body: "The site may save cart items locally in your browser so your order can stay available while you browse.",
      },
      {
        title: "Preferences",
        body: "Some UI preferences, such as menu category navigation, may be stored temporarily to make page navigation smoother.",
      },
      {
        title: "Managing data",
        body: "You can clear saved website data from your browser settings. Doing this may remove your cart and saved preferences.",
      },
      {
        title: "No third-party tracking setup",
        body: "This demo page does not add third-party advertising cookies. Replace this text if analytics or marketing tools are added later.",
      },
    ],
  },
} as const;

export default function FooterInfoPage({ cartCount, variant }: FooterInfoPageProps) {
  const content = pageContent[variant];
  const Icon = content.icon;

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#050505] text-white">
      <Navbar cartCount={cartCount} showSearch={false} />

      <main className="px-4 pb-16 pt-28 sm:px-6 md:pt-32">
        <section className="mx-auto max-w-5xl">
          <div className="mb-8 rounded-[2rem] border border-white/10 bg-[#111111]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.3)] sm:p-8 md:p-10">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#FF3B3B]/25 bg-[#FF3B3B]/12 text-[#FF4D2E]">
              <Icon className="h-7 w-7" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FF8A80]">
              {content.eyebrow}
            </p>
            <h1 className="mt-3 font-display text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
              {content.title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/55 sm:text-base">
              {content.description}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {content.sections.map((section) => (
              <article
                key={section.title}
                className="rounded-3xl border border-white/8 bg-[#111111]/80 p-5 transition-colors hover:border-[#FF3B3B]/25 sm:p-6"
              >
                <h2 className="font-display text-xl font-black text-white">{section.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/50">{section.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
