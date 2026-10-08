import React from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer data-testid="main-footer" className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo to={null} dark />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              DocGalaxy is a trusted online estamping service in Gujarat. Pay your
              non-judicial stamp duty online and get authentic e-stamp certificates for
              sale deeds, gift deeds, rent agreements, affidavits and more.
            </p>
          </div>
          <div>
            <h3 className="font-head text-sm font-semibold uppercase tracking-wider text-white">
              E-Stamping
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a href="/#services" className="transition-colors hover:text-white">Online Estamping</a></li>
              <li><a href="/#faq" className="transition-colors hover:text-white">Stamp Duty FAQ</a></li>
              <li><Link to="/estamping" className="transition-colors hover:text-white">Start Application</Link></li>
              <li><Link to="/admin/login" className="transition-colors hover:text-white">Admin Login</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-head text-sm font-semibold uppercase tracking-wider text-white">
              Keywords We Serve
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>estamping gujarat</li>
              <li>online estamping</li>
              <li>estamping center</li>
              <li>e-stamping service</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-800 pt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} DocGalaxy E-Stamping Gujarat. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
