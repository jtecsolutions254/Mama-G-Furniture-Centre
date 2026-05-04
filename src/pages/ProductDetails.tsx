import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, MessageCircle, Ruler, Layers, ShoppingBag } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import DeliveryCalculator from "@/components/DeliveryCalculator";
import ProductReviews, { Stars } from "@/components/ProductReviews";
import { useProduct, resolveImage } from "@/hooks/useProducts";
import { BUSINESS, formatKsh, whatsappLink } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

export default function ProductDetails() {
  const { slug } = useParams();
  const { product, loading } = useProduct(slug);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container pt-32 pb-20"><div className="aspect-square bg-muted animate-pulse rounded-sm max-w-2xl" /></div>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container pt-32 pb-20 text-center">
          <h1 className="font-display text-4xl">Product not found</h1>
          <Link to="/shop" className="text-primary mt-4 inline-block underline">Back to shop</Link>
        </div>
      </div>
    );
  }

  const images = product.images.length ? product.images : [""];
  const message = `Hello ${BUSINESS.name}, I'm interested in *${product.name}* (${formatKsh(product.price_ksh)}). Is it available?`;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="pt-24 md:pt-28">
        <div className="container py-6">
          <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ChevronLeft className="w-4 h-4" /> Back to shop
          </Link>
        </div>

        <div className="container grid md:grid-cols-2 gap-10 lg:gap-16 pb-16">
          {/* Gallery */}
          <div>
            <div
              className="relative aspect-square bg-muted overflow-hidden rounded-sm cursor-zoom-in"
              onClick={() => setZoom((z) => !z)}
            >
              <img
                src={resolveImage(images[active])}
                alt={product.name}
                width={1024}
                height={1024}
                className={`w-full h-full object-cover transition-smooth ${zoom ? "scale-150 cursor-zoom-out" : "scale-100"}`}
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => { setActive(i); setZoom(false); }}
                    className={`aspect-square overflow-hidden rounded-sm border-2 transition-smooth ${active === i ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
                  >
                    <img src={resolveImage(src)} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-accent">{product.category === "sofas" ? "Sofa" : "Table"}</span>
            <h1 className="font-display text-4xl md:text-5xl mt-2 leading-tight">{product.name}</h1>
            <div className="font-display text-3xl text-primary mt-4">{formatKsh(product.price_ksh)}</div>

            <p className="mt-6 text-foreground/80 leading-relaxed">{product.description}</p>

            <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
              {product.size && (
                <div className="border-l-2 border-accent pl-3">
                  <dt className="text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1"><Layers className="w-3 h-3" /> Size</dt>
                  <dd className="mt-1 text-foreground">{product.size}</dd>
                </div>
              )}
              {product.dimensions && (
                <div className="border-l-2 border-accent pl-3">
                  <dt className="text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-1"><Ruler className="w-3 h-3" /> Dimensions</dt>
                  <dd className="mt-1 text-foreground">{product.dimensions}</dd>
                </div>
              )}
              {product.materials && (
                <div className="col-span-2 border-l-2 border-accent pl-3">
                  <dt className="text-xs uppercase text-muted-foreground tracking-wider">Materials</dt>
                  <dd className="mt-1 text-foreground">{product.materials}</dd>
                </div>
              )}
            </dl>

            <div className="mt-8">
              <DeliveryCalculator />
            </div>

            <a
              href={whatsappLink(message)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-whatsapp text-whatsapp-foreground px-7 py-4 font-medium hover:opacity-90 transition-smooth rounded-sm shadow-elegant"
            >
              <MessageCircle className="w-5 h-5" />
              Order via WhatsApp
            </a>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Pre-filled message will open in WhatsApp · Pay via M-Pesa on delivery
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
      <FloatingWhatsApp message={message} />
    </div>
  );
}
