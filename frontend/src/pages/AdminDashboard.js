import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stamp, LogOut, Copy, Check, X, Star, Package, MessageSquare, Bookmark, Info,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import SEO from "@/components/SEO";
import { buildBookmarklet } from "@/lib/bookmarklet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import StarRating from "@/components/StarRating";
import { toast } from "sonner";

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

const FIELD_LABELS = {
  purchased_by: "Purchased By", description_of_document: "Description of Document",
  consideration_price: "Consideration Price", first_party_name: "First Party Name",
  first_party_address1: "First Party Address 1", first_party_address2: "First Party Address 2",
  first_party_address3: "First Party Address 3", first_party_pin: "First Party Pin Code",
  first_party_pan: "First Party PAN", second_party_name: "Second Party Name",
  second_party_address1: "Second Party Address 1", second_party_address2: "Second Party Address 2",
  second_party_address3: "Second Party Address 3", second_party_pin: "Second Party Pin Code",
  second_party_pan: "Second Party PAN", stamp_duty_amount: "Stamp Duty Amount",
  stamp_duty_paid_by: "Stamp Duty Paid By", gender: "Gender",
  proof_of_identity: "Proof of Identity", proof_of_residence: "Proof of Residence",
  mode_of_payment: "Mode of Payment", first_party_mobile: "First Party Mobile",
  first_party_email: "First Party Email", second_party_mobile: "Second Party Mobile",
  second_party_email: "Second Party Email",
};

function BookmarkletLink({ order }) {
  const ref = useRef(null);
  const href = buildBookmarklet(order);
  useEffect(() => {
    if (ref.current) ref.current.setAttribute("href", href);
  }, [href]);
  return (
    <a
      ref={ref}
      data-testid={`bookmarklet-link-${order.id}`}
      className="inline-flex cursor-move items-center gap-2 rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-amber-300"
      onClick={(e) => e.preventDefault()}
      title="Drag me to your bookmarks bar"
    >
      <Bookmark className="h-4 w-4" /> SHCIL Autofill
    </a>
  );
}

