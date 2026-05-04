import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
});
const signupSchema = loginSchema.extend({
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
});

export default function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(params.get("mode") === "signup" ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<unknown>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const redirect = params.get("redirect") || "/account";
  if (!checking && session && mode === "login") return <Navigate to={redirect} replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const r = loginSchema.safeParse({ email, password });
        if (!r.success) { toast.error(r.error.issues[0].message); return; }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate(redirect);
      } else {
        const r = signupSchema.safeParse({ email, password, full_name: fullName, phone });
        if (!r.success) { toast.error(r.error.issues[0].message); return; }
        const redirectUrl = `${window.location.origin}/auth?mode=login`;
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { full_name: fullName, phone },
          },
        });
        if (error) throw error;
        // Sign user out so they must explicitly sign in
        await supabase.auth.signOut();
        toast.success("Account created! Please sign in to continue.");
        setMode("login");
        setPassword("");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container pt-28 sm:pt-32 pb-20 max-w-md">
        <h1 className="font-display text-3xl sm:text-4xl mb-2">
          {mode === "login" ? "Sign in" : "Create your account"}
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          {mode === "login"
            ? "Sign in to view orders and track deliveries."
            : "Save delivery addresses & track all your orders."}
        </p>

        <form onSubmit={submit} className="space-y-4 bg-card border border-border p-6 rounded-sm">
          {mode === "signup" && (
            <>
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} />
              </div>
              <div>
                <Label htmlFor="phone">Phone (WhatsApp)</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+254 7XX XXX XXX" />
              </div>
            </>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-sm hover:bg-accent hover:text-accent-foreground transition-smooth disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="w-full text-sm text-muted-foreground hover:text-primary"
          >
            {mode === "login" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          <Link to="/track" className="underline">Track an order without an account</Link>
        </p>
      </div>
    </div>
  );
}
