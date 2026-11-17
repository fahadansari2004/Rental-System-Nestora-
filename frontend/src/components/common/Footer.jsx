import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShieldCheck, HeartHandshake, Sparkles, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-900">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-md shadow-emerald-800/30">
                <Home className="w-5 h-5 stroke-[2.4]" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white block leading-none">
                  Nestora
                </span>
                <span className="text-[10px] font-black text-emerald-400 tracking-widest block uppercase mt-0.5">
                  Rental Residences &bull; Kerala
                </span>
              </div>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Nestora is India's verified rental marketplace connecting genuine property owners and renters across Kerala and major metros. Zero brokerage, transparent pricing, and 100% inspected listings.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300 pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified Owners
              </span>
              <span className="flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-emerald-400" /> Zero Brokerage
              </span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white mb-4">
              Property Categories
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/explore?category=Residential" className="hover:text-emerald-400 transition-colors">
                  Residential Apartments &amp; Villas
                </Link>
              </li>
              <li>
                <Link to="/explore?category=Rooms%20%26%20PG" className="hover:text-emerald-400 transition-colors">
                  Rooms &amp; Paying Guest (PG)
                </Link>
              </li>
              <li>
                <Link to="/explore?category=Commercial&propertyType=Retail%20Shop" className="hover:text-emerald-400 transition-colors">
                  Shops &amp; Retail Showrooms
                </Link>
              </li>
              <li>
                <Link to="/explore?category=Commercial&propertyType=Office%20Space" className="hover:text-emerald-400 transition-colors">
                  Office Spaces &amp; Commercial
                </Link>
              </li>
            </ul>
          </div>

          {/* Top Kerala Cities */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white mb-4">
              Top Locations
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/explore?city=Kochi" className="hover:text-emerald-400 transition-colors">
                  Kochi &amp; Marine Drive
                </Link>
              </li>
              <li>
                <Link to="/explore?city=Kakkanad" className="hover:text-emerald-400 transition-colors">
                  Kakkanad (Infopark)
                </Link>
              </li>
              <li>
                <Link to="/explore?city=Thiruvananthapuram" className="hover:text-emerald-400 transition-colors">
                  Thiruvananthapuram (Technopark)
                </Link>
              </li>
              <li>
                <Link to="/explore?city=Kozhikode" className="hover:text-emerald-400 transition-colors">
                  Kozhikode (Beach Road)
                </Link>
              </li>
              <li>
                <Link to="/explore?city=Thrissur" className="hover:text-emerald-400 transition-colors">
                  Thrissur &amp; Kottayam
                </Link>
              </li>
            </ul>
          </div>

          {/* Dashboards & Portals */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white mb-4">
              Quick Portals
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link to="/dashboard/renter" className="hover:text-emerald-400 transition-colors">
                  Renter Dashboard
                </Link>
              </li>
              <li>
                <Link to="/dashboard/owner" className="hover:text-emerald-400 transition-colors">
                  Owner Dashboard
                </Link>
              </li>
              <li>
                <Link to="/dashboard/admin" className="hover:text-emerald-400 transition-colors">
                  Admin Hub
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-emerald-400 transition-colors">
                  My Bookings &amp; Leases
                </Link>
              </li>
              <li>
                <Link to="/properties/new" className="hover:text-emerald-400 transition-colors">
                  List a New Property
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} Nestora Rental Residences India. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-emerald-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-emerald-400 cursor-pointer">Standard 11-Month Lease Terms</span>
            <span className="hover:text-emerald-400 cursor-pointer">Deposit Security Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
