import { useState } from "react";
import { z } from "zod";
import { Phone, MessageCircle, MapPin, Mail, Send } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BUSINESS, whatsappLink } from "@/lib/constants";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  message: z.string().trim().min(5, "Message too short").max(1000),
});

export default function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const msg = `Hello ${BUSINESS.name}, my name is ${form.name} (${form.phone}). ${form.message}`;
    window.open(whatsappLink(msg), "_blank", "noopener,noreferrer");
    setTimeout(() => {
      toast.success("Opening WhatsApp to send your message…");
      setSubmitting(false);
    }, 300);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="pt-28 md:pt-36 pb-10 bg-gradient-subtle">
        <div className="container">
          <span className="text-xs uppercase tracking-[0.3em] text-accent">Contact</span>
          <h1 className="font-display text-4xl md:text-6xl mt-2">Let's talk furniture.</h1>
          <p className="mt-3 text-muted-foreground max-w-xl">
            Send a message, call, or chat on WhatsApp. We respond within minutes during business hours.
          </p>
        </div>
      </section>

      <section className="container py-12 md:py-16 grid md:grid-cols-2 gap-10 lg:gap-16">
        <div>
          <h2 className="font-display text-3xl mb-6">Get in touch</h2>
          <ul className="space-y-5">
            <li className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-accent mt-1" />
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Phone</div>
                <a href={`tel:${BUSINESS.phoneDisplay.replace(/\s/g, "")}`} className="text-foreground hover:text-primary">
                  {BUSINESS.phoneDisplay}
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-whatsapp mt-1" />
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">WhatsApp</div>
                <a
                  href={whatsappLink(`Hello ${BUSINESS.name}!`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary"
                >
                  Chat now
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-accent mt-1" />
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Email</div>
                <a href={`mailto:${BUSINESS.email}`} className="text-foreground hover:text-primary">{BUSINESS.email}</a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-accent mt-1" />
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Location</div>
                <span className="text-foreground">{BUSINESS.address}</span>
              </div>
            </li>
          </ul>

          <div className="mt-8 aspect-video w-full overflow-hidden rounded-sm border border-border">
            <iframe
              title="Nairobi map"
              src="https://www.google.com/maps?q=Nairobi,Kenya&output=embed"
              loading="lazy"
              className="w-full h-full border-0"
            />
          </div>
        </div>

        <form onSubmit={submit} className="bg-card border border-border p-6 md:p-8 rounded-sm shadow-soft self-start">
          <h2 className="font-display text-3xl mb-6">Send a message</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" rows={5} maxLength={1000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 font-medium hover:bg-accent hover:text-accent-foreground transition-smooth rounded-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> Send via WhatsApp
            </button>
          </div>
        </form>
      </section>

      <SiteFooter />
      <FloatingWhatsApp />
    </div>
  );
}
