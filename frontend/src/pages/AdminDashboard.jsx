import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import { propertyService } from '../services/propertyService';
import { bookingService } from '../services/bookingService';
import { useToast } from '../hooks/useToast';
import { formatINR, formatDateIndian } from '../utils/formatters';
import Spinner from '../components/common/Loader';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import {
  ShieldAlert,
  Users,
  Building,
  CalendarCheck,
  CheckCircle,
  XCircle,
  Ban,
  Trash2,
  ExternalLink,
  Shield,
  Search,
  IndianRupee,
  Flag,
  Power,
  Eye,
  Clock,
  Filter,
  UserCheck,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Layers,
  AlertTriangle,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [allProperties, setAllProperties] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('properties'); // 'properties' | 'pending' | 'flagged' | 'users' | 'bookings'

  // Search & Filter States
  const [propertySearch, setPropertySearch] = useState('');
  const [propertyApprovalFilter, setPropertyApprovalFilter] = useState('all'); // 'all' | 'approved' | 'pending' | 'rejected'
  const [propertyActiveFilter, setPropertyActiveFilter] = useState('all'); // 'all' | 'active' | 'deactivated'
  const [propertyCategoryFilter, setPropertyCategoryFilter] = useState('all'); // 'all' | 'Residential' | 'Rooms & PG' | 'Commercial'

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All'); // 'All' | 'Admin' | 'Owner' | 'Renter'

  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');

  // Modals
  const [reviewProperty, setReviewProperty] = useState(null);
  const [changeRoleUser, setChangeRoleUser] = useState(null);
  const [newSelectedRole, setNewSelectedRole] = useState('Renter');

  const { showToast } = useToast();

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [stats, usersData, propsData, bookingsData] = await Promise.all([
        userService.getAdminStats(),
        userService.getUsers(),
        userService.getAdminProperties(),
        bookingService.getBookings().catch(() => []),
      ]);

      const allBks = Array.isArray(bookingsData)
        ? bookingsData
        : Array.isArray(bookingsData?.bookings)
        ? bookingsData.bookings
        : stats?.bookings || [];

      setData({
        ...stats,
        bookings: allBks,
        totalBookings: allBks.length,
      });
      setAllUsers(usersData?.users || stats?.users || []);
      setAllProperties(propsData?.properties || stats?.properties || []);
    } catch (error) {
      console.error('Admin data load error:', error);
      showToast(error.message || 'Could not load admin stats', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      await bookingService.updateBookingStatus(bookingId, status);
      showToast(`Booking marked as ${status}`, 'success');
      loadAdminData();
    } catch (err) {
      showToast(err.message || `Could not update booking to ${status}`, 'error');
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // --- PROPERTY ACTIONS ---

  const handleApproveProperty = async (propertyId) => {
    try {
      await userService.approveProperty(propertyId);
      showToast('Property listing approved & published live', 'success');
      loadAdminData();
      if (reviewProperty?._id === propertyId) setReviewProperty(null);
    } catch (error) {
      showToast(error.message || 'Failed to approve property', 'error');
    }
  };

  const handleRejectProperty = async (propertyId) => {
    try {
      await userService.rejectProperty(propertyId);
      showToast('Property listing rejected', 'info');
      loadAdminData();
      if (reviewProperty?._id === propertyId) setReviewProperty(null);
    } catch (error) {
      showToast(error.message || 'Failed to reject property', 'error');
    }
  };

  const handleToggleActiveProperty = async (propertyId, currentActive) => {
    try {
      const updated = await userService.togglePropertyActive(propertyId, currentActive);
      const isNowActive = updated?.isActive !== undefined ? updated.isActive : !currentActive;
      showToast(`Property listing ${isNowActive ? 'activated & live' : 'deactivated'}`, 'success');
      loadAdminData();
    } catch (error) {
      showToast(error.message || 'Failed to update property status', 'error');
    }
  };

  const handleToggleFlagProperty = async (propertyId, currentFlagged) => {
    try {
      const nextFlag = !currentFlagged;
      await userService.flagProperty(
        propertyId,
        nextFlag,
        nextFlag ? 'Flagged by administrator for policy review' : ''
      );
      showToast(`Property ${nextFlag ? 'marked as flagged content' : 'cleared from flagged list'}`, 'info');
      loadAdminData();
    } catch (error) {
      showToast(error.message || 'Failed to update flag status', 'error');
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Are you sure you want to permanently delete this property listing? This action cannot be undone.')) return;
    try {
      const idStr = String(propertyId);
      // 1. Instantly remove from state so the card/row vanishes immediately
      setAllProperties((prev) =>
        prev.filter((p) => String(p._id) !== idStr && String(p.id) !== idStr && String(p.customId) !== idStr)
      );
      if (reviewProperty && (String(reviewProperty._id) === idStr || String(reviewProperty.id) === idStr)) {
        setReviewProperty(null);
      }

      // 2. Perform deletion across backend API, admin service, and local persistence
      await userService.deleteProperty(propertyId);

      showToast('Property listing permanently deleted by administrator', 'info');
      loadAdminData();
    } catch (error) {
      showToast(error.message || 'Failed to delete property', 'error');
    }
  };

  // --- USER ACTIONS ---

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!changeRoleUser) return;
    try {
      await userService.updateUserRole(changeRoleUser._id, newSelectedRole);
      showToast(`User role updated to ${newSelectedRole}`, 'success');
      setChangeRoleUser(null);
      loadAdminData();
    } catch (error) {
      showToast(error.message || 'Failed to change user role', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
    try {
      await userService.deleteUser(userId);
      showToast('User account deleted', 'info');
      loadAdminData();
    } catch (error) {
      showToast(error.message || 'Failed to delete user', 'error');
    }
  };

  // --- FILTERED COMPUTATIONS ---

  const safeUsers = Array.isArray(allUsers) ? allUsers : [];
  const safeProperties = (Array.isArray(allProperties) ? allProperties : []).filter((p) => {
    try {
      const deleted = JSON.parse(localStorage.getItem('nestora_deleted_properties') || '[]');
      const pid = String(p._id || p.id || '');
      const cid = String(p.customId || '');
      return !deleted.includes(pid) && !deleted.includes(cid);
    } catch {
      return true;
    }
  });
  const safeBookings = Array.isArray(data?.bookings) ? data.bookings : [];

  // Metrics - synchronized directly with filtered lists
  const totalUsersCount = safeUsers.length || data?.totalUsers || 0;
  const activeListingsCount =
    safeProperties.filter((p) => p.approvalStatus === 'approved' && p.isActive !== false).length;
  const totalBookingsCount = safeBookings.length;
  const flaggedContentCount =
    safeProperties.filter((p) => Boolean(p.isFlagged)).length;
  const pendingApprovalsCount = safeProperties.filter((p) => p.approvalStatus === 'pending').length;

  // Filtered Properties
  const filteredProperties = useMemo(() => {
    return safeProperties.filter((p) => {
      // Search filter
      if (propertySearch.trim()) {
        const q = propertySearch.toLowerCase().trim();
        const matchesTitle = (p.title || '').toLowerCase().includes(q);
        const matchesCity = (p.location?.city || p.address?.city || '').toLowerCase().includes(q);
        const matchesOwner = (p.owner?.name || p.host?.name || '').toLowerCase().includes(q);
        const matchesType = (p.propertyType || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCity && !matchesOwner && !matchesType) return false;
      }

      // Approval Status filter
      if (propertyApprovalFilter !== 'all') {
        if (p.approvalStatus !== propertyApprovalFilter) return false;
      }

      // Active Status filter
      if (propertyActiveFilter !== 'all') {
        const isAct = p.isActive !== undefined ? p.isActive : true;
        if (propertyActiveFilter === 'active' && !isAct) return false;
        if (propertyActiveFilter === 'deactivated' && isAct) return false;
      }

      // Category filter
      if (propertyCategoryFilter !== 'all') {
        if (p.category !== propertyCategoryFilter) return false;
      }

      return true;
    });
  }, [safeProperties, propertySearch, propertyApprovalFilter, propertyActiveFilter, propertyCategoryFilter]);

  // Pending Properties
  const pendingPropertiesList = useMemo(() => {
    return safeProperties.filter((p) => p.approvalStatus === 'pending');
  }, [safeProperties]);

  // Flagged Properties
  const flaggedPropertiesList = useMemo(() => {
    return safeProperties.filter((p) => Boolean(p.isFlagged));
  }, [safeProperties]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return safeUsers.filter((u) => {
      if (userSearch.trim()) {
        const q = userSearch.toLowerCase().trim();
        const matchesName = (u.name || '').toLowerCase().includes(q);
        const matchesEmail = (u.email || '').toLowerCase().includes(q);
        const matchesPhone = (u.phone || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone) return false;
      }
      if (userRoleFilter !== 'All') {
        if ((u.role || '').toLowerCase() !== userRoleFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [safeUsers, userSearch, userRoleFilter]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return safeBookings.filter((b) => {
      if (bookingSearch.trim()) {
        const q = bookingSearch.toLowerCase().trim();
        const matchesTenant = (b.renter?.name || b.user?.name || '').toLowerCase().includes(q);
        const matchesOwner = (b.owner?.name || b.property?.owner?.name || '').toLowerCase().includes(q);
        const matchesProperty = (b.property?.title || '').toLowerCase().includes(q);
        const matchesId = String(b._id || b.id || '').toLowerCase().includes(q);
        if (!matchesTenant && !matchesOwner && !matchesProperty && !matchesId) return false;
      }
      if (bookingStatusFilter !== 'all') {
        if ((b.status || '').toLowerCase() !== bookingStatusFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [safeBookings, bookingSearch, bookingStatusFilter]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header Banner */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              CENTRAL ADMINISTRATOR HUB
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Platform Moderation &amp; Control
          </h1>
          <p className="text-xs text-slate-400">
            System-wide oversight for property verification, user access control, listing moderation, and compliance across India.
          </p>
        </div>

        <Link to="/properties/new">
          <Button variant="primary" size="sm">
            Add Official Listing
          </Button>
        </Link>
      </div>

      {/* Required System Metrics Cards (Using actual database data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Users
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {totalUsersCount}
            </span>
            <span className="text-[11px] text-slate-400">Registered Accounts</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Active Listings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Active Listings
            </span>
            <span className="text-2xl font-black text-emerald-800 mt-1 block">
              {activeListingsCount}
            </span>
            <span className="text-[11px] text-slate-400">
              {pendingApprovalsCount} pending review
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <Building className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Total Bookings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Bookings
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {totalBookingsCount}
            </span>
            <span className="text-[11px] text-slate-400">Rental Leases Signed</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Flagged Content */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Flagged Content
            </span>
            <span className={`text-2xl font-black mt-1 block ${flaggedContentCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {flaggedContentCount}
            </span>
            <span className="text-[11px] text-slate-400">Reported for Moderation</span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${flaggedContentCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
            <Flag className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('properties')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'properties'
            ? 'bg-emerald-800 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Building className="w-4 h-4" />
          All Properties ({safeProperties.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'pending'
            ? 'bg-amber-600 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Clock className="w-4 h-4" />
          Review &amp; Approve ({pendingApprovalsCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('flagged')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'flagged'
            ? 'bg-rose-600 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Flag className="w-4 h-4" />
          Flagged Content ({flaggedContentCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'users'
            ? 'bg-emerald-800 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <Users className="w-4 h-4" />
          User Accounts ({safeUsers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'bookings'
            ? 'bg-emerald-800 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Bookings ({safeBookings.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL PROPERTIES TABLE WITH SEARCH & FILTER */}
      {/* ========================================================================= */}
      {activeTab === 'properties' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search properties by title, city, or owner..."
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Approval status filter */}
              <select
                value={propertyApprovalFilter}
                onChange={(e) => setPropertyApprovalFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">All Approvals</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* Active / Deactivated filter */}
              <select
                value={propertyActiveFilter}
                onChange={(e) => setPropertyActiveFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">All States</option>
                <option value="active">Active (Live)</option>
                <option value="deactivated">Deactivated</option>
              </select>

              {/* Category filter */}
              <select
                value={propertyCategoryFilter}
                onChange={(e) => setPropertyCategoryFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="Residential">Residential</option>
                <option value="Rooms & PG">Rooms &amp; PG</option>
                <option value="Commercial">Commercial</option>
              </select>

              {(propertySearch || propertyApprovalFilter !== 'all' || propertyActiveFilter !== 'all' || propertyCategoryFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setPropertySearch('');
                    setPropertyApprovalFilter('all');
                    setPropertyActiveFilter('all');
                    setPropertyCategoryFilter('all');
                  }}
                  className="text-xs text-emerald-800 font-bold hover:underline px-2"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Properties Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Property</th>
                    <th className="p-4">Category / Type</th>
                    <th className="p-4">Monthly Rent</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Approval</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProperties.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400">
                        No property listings match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProperties.map((prop) => {
                      const isAct = prop.isActive !== undefined ? prop.isActive : true;
                      const isApp = prop.approvalStatus === 'approved';
                      const isPen = prop.approvalStatus === 'pending';

                      return (
                        <tr key={prop._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={prop.featuredImage || prop.images?.[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=150&q=80'}
                                alt={prop.title}
                                className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-slate-200"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 line-clamp-1">{prop.title}</p>
                                <span className="text-[11px] text-slate-500">
                                  Owner: <strong>{prop.owner?.name || prop.host?.name || 'Owner'}</strong> ({prop.owner?.email || prop.host?.email || 'verified'})
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="font-semibold text-slate-800 block">{prop.category || 'Residential'}</span>
                            <span className="text-[11px] text-slate-400">{prop.propertyType}</span>
                          </td>

                          <td className="p-4 font-black text-emerald-800 text-sm">
                            {formatINR(prop.rentPerMonth || prop.price || 0, false)}/mo
                          </td>

                          <td className="p-4 text-slate-600">
                            {prop.location?.city || prop.address?.city || 'Kochi'}, Kerala
                          </td>

                          <td className="p-4">
                            <Badge
                              variant={isApp ? 'success' : isPen ? 'warning' : 'danger'}
                              size="sm"
                              className="capitalize font-bold"
                            >
                              {prop.approvalStatus || 'pending'}
                            </Badge>
                          </td>

                          <td className="p-4">
                            <Badge
                              variant={isAct ? 'success' : 'default'}
                              size="sm"
                              className="capitalize font-bold"
                            >
                              {isAct ? 'Active' : 'Deactivated'}
                            </Badge>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Review / Inspect button */}
                              <Button
                                variant="outline"
                                size="sm"
                                icon={Eye}
                                onClick={() => setReviewProperty(prop)}
                                title="Review and Inspect Listing Details"
                              >
                                Review
                              </Button>

                              {/* Quick Approve if pending */}
                              {isPen && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={CheckCircle}
                                  onClick={() => handleApproveProperty(prop._id)}
                                  title="Approve Listing"
                                >
                                  Approve
                                </Button>
                              )}

                              {/* Toggle Activate / Deactivate button */}
                              <button
                                type="button"
                                onClick={() => handleToggleActiveProperty(prop._id, isAct)}
                                className={`p-2 rounded-xl text-xs font-bold border transition-colors ${isAct
                                  ? 'border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300'
                                  : 'border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                                  }`}
                                title={isAct ? 'Deactivate listing' : 'Activate listing (Live)'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteProperty(prop._id)}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition-colors"
                                title="Delete Property"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PENDING REVIEWS & MODERATION TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <span className="font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700" />
              {pendingPropertiesList.length} Property Submissions Pending Verification
            </span>
            <span className="text-amber-800">Review images, lease terms, and ownership before approving.</span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Submission</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Owner</th>
                    <th className="p-4">Monthly Rent</th>
                    <th className="p-4">Location</th>
                    <th className="p-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingPropertiesList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400">
                        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        All property listings have been reviewed! No submissions currently pending.
                      </td>
                    </tr>
                  ) : (
                    pendingPropertiesList.map((prop) => (
                      <tr key={prop._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={prop.featuredImage || prop.images?.[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=150&q=80'}
                              alt={prop.title}
                              className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-slate-200"
                            />
                            <div>
                              <p className="font-bold text-slate-900 line-clamp-1">{prop.title}</p>
                              <span className="text-[11px] text-slate-400">
                                Submitted on {formatDateIndian(prop.createdAt)}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <Badge variant="primary" size="sm">
                            {prop.category || 'Residential'}
                          </Badge>
                        </td>

                        <td className="p-4 font-semibold text-slate-800">
                          {prop.owner?.name || prop.host?.name || 'Owner'}
                        </td>

                        <td className="p-4 font-black text-emerald-800">
                          {formatINR(prop.rentPerMonth || prop.price || 0, false)}/mo
                        </td>

                        <td className="p-4 text-slate-600">
                          {prop.location?.city || prop.address?.city || 'Kochi'}, Kerala
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Eye}
                              onClick={() => setReviewProperty(prop)}
                            >
                              Inspect
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              icon={CheckCircle}
                              onClick={() => handleApproveProperty(prop._id)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              icon={XCircle}
                              onClick={() => handleRejectProperty(prop._id)}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FLAGGED & REPORTED CONTENT */}
      {/* ========================================================================= */}
      {activeTab === 'flagged' && (
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 flex items-center justify-between">
            <span className="font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              {flaggedPropertiesList.length} Items Flagged for Policy / Trust Review
            </span>
            <span className="text-rose-700">Investigate reports and deactivate violating listings if necessary.</span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Reported Listing</th>
                    <th className="p-4">Flag Reason</th>
                    <th className="p-4">Owner</th>
                    <th className="p-4">Current Status</th>
                    <th className="p-4 text-right">Remediation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {flaggedPropertiesList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400">
                        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        No content currently flagged! Platform is fully compliant.
                      </td>
                    </tr>
                  ) : (
                    flaggedPropertiesList.map((prop) => (
                      <tr key={prop._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={prop.featuredImage || prop.images?.[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=150&q=80'}
                              alt={prop.title}
                              className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-slate-200"
                            />
                            <div>
                              <p className="font-bold text-slate-900 line-clamp-1">{prop.title}</p>
                              <span className="text-[11px] text-slate-400">
                                {prop.location?.city || prop.address?.city || 'Kochi'}, Kerala
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-rose-700 font-semibold">
                          {prop.flagReason || 'Reported by users for verification'}
                        </td>

                        <td className="p-4 font-semibold text-slate-800">
                          {prop.owner?.name || prop.host?.name || 'Owner'}
                        </td>

                        <td className="p-4">
                          <Badge variant={prop.isActive ? 'warning' : 'default'} size="sm">
                            {prop.isActive ? 'Active (Live)' : 'Deactivated'}
                          </Badge>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Eye}
                              onClick={() => setReviewProperty(prop)}
                            >
                              Inspect
                            </Button>
                            <Button
                              variant={prop.isActive ? 'danger' : 'primary'}
                              size="sm"
                              onClick={() => handleToggleActiveProperty(prop._id, prop.isActive)}
                            >
                              {prop.isActive ? 'Deactivate Listing' : 'Restore (Active)'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleFlagProperty(prop._id, true)}
                            >
                              Dismiss Flag
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: USER ACCOUNTS TABLE WITH SEARCH & ROLE FILTER */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* User Search & Role Filter Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users by name, email, or phone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter Role:</span>
              {['All', 'Admin', 'Owner', 'Renter'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${userRoleFilter === r
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Contact Email</th>
                    <th className="p-4">Phone Number</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400">
                        No registered users match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isAdm = (u.role || '').toLowerCase() === 'admin';
                      const isOwn = (u.role || '').toLowerCase() === 'owner' || (u.role || '').toLowerCase() === 'host';

                      return (
                        <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  u.avatar ||
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                                }
                                alt={u.name}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200"
                              />
                              <div>
                                <span className="font-bold text-slate-900 block">{u.name}</span>
                                <span className="text-[11px] text-slate-400">
                                  Joined: {formatDateIndian(u.createdAt)}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 text-slate-600">{u.email}</td>

                          <td className="p-4 text-slate-600 font-mono text-xs">
                            {u.phone || '+91 98470 XXXXX'}
                          </td>

                          <td className="p-4">
                            <Badge
                              variant={isAdm ? 'danger' : isOwn ? 'primary' : 'default'}
                              size="sm"
                              className="uppercase font-bold"
                            >
                              {isOwn ? 'Owner' : u.role}
                            </Badge>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                icon={UserCheck}
                                onClick={() => {
                                  setChangeRoleUser(u);
                                  setNewSelectedRole(u.role || 'Renter');
                                }}
                              >
                                Edit Role
                              </Button>

                              {!isAdm && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u._id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: BOOKINGS TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search bookings by tenant, property, or owner..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:outline-none focus:border-emerald-700"
              >
                <option value="all">All Statuses ({safeBookings.length})</option>
                <option value="pending">Pending Review ({safeBookings.filter((b) => b.status === 'pending').length})</option>
                <option value="confirmed">Confirmed ({safeBookings.filter((b) => b.status === 'confirmed').length})</option>
                <option value="rejected">Rejected ({safeBookings.filter((b) => b.status === 'rejected').length})</option>
                <option value="cancelled">Cancelled ({safeBookings.filter((b) => b.status === 'cancelled').length})</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Lease ID</th>
                    <th className="p-4">Property</th>
                    <th className="p-4">Tenant</th>
                    <th className="p-4">Owner / Landlord</th>
                    <th className="p-4">Move-In</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Monthly Rent</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-slate-400">
                        No platform bookings matching your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => {
                      const adminEmail = (user?.email || 'admin@nestora.com').toLowerCase().trim();
                const adminId = String(user?._id || '');
                const propOwnerEmail = (b.property?.owner?.email || b.property?.host?.email || '').toLowerCase().trim();
                const bookingOwnerEmail = (b.owner?.email || b.host?.email || '').toLowerCase().trim();
                const bookingOwnerId = String(b.owner?._id || b.owner || b.property?.owner?._id || b.property?.owner || '');

                const isOwnerAdmin =
                (bookingOwnerEmail && bookingOwnerEmail === adminEmail) ||
                (propOwnerEmail && propOwnerEmail === adminEmail) ||
                (adminId && bookingOwnerId === adminId) ||
                (b.owner?.role || '').toLowerCase() === 'admin' ||
                (b.property?.owner?.role || '').toLowerCase() === 'admin';

                return (
                <tr key={b._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 font-bold text-emerald-800 font-mono">
                    #{String(b._id || '').slice(-6).toUpperCase()}
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-900 block line-clamp-1">
                      {b.property?.title || 'Nestora Residence'}
                    </span>
                    {isOwnerAdmin && (
                      <span className="inline-block px-1.5 py-0.5 mt-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                        Admin Listing
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-800 block">
                      {b.user?.name || b.renter?.name || 'Renter'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {b.user?.email || b.renter?.email || 'tenant@nestora.com'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">
                    <span className="font-medium text-slate-800 block">
                      {b.owner?.name || b.host?.name || 'Owner'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {b.owner?.email || b.host?.email || 'owner@nestora.com'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">
                    {formatDateIndian(b.checkIn || b.moveInDate)}
                  </td>
                  <td className="p-4 text-slate-600">
                    {b.duration || 11} Months
                  </td>
                  <td className="p-4 font-black text-slate-900">
                    {formatINR(b.monthlyRent || b.property?.rentPerMonth || b.totalAmount || 25000)}/mo
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={
                        b.status === 'confirmed'
                          ? 'success'
                          : b.status === 'rejected' || b.status === 'cancelled'
                            ? 'danger'
                            : 'warning'
                      }
                      size="sm"
                      className="capitalize font-bold"
                    >
                      {b.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {isOwnerAdmin ? (
                        b.status === 'pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(b._id, 'confirmed')}
                              title="Approve booking on your admin property"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 transition-colors flex items-center gap-1 font-bold text-[11px] px-2.5"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(b._id, 'rejected')}
                              title="Reject booking on your admin property"
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-900 transition-colors flex items-center gap-1 font-bold text-[11px] px-2.5"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No action needed</span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          Owner Managed
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
                );
                    })
                  )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
  )
}

{/* ========================================================================= */ }
{/* MODAL 1: PROPERTY REVIEW & INSPECTION MODAL */ }
{/* ========================================================================= */ }
{
  reviewProperty && (
    <Modal
      isOpen={!!reviewProperty}
      onClose={() => setReviewProperty(null)}
      title="Listing Inspection &amp; Moderation Review"
    >
      <div className="space-y-5">
        {/* Main Preview Image */}
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100">
          <img
            src={reviewProperty.featuredImage || reviewProperty.images?.[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'}
            alt={reviewProperty.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white text-xs font-black uppercase">
              {reviewProperty.category || 'Residential'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/95 text-slate-800 text-xs font-bold shadow-sm">
              {reviewProperty.propertyType}
            </span>
          </div>
        </div>

        {/* Title & Location */}
        <div>
          <h3 className="text-lg font-bold text-slate-900">{reviewProperty.title}</h3>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-800" />
            {reviewProperty.location?.address || reviewProperty.address?.street || 'Prime Location'},{' '}
            {reviewProperty.location?.city || reviewProperty.address?.city || 'Kochi'}, Kerala
          </p>
        </div>

        {/* Key Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3.5 rounded-xl text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Monthly Rent</span>
            <span className="font-black text-emerald-800 text-sm">
              {formatINR(reviewProperty.rentPerMonth || reviewProperty.price || 0, false)}/mo
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Bedrooms</span>
            <span className="font-bold text-slate-800">
              {reviewProperty.specifications?.bedrooms || 2} Beds
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Bathrooms</span>
            <span className="font-bold text-slate-800">
              {reviewProperty.specifications?.bathrooms || 2} Baths
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Approval Status</span>
            <Badge
              variant={
                reviewProperty.approvalStatus === 'approved'
                  ? 'success'
                  : reviewProperty.approvalStatus === 'rejected'
                    ? 'danger'
                    : 'warning'
              }
              size="sm"
              className="capitalize font-bold"
            >
              {reviewProperty.approvalStatus || 'pending'}
            </Badge>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1 text-xs">
          <span className="font-bold text-slate-700 block">Description:</span>
          <p className="text-slate-600 leading-relaxed max-h-28 overflow-y-auto bg-slate-50 p-3 rounded-xl border border-slate-100">
            {reviewProperty.description}
          </p>
        </div>

        {/* Owner Info */}
        <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-800 block">
              Owner: {reviewProperty.owner?.name || reviewProperty.host?.name || 'Verified Landlord'}
            </span>
            <span className="text-slate-500">
              {reviewProperty.owner?.email || reviewProperty.host?.email || 'owner@nestora.com'} • {reviewProperty.owner?.phone || '+91 98470 12345'}
            </span>
          </div>
          <Link to={`/properties/${reviewProperty._id}`} target="_blank">
            <Button variant="ghost" size="sm" icon={ExternalLink}>
              Public Page
            </Button>
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleToggleFlagProperty(reviewProperty._id, Boolean(reviewProperty.isFlagged))}
            className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
          >
            <Flag className="w-3.5 h-3.5" />
            {reviewProperty.isFlagged ? 'Remove Flag' : 'Flag Listing'}
          </button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setReviewProperty(null)}>
              Close
            </Button>
            {reviewProperty.approvalStatus !== 'rejected' && (
              <Button
                variant="danger"
                size="sm"
                icon={XCircle}
                onClick={() => handleRejectProperty(reviewProperty._id)}
              >
                Reject
              </Button>
            )}
            {reviewProperty.approvalStatus !== 'approved' && (
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle}
                onClick={() => handleApproveProperty(reviewProperty._id)}
              >
                Approve Listing
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

{/* ========================================================================= */ }
{/* MODAL 2: CHANGE USER ROLE MODAL */ }
{/* ========================================================================= */ }
{
  changeRoleUser && (
    <Modal
      isOpen={!!changeRoleUser}
      onClose={() => setChangeRoleUser(null)}
      title={`Update User Role: ${changeRoleUser.name}`}
    >
      <form onSubmit={handleUpdateRole} className="space-y-4">
        <p className="text-xs text-slate-500">
          Select the system access level for <strong>{changeRoleUser.email}</strong>.
        </p>

        <div className="space-y-2">
          {['Renter', 'Owner', 'Admin'].map((roleOption) => (
            <label
              key={roleOption}
              className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${newSelectedRole === roleOption
                ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="userRole"
                  value={roleOption}
                  checked={newSelectedRole === roleOption}
                  onChange={(e) => setNewSelectedRole(e.target.value)}
                  className="text-emerald-700 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold">{roleOption}</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {roleOption === 'Admin'
                  ? 'Full platform control'
                  : roleOption === 'Owner'
                    ? 'Can publish & manage properties'
                    : 'Can browse & submit rental leases'}
              </span>
            </label>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <Button variant="outline" size="sm" type="button" onClick={() => setChangeRoleUser(null)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" icon={CheckCircle}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}
    </div >
  );
};

export default AdminDashboard;
