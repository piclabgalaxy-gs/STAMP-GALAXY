import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import SEO from "@/components/SEO";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/admin/login", { email, password });
      login(data.token, data.user);
      toast.success("Welcome back, Admin!");
      navigate("/admin");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-6">
      <SEO title="Admin Login | DocGalaxy E-Stamping" description="Admin login for DocGalaxy estamping management." path="/admin/login" />
      <Card className="w-full max-w-md border border-slate-700 bg-slate-800 p-8 text-white" data-testid="admin-login-card">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <Logo to="/" dark />
        <div className="mt-8 flex items-center gap-2">
          <Lock className="h-5 w-5 text-amber-400" />
          <h1 className="font-head text-2xl font-bold">Admin Login</h1>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-5">
          <div>
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              id="email"
              type="email"
              data-testid="admin-email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@docgalaxy.in"
              className="mt-2 border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            <Input
              id="password"
              type="password"
              data-testid="admin-password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2 border-slate-600 bg-slate-900 text-white placeholder:text-slate-500"
            />
          </div>
          <Button
            type="submit"
            data-testid="admin-login-btn"
            disabled={loading}
            className="w-full bg-amber-400 text-slate-900 hover:bg-amber-300"
          >
            {loading ? "Logging in…" : "Login"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
