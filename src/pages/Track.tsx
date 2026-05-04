import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BUSINESS, formatKsh, whatsappLink } from "@/lib/constants";
import { Package, MessageCircle, Search, CheckCircle2, Truck, Box, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

type Order = {
  id: string;
  tracking_code: string;
  customer_name: string;
  product_name: string;
  product_price_ksh: number;
  quantity: number;
  delivery_area: string;
  delivery_details: string | null;
  delivery_fee_ksh: number;
  total_ksh: number;
  status: string;
  admin_notes: string | null;
  estimated_delivery: string | null;
  created_at: string;
};
type Update = { id: string; status: string; message: string | null; created_at: string };

const STEPS = [
  { key: "pending", label: "Order Received", Icon: Clock },
  { key: "confirmed", label: "Confirmed", Icon: CheckCircle2 },
  { key: "preparing", label: "Preparing", Icon: Box },
  { key: "out_for_delivery", label: "Out for Delivery", Icon: Truck },
  { key: "delivered", label: "Delivered", Icon: CheckCircle2 },
];

export default function Track() {
  const [params, setParams] = useSearchParams();
  const [code, setCode] = useState(params.get("code") || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function lookup(c: string) {
    if (!c.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const trimmed = c.trim().toUpperCase();
      const { data: o } = await supabase.from("orders").select("*").eq("tracking_code", trimmed).maybeSingle();
      if (!o) { setOrder(null); setUpdates([]); return; }
      setOrder(o as Order);
      const { data: u } = await supabase.from("order_status_updates")
        .select("*").eq("order_id", (o as Order).id).order("created_at", { ascending: true });
      setUpdates((u ?? []) as Update[]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.get("code")) lookup(params.get("code")!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setParams({ code: code.trim().toUpperCase() });
    lookup(code);
  }

  const cancelled = order?.status === "cancelled";
  const currentIdx = order ? STEPS.findIndex((s) => s.key === order.status) : -1;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container pt-24 sm:pt-28 pb-20">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-[0.3em] text-accent">Order Tracking</span>
          <h1 className="font-display text-3xl sm:text-4xl mt-2 mb-2">Track your order</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Enter your tracking code (e.g. <code className="text-foreground">MG-XXXXXXXX</code>) sent to you via WhatsApp.
          </p>

          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 mb-10">
            <div className="flex-1">
              <Label htmlFor="code" className="sr-only">Tracking code</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="MG-XXXXXXXX" className="uppercase" />
            </div>
            <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-sm hover:bg-accent transition-smooth disabled:opacity-50">
              <Search className="w-4 h-4" /> Track
            </button>
          </form>

          {searched && !loading && !order && (
            <div className="bg-card border border-border p-6 rounded-sm text-center">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No order found with code <strong>{code}</strong>.</p>
              <p className="text-xs text-muted-foreground mt-2">Check the code or contact us on WhatsApp.</p>
            </div>
          )}

          {order && (
            <div className="space-y-6">
              <div className="bg-card border border-border p-5 rounded-sm">
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Tracking #</div>
                    <div className="font-display text-2xl">{order.tracking_code}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Total</div>
                    <div className="font-display text-2xl text-primary">{formatKsh(order.total_ksh)}</div>
                  </div>
                </div>
                <div className="border-t border-border mt-4 pt-4 grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Item</div>
                    <div>{order.product_name} × {order.quantity}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Delivery to</div>
                    <div>{order.delivery_area}</div>
                  </div>
                  {order.estimated_delivery && (
                    <div>
                      <div className="text-muted-foreground">Estimated delivery</div>
                      <div>{new Date(order.estimated_delivery).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" })}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-muted-foreground">Ordered</div>
                    <div>{new Date(order.created_at).toLocaleDateString("en-KE")}</div>
                  </div>
                </div>
              </div>

              {/* Progress */}
              {cancelled ? (
                <div className="bg-destructive/10 border border-destructive/30 rounded-sm p-5 flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-destructive shrink-0" />
                  <div>
                    <div className="font-medium">Order cancelled</div>
                    {order.admin_notes && <div className="text-sm text-muted-foreground mt-1">{order.admin_notes}</div>}
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border p-5 rounded-sm">
                  <ol className="space-y-4">
                    {STEPS.map((s, i) => {
                      const done = i <= currentIdx;
                      const active = i === currentIdx;
                      return (
                        <li key={s.key} className="flex items-start gap-3">
                          <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${
                            done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          } ${active ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}`}>
                            <s.Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 pt-1.5">
                            <div className={`font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</div>
                            {active && order.admin_notes && (
                              <div className="text-sm text-muted-foreground mt-0.5">{order.admin_notes}</div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              {/* Update history */}
              {updates.length > 0 && (
                <div className="bg-card border border-border p-5 rounded-sm">
                  <h3 className="font-display text-lg mb-3">Update history</h3>
                  <ul className="space-y-3 text-sm">
                    {updates.map((u) => (
                      <li key={u.id} className="border-l-2 border-accent pl-3">
                        <div className="font-medium capitalize">{u.status.replace(/_/g, " ")}</div>
                        {u.message && <div className="text-muted-foreground">{u.message}</div>}
                        <div className="text-xs text-muted-foreground/70 mt-0.5">
                          {new Date(u.created_at).toLocaleString("en-KE")}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <a
                href={whatsappLink(`Hello ${BUSINESS.name}, I have a question about my order ${order.tracking_code}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-whatsapp text-whatsapp-foreground py-3 rounded-sm hover:opacity-90 transition-smooth"
              >
                <MessageCircle className="w-5 h-5" /> Ask about this order
              </a>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
