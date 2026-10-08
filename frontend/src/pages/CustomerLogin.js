import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Stamp, Smartphone, ArrowLeft } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";

export default function CustomerLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    if (!mobile.trim()) {
      toast.error("Please enter your mobile number.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/customer/request-otp", { mobile, name });
      setStep(2);
      toast.success(`OTP sent! Demo OTP: ${data.demo_otp}`, { duration: 8000 });
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length < 6) {
      toast.error("Please enter the 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/customer/verify-otp", { mobile, otp });
      login(data.token, data.user);
      toast.success("Welcome to DocGalaxy!");
      navigate("/dashboard");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA]">
      <SEO
        title="Customer Login | Online Estamping Gujarat | DocGalaxy"
        description="Login to DocGalaxy with your mobile number to start online estamping in Gujarat."
        path="/login"
      />
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between bg-slate-900 p-12 text-white lg:flex">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-slate-900">
              <Stamp className="h-5 w-5" />
            </span>
            <span className="font-head text-xl font-bold">DocGalaxy</span>
          </Link>
          <div>
            <h1 className="font-head text-4xl font-bold leading-tight">
              Online Estamping,<br />made simple.
            </h1>
            <p className="mt-4 max-w-sm text-slate-300">
              Login with your mobile number and complete your estamping in Gujarat in minutes.
              Your drafts save automatically.
            </p>
          </div>
          <p className="text-sm text-slate-400">Trusted estamping center · Gujarat</p>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-12">
          <Card className="w-full max-w-md border border-slate-200 bg-white p-8" data-testid="customer-login-card">
            <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
            <div className="flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-blue-600" />
              <h2 className="font-head text-2xl font-bold text-slate-900">Customer Login</h2>
            </div>

            {step === 1 ? (
              <div className="mt-8 space-y-5">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    data-testid="login-name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="mt-2 border-slate-300"
                  />
                </div>
                <div>
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    data-testid="login-mobile-input"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className="mt-2 border-slate-300"
                  />
                </div>
                <Button
                  data-testid="request-otp-btn"
                  onClick={requestOtp}
                  disabled={loading}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800"
                >
                  {loading ? "Sending…" : "Send OTP"}
                </Button>
              </div>
            ) : (
              <div className="mt-8 space-y-5">
                <p className="text-sm text-slate-600">
                  Enter the 6-digit OTP sent to <span className="font-semibold text-slate-900">{mobile}</span>
                </p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp} data-testid="login-otp-input">
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  data-testid="verify-otp-btn"
                  onClick={verifyOtp}
                  disabled={loading}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800"
                >
                  {loading ? "Verifying…" : "Verify & Login"}
                </Button>
                <button
                  data-testid="change-mobile-btn"
                  onClick={() => { setStep(1); setOtp(""); }}
                  className="w-full text-sm text-slate-500 hover:text-slate-900"
                >
                  Change mobile number
                </button>
              </div>
            )}
            <p className="mt-6 text-center text-xs text-slate-400">
              Are you an admin? <Link to="/admin/login" className="font-medium text-blue-600">Admin login</Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
