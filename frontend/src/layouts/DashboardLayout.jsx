import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import {
  LayoutDashboard,
  Home,
  PlusCircle,
  CalendarCheck,
  User,
} from 'lucide-react';

const DashboardLayout = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Host Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm sticky top-28 space-y-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                  Host Management Portal
                </span>
                <h2 className="text-xl font-black text-slate-900">Host Hub</h2>
              </div>

              <nav className="space-y-1">
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive('/dashboard')
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Analytics & Overview
                </Link>

                <Link
                  to="/properties/new"
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive('/properties/new')
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  Add New Listing
                </Link>

                <Link
                  to="/my-bookings"
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive('/my-bookings')
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" />
                  My Personal Bookings
                </Link>

                <Link
                  to="/profile"
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive('/profile')
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Host Profile
                </Link>
              </nav>

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 space-y-1.5">
                <p className="font-bold">Superhost Guarantee</p>
                <p className="text-slate-600 leading-relaxed">
                  Every booking is protected by Nestora's guest identity verification and host damage coverage.
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">
            <Outlet />
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DashboardLayout;

