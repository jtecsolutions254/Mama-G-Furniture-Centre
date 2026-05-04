import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BUSINESS, formatKsh, whatsappNumberLink } from "@/lib/constants";
import { toast } from "sonner";
import { MessageCircle, Package, X, Send } from "lucide-react";

type Order = {
  id: string; tracking_code: string; customer_name: string; customer_phone: string;
  customer_whatsapp: string | null; product_name: string; product_price_ksh: number;
  quantity: number; delivery_area: string; delivery_details: string | null;
  delivery_fee_ksh: number; total_ksh: number; status: string;
  admin_notes: string | null; estimated_delivery: string | null; created_at: string;
};

const STATUS_OPTIONS = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"] as const;

const STATUS_MESSAGE: Record<string, (o: Order) => string> = {
  confirmed: (o) => `Hi ${o.customer_name}, your order *${o.tracking_code}* (${o.product_name}) is *confirmed*. Total ${formatKsh(o.total_ksh)}. We'll notify you when it ships. Track: ${origin()}/track?code=${o.tracking_code}`,
  preparing: (o) => `Hi ${o.customer_name}, we're preparing your order *${o.tracking_code}* (${o.product_name}). It'll be ready for delivery soon!`,
  out_for_delivery: (o) => `Hi ${o.customer_name}, your order *${o.tracking_code}* is *out for delivery* to ${o.delivery_area}. Our team will call you on arrival.`,
  delivered: (o) => `Hi ${o.customer_name}, your order *${o.tracking_code}* has been *delivered*. Thank you for shopping with ${BUSINESS.name}! 🛋️ Please consider leaving a review.`,
  cancelled: (o) => `Hi ${o.customer_name}, your order *${o.tracking_code}* has been cancelled. ${o.admin_notes ? "Reason: " + o.admin_notes : ""}`,
  pending: (o) => `Hi ${o.customer_name}, we received your order *${o.tracking_code}*. We'll confirm shortly.`,
};

function origin() {
  return typeof window !== "undefined" ? window.location.origin : "";
}

export default function AdminOrders() {
  const [rows, setRows] = useState<Order[]>([]);
  const [editing, setEditing] = useState<Order | null>(null);
  const [statusDraft, setStatusDraft] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [eta, setEta] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    setRows((data ?? []) as Order[]);
  }
  useEffect(() => { load(); }, []);

  function openEdit(o: Order) {
    setEditing(o);
    setStatusDraft(o.status);
    setNotes(o.admin_notes || "");
    setEta(o.estimated_delivery || "");
    setMessage(STATUS_MESSAGE[o.status]?.(o) || "");
  }

  function statusChange(s: string) {
    setStatusDraft(s);
    if (editing) setMessage(STATUS_MESSAGE[s]?.({ ...editing, status: s, admin_notes: notes }) || "");
  }

  async function save() {
    if (!editing) return;
    try {
      const status = statusDraft as Order["status"];
      const { error } = await supabase.from("orders").update({
        status: status as never,
        admin_notes: notes || null,
        estimated_delivery: eta || null,
      }).eq("id", editing.id);
      if (error) throw error;
      // log status update
      if (statusDraft !== editing.status || message.trim()) {
        await supabase.from("order_status_updates").insert({
          order_id: editing.id,
          status: status as never,
          message: message || null,
        });
      }
      toast.success("Order updated");
      setEditing(null);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function waLink(o: Order) {
    const phone = o.customer_whatsapp || o.customer_phone;
    return whatsappNumberLink(phone, message || STATUS_MESSAGE[statusDraft]?.(o) || "");
  }

  return (
    <div>
      <div className="border border-border rounded-sm overflow-x-auto bg-card">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="p-3">Tracking</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Item</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3 font-mono text-xs">{r.tracking_code}</td>
                <td className="p-3">
                  <div className="font-medium">{r.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{r.customer_phone} · {r.delivery_area}</div>
                </td>
                <td className="p-3">{r.product_name} <span className="text-muted-foreground">× {r.quantity}</span></td>
                <td className="p-3">{formatKsh(r.total_ksh)}</td>
                <td className="p-3 capitalize">{r.status.replace(/_/g, " ")}</td>
                <td className="p-3 text-right">
                  <button onClick={() => openEdit(r)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-sm text-xs">Update</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground"><Package className="w-8 h-8 mx-auto mb-2" />No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm overflow-y-auto" onClick={() => setEditing(null)}>
          <div className="container max-w-2xl my-10 bg-card rounded-sm border border-border p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-display text-2xl">Order {editing.tracking_code}</h2>
                <p className="text-sm text-muted-foreground">{editing.customer_name} · {editing.customer_phone}</p>
              </div>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5" /></button>
            </div>

            <div className="bg-secondary p-3 rounded-sm text-sm space-y-1 mb-4">
              <div><strong>{editing.product_name}</strong> × {editing.quantity} — {formatKsh(editing.total_ksh)}</div>
              <div className="text-muted-foreground">Delivery: {editing.delivery_area}{editing.delivery_details ? ` — ${editing.delivery_details}` : ""}</div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={statusDraft} onValueChange={statusChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estimated delivery</Label>
                <Input type="date" value={eta} onChange={(e) => setEta(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label>Internal / customer notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Driver arriving 2pm" />
              </div>
              <div className="sm:col-span-2">
                <Label>WhatsApp message to customer</Label>
                <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} />
                <p className="text-xs text-muted-foreground mt-1">Auto-filled from status. Edit before sending.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-6 justify-end">
              <button onClick={() => setEditing(null)} className="px-4 py-2.5 border border-border rounded-sm">Cancel</button>
              <a href={waLink(editing)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-4 py-2.5 bg-whatsapp text-whatsapp-foreground rounded-sm">
                <MessageCircle className="w-4 h-4" /> Send via WhatsApp
              </a>
              <button onClick={save} className="inline-flex items-center gap-1 px-5 py-2.5 bg-primary text-primary-foreground rounded-sm">
                <Send className="w-4 h-4" /> Save & log update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
