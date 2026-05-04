import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, User, Package, LogOut } from "lucide-react";
import { BUSINESS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/shop?category=sofas", label: "Sofas" },
  { to: "/shop?category=tables", label: "Tables" },
  { to: "/track", label: "Track Order" },
  { to: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname, location.search]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-40 transition-smooth",
        scrolled || open
          ? "bg-background/95 backdrop-blur border-b border-border shadow-sm"
          : "bg-background/40 backdrop-blur-sm"
      )}
    >
      <div className="container flex items-center justify-between h-14 sm:h-16 lg:h-20 gap-3">
        <Link to="/" className="flex items-center gap-2 min-w-0 shrink">
          <span className="font-display text-base sm:text-lg lg:text-2xl text-primary leading-tight truncate max-w-[180px] sm:max-w-none">
            {BUSINESS.name}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-5 xl:gap-8">
          {links.map((l) => (
            <NavLink
              key={l.to + l.label}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cn(
                  "text-xs xl:text-sm tracking-wide uppercase whitespace-nowrap transition-colors hover:text-primary",
                  isActive ? "text-primary" : "text-foreground/70"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          {session ? (
            <>
              <Link to="/account" className="inline-flex items-center gap-1 text-xs uppercase tracking-wide px-3 py-2 hover:text-primary">
                <User className="w-4 h-4" /> Account
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="inline-flex items-center gap-1 text-xs uppercase tracking-wide px-3 py-2 text-foreground/70 hover:text-primary"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link to="/auth" className="inline-flex items-center gap-1 text-xs uppercase tracking-wide bg-primary text-primary-foreground px-4 py-2 rounded-sm hover:bg-accent transition-smooth">
              <User className="w-4 h-4" /> Sign in
            </Link>
          )}
        </div>

        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          className="lg:hidden p-2 -mr-2 text-foreground"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-border bg-background animate-fade-in max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="container py-4 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to + l.label}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "py-3 px-2 text-base uppercase tracking-wide border-b border-border/50",
                    isActive ? "text-primary" : "text-foreground/80"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              {session ? (
                <>
                  <Link to="/account" className="inline-flex items-center gap-2 py-3 px-2 text-base">
                    <User className="w-5 h-5" /> My Account
                  </Link>
                  <Link to="/account?tab=orders" className="inline-flex items-center gap-2 py-3 px-2 text-base">
                    <Package className="w-5 h-5" /> My Orders
                  </Link>
                  <button
                    onClick={() => supabase.auth.signOut()}
                    className="inline-flex items-center gap-2 py-3 px-2 text-base text-foreground/70 text-left"
                  >
                    <LogOut className="w-5 h-5" /> Sign out
                  </button>
                </>
              ) : (
                <Link to="/auth" className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-sm">
                  <User className="w-5 h-5" /> Sign in / Create account
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
