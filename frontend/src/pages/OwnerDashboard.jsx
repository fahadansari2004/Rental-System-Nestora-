import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  IndianRupee,
  Building2,
  CalendarCheck,
  TrendingUp,
  PlusCircle,
  ExternalLink,
  Users,
  CheckCircle,
  XCircle,
  ArrowRight,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Clock,
  FileText,
} from 'lucide-react';

const OwnerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingFilterTab, setBookingFilterTab] = useState('all'); // 'all' | 'pending' | 'confirmed' | 'rejected'
  const [selectedRenterBooking, setSelectedRenterBooking] = useState(null);
  const { showToast } = useToast();

  const loadOwnerDashboard = async () => {
    setIsLoading(true);
    try {
      const [statsData, hostBookings, myProps] = await Promise.all([
        userService.getHostStats().catch(() => ({
          totalEarnings: 0,
          totalListings: 0,
          properties: [],
          totalBookings: 0,
        })),
        bookingService.getHostBookings().catch(() => []),
        propertyService.getMyProperties().catch(() => []),
      ]);

      const propsList = Array.isArray(myProps)
        ? myProps
        : Array.isArray(myProps?.properties)
        ? myProps.properties
        : [];

      const bookingsList = Array.isArray(hostBookings)
        ? hostBookings
        : Array.isArray(hostBookings?.bookings)
        ? hostBookings.bookings
        : [];

      const confirmedList = bookingsList.filter(
        (b) => (b.status || '').toLowerCase() === 'confirmed'
      );

      const calculatedMonthlyYield = confirmedList.reduce((sum, b) => {
        const propId = String(b.property?._id || b.property?.id || b.property || '');
        const propCustomId = String(b.property?.customId || '');
        const propTitle = String(b.property?.title || '').toLowerCase().trim();
        const matchedProp = propsList.find(
          (p) =>
            String(p._id || p.id || '') === propId ||
            (propCustomId && String(p.customId || '') === propCustomId) ||
            (propTitle && String(p.title || '').toLowerCase().trim() === propTitle)
        );
        const rent = Number(
          matchedProp?.rentPerMonth ||
          matchedProp?.price ||
          b.property?.rentPerMonth ||
          b.property?.price ||
          b.monthlyRent ||
          (b.totalAmount && b.duration ? Math.round(b.totalAmount / b.duration) : b.totalAmount || 0)
        );
        return sum + (isNaN(rent) ? 0 : rent);
      }, 0);

      const finalMonthlyYield =
        calculatedMonthlyYield > 0
          ? calculatedMonthlyYield
          : Number(statsData?.totalEarnings || statsData?.monthlyRevenue || 0);

      const calculatedStats = {
        totalEarnings: finalMonthlyYield,
        monthlyRevenue: finalMonthlyYield,
        totalListings: propsList.length,
        properties: propsList,
        totalBookings: bookingsList.length,
        activeBookings: confirmedList.length,
      };

      setStats(calculatedStats);
      setProperties(propsList);
      setBookings(bookingsList);
    } catch (error) {
      console.error('Owner dashboard error:', error);
      showToast(error.message || 'Could not load owner analytics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerDashboard();
  }, []);

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      await bookingService.updateBookingStatus(bookingId, newStatus);
      const label =
        newStatus === 'confirmed'
          ? 'approved and confirmed'
          : newStatus === 'rejected'
          ? 'rejected'
          : newStatus;
      showToast(`Tenant booking ${label} successfully!`, 'success');
      if (selectedRenterBooking?._id === bookingId) {
        setSelectedRenterBooking((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      loadOwnerDashboard();
    } catch (error) {
      showToast(error.message || 'Failed to update reservation', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const safeProperties = Array.isArray(properties) ? properties : [];
  const safeBookings = Array.isArray(bookings) ? bookings : [];

  const occupancyRate =
    safeProperties.length > 0
      ? Math.min(
          100,
          Math.round(
            (safeBookings.filter((b) => (b.status || '').toLowerCase() === 'confirmed').length /
              safeProperties.length) *
              100
          )
        )
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="space-y-1 z-10">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
            PROPERTY OWNER HUB
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">
            Owner Management &amp; Analytics
          </h1>
          <p className="text-xs text-slate-400 max-w-md">
            Monitor monthly rental yields, review tenant applications across Kerala, and publish new property listings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <Link to="/my-properties">
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
            >
              Manage My Listings
            </Button>
          </Link>
          <Link to="/properties/new">
            <Button variant="primary" size="sm" icon={PlusCircle}>
              Add Property Listing
            </Button>
          </Link>
        </div>

        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-600/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Overview Stats Cards in INR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Monthly Revenue
            </span>
            <span className="text-2xl font-black text-emerald-800 mt-1 block">
              {formatINR(stats?.totalEarnings ?? 0)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <span className="text-xl font-black">₹</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Listed Properties
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {safeProperties.length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Rental Applications
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {safeBookings.length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Estimated Occupancy
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {occupancyRate}%
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Applications Left, Quick Listings Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Tenant Applications */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Incoming Tenant Applications &amp; Inquiries
              </h3>
              <p className="text-xs text-slate-500">
                Review applicant profiles, move-in dates, and approve or reject tenant lease requests.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
              {safeBookings.length} Total Applications
            </span>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Requests', count: safeBookings.length },
              { id: 'pending', label: 'Pending', count: safeBookings.filter((b) => (b.status || '').toLowerCase() === 'pending').length },
              { id: 'confirmed', label: 'Confirmed', count: safeBookings.filter((b) => (b.status || '').toLowerCase() === 'confirmed').length },
              { id: 'rejected', label: 'Rejected', count: safeBookings.filter((b) => (b.status || '').toLowerCase() === 'rejected').length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setBookingFilterTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  bookingFilterTab === tab.id
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200/70'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {safeBookings.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CalendarCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No applications received yet</p>
              <p className="text-xs">Incoming rental requests from prospective tenants will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {safeBookings
                .filter((b) => {
                  const s = (b.status || '').toLowerCase();
                  if (bookingFilterTab === 'all') return true;
                  return s === bookingFilterTab;
                })
                .map((booking) => {
                  const renter = booking.renter || booking.user || {};
                  const status = (booking.status || 'pending').toLowerCase();
                  const badgeVariant =
                    status === 'confirmed'
                      ? 'success'
                      : status === 'rejected' || status === 'cancelled'
                      ? 'danger'
                      : 'warning';

                  return (
                    <div
                      key={booking._id}
                      className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 transition-all shadow-xs space-y-4"
                    >
                      {/* Top Bar: Renter Info & Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              renter.avatar ||
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
                            }
                            alt={renter.name || 'Tenant'}
                            className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500/30"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm">
                                {renter.name || 'Prospective Tenant'}
                              </h4>
                              <Badge variant={badgeVariant} size="sm" className="capitalize">
                                {status === 'confirmed' ? 'Confirmed / Approved' : status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                              {renter.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  {renter.email}
                                </span>
                              )}
                              {renter.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {renter.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          icon={User}
                          onClick={() => setSelectedRenterBooking(booking)}
                          className="text-xs"
                        >
                          View Details
                        </Button>
                      </div>

                      {/* Middle: Property & Lease Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl text-xs">
                        <div>
                          <span className="text-slate-400 block font-medium">Applied Property</span>
                          <span className="font-bold text-slate-800 line-clamp-1">
                            {booking.property?.title || 'Nestora Verified Residence'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Move-In &amp; Duration</span>
                          <span className="font-bold text-slate-800">
                            {formatDateIndian(booking.checkIn || booking.moveInDate)} ({booking.duration || '11'} Months)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Monthly Rent</span>
                          <span className="font-black text-emerald-800">
                            {formatINR(booking.property?.rentPerMonth || booking.property?.price || booking.monthlyRent || 25000, false)}/month
                          </span>
                        </div>
                      </div>

                      {booking.specialRequests && (
                        <p className="text-xs text-slate-500 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                          <strong>Note from tenant:</strong> {booking.specialRequests}
                        </p>
                      )}

                      {/* Bottom Actions: Approve & Reject */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        {status === 'pending' && (
                          <>
                            <Button
                              variant="danger"
                              size="sm"
                              icon={XCircle}
                              onClick={() => handleUpdateBookingStatus(booking._id, 'rejected')}
                            >
                              Reject Request
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              icon={CheckCircle}
                              onClick={() => handleUpdateBookingStatus(booking._id, 'confirmed')}
                            >
                              Approve Booking
                            </Button>
                          </>
                        )}

                        {status === 'confirmed' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              Approved &amp; Reserved
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={XCircle}
                              onClick={() => handleUpdateBookingStatus(booking._id, 'rejected')}
                            >
                              Cancel Approval
                            </Button>
                          </div>
                        )}

                        {status === 'rejected' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                              <XCircle className="w-4 h-4 text-rose-600" />
                              Application Rejected
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateBookingStatus(booking._id, 'confirmed')}
                            >
                              Re-Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Right Col: Quick Listings Overview */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Your Listed Residences</h3>
              <Link to="/my-properties" className="text-xs font-bold text-emerald-800 hover:underline">
                View All &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {safeProperties.slice(0, 3).map((prop) => (
                <div
                  key={prop._id}
                  className="flex gap-3 items-center p-2 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <img
                    src={prop.featuredImage || prop.images?.[0]}
                    alt={prop.title}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs truncate">
                      {prop.title}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {prop.location?.city || prop.address?.city || 'Kochi'}, Kerala
                    </p>
                    <p className="text-xs font-black text-emerald-800 mt-1">
                      {formatINR(prop.rentPerMonth || prop.price || 0, false)}/mo
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/properties/new" className="block pt-2">
              <Button variant="outline" size="sm" icon={PlusCircle} className="w-full">
                Add Another Property
              </Button>
            </Link>
          </div>

          {/* Owner Protection Box */}
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-800" />
              <span>Owner Protection &amp; Lease Compliance</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every lease signed on Nestora includes verified tenant ID checks, standardized 11-month agreements, and 100% protected security deposit management.
            </p>
          </div>
        </div>
      </div>

      {/* Renter Details & Review Modal */}
      {selectedRenterBooking && (
        <Modal
          isOpen={!!selectedRenterBooking}
          onClose={() => setSelectedRenterBooking(null)}
          title="Tenant Lease Application Details"
        >
          <div className="space-y-5">
            {/* Applicant Profile */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <img
                src={
                  selectedRenterBooking.renter?.avatar ||
                  selectedRenterBooking.user?.avatar ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
                }
                alt={selectedRenterBooking.renter?.name || 'Tenant'}
                className="w-14 h-14 rounded-full object-cover border-2 border-emerald-600"
              />
              <div className="space-y-0.5">
                <h4 className="text-base font-bold text-slate-900">
                  {selectedRenterBooking.renter?.name || selectedRenterBooking.user?.name || 'Applicant'}
                </h4>
                <p className="text-xs text-slate-600">
                  {selectedRenterBooking.renter?.email || selectedRenterBooking.user?.email || 'renter@nestora.com'}
                </p>
                <p className="text-xs text-slate-600 font-semibold">
                  Phone: {selectedRenterBooking.renter?.phone || selectedRenterBooking.user?.phone || '+91 97455 88990'}
                </p>
              </div>
            </div>

            {/* Application Parameters */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Property:</span>
                <span className="font-bold text-slate-900 text-right">
                  {selectedRenterBooking.property?.title || 'Nestora Property'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Desired Move-In Date:</span>
                <span className="font-bold text-slate-900">
                  {formatDateIndian(selectedRenterBooking.moveInDate || selectedRenterBooking.checkIn)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Rental Duration:</span>
                <span className="font-bold text-slate-900">
                  {selectedRenterBooking.duration || 11} Months
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Monthly Rent:</span>
                <span className="font-black text-emerald-800">
                  {formatINR(selectedRenterBooking.property?.rentPerMonth || selectedRenterBooking.property?.price || selectedRenterBooking.monthlyRent || 25000)}/month
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Current Status:</span>
                <Badge
                  variant={
                    selectedRenterBooking.status === 'confirmed'
                      ? 'success'
                      : selectedRenterBooking.status === 'rejected'
                      ? 'danger'
                      : 'warning'
                  }
                  size="sm"
                  className="capitalize font-bold"
                >
                  {selectedRenterBooking.status}
                </Badge>
              </div>
            </div>

            {selectedRenterBooking.specialRequests && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <span className="font-bold text-slate-700 block">Tenant Notes &amp; Special Requests:</span>
                <p className="text-slate-600">{selectedRenterBooking.specialRequests}</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRenterBooking(null)}
              >
                Close
              </Button>
              {selectedRenterBooking.status !== 'rejected' && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={XCircle}
                  onClick={() => {
                    handleUpdateBookingStatus(selectedRenterBooking._id, 'rejected');
                    setSelectedRenterBooking(null);
                  }}
                >
                  Reject Booking
                </Button>
              )}
              {selectedRenterBooking.status !== 'confirmed' && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={CheckCircle}
                  onClick={() => {
                    handleUpdateBookingStatus(selectedRenterBooking._id, 'confirmed');
                    setSelectedRenterBooking(null);
                  }}
                >
                  Approve Booking
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OwnerDashboard;