function OrderDetailDialog({ order, children }) {
  const [copied, setCopied] = useState(false);
  const href = buildBookmarklet(order);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      toast.success("Bookmarklet code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toast.error("Copy failed. Please copy manually.");
    }
  };
  const d = order.data || {};
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto" data-testid={`order-detail-${order.id}`}>
        <DialogHeader>
          <DialogTitle className="font-head">Order Details</DialogTitle>
          <DialogDescription>
            {order.customer_name} · {order.customer_mobile} · {order.status === "submitted" ? `Submitted ${fmtDate(order.submitted_at)}` : "Draft"}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Autofill Bookmarklet for shcilestamp.com</p>
              <p className="mt-1 text-xs text-amber-700">
                Drag the button to your browser's bookmarks bar, open the shcilestamp.com e-stamping form,
                then click the saved bookmark to auto-fill the fields.
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <BookmarkletLink order={order} />
            <Button variant="outline" size="sm" onClick={copy} data-testid={`copy-bookmarklet-${order.id}`} className="gap-2 border-slate-300">
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy Code"}
            </Button>
          </div>
        </div>

        <div className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {Object.keys(FIELD_LABELS).map((k) => (
            <div key={k} className="flex flex-col border-b border-slate-100 py-1.5">
              <span className="text-xs text-slate-400">{FIELD_LABELS[k]}</span>
              <span className="text-sm font-medium text-slate-900">{d[k] ? d[k] : "—"}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);

  const loadOrders = async () => {
    const { data } = await api.get("/admin/orders");
    setOrders(data);
  };
  const loadReviews = async () => {
    const { data } = await api.get("/admin/reviews");
    setReviews(data);
  };

  useEffect(() => {
    loadOrders().catch(() => {});
    loadReviews().catch(() => {});
  }, []);

  const togglePayment = async (order) => {
    const next = order.payment_status === "paid" ? "unpaid" : "paid";
    try {
      await api.patch(`/admin/orders/${order.id}/payment`, { payment_status: next });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, payment_status: next } : o)));
      toast.success(`Marked as ${next}`);
    } catch (e) {
      toast.error("Could not update payment status.");
    }
  };

  const moderate = async (review, status) => {
    try {
      await api.patch(`/admin/reviews/${review.id}`, { status });
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, status } : r)));
      toast.success(`Review ${status}`);
    } catch (e) {
      toast.error("Could not update review.");
    }
  };

  const submittedCount = orders.filter((o) => o.status === "submitted").length;
  const pendingReviews = reviews.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title="Admin Dashboard | DocGalaxy E-Stamping" description="DocGalaxy estamping admin dashboard." path="/admin" />
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-slate-900">
              <Stamp className="h-5 w-5" />
            </span>
            <span className="font-head text-lg font-bold">DocGalaxy Admin</span>
          </div>
          <Button
            data-testid="admin-logout-btn"
            variant="ghost"
            onClick={() => { logout(); navigate("/"); }}
            className="gap-2 text-white hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total Orders</p>
            <p className="mt-1 font-head text-3xl font-bold text-slate-900 tabular-nums">{orders.length}</p>
          </Card>
          <Card className="border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Submitted</p>
            <p className="mt-1 font-head text-3xl font-bold text-slate-900 tabular-nums">{submittedCount}</p>
          </Card>
          <Card className="border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Pending Reviews</p>
            <p className="mt-1 font-head text-3xl font-bold text-slate-900 tabular-nums">{pendingReviews}</p>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="mt-8">
          <TabsList data-testid="admin-tabs">
            <TabsTrigger value="orders" data-testid="tab-orders" className="gap-2"><Package className="h-4 w-4" /> Orders</TabsTrigger>
            <TabsTrigger value="reviews" data-testid="tab-reviews" className="gap-2"><MessageSquare className="h-4 w-4" /> Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-4">
            <Card className="border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <Table data-testid="admin-orders-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="py-10 text-center text-slate-500">No orders yet.</TableCell></TableRow>
                    ) : (
                      orders.map((o) => (
                        <TableRow key={o.id} data-testid={`admin-order-row-${o.id}`}>
                          <TableCell>
                            <div className="font-medium text-slate-900">{o.customer_name || "—"}</div>
                            <div className="text-xs text-slate-500">{o.customer_mobile}</div>
                          </TableCell>
                          <TableCell className="max-w-[220px]">
                            <span className="line-clamp-2 text-sm text-slate-700">{o.data?.description_of_document || "—"}</span>
                          </TableCell>
                          <TableCell>
                            {o.status === "submitted" ? (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Submitted</Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Draft</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={o.payment_status === "paid"}
                                onCheckedChange={() => togglePayment(o)}
                                data-testid={`payment-toggle-${o.id}`}
                              />
                              <span className={`text-xs font-medium ${o.payment_status === "paid" ? "text-emerald-600" : "text-slate-500"}`}>
                                {o.payment_status === "paid" ? "Paid" : "Unpaid"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">{fmtDate(o.updated_at)}</TableCell>
                          <TableCell className="text-right">
                            <OrderDetailDialog order={o}>
                              <Button variant="outline" size="sm" data-testid={`view-order-${o.id}`} className="border-slate-300">
                                View & Bookmarklet
                              </Button>
                            </OrderDetailDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <div className="space-y-3" data-testid="admin-reviews-list">
              {reviews.length === 0 ? (
                <Card className="border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No reviews yet.</Card>
              ) : (
                reviews.map((r) => (
                  <Card key={r.id} data-testid={`admin-review-${r.id}`} className="flex flex-col gap-3 border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-slate-900">{r.customer_name}</span>
                        <StarRating value={r.rating} readOnly size={16} />
                        <Badge variant="outline" className={
                          r.status === "approved" ? "border-emerald-300 text-emerald-700"
                          : r.status === "rejected" ? "border-red-300 text-red-600"
                          : "border-amber-300 text-amber-700"
                        }>{r.status}</Badge>
                      </div>
                      {r.text && <p className="mt-2 text-sm text-slate-600">{r.text}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => moderate(r, "approved")} data-testid={`approve-review-${r.id}`} className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700" disabled={r.status === "approved"}>
                        <Check className="h-4 w-4" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => moderate(r, "rejected")} data-testid={`reject-review-${r.id}`} className="gap-1 border-red-300 text-red-600 hover:bg-red-50" disabled={r.status === "rejected"}>
                        <X className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
