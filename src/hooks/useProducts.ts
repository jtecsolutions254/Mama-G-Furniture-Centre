import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SAMPLE_PRODUCTS, SampleProduct } from "@/lib/sampleProducts";

// Map asset paths from DB ('/src/assets/xxx.jpg') back to bundled URLs
import sofa1 from "@/assets/product-sofa-1.jpg";
import sofa2 from "@/assets/product-sofa-2.jpg";
import sofa3 from "@/assets/product-sofa-3.jpg";
import table1 from "@/assets/product-table-1.jpg";
import table2 from "@/assets/product-table-2.jpg";

const ASSET_MAP: Record<string, string> = {
  "/src/assets/product-sofa-1.jpg": sofa1,
  "/src/assets/product-sofa-2.jpg": sofa2,
  "/src/assets/product-sofa-3.jpg": sofa3,
  "/src/assets/product-table-1.jpg": table1,
  "/src/assets/product-table-2.jpg": table2,
};

export function resolveImage(src: string): string {
  if (!src) return sofa1;
  if (ASSET_MAP[src]) return ASSET_MAP[src];
  return src; // already a full URL (Supabase storage)
}

export type Product = SampleProduct & { in_stock?: boolean };

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (!mounted) return;
      if (error || !data || data.length === 0) {
        setProducts(SAMPLE_PRODUCTS);
      } else {
        setProducts(
          data.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            category: p.category as "sofas" | "tables",
            price_ksh: p.price_ksh,
            short_description: p.short_description,
            description: p.description,
            size: p.size ?? "",
            dimensions: p.dimensions ?? "",
            materials: p.materials ?? "",
            images: p.images?.length ? p.images : [],
            featured: p.featured,
            in_stock: p.in_stock,
          }))
        );
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  return { products, loading };
}

export function useProduct(slug: string | undefined) {
  const { products, loading } = useProducts();
  const product = products.find((p) => p.slug === slug);
  return { product, loading };
}
