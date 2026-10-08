import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Services", to: "/#services" },
  { label: "Testimonials", to: "/#testimonials" },
  { label: "FAQ", to: "/#faq" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const isCustomer = user && user.role === "customer";
  const isAdmin = user && user.role === "admin";

  return (
    <header
      data-testid="main-navbar"
      className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" data-testid="navbar-logo" className="flex items-center gap-2">
          <Logo to={null} />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.to}
              data-testid={`nav-${l.label.toLowerCase()}`}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isCustomer && (
            <Button
              variant="ghost"
              data-testid="navbar-dashboard-btn"
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <LayoutDashboard className="h-4 w-4" /> My Orders
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="ghost"
              data-testid="navbar-admin-btn"
              onClick={() => navigate("/admin")}
              className="gap-2"
            >
              <LayoutDashboard className="h-4 w-4" /> Admin
            </Button>
          )}
          {user ? (
            <Button
              data-testid="navbar-logout-btn"
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          ) : (
            <Button
              data-testid="navbar-login-btn"
              onClick={() => navigate("/login")}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              Customer Login
            </Button>
          )}
        </div>

        <button
          data-testid="navbar-mobile-toggle"
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.to}
                className="text-sm font-medium text-slate-700"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            {isCustomer && (
              <button className="text-left text-sm font-medium text-slate-700" onClick={() => { setOpen(false); navigate("/dashboard"); }}>My Orders</button>
            )}
            {isAdmin && (
              <button className="text-left text-sm font-medium text-slate-700" onClick={() => { setOpen(false); navigate("/admin"); }}>Admin</button>
            )}
            {user ? (
              <Button data-testid="navbar-mobile-logout" onClick={() => { setOpen(false); logout(); navigate("/"); }} className="bg-slate-900 text-white">Logout</Button>
            ) : (
              <Button data-testid="navbar-mobile-login" onClick={() => { setOpen(false); navigate("/login"); }} className="bg-slate-900 text-white">Customer Login</Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
