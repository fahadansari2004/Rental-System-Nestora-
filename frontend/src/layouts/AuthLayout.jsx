import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Home, ShieldCheck, Star, Sparkles } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 font-sans">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-emerald-950 text-white overflow-hidden p-12 flex-col justify-between">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"
            alt="Nestora Luxury Architecture"
            className="w-full h-full object-cover opacity-35 mix-blend-overlay scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/70 to-emerald-900/40" />
        </div>

        {/* Brand header */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/40">
              <Home className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">Nestora</span>
              <span className="text-[10px] font-bold text-emerald-400 tracking-widest block uppercase -mt-1">
                Rental Residences
              </span>
            </div>
          </Link>
        </div>

        {/* Testimonial Quote */}
        <div className="relative z-10 space-y-4 max-w-md">
          <div className="flex gap-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400" />
            ))}
          </div>
          <p className="text-xl font-bold leading-relaxed text-emerald-50">
            "Nestora made leasing our Manhattan apartment completely transparent. The monthly terms, virtual walkthrough, and digital agreement took less than 24 hours."
          </p>
          <div>
            <p className="text-sm font-bold text-white">Marcus Sterling</p>
            <p className="text-xs text-emerald-300">Tenant in SoHo, New York</p>
          </div>
        </div>

        {/* Bottom tags */}
        <div className="relative z-10 flex items-center gap-6 text-xs text-emerald-200/80 border-t border-emerald-900 pt-6">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Bank-grade JWT Security
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Standardized Digital Leases
          </span>
        </div>
      </div>

      {/* Auth Content Right Panel */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-16 py-12">
        <div className="max-w-md w-full mx-auto">
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <Home className="w-5 h-5 stroke-[2.4]" />
              </div>
              <span className="text-2xl font-black text-slate-900">Nestora</span>
            </Link>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
