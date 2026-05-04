import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_NAIROBI_AREAS, BUSINESS, formatKsh, isFreeDelivery, whatsappLink } from "@/lib/constants";
import { toast } from "sonner";
import { Plus, Trash2, MapPin, Package, MessageCircle, User, LogOut } from "lucide-react";
import { z } from "zod";

type Profile = { id: string; full_name: string | null; phone: string | null; whatsapp: string | null };
type Address = { id: string; label: string; area: string; details: string | null; is_default: boolean };
type Order = {
  id: string; tracking_code: string; product_name: string; product_price_ksh: number;
  total_ksh: number; status: string; delivery_area: string; created_at: string; quantity: number;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  whatsapp: z.string().trim().max(20).optional(),
});

export default function Account() {
  const [params] = useSearchParams();
  const [session, setSession] = useState<unknown>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<"profile" | "addresses" | "orders">(
    (params.get("tab") as "profile" | "addresses" | "orders") || "profile"
  );
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [newAddr, setNewAddr] = useState<{ label: string; area: string; details: string }>({
    label: "Home", area: "", details: "",
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadAll(uid: string) {
    const [p, a, o] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("delivery_addresses").select("*").eq("user_id", uid).order("is_default", { ascending: false }),
      supabase.from("orders").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
    ]);
    setProfile((p.data as Profile) ?? null);
    setAddresses((a.data ?? []) as Address[]);
    setOrders((o.data ?? []) as Order[]);
  }

  useEffect(() => {
    const s = session as { user?: { id: string } } | null;
    if (s?.user?.id) loadAll(s.user.id);
  }, [session]);

  if (checking) return <div className="min-h-screen bg-background"><SiteHeader /><div className="container pt-32">Loading…</div></div>;
  if (!session) return <Navigate to="/auth?redirect=/account" replace />;
  const uid = (session as { user: { id: string } }).user.id;

  async function saveProfile() {
    if (!profile) return;
    const r = profileSchema.safeParse(profile);
    if (!r.success) { toast.error(r.error.issues[0].message); return; }
    const { error } = await supabase.from("profiles").update({
      full_name: r.data.full_name,
      phone: r.data.phone,
      whatsapp: r.data.whatsapp || null,
    }).eq("user_id", uid);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
  }

  async function addAddress() {
    if (!newAddr.area) { toast.error("Select an area"); return; }
    const { error } = await supabase.from("delivery_addresses").insert({
      user_id: uid, label: newAddr.label.slice(0, 50), area: newAddr.area,
      details: newAddr.details.slice(0, 500) || null,
      is_default: addresses.length === 0,
    });
    if (error) { toast.error(error.message); return; }
    setNewAddr({ label: "Home", area: "", details: "" });
    loadAll(uid);
  }

  async function deleteAddress(id: string) {
    await supabase.from("delivery_addresses").delete().eq("id", id);
    loadAll(uid);
  }

  async function setDefault(id: string) {
    await supabase.from("delivery_addresses").update({ is_default: false }).eq("user_id", uid);
    await supabase.from("delivery_addresses").update({ is_default: true }).eq("id", id);
    loadAll(uid);
  }

  function reorderWhatsApp(o: Order) {
    return whatsappLink(`Hello ${BUSINESS.name}, I'd like to reorder *${o.product_name}* (Qty ${o.quantity}). My previous order: ${o.tracking_code}.`);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container pt-24 sm:pt-28 pb-20">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl">My Account</h1>
            <p className="text-sm text-muted-foreground mt-1">{profile?.full_name || "Welcome back"}</p>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="inline-flex items-center gap-1 text-sm px-3 py-2 border border-border rounded-sm hover:bg-secondary">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>

        <div className="border-b border-border mb-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {(["profile", "addresses", "orders"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm uppercase tracking-wider border-b-2 transition-colors ${
                  tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "profile" && <User className="w-4 h-4 inline mr-1.5" />}
                {t === "addresses" && <MapPin className="w-4 h-4 inline mr-1.5" />}
                {t === "orders" && <Package className="w-4 h-4 inline mr-1.5" />}
                {t}
              </button>
            ))}
          </div>
        </div>

        {tab === "profile" && profile && (
          <div className="max-w-lg space-y-4">
            <div>
              <Label>Full name</Label>
              <Input value={profile.full_name ?? ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>
            <div>
              <Label>WhatsApp (optional)</Label>
              <Input value={profile.whatsapp ?? ""} onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })} placeholder="+254..." />
            </div>
            <button onClick={saveProfile} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-sm hover:bg-accent transition-smooth">
              Save changes
            </button>
          </div>
        )}

        {tab === "addresses" && (
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
            <div className="bg-card border border-border p-5 rounded-sm">
              <h3 className="font-display text-xl mb-3">Add address</h3>
              <div className="space-y-3">
                <div>
                  <Label>Label</Label>
                  <Input value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })} placeholder="Home / Office" />
                </div>
                <div>
                  <Label>Area</Label>
                  <Select value={newAddr.area} onValueChange={(v) => setNewAddr({ ...newAddr, area: v })}>
                    <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {ALL_NAIROBI_AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Details (street, building, landmark)</Label>
                  <Textarea value={newAddr.details} onChange={(e) => setNewAddr({ ...newAddr, details: e.target.value })} rows={3} maxLength={500} />
                </div>
                <button onClick={addAddress} className="w-full inline-flex items-center justify-center gap-1 bg-primary text-primary-foreground py-2.5 rounded-sm">
                  <Plus className="w-4 h-4" /> Save address
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {addresses.length === 0 && <p className="text-muted-foreground text-sm">No saved addresses yet.</p>}
              {addresses.map((a) => (
                <div key={a.id} className="border border-border p-4 rounded-sm bg-card">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-medium">
                        {a.label} {a.is_default && <span className="text-xs text-accent uppercase ml-2">Default</span>}
                        {isFreeDelivery(a.area) && <span className="text-xs text-whatsapp uppercase ml-2">Free delivery</span>}
                      </div>
                      <div className="text-sm text-muted-foreground">{a.area}</div>
                      {a.details && <div className="text-sm mt-1 text-foreground/70">{a.details}</div>}
                    </div>
                    <button onClick={() => deleteAddress(a.id)} className="p-2 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  {!a.is_default && (
                    <button onClick={() => setDefault(a.id)} className="mt-2 text-xs text-primary underline">Set as default</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-3 max-w-3xl">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No orders yet.</p>
                <Link to="/shop" className="text-primary underline mt-3 inline-block">Browse products</Link>
              </div>
            ) : (
              orders.map((o) => (
                <div key={o.id} className="border border-border bg-card p-4 rounded-sm">
                  <div className="flex justify-between items-start flex-wrap gap-3">
                    <div>
                      <div className="font-medium">{o.product_name} <span className="text-muted-foreground text-sm">× {o.quantity}</span></div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("en-KE")} · {o.delivery_area} · #{o.tracking_code}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg">{formatKsh(o.total_ksh)}</div>
                      <span className={`text-xs uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                        o.status === "delivered" ? "bg-whatsapp/20 text-whatsapp" :
                        o.status === "cancelled" ? "bg-destructive/20 text-destructive" :
                        "bg-accent/20 text-accent"
                      }`}>{STATUS_LABEL[o.status]}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link to={`/track?code=${o.tracking_code}`} className="text-xs px-3 py-1.5 border border-border rounded-sm hover:bg-secondary">
                      Track order
                    </Link>
                    <a href={reorderWhatsApp(o)} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-whatsapp text-whatsapp-foreground rounded-sm inline-flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> Reorder via WhatsApp
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
