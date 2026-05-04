import { useState } from "react";
import { ALL_NAIROBI_AREAS, DELIVERY_FEE_KSH, FREE_DELIVERY_AREAS, OUTSIDE_NAIROBI_NOTE, formatKsh, isFreeDelivery } from "@/lib/constants";
import { Truck, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DeliveryCalculator({ onChange }: { onChange?: (area: string, free: boolean) => void }) {
  const [area, setArea] = useState<string>("");

  const free = area && isFreeDelivery(area);
  const outside = area === "Outside Nairobi";

  function handle(v: string) {
    setArea(v);
    onChange?.(v, isFreeDelivery(v));
  }

  return (
    <div className="border border-border bg-card p-5 rounded-sm">
      <div className="flex items-center gap-2 mb-3 text-foreground">
        <Truck className="w-5 h-5 text-accent" />
        <h3 className="font-display text-xl">Delivery</h3>
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        FREE delivery in <span className="text-foreground font-medium">{FREE_DELIVERY_AREAS.join(", ")}</span>.
      </div>

      <Label htmlFor="area" className="text-xs uppercase tracking-wider text-muted-foreground">Your area</Label>
      <Select value={area} onValueChange={handle}>
        <SelectTrigger id="area" className="mt-1.5">
          <SelectValue placeholder="Select your delivery area" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {ALL_NAIROBI_AREAS.map((a) => (
            <SelectItem key={a} value={a}>{a}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {area && (
        <div className="mt-4 animate-fade-in">
          {free ? (
            <div className="flex items-start gap-2 bg-whatsapp/10 border border-whatsapp/30 rounded-sm p-3">
              <CheckCircle2 className="w-5 h-5 text-whatsapp shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-foreground">FREE Delivery to {area}</div>
                <div className="text-xs text-muted-foreground">Delivered within 2–4 days.</div>
              </div>
            </div>
          ) : outside ? (
            <div className="bg-secondary p-3 rounded-sm text-sm text-secondary-foreground">
              <div className="font-medium">Delivery available outside Nairobi</div>
              <div className="text-xs text-muted-foreground mt-1">{OUTSIDE_NAIROBI_NOTE}. Confirm via WhatsApp.</div>
            </div>
          ) : (
            <div className="bg-secondary p-3 rounded-sm text-sm text-secondary-foreground">
              <div className="font-medium">Delivery to {area}: {formatKsh(DELIVERY_FEE_KSH)}</div>
              <div className="text-xs text-muted-foreground mt-1">Flat fee within Nairobi. Delivered within 2–4 days.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
