
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check, ChevronsUpDown, Save, Loader2, Lock, FileText,
  Users, UserCheck, Coins, Phone, CheckCircle2, ArrowLeft,
} from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  STAMP_DUTY_PAID_BY, GENDER_OPTIONS, MODE_OF_PAYMENT,
  PROOF_OF_IDENTITY, PROOF_OF_RESIDENCE,
} from "@/data/options";
import { toast } from "sonner";

const BLUE = "#2563EB";
const LIGHT_GREY = "#F1F5F9";

const EMPTY = {
  purchased_by: "",
  description_of_document: "",
  article: "",
  consideration_price: "",
  first_party_name: "",
  first_party_address1: "",
  first_party_address2: "",
  first_party_address3: "",
  first_party_pin: "",
  first_party_pan: "",
  second_party_name: "",
  second_party_address1: "",
  second_party_address2: "",
  second_party_address3: "",
  second_party_pin: "",
  second_party_pan: "",
  stamp_duty_amount: "",
  stamp_duty_paid_by: "",
  gender: "",
  proof_of_identity: "",
  proof_of_residence: "",
  mode_of_payment: "",
  first_party_mobile: "",
  first_party_email: "",
  second_party_mobile: "",
  second_party_email: "",
};

function TextField({
  field, label, placeholder, value, disabled, onChange,
  type = "text", required = false, uppercase = true, maxLength,
}) {
  const handleChange = (e) => {
    let v = e.target.value;

    if (type === "number") {
      v = v.replace(/[^0-9.]/g, "");
    } else if (field.includes("mobile")) {
      v = v.replace(/\D/g, "").slice(0, 10);
    } else if (uppercase && type !== "email") {
      v = v.toUpperCase();
    }

    if (maxLength) v = v.slice(0, maxLength);
    onChange(field, v);
  };

  return (
    <div>
      <Label htmlFor={field} className="text-sm text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </Label>
      <Input
        id={field}
        data-testid={`field-${field}`}
        value={value || ""}
        disabled={disabled}
        type={type === "email" ? "email" : "text"}
        inputMode={
          field.includes("mobile")
            ? "numeric"
            : type === "number"
              ? "decimal"
              : undefined
        }
        maxLength={maxLength}
        required={required}
        onChange={handleChange}
        placeholder={placeholder}
        className="mt-1.5 border-slate-300 focus-visible:ring-[#2563EB] disabled:opacity-100 disabled:bg-slate-50"
      />
    </div>
  );
}

function SelectField({ field, label, options, value, disabled, onChange }) {
  return (
    <div>
      <Label className="text-sm text-slate-700">{label}</Label>
      <Select
        value={value || ""}
        onValueChange={(v) => onChange(field, v)}
        disabled={disabled}
      >
        <SelectTrigger
          data-testid={`field-${field}`}
          className="mt-1.5 border-slate-300 focus:ring-[#2563EB]"
        >
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2563EB] text-white">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 className="font-head text-lg font-semibold text-slate-900">
            {title}
          </h2>
        </div>
        {children}
      </Card>
    </motion.div>
  );
}

