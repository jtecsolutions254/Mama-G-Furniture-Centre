import { useEffect, useState } from "react";
import { Link, Navigate, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ALL_NAIROBI_AREAS, BUSINESS, DELIVERY_FEE_KSH, formatKsh,
  isFreeDelivery, whatsappLink,
} from "@/lib/constants";
import { useProduct, resolveImage } from "@/hooks/useProducts";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

type Address = { id: string; label: string; area: string; details: string | null; is_default: boolean };

const schema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  customer_phone: z.string().trim().min(7).max(20),
  customer_whatsapp: z.string().trim().max(20).optional(),
  delivery_area: z.string().min(1, "Select a delivery area"),
  delivery_details: z.string().trim().max(500).optional(),
  quantity: z.number().int().min(1).max(20),
});

export default function Checkout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { product, loading } = useProduct(slug);
  const [session, setSession] = useState<unknown>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState({
    customer_name: "", customer_phone: "", customer_whatsapp: "",
    delivery_area: "", delivery_details: "", quantity: 1,
  });
  const [selectedAddrId, setSelectedAddrId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ tracking: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      const uid = data.session?.user.id;
      if (uid) {
        const { data: p } = await supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle();
        const { data: a } = await supabase.from("delivery_addresses").select("*").eq("user_id", uid).order("is_default", { ascending: false });
        setForm((f) => ({
          ...f,
          customer_name: p?.full_name || "",
          customer_phone: p?.phone || "",
          customer_whatsapp: p?.whatsapp || p?.phone || "",
        }));
        const list = (a ?? []) as Address[];
        setAddresses(list);
        const def = list.find((x) => x.is_default) || list[0];
        if (def) {
          setSelectedAddrId(def.id);
          setForm((f) => ({ ...f, delivery_area: def.area, delivery_details: def.details || "" }));
        }
      }
    });
  }, []);

  if (loading) return <div className="min-h-screen bg-background"><SiteHeader /><div className="container pt-32">Loading…</div></div>;
  if (!product) return <Navigate to="/shop" replace />;

  const free = form.delivery_area && isFreeDelivery(form.delivery_area);
  const fee = !form.delivery_area || free || form.delivery_area === "Outside Nairobi" ? 0 : DELIVERY_FEE_KSH;
  const subtotal = product.price_ksh * form.quantity;
  const total = subtotal + fee;

  function pickAddress(id: string) {
    setSelectedAddrId(id);
    const a = addresses.find((x) => x.id === id);
    if (a) setForm((f) => ({ ...f, delivery_area: a.area, delivery_details: a.details || "" }));
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) { toast.error(r.error.issues[0].message); return; }
    setSubmitting(true);
    try {
      const uid = (session as { user?: { id: string } } | null)?.user?.id ?? null;
      const payload = {
        user_id: uid,
        customer_name: r.data.customer_name,
        customer_phone: r.data.customer_phone,
        customer_whatsapp: r.data.customer_whatsapp || null,
        product_id: product.id.length === 36 ? product.id : null,
        product_name: product.name,
        product_price_ksh: product.price_ksh,
        quantity: r.data.quantity,
        delivery_area: r.data.delivery_area,
        delivery_details: r.data.delivery_details || null,
        delivery_fee_ksh: fee,
        total_ksh: total,
      };
      const { data, error } = await supabase.from("orders").insert(payload).select("tracking_code").single();
      if (error) throw error;
      setSuccess({ tracking: data!.tracking_code });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    const msg = `Hello ${BUSINESS.name}! I just placed order *${success.tracking}* — *${product.name}* × ${form.quantity}. Total: ${formatKsh(total)}. Delivery to ${form.delivery_area}.`;
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container pt-28 pb-20 max-w-xl text-center">
          <CheckCircle2 className="w-16 h-16 text-whatsapp mx-auto mb-4" />
          <h1 className="font-display text-3xl sm:text-4xl">Order placed!</h1>
          <p className="text-muted-foreground mt-2">
            Your tracking code is <strong className="text-foreground">{success.tracking}</strong>.
            We'll confirm with you shortly on WhatsApp.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={whatsappLink(msg)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-whatsapp text-whatsapp-foreground px-6 py-3 rounded-sm"
            >
              <MessageCircle className="w-5 h-5" /> Confirm on WhatsApp
            </a>
            <Link to={`/track?code=${success.tracking}`} className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-sm">
              Track order
            </Link>
          </div>
          <button onClick={() => navigate("/shop")} className="mt-6 text-sm text-muted-foreground underline">Continue shopping</button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container pt-24 sm:pt-28 pb-20 max-w-3xl">
        <h1 className="font-display text-3xl sm:text-4xl mb-2">Place your order</h1>
        <p className="text-muted-foreground text-sm mb-8">
          We'll confirm and arrange delivery via WhatsApp. Pay on delivery (M-Pesa or cash).
        </p>

        <div className="grid md:grid-cols-[1fr_320px] gap-8">
          <form onSubmit={placeOrder} className="space-y-4">
            {!session && (
              <p className="text-xs text-muted-foreground">
                <Link to={`/auth?redirect=/checkout/${slug}`} className="text-primary underline">Sign in</Link> to use saved addresses.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Full name</Label>
                <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} required />
              </div>
              <div className="sm:col-span-2">
                <Label>WhatsApp (if different)</Label>
                <Input value={form.customer_whatsapp} onChange={(e) => setForm({ ...form, customer_whatsapp: e.target.value })} placeholder="+254..." />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" min={1} max={20} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Math.max(1, Number(e.target.value)) })} />
              </div>
            </div>

            {addresses.length > 0 && (
              <div>
                <Label>Saved address</Label>
                <Select value={selectedAddrId} onValueChange={pickAddress}>
                  <SelectTrigger><SelectValue placeholder="Choose saved" /></SelectTrigger>
                  <SelectContent>
                    {addresses.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.label} — {a.area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Delivery area</Label>
              <Select value={form.delivery_area} onValueChange={(v) => setForm({ ...form, delivery_area: v })}>
                <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {ALL_NAIROBI_AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Delivery details (street, building, landmark)</Label>
              <Textarea rows={3} maxLength={500} value={form.delivery_details} onChange={(e) => setForm({ ...form, delivery_details: e.target.value })} />
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground py-3 rounded-sm hover:bg-accent transition-smooth disabled:opacity-50">
              {submitting ? "Placing order…" : `Place order · ${formatKsh(total)}`}
            </button>
          </form>

          <aside className="bg-card border border-border p-5 rounded-sm h-fit md:sticky md:top-24">
            <div className="flex gap-3 items-start">
              <img src={resolveImage(product.images[0] || "")} alt="" className="w-20 h-20 object-cover rounded-sm" />
              <div>
                <div className="font-medium leading-tight">{product.name}</div>
                <div className="text-sm text-muted-foreground">{product.size}</div>
                <div className="font-display text-lg text-primary mt-1">{formatKsh(product.price_ksh)}</div>
              </div>
            </div>
            <div className="border-t border-border mt-4 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatKsh(subtotal)}</span></div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>{form.delivery_area === "Outside Nairobi" ? "TBD" : free ? <span className="text-whatsapp">FREE</span> : formatKsh(fee)}</span>
              </div>
              <div className="flex justify-between font-display text-lg pt-2 border-t border-border mt-2">
                <span>Total</span><span className="text-primary">{formatKsh(total)}</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
