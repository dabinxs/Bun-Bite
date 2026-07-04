import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, Clock, Loader2, Star } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Message is required").max(500, "Message is too long"),
});

export default function Contact() {
  const [selectedLocation, setSelectedLocation] = useState<number | null>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", subject: "", message: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    toast({ title: "Message sent!", description: "We've received your message and will get back to you soon." });
    form.reset();
  };

  const locations = [
    { id: 0, name: "Bi\u00f1an City Laguna", rating: "4.8 (405)", address: "Barangay Langkiwa, Bi\u00f1an City Laguna", phone: "(8888) 987 654 321" },
    { id: 1, name: "Bi\u00f1an City Laguna", rating: "4.8 (405)", address: "Barangay Langkiwa, Bi\u00f1an City Laguna", phone: "(8888) 987 654 321" },
    { id: 2, name: "Bi\u00f1an City Laguna", rating: "4.8 (405)", address: "Barangay Langkiwa, Bi\u00f1an City Laguna", phone: "(8888) 987 654 321" },
  ];

  return (
    <section id="contact" className="py-24 bg-[#0d0d0d] border-t border-white/5 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl font-black mb-4"
          >
            LET'S CONNECT
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white/50 text-lg"
          >
            We're dedicated to crafting burgers that bring people together — combining bold flavors, creativity, and consistency in every order.
          </motion.p>
        </div>

        {/* Part 1: Info & Locations */}
        <div className="grid lg:grid-cols-12 gap-12 mb-24">
          {/* Contact Info */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            {[
              { icon: Phone, title: "Call Us", subtitle: "Available daily for orders and inquiries", value: "(+555) 234 567 891" },
              { icon: Mail, title: "Email Us", subtitle: "For general questions and support", value: "support@bunandbite.com" },
              { icon: Clock, title: "Opening Hours", subtitle: "Come and visit us", value: "Monday - Friday: 7:00 AM - 5:00 PM Sat – Sunday: 10AM – 11:00 PM" },
            ].map((info, i) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-[#FF3B3B]/10 rounded-full flex items-center justify-center shrink-0">
                  <info.icon className="w-5 h-5 text-[#FF3B3B]" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">{info.title}</h4>
                  {info.subtitle && <p className="text-xs text-white/40">{info.subtitle}</p>}
                  <p className="mt-1 font-medium text-sm">{info.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Locations */}
          <div className="lg:col-span-8">
            <h3 className="font-display text-2xl font-bold mb-6">Our Locations</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {locations.map((loc, i) => (
                <motion.div
                  key={loc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedLocation(loc.id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                    selectedLocation === loc.id
                      ? "border-[#FF3B3B]/50 bg-[#FF3B3B]/5"
                      : "border-white/5 bg-[#111111] hover:border-white/15"
                  } ${i === 2 ? "sm:col-span-2" : ""}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-display text-xl font-bold">{loc.name}</h4>
                    <span className="flex items-center gap-1 text-sm font-bold text-[#FF3B3B]">
                      <Star className="w-3.5 h-3.5 fill-current" /> {loc.rating}
                    </span>
                  </div>
                  <p className="text-white/40 text-sm mb-3">{loc.address}</p>
                  <p className="font-medium text-sm mb-3">{loc.phone}</p>
                  <div className="flex gap-2 flex-wrap">
                    {["Fast Service", "Takeout", "Delivery"].map(tag => (
                      <span key={tag} className="text-[10px] font-bold tracking-wider px-2 py-1 rounded-full bg-white/5 text-white/50 border border-white/5">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Part 2: Hours + Issue + Form */}
        <div className="grid lg:grid-cols-2 gap-12 bg-[#111111] p-8 md:p-12 rounded-3xl border border-white/5">
          {/* Left column */}
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="font-display text-2xl font-bold mb-4">Opening Hours</h3>
              <p className="text-white/50 text-sm">Monday - Friday: 7:00 AM - 10:00 PM</p>
              <p className="text-white/50 text-sm">Saturday - Sunday: 7:00 AM - 12:00 AM</p>
            </div>

            <div className="p-6 bg-[#FF3B3B]/5 rounded-2xl border border-[#FF3B3B]/20">
              <h4 className="font-bold text-xl mb-2 text-[#FF3B3B]">Order Issues?</h4>
              <p className="text-white/50 text-sm mb-6">Having trouble with your order? Let us know and we'll resolve it quickly to make things right.</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full font-bold bg-[#FF3B3B] hover:bg-[#ff6647] text-white rounded-full">
                    REPORT AN ISSUE
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#111111] border-white/10">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Report an order issue?</AlertDialogTitle>
                    <AlertDialogDescription className="text-white/50">
                      This will direct you to our priority support team. Are you sure you want to report an issue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-white/5 text-white border-white/10 hover:bg-white/10">Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-[#FF3B3B] text-white hover:bg-[#ff6647]">Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Right: Form */}
          <div>
            <h3 className="font-display text-2xl font-bold mb-6">Send us a Message</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Your Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your name (optional)" {...field} className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-white/30 focus:border-[#FF3B3B]/50 focus:ring-[#FF3B3B]/20 rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="How can we help you?" {...field} className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-white/30 focus:border-[#FF3B3B]/50 focus:ring-[#FF3B3B]/20 rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-white/70">Message</FormLabel>
                        <span className="text-xs text-white/30">{field.value.length}/500</span>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Input the message (500 characters)"
                          className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-white/30 focus:border-[#FF3B3B]/50 focus:ring-[#FF3B3B]/20 min-h-[120px] rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-bold bg-[#FF3B3B] hover:bg-[#ff6647] text-white rounded-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
}
