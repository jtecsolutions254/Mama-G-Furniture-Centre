export const BUSINESS = {
  name: "Pamoja Living",
  tagline: "Modern Sofas & Tables Delivered Across Nairobi & Kenya",
  whatsapp: "254114234020", // +254 114 234 020
  phoneDisplay: "+254 114 234 020",
  email: "hello@pamojaliving.co.ke",
  address: "Nairobi, Kenya",
};

export const FREE_DELIVERY_AREAS = [
  "Kilimani",
  "Kileleshwa",
  "Karen",
  "Westlands",
] as const;

export const ALL_NAIROBI_AREAS = [
  "Kilimani",
  "Kileleshwa",
  "Karen",
  "Westlands",
  "Lavington",
  "Parklands",
  "Runda",
  "Muthaiga",
  "South B",
  "South C",
  "Langata",
  "Ruaka",
  "Kiambu",
  "Thika Road",
  "Mombasa Road",
  "Other (Nairobi)",
  "Outside Nairobi",
] as const;

export const DELIVERY_FEE_KSH = 1500; // flat rate outside free zones within Nairobi
export const OUTSIDE_NAIROBI_NOTE = "Delivery fee calculated based on location";

export function isFreeDelivery(area: string) {
  return FREE_DELIVERY_AREAS.includes(area as typeof FREE_DELIVERY_AREAS[number]);
}

export function formatKsh(amount: number) {
  return `Ksh ${amount.toLocaleString("en-KE")}`;
}

export function whatsappLink(message: string) {
  return `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(message)}`;
}
