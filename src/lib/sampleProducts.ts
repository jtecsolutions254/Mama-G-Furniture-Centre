import sofa1 from "@/assets/product-sofa-1.jpg";
import sofa2 from "@/assets/product-sofa-2.jpg";
import sofa3 from "@/assets/product-sofa-3.jpg";
import table1 from "@/assets/product-table-1.jpg";
import table2 from "@/assets/product-table-2.jpg";

export type SampleProduct = {
  id: string;
  slug: string;
  name: string;
  category: "sofas" | "tables";
  price_ksh: number;
  short_description: string;
  description: string;
  size: string;
  dimensions: string;
  materials: string;
  images: string[];
  featured: boolean;
};

export const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    id: "s1",
    slug: "sienna-3-seater-sofa",
    name: "Sienna 3-Seater Sofa",
    category: "sofas",
    price_ksh: 68000,
    short_description: "Bold burnt-orange linen, deep cushions, modern silhouette.",
    description:
      "The Sienna anchors any living room with its warm rust tone and clean lines. Hand-built on a kiln-dried hardwood frame, with high-density foam cushions and removable covers.",
    size: "3-seater",
    dimensions: "210cm × 90cm × 82cm (L×W×H)",
    materials: "Hardwood frame, linen upholstery, high-density foam, powder-coated steel legs",
    images: [sofa1],
    featured: true,
  },
  {
    id: "s2",
    slug: "kilimani-l-shape-leather",
    name: "Kilimani L-Shape Leather",
    category: "sofas",
    price_ksh: 145000,
    short_description: "Full-grain brown leather, generous L-shape for family living.",
    description:
      "A statement piece for spacious living rooms. Genuine full-grain leather softens beautifully with age. Sturdy hardwood frame with a 10-year structural warranty.",
    size: "L-shape (5+ seats)",
    dimensions: "280cm × 200cm × 85cm (L×W×H)",
    materials: "Full-grain leather, hardwood frame, pocket-spring seats",
    images: [sofa2],
    featured: true,
  },
  {
    id: "s3",
    slug: "karen-loveseat",
    name: "Karen Loveseat",
    category: "sofas",
    price_ksh: 42000,
    short_description: "Cozy 2-seater in cream weave with mid-century walnut legs.",
    description:
      "Compact and elegant — perfect for apartments or reading corners. Tightly woven cream upholstery resists stains and lifts any space.",
    size: "2-seater",
    dimensions: "140cm × 82cm × 78cm (L×W×H)",
    materials: "Solid walnut legs, cotton-poly weave, sinuous spring suspension",
    images: [sofa3],
    featured: true,
  },
  {
    id: "t1",
    slug: "copper-leg-coffee-table",
    name: "Copper Leg Coffee Table",
    category: "tables",
    price_ksh: 22000,
    short_description: "Walnut top with sculptural copper-finish steel base.",
    description:
      "A modern centerpiece. Solid walnut top finished with natural oil; rose-copper steel base for a warm metallic glow.",
    size: "Round, 90cm",
    dimensions: "90cm Ø × 42cm H",
    materials: "Solid walnut, copper-plated steel",
    images: [table1],
    featured: true,
  },
  {
    id: "t2",
    slug: "westlands-6-seater-dining",
    name: "Westlands 6-Seater Dining Table",
    category: "tables",
    price_ksh: 58000,
    short_description: "Solid oak top, matte black A-frame legs.",
    description:
      "A clean, functional dining table built to host. Solid oak top with sealed finish; matte-black powder-coated steel A-frame for stability.",
    size: "6-seater",
    dimensions: "180cm × 90cm × 76cm (L×W×H)",
    materials: "Solid oak, powder-coated steel",
    images: [table2],
    featured: false,
  },
];
