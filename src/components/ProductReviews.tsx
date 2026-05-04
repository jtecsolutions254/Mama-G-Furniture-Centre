import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  customer_name: string;
  user_id: string;
  created_at: string;
};

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    setReviews((data ?? []) as Review[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id ?? null;
      setUserId(uid);
      if (uid) {
        const { data: p } = await supabase.from("profiles").select("full_name").eq("user_id", uid).maybeSingle();
        if (p?.full_name) setName(p.full_name);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const myReview = userId ? reviews.find((r) => r.user_id === userId) : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    const r = reviewSchema.safeParse({ rating, comment });
    if (!r.success) { toast.error("Please pick a rating (1–5 stars)."); return; }
    if (!name.trim()) { toast.error("Please enter your name."); return; }
    setSubmitting(true);
    try {
      const payload = {
        product_id: productId,
        user_id: userId,
        customer_name: name.trim().slice(0, 100),
        rating,
        comment: comment.trim() || null,
      };
      const { error } = await supabase.from("reviews").upsert(payload, { onConflict: "product_id,user_id" });
      if (error) throw error;
      toast.success(myReview ? "Review updated" : "Thank you for your review!");
      setComment(""); setRating(0);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="container py-12 md:py-16 border-t border-border">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-accent">Customer Reviews</span>
          <h2 className="font-display text-3xl md:text-4xl mt-2">What customers say</h2>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <Stars value={avg} />
            <span className="text-sm text-muted-foreground">
              {avg.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="bg-card border border-border p-5 rounded-sm">
          <h3 className="font-display text-xl mb-3">{myReview ? "Update your review" : "Write a review"}</h3>
          {!userId ? (
            <p className="text-sm text-muted-foreground">
              <Link to={`/auth?redirect=${encodeURIComponent(window.location.pathname)}`} className="text-primary underline">Sign in</Link> to leave a review.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Your name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-input rounded-sm px-3 py-2 text-sm"
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(n)}
                      className="p-1"
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hover || rating) >= n ? "fill-highlight text-highlight" : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Comment</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Share your experience…"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-sm hover:bg-accent transition-smooth disabled:opacity-50"
              >
                {submitting ? "Saving…" : myReview ? "Update review" : "Submit review"}
              </button>
            </form>
          )}
        </div>

        <div className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading reviews…</p>
          ) : reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reviews yet — be the first!</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="border-l-2 border-accent pl-4 py-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{r.customer_name}</span>
                  <Stars value={r.rating} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                {r.comment && <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed">{r.comment}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export function Stars({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <div className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${cls} ${n <= Math.round(value) ? "fill-highlight text-highlight" : "text-muted-foreground/40"}`}
        />
      ))}
    </div>
  );
}
