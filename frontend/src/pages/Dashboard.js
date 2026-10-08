import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilePlus2, FileText, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get("/orders");
      setOrders(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const drafts = orders.filter((o) => o.status === "draft");
  const submitted = orders.filter((o) => o.status === "submitted");

  const OrderCard = ({ o }) => (
    <Card
      data-testid={`order-card-${o.id}`}
      className="flex flex-col gap-3 border border-slate-200 bg-white p-5 transition-transform hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 shrink-0 text-slate-400" />
          <p className="truncate font-head text-base font-semibold text-slate-900">
            {o.data?.article || o.data?.description_of_document || "Untitled estamping document"}
          </p>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {o.data?.first_party_name ? `${o.data.first_party_name}` : "No party name"}
          {o.data?.consideration_price ? ` · ₹${o.data.consideration_price}` : ""}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {o.status === "submitted" ? `Submitted ${fmtDate(o.submitted_at)}` : `Updated ${fmtDate(o.updated_at)}`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {o.status === "submitted" ? (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Submitted</Badge>
        ) : (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Draft</Badge>
        )}
        <Badge variant="outline" className={o.payment_status === "paid" ? "border-emerald-300 text-emerald-700" : "border-slate-300 text-slate-500"}>
          {o.payment_status === "paid" ? "Paid" : "Unpaid"}
        </Badge>
        <Button
          data-testid={`open-order-${o.id}`}
          variant="outline"
          size="sm"
          className="gap-1 border-slate-300"
          onClick={() => navigate(`/estamping/${o.id}`)}
        >
          {o.status === "submitted" ? "View" : "Continue"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA]">
      <SEO title="My Estamping Orders | DocGalaxy" description="View your estamping drafts and submitted orders on DocGalaxy." path="/dashboard" />
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-head text-3xl font-bold tracking-tight text-slate-900">
              Hello, {user?.name || "there"}
            </h1>
            <p className="mt-1 text-sm text-slate-600">Manage your estamping drafts and submitted orders.</p>
          </div>
          <Button
            data-testid="new-estamping-btn"
            onClick={() => navigate("/estamping")}
            className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
          >
            <FilePlus2 className="h-4 w-4" /> New E-Stamping
          </Button>
        </div>

        {loading ? (
          <p className="mt-12 text-center text-slate-500">Loading your orders…</p>
        ) : (
          <>
            <section className="mt-10">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <h2 className="font-head text-xl font-semibold text-slate-900">Drafts ({drafts.length})</h2>
              </div>
              <div className="mt-4 space-y-3" data-testid="drafts-list">
                {drafts.length === 0 ? (
                  <Card className="border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                    No drafts yet. Start a new estamping application.
                  </Card>
                ) : (
                  drafts.map((o) => <OrderCard key={o.id} o={o} />)
                )}
              </div>
            </section>

            <section className="mt-10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h2 className="font-head text-xl font-semibold text-slate-900">Submitted Orders ({submitted.length})</h2>
              </div>
              <div className="mt-4 space-y-3" data-testid="submitted-list">
                {submitted.length === 0 ? (
                  <Card className="border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                    No submitted orders yet.
                  </Card>
                ) : (
                  submitted.map((o) => <OrderCard key={o.id} o={o} />)
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
