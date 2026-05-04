import { Link } from "react-router-dom";
import { Product, resolveImage } from "@/hooks/useProducts";
import { formatKsh } from "@/lib/constants";
import { ArrowUpRight } from "lucide-react";

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const img = resolveImage(product.images[0]);
  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block animate-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted mb-4 rounded-sm">
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          width={1024}
          height={1024}
          className="w-full h-full object-cover transition-smooth group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur px-2.5 py-1 text-[10px] uppercase tracking-widest text-foreground/80">
          {product.category === "sofas" ? "Sofa" : "Table"}
        </div>
        <div className="absolute inset-0 bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-smooth flex items-end p-4">
          <span className="text-primary-foreground text-sm flex items-center gap-1">
            View details <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-foreground leading-tight">{product.name}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.short_description}</p>
        </div>
        <span className="font-display text-lg text-primary whitespace-nowrap">{formatKsh(product.price_ksh)}</span>
      </div>
    </Link>
  );
}
