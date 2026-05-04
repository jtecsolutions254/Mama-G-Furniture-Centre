import { Link } from "react-router-dom";
import { BUSINESS, FREE_DELIVERY_AREAS } from "@/lib/constants";
import { Phone, MessageCircle, MapPin } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground mt-24">
      <div className="container py-16 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <h3 className="font-display text-3xl mb-3">{BUSINESS.name}</h3>
          <p className="text-primary-foreground/80 max-w-md leading-relaxed">
            Modern Kenyan furniture, hand-built and delivered across Nairobi & beyond.
            FREE delivery in {FREE_DELIVERY_AREAS.join(", ")}.
          </p>
        </div>

        <div>
          <h4 className="uppercase text-xs tracking-widest mb-4 text-highlight">Shop</h4>
          <ul className="space-y-2 text-primary-foreground/80">
            <li><Link to="/shop?category=sofas" className="hover:text-highlight">Sofas</Link></li>
            <li><Link to="/shop?category=tables" className="hover:text-highlight">Tables</Link></li>
            <li><Link to="/shop" className="hover:text-highlight">All Products</Link></li>
            <li><Link to="/contact" className="hover:text-highlight">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="uppercase text-xs tracking-widest mb-4 text-highlight">Get in Touch</h4>
          <ul className="space-y-3 text-primary-foreground/80 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> {BUSINESS.phoneDisplay}
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> WhatsApp orders
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {BUSINESS.address}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container py-5 flex flex-col md:flex-row items-center justify-between text-xs text-primary-foreground/60 gap-2">
          <span>© {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.</span>
          <Link to="/admin" className="hover:text-highlight">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