function ArticleCombobox({ value, onChange, articles, disabled }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          data-testid="article-combobox-trigger"
          className="w-full justify-between border-slate-300 font-normal disabled:opacity-100 disabled:bg-slate-50"
        >
          <span className="truncate text-left">
            {value || "Type to search & select an article…"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Type article name… e.g. Affidavit, Lease"
            data-testid="article-combobox-search"
          />
          <CommandList>
            <CommandEmpty>No matching article found.</CommandEmpty>
            <CommandGroup>
              {articles.map((a, i) => {
                const label = `${a.description} (Art. ${a.article.trim()})`;
                return (
                  <CommandItem
                    key={`${a.article}-${i}`}
                    value={label}
                    onSelect={() => {
                      onChange("article", label);
                      setOpen(false);
                    }}
                    data-testid={`article-option-${i}`}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === label ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="text-sm">{label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function EStampingForm() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(EMPTY);
  const [order, setOrder] = useState(null);
  const [articles, setArticles] = useState([]);
  const [saveState, setSaveState] = useState("idle");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const idRef = useRef(orderId || null);
  const timerRef = useRef(null);
  const readOnly = order?.status === "submitted";

  useEffect(() => {
    api.get("/articles")
      .then((r) => setArticles(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        if (orderId) {
          const { data: o } = await api.get(`/orders/${orderId}`);
          if (!active) return;

          setOrder(o);
          setData({ ...EMPTY, ...(o.data || {}) });
          idRef.current = o.id;
        } else {
          const { data: o } = await api.post("/orders", EMPTY);
          if (!active) return;

          setOrder(o);
          idRef.current = o.id;
          window.history.replaceState(null, "", `/estamping/${o.id}`);
        }
      } catch (e) {
        toast.error("Could not load the estamping form.");
      } finally {
        if (active) setLoading(false);
      }
    }

    init();

    return () => {
      active = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [orderId]);

  const scheduleSave = useCallback((next) => {
    if (!idRef.current) return;

    setSaveState("saving");
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        await api.put(`/orders/${idRef.current}`, next);
        setSaveState("saved");
      } catch (e) {
        setSaveState("idle");
      }
    }, 900);
  }, []);

  const update = useCallback((field, val) => {
    setData((prev) => {
      const next = { ...prev, [field]: val };
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const handleSubmit = async () => {
    const stampDuty = String(data.stamp_duty_amount || "").trim();
    const mobile = String(data.first_party_mobile || "").trim();

    if (!stampDuty || !Number.isFinite(Number(stampDuty)) || Number(stampDuty) <= 0) {
      toast.error("Please enter a valid Stamp Duty Amount.");
      return;
    }

    if (!/^\d{10}$/.test(mobile)) {
      toast.error("Please enter a valid 10-digit First Party Mobile Number.");
      return;
    }

    setSubmitting(true);

    try {
      const { data: o } = await api.post(
        `/orders/${idRef.current}/submit`,
        data
      );
      setOrder(o);
      toast.success("Your estamping application has been submitted!");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F1F5F9] text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading estamping form…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F1F5F9]">
      <SEO
        title="E-Stamping Application | Galaxy Stamp Gujarat"
        description="Fill your Galaxy Stamp e-stamping application online. Stamp Duty Amount and First Party Mobile Number are required. Your progress saves automatically."
        path="/estamping"
      />
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#2563EB]"
          data-testid="back-to-dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to my orders
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-head text-3xl font-bold tracking-tight text-slate-900">
              E-Stamping Application
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Stamp Duty Amount and First Party Mobile Number are required.{" "}
              {readOnly
                ? "This submitted order is read-only."
                : "Your progress saves automatically."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {readOnly ? (
              <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100" data-testid="readonly-badge">
                <Lock className="h-3.5 w-3.5" />
                Submitted
              </Badge>
            ) : (
              <span
                data-testid="save-status"
                className="flex items-center gap-1.5 text-sm text-slate-500"
              >
                {saveState === "saving" && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                )}
                {saveState === "saved" && (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Draft saved
                  </>
                )}
                {saveState === "idle" && (
                  <>
                    <Save className="h-4 w-4" />
                    Auto-save on
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Section icon={FileText} title="Document Details">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  field="purchased_by"
                  label="Purchased By"
                  placeholder="e.g. First Party / name"
                  value={data.purchased_by}
                  disabled={readOnly}
                  onChange={update}
                />

                <TextField
                  field="consideration_price"
                  label="Consideration Price (₹)"
                  type="number"
                  placeholder="e.g. 5000000"
                  value={data.consideration_price}
                  disabled={readOnly}
                  onChange={update}
                />

                <div className="sm:col-span-2">
                  <Label htmlFor="description_of_document" className="text-sm text-slate-700">
                    Description of Document
                  </Label>
                  <Textarea
                    id="description_of_document"
                    data-testid="field-description_of_document"
                    value={data.description_of_document || ""}
                    disabled={readOnly}
                    onChange={(e) =>
                      update("description_of_document", e.target.value.toUpperCase())
                    }
                    placeholder="Describe the document / transaction details…"
                    className="mt-1.5 min-h-[90px] border-slate-300 focus-visible:ring-[#2563EB] disabled:opacity-100 disabled:bg-slate-50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-sm text-slate-700">Article</Label>
                  <div className="mt-1.5">
                    <ArticleCombobox
                      value={data.article}
                      onChange={update}
                      articles={articles}
                      disabled={readOnly}
                    />
                  </div>
                </div>
              </div>
            </Section>

            <Section icon={Users} title="First Party">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <TextField
                    field="first_party_name"
                    label="Name"
                    placeholder="First party full name"
                    value={data.first_party_name}
                    disabled={readOnly}
                    onChange={update}
                  />
                </div>
                <TextField field="first_party_address1" label="Address Line 1" placeholder="Address line 1" value={data.first_party_address1} disabled={readOnly} onChange={update} />
                <TextField field="first_party_address2" label="Address Line 2" placeholder="Address line 2" value={data.first_party_address2} disabled={readOnly} onChange={update} />
                <TextField field="first_party_address3" label="Address Line 3" placeholder="Address line 3" value={data.first_party_address3} disabled={readOnly} onChange={update} />
                <TextField field="first_party_pin" label="Pin Code" placeholder="e.g. 380001" value={data.first_party_pin} disabled={readOnly} onChange={update} />
                <TextField field="first_party_pan" label="PAN" placeholder="e.g. ABCDE1234F" value={data.first_party_pan} disabled={readOnly} onChange={update} />
              </div>
            </Section>

            <Section icon={UserCheck} title="Second Party">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <TextField
                    field="second_party_name"
                    label="Name"
                    placeholder="Second party full name"
                    value={data.second_party_name}
                    disabled={readOnly}
                    onChange={update}
                  />
                </div>
                <TextField field="second_party_address1" label="Address Line 1" placeholder="Address line 1" value={data.second_party_address1} disabled={readOnly} onChange={update} />
                <TextField field="second_party_address2" label="Address Line 2" placeholder="Address line 2" value={data.second_party_address2} disabled={readOnly} onChange={update} />
                <TextField field="second_party_address3" label="Address Line 3" placeholder="Address line 3" value={data.second_party_address3} disabled={readOnly} onChange={update} />
                <TextField field="second_party_pin" label="Pin Code" placeholder="e.g. 380001" value={data.second_party_pin} disabled={readOnly} onChange={update} />
                <TextField field="second_party_pan" label="PAN" placeholder="e.g. ABCDE1234F" value={data.second_party_pan} disabled={readOnly} onChange={update} />
              </div>
            </Section>

            <Section icon={Coins} title="Stamp Duty & Payment">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  field="stamp_duty_amount"
                  label="Stamp Duty Amount (₹)"
                  placeholder="e.g. 294000"
                  value={data.stamp_duty_amount}
                  disabled={readOnly}
                  onChange={update}
                  required
                  type="number"
                />
                <SelectField field="stamp_duty_paid_by" label="Stamp Duty Paid By" options={STAMP_DUTY_PAID_BY} value={data.stamp_duty_paid_by} disabled={readOnly} onChange={update} />
                <SelectField field="gender" label="Gender" options={GENDER_OPTIONS} value={data.gender} disabled={readOnly} onChange={update} />
                <SelectField field="mode_of_payment" label="Mode of Payment" options={MODE_OF_PAYMENT} value={data.mode_of_payment} disabled={readOnly} onChange={update} />
                <SelectField field="proof_of_identity" label="Proof of Identity" options={PROOF_OF_IDENTITY} value={data.proof_of_identity} disabled={readOnly} onChange={update} />
                <SelectField field="proof_of_residence" label="Proof of Residence" options={PROOF_OF_RESIDENCE} value={data.proof_of_residence} disabled={readOnly} onChange={update} />
              </div>
            </Section>

            <Section icon={Phone} title="Contact Details">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  field="first_party_mobile"
                  label="First Party Mobile"
                  placeholder="10-digit mobile number"
                  value={data.first_party_mobile}
                  disabled={readOnly}
                  onChange={update}
                  required
                  maxLength={10}
                  uppercase={false}
                />
                <TextField
                  field="first_party_email"
                  label="First Party Email"
                  placeholder="Email address"
                  value={data.first_party_email}
                  disabled={readOnly}
                  onChange={update}
                  type="email"
                  uppercase={false}
                />
                <TextField
                  field="second_party_mobile"
                  label="Second Party Mobile"
                  placeholder="Mobile number (optional)"
                  value={data.second_party_mobile}
                  disabled={readOnly}
                  onChange={update}
                  maxLength={10}
                  uppercase={false}
                />
                <TextField
                  field="second_party_email"
                  label="Second Party Email"
                  placeholder="Email address"
                  value={data.second_party_email}
                  disabled={readOnly}
                  onChange={update}
                  type="email"
                  uppercase={false}
                />
              </div>
            </Section>
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <Card className="border border-slate-200 bg-white p-6">
                <h3 className="font-head text-lg font-semibold text-slate-900">
                  Summary
                </h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Purchased By</dt>
                    <dd className="font-medium text-slate-900">{data.purchased_by || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Article</dt>
                    <dd className="font-medium text-slate-900">{data.article || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Document</dt>
                    <dd className="font-medium text-slate-900">{data.description_of_document || "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Consideration</dt>
                    <dd className="tabular-nums font-medium text-slate-900">
                      {data.consideration_price ? `₹${data.consideration_price}` : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Stamp Duty</dt>
                    <dd className="tabular-nums font-medium text-slate-900">
                      {data.stamp_duty_amount ? `₹${data.stamp_duty_amount}` : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">First Party</dt>
                    <dd className="font-medium text-slate-900">{data.first_party_name || "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Second Party</dt>
                    <dd className="font-medium text-slate-900">{data.second_party_name || "—"}</dd>
                  </div>
                </dl>

                {!readOnly ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        data-testid="submit-order-btn"
                        className="mt-6 w-full bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                      >
                        Submit Application
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent data-testid="submit-confirm-dialog">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Submit this estamping application?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Once submitted, the form becomes <strong>read-only</strong>{" "}
                          and cannot be edited. Please review your details before submitting.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid="submit-cancel">
                          Review again
                        </AlertDialogCancel>
                        <AlertDialogAction
                          data-testid="submit-confirm"
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="bg-[#2563EB] hover:bg-[#1D4ED8]"
                        >
                          {submitting ? "Submitting…" : "Yes, submit"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-center">
                    <Lock className="mx-auto h-6 w-6 text-emerald-600" />
                    <p className="mt-2 text-sm font-medium text-emerald-800">
                      Submitted & locked
                    </p>
                    <p className="mt-1 text-xs text-emerald-600">
                      Payment: {order.payment_status === "paid" ? "Paid" : "Unpaid"}
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
