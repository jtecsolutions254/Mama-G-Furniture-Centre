import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatKsh } from "@/lib/constants";

export default function Shop() {
  const { products, loading } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category") ?? "all";
  const [size, setSize] = useState<string>("all");
  const [price, setPrice] = useState<[number, number]>([0, 200000]);

  const sizes = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => p.size && s.add(p.size));
    return Array.from(s);
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (size !== "all" && p.size !== size) return false;
      if (p.price_ksh < price[0] || p.price_ksh > price[1]) return false;
      return true;
    });
  }, [products, category, size, price]);

  function setCategory(v: string) {
    const sp = new URLSearchParams(searchParams);
    if (v === "all") sp.delete("category"); else sp.set("category", v);
    setSearchParams(sp, { replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="pt-28 md:pt-36 pb-10 bg-gradient-subtle">
        <div className="container">
          <span className="text-xs uppercase tracking-[0.3em] text-accent">Shop</span>
          <h1 className="font-display text-4xl md:text-6xl mt-2">All Furniture</h1>
          <p className="mt-3 text-muted-foreground max-w-xl">
            Browse our full collection of sofas and tables. Order via WhatsApp — fast, simple, no signup needed.
          </p>
        </div>
      </section>

      <section className="container py-10 md:py-14">
        <div className="grid lg:grid-cols-[260px_1fr] gap-10">
          {/* Filters */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="sofas">Sofas</SelectItem>
                  <SelectItem value="tables">Tables</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Size</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sizes</SelectItem>
                  {sizes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Price: {formatKsh(price[0])} – {formatKsh(price[1])}
              </Label>
              <Slider
                value={price}
                onValueChange={(v) => setPrice([v[0], v[1]] as [number, number])}
                min={0}
                max={200000}
                step={5000}
                className="mt-4"
              />
            </div>

            <div className="text-sm text-muted-foreground">{filtered.length} products</div>
          </aside>

          {/* Grid */}
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] bg-muted animate-pulse rounded-sm" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                No products match your filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
      <FloatingWhatsApp />
    </div>
  );
}
