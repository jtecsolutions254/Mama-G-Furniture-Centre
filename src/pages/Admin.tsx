import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, LogOut, Upload, X, Package, ShoppingBag } from "lucide-react";
import { formatKsh } from "@/lib/constants";
import AdminOrders from "@/components/AdminOrders";

type Row = {
  id: string;
  slug: string;
  name: string;
  category: "sofas" | "tables";
  short_description: string;
  description: string;
  price_ksh: number;
  size: string | null;
  dimensions: string | null;
  materials: string | null;
  images: string[];
  featured: boolean;
};

const productSchema = z.object({
  name: z.string().trim().min(2).max(150),
  slug: z.string().trim().min(2).max(150).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, hyphens"),
  category: z.enum(["sofas", "tables"]),
  short_description: z.string().trim().max(300),
  description: z.string().trim().max(3000),
  price_ksh: z.coerce.number().int().min(0).max(10_000_000),
  size: z.string().trim().max(100).optional(),
  dimensions: z.string().trim().max(200).optional(),
  materials: z.string().trim().max(500).optional(),
  featured: z.boolean(),
});

const empty: Partial<Row> = {
  name: "", slug: "", category: "sofas",
  short_description: "", description: "", price_ksh: 0,
  size: "", dimensions: "", materials: "", images: [], featured: false,
};

export default function Admin() {
  const [session, setSession] = useState<unknown>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Partial<Row> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        setIsAdmin(!!roleData);
      } else {
        setIsAdmin(false);
      }
      setChecking(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function load() {
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    setRows((data ?? []) as Row[]);
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (checking) return <div className="min-h-screen bg-background"><SiteHeader /><div className="container pt-32">Loading…</div></div>;
  if (!session) return <Navigate to="/auth" replace />;
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container pt-32 max-w-xl">
          <h1 className="font-display text-3xl mb-3">Access denied</h1>
          <p className="text-muted-foreground">
            Your account does not have admin access. To grant admin access to this user, run the following in your backend SQL editor:
          </p>
          <pre className="mt-4 p-4 bg-secondary text-xs overflow-auto rounded-sm">
{`INSERT INTO public.user_roles (user_id, role)
VALUES ('${(session as { user: { id: string } } | null)?.user?.id ?? "USER_ID"}', 'admin');`}
          </pre>
          <button onClick={() => supabase.auth.signOut()} className="mt-6 underline text-primary">Sign out</button>
        </div>
      </div>
    );
  }

  async function handleUpload(file: File): Promise<string | null> {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      return data.publicUrl;
    } catch (err) {
      toast.error((err as Error).message);
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function onFiles(files: FileList | null) {
    if (!files || !editing) return;
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      const u = await handleUpload(f);
      if (u) urls.push(u);
    }
    setEditing({ ...editing, images: [...(editing.images ?? []), ...urls] });
  }

  function removeImage(i: number) {
    if (!editing) return;
    setEditing({ ...editing, images: (editing.images ?? []).filter((_, idx) => idx !== i) });
  }

  async function save() {
    if (!editing) return;
    const r = productSchema.safeParse(editing);
    if (!r.success) { toast.error(r.error.issues[0].message); return; }
    setSaving(true);
    try {
      const payload = {
        name: r.data.name,
        slug: r.data.slug,
        category: r.data.category,
        short_description: r.data.short_description,
        description: r.data.description,
        price_ksh: r.data.price_ksh,
        featured: r.data.featured,
        size: r.data.size || null,
        dimensions: r.data.dimensions || null,
        materials: r.data.materials || null,
        images: editing.images ?? [],
      };
      if (editing.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Product updated");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        toast.success("Product added");
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    load();
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container pt-28 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your products and inventory.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary px-3 py-2">View site</Link>
            <button onClick={() => supabase.auth.signOut()} className="inline-flex items-center gap-1 text-sm px-3 py-2 border border-border rounded-sm hover:bg-secondary">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>

        <div className="border-b border-border mb-6 flex gap-1">
          <button
            onClick={() => setTab("products")}
            className={`px-4 py-3 text-sm uppercase tracking-wider border-b-2 transition-colors ${tab === "products" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <ShoppingBag className="w-4 h-4 inline mr-1.5" /> Products
          </button>
          <button
            onClick={() => setTab("orders")}
            className={`px-4 py-3 text-sm uppercase tracking-wider border-b-2 transition-colors ${tab === "orders" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Package className="w-4 h-4 inline mr-1.5" /> Orders
          </button>
        </div>

        {tab === "orders" ? (
          <AdminOrders />
        ) : (
          <>
            <button onClick={() => setEditing({ ...empty })} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-sm hover:bg-accent hover:text-accent-foreground transition-smooth mb-6">
              <Plus className="w-4 h-4" /> Add product
            </button>

            <div className="border border-border rounded-sm overflow-x-auto bg-card">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-left">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Featured</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="p-3 font-medium">{r.name}</td>
                      <td className="p-3 capitalize text-muted-foreground">{r.category}</td>
                      <td className="p-3">{formatKsh(r.price_ksh)}</td>
                      <td className="p-3">{r.featured ? "✓" : "—"}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => setEditing(r)} className="p-2 hover:text-primary"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => remove(r.id)} className="p-2 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No products yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Editor Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm overflow-y-auto" onClick={() => setEditing(null)}>
          <div className="container max-w-2xl my-10 bg-card rounded-sm border border-border p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl">{editing.id ? "Edit product" : "New product"}</h2>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Name</Label>
                <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })} />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v as "sofas" | "tables" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sofas">Sofas</SelectItem>
                    <SelectItem value="tables">Tables</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price (Ksh)</Label>
                <Input type="number" value={editing.price_ksh ?? 0} onChange={(e) => setEditing({ ...editing, price_ksh: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Size</Label>
                <Input value={editing.size ?? ""} onChange={(e) => setEditing({ ...editing, size: e.target.value })} placeholder="e.g. 3-seater" />
              </div>
              <div className="md:col-span-2">
                <Label>Short description</Label>
                <Input value={editing.short_description ?? ""} onChange={(e) => setEditing({ ...editing, short_description: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Full description</Label>
                <Textarea rows={4} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div>
                <Label>Dimensions</Label>
                <Input value={editing.dimensions ?? ""} onChange={(e) => setEditing({ ...editing, dimensions: e.target.value })} />
              </div>
              <div>
                <Label>Materials</Label>
                <Input value={editing.materials ?? ""} onChange={(e) => setEditing({ ...editing, materials: e.target.value })} />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input id="feat" type="checkbox" checked={!!editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} />
                <Label htmlFor="feat">Featured on homepage</Label>
              </div>

              <div className="md:col-span-2">
                <Label>Images</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                  {(editing.images ?? []).map((src, i) => (
                    <div key={i} className="relative aspect-square bg-muted rounded-sm overflow-hidden group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-background/90 rounded-full p-1 opacity-0 group-hover:opacity-100">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-secondary text-muted-foreground text-xs">
                    <Upload className="w-5 h-5 mb-1" />
                    {uploading ? "Uploading…" : "Upload"}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-8">
              <button onClick={() => setEditing(null)} className="px-4 py-2.5 border border-border rounded-sm">Cancel</button>
              <button onClick={save} disabled={saving || uploading} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-sm hover:bg-accent hover:text-accent-foreground transition-smooth disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
