import React from "react";
import { Link } from "react-router-dom";

// Consistent brand logo: Galaxy Stamp image + "Galaxy Stamp" / "By DocGalaxy"
export default function Logo({ to = "/", dark = false, className = "" }) {
  const primary = dark ? "text-white" : "text-slate-900";
  const secondary = dark ? "text-slate-300" : "text-slate-500";

  const inner = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/galaxy-stamp-logo.jpg"
        alt="Galaxy Stamp logo"
        className="h-11 w-11 shrink-0 rounded-full object-contain ring-1 ring-slate-200"
      />
      <div className="flex flex-col leading-tight">
        <span className={`font-head text-base font-semibold ${primary}`}>Galaxy Stamp</span>
        <span className={`text-[11px] ${secondary}`}>By DocGalaxy</span>
      </div>
    </div>
  );

  if (to === null) return inner;
  return (
    <Link to={to} data-testid="brand-logo" className="inline-flex">
      {inner}
    </Link>
  );
}
