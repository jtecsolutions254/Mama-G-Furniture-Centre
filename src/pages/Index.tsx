import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle, Truck, ShieldCheck, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-sofa.jpg";
import { BUSINESS, FREE_DELIVERY_AREAS, whatsappLink } from "@/lib/constants";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";

const Index = () => {
  const { products } = useProducts();
  const featured = products.filter((p) => p.featured).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative min-h-[100svh] flex items-end overflow-hidden">
        <img
          src={heroImage}
          alt="Modern sofa in warm Nairobi living room"
          width={1600}
          height={1100}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-overlay" />

        <div className="relative container pb-16 md:pb-24 pt-28 text-primary-foreground">
          <div className="max-w-3xl animate-fade-up">
            <span className="inline-block text-xs uppercase tracking-[0.3em] text-highlight mb-5">
              Nairobi · Est. 2024
            </span>
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] text-balance">
              Modern sofas & tables, delivered across Kenya.
            </h1>
            <p className="mt-6 max-w-xl text-base md:text-lg text-primary-foreground/85 leading-relaxed">
              Hand-built furniture for Kenyan homes. <span className="text-highlight">FREE delivery</span> in {FREE_DELIVERY_AREAS.join(", ")}.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 bg-highlight text-highlight-foreground px-7 py-4 font-medium hover:bg-accent hover:text-accent-foreground transition-smooth shadow-elegant rounded-sm"
              >
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={whatsappLink(`Hello ${BUSINESS.name}, I'd like to order furniture.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-whatsapp text-whatsapp-foreground px-7 py-4 font-medium hover:opacity-90 transition-smooth rounded-sm"
              >
                <MessageCircle className="w-4 h-4" /> Order via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FREE DELIVERY BAND */}
      <section className="bg-primary text-primary-foreground py-10">
        <div className="container grid sm:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="flex items-start gap-3 justify-center sm:justify-start">
            <Truck className="w-6 h-6 text-highlight shrink-0 mt-1" />
            <div>
              <div className="font-display text-lg">FREE Delivery</div>
              <div className="text-sm text-primary-foreground/70">Kilimani · Kileleshwa · Karen · Westlands</div>
            </div>
          </div>
          <div className="flex items-start gap-3 justify-center sm:justify-start">
            <ShieldCheck className="w-6 h-6 text-highlight shrink-0 mt-1" />
            <div>
              <div className="font-display text-lg">Built to Last</div>
              <div className="text-sm text-primary-foreground/70">Kenyan hardwood · 1-year warranty</div>
            </div>
          </div>
          <div className="flex items-start gap-3 justify-center sm:justify-start">
            <Sparkles className="w-6 h-6 text-highlight shrink-0 mt-1" />
            <div>
              <div className="font-display text-lg">Order via WhatsApp</div>
              <div className="text-sm text-primary-foreground/70">Quick replies · M-Pesa friendly</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="container py-20 md:py-28">
        <div className="flex items-end justify-between mb-10 md:mb-14">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-accent">Featured</span>
            <h2 className="font-display text-4xl md:text-5xl mt-2">New this season</h2>
          </div>
          <Link
            to="/shop"
            className="hidden md:inline-flex items-center gap-1 text-sm uppercase tracking-wider text-primary hover:text-accent transition-colors"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>

        <div className="md:hidden mt-10 text-center">
          <Link to="/shop" className="inline-flex items-center gap-1 text-sm uppercase tracking-wider text-primary">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-warm text-primary-foreground py-20">
        <div className="container text-center max-w-2xl">
          <h2 className="font-display text-4xl md:text-5xl">Made for Kenyan living.</h2>
          <p className="mt-4 text-primary-foreground/85">
            Tell us what you're looking for — we'll send photos, prices, and confirm delivery in minutes on WhatsApp.
          </p>
          <a
            href={whatsappLink(`Hello ${BUSINESS.name}, I'd like help choosing furniture for my home.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 bg-background text-foreground px-7 py-4 font-medium hover:bg-highlight hover:text-highlight-foreground transition-smooth rounded-sm"
          >
            <MessageCircle className="w-4 h-4" /> Chat with us on WhatsApp
          </a>
        </div>
      </section>

      <SiteFooter />
      <FloatingWhatsApp />
    </div>
  );
};

export default Index;
