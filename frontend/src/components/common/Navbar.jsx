import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import {
  Compass,
  MapPin,
  Home,
  Calendar,
  LayoutDashboard,
  User,
  LogOut,
  PlusCircle,
  Menu,
  X,
  ShieldCheck,
  Building2,
  FolderHeart,
} from 'lucide-react';
import Button from './Button';

const Navbar = () => {
  const { user, isAuthenticated, isHost, isAdmin, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    showToast('Signed out successfully', 'info');
    navigate('/');
    setDropdownOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  // Resolve target dashboard link based on role
  const getDashboardRoute = () => {
    if (isAdmin) return '/dashboard/admin';
    if (isHost) return '/dashboard/owner';
    return '/dashboard/renter';
  };

  const getDashboardLabel = () => {
    if (isAdmin) return 'Admin Hub';
    if (isHost) return 'Owner Hub';
    return 'Renter Dashboard';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#0c4a3e] flex items-center justify-center text-white shadow-md shadow-[#0c4a3e]/20 group-hover:bg-[#07362d] transition-all duration-200">
              <Home className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-[#0c4a3e] transition-colors leading-none block">
                Nestora
              </span>
              <span className="text-[10px] font-black text-[#0c4a3e] tracking-widest block uppercase mt-0.5">
                Rental Residences
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              to="/"
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                isActive('/')
                  ? 'bg-[#dcf0e7] text-[#0c4a3e]'
                  : 'text-slate-700 hover:text-[#0c4a3e] hover:bg-slate-50'
              }`}
            >
              Home
            </Link>

            <Link
              to="/explore"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold transition-all ${
                isActive('/explore')
                  ? 'bg-[#dcf0e7] text-[#0c4a3e]'
                  : 'text-slate-700 hover:text-[#0c4a3e] hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-4 h-4 text-[#0c4a3e] stroke-[2.2]" />
              Property Listings
            </Link>

            {isAuthenticated && (
              <Link
                to={getDashboardRoute()}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-colors ${
                  location.pathname.startsWith('/dashboard')
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                {getDashboardLabel()}
              </Link>
            )}

            {isAuthenticated && !isHost && !isAdmin && (
              <Link
                to="/my-bookings"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-colors ${
                  isActive('/my-bookings')
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-4 h-4 text-slate-500" />
                My Bookings
              </Link>
            )}

            {isAuthenticated && (isHost || isAdmin) && (
              <Link
                to="/my-properties"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-colors ${
                  isActive('/my-properties')
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4 text-slate-500" />
                My Properties
              </Link>
            )}
          </nav>

          {/* User Section / Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && (
              <Link to="/properties/new">
                <Button variant="outline" size="sm" icon={PlusCircle}>
                  Add Property
                </Button>
              </Link>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 p-1.5 pl-3 rounded-full border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all bg-white"
                >
                  <span className="text-xs font-bold text-slate-700 max-w-[120px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <img
                    src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500"
                  />
                </button>

                {dropdownOpen && (
                  <div
                    onMouseLeave={() => setDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in-50 zoom-in-95"
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-[11px] text-slate-400 font-semibold">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {user?.email}
                      </p>
                      <span className="inline-block mt-1 uppercase text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {user?.role === 'host' ? 'Property Owner' : user?.role}
                      </span>
                    </div>

                    <Link
                      to={getDashboardRoute()}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-emerald-50/60 hover:text-emerald-800 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                      {getDashboardLabel()}
                    </Link>

                    {isHost || isAdmin ? (
                      <Link
                        to="/my-properties"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-emerald-50/60 hover:text-emerald-800 transition-colors"
                      >
                        <Building2 className="w-4 h-4 text-slate-400" />
                        My Properties
                      </Link>
                    ) : (
                      <Link
                        to="/my-bookings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-emerald-50/60 hover:text-emerald-800 transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-slate-400" />
                        My Bookings
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-emerald-50/60 hover:text-emerald-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Profile Settings
                    </Link>

                    <div className="border-t border-slate-100 my-1.5" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-bold text-slate-800 hover:text-[#0c4a3e] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 rounded-full bg-[#0c4a3e] hover:bg-[#07362d] text-white text-sm font-bold shadow-md shadow-[#0c4a3e]/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2.5 animate-in slide-in-from-top-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <Home className="w-5 h-5 text-emerald-600" />
            Home
          </Link>
          <Link
            to="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <Compass className="w-5 h-5 text-emerald-600" />
            Property Listings
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardRoute()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <LayoutDashboard className="w-5 h-5 text-emerald-600" />
                {getDashboardLabel()}
              </Link>
              <Link
                to="/my-bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <Calendar className="w-5 h-5 text-slate-500" />
                My Bookings
              </Link>
              <Link
                to="/my-properties"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <Building2 className="w-5 h-5 text-slate-500" />
                My Properties
              </Link>
              <Link
                to="/properties/new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <PlusCircle className="w-5 h-5 text-slate-500" />
                Add Property
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <User className="w-5 h-5 text-slate-500" />
                Profile Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
