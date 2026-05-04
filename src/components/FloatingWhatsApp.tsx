import { MessageCircle } from "lucide-react";
import { BUSINESS, whatsappLink } from "@/lib/constants";

interface Props {
  message?: string;
}

export default function FloatingWhatsApp({ message }: Props) {
  const msg = message ?? `Hello ${BUSINESS.name}, I'd like to know more about your furniture.`;
  return (
    <a
      href={whatsappLink(msg)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 group"
    >
      <span className="absolute inset-0 rounded-full bg-whatsapp/40 animate-ping" />
      <span className="relative flex items-center gap-2 bg-whatsapp text-whatsapp-foreground rounded-full pl-4 pr-5 py-3 shadow-elegant hover:scale-105 transition-smooth">
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">Order via WhatsApp</span>
      </span>
    </a>
  );
}
