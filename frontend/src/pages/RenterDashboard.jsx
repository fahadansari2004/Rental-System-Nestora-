import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { bookingService } from '../services/bookingService';
import { propertyService } from '../services/propertyService';
import { formatINR, formatDateIndian } from '../utils/formatters';
import PropertyCard from '../components/property/PropertyCard';
import BookingCard from '../components/booking/BookingCard';
import Spinner from '../components/common/Loader';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import {
  Home,
  Heart,
  Calendar,
  CreditCard,
  Compass,
  FileCheck,
  MapPin,
  Clock,
  Download,
  Printer,
} from 'lucide-react';
import { downloadReceiptPdf, printReceiptWindow } from '../utils/receiptPdfGenerator';

const RenterDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState([]);
  const [savedProperties, setSavedProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leases'); // 'leases' | 'saved' | 'tours'
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const loadRenterData = async () => {
    setIsLoading(true);
    try {
      const [bookingsData, allPropsData] = await Promise.all([
        bookingService.getMyBookings().catch(() => []),
        propertyService.getProperties({ limit: 20 }).catch(() => ({ properties: [] })),
      ]);

      const rawBookings = Array.isArray(bookingsData)
        ? bookingsData
        : Array.isArray(bookingsData?.bookings)
        ? bookingsData.bookings
        : [];

      // Filter out bookings referencing properties that were permanently deleted by admin
      const deletedIds = JSON.parse(localStorage.getItem('nestora_deleted_properties') || '[]');
      const userEmail = (user?.email || '').toLowerCase().trim();
      const userId = String(user?._id || '');

      const bookingsList = rawBookings.filter((b) => {
        // Ownership check: for new users, only show their own bookings
        const rEmail = (b.renter?.email || b.user?.email || '').toLowerCase().trim();
        const rId = String(b.renter?._id || b.user?._id || b.renter || b.user || '');
        const isMine = (userId && rId === userId) || (userEmail && rEmail === userEmail);
        if (!isMine) {
          return false;
        }

        // Deleted property check
        const pid = String(b.property?._id || b.property?.id || b.property || '');
        const cid = String(b.property?.customId || '');
        return !deletedIds.includes(pid) && !deletedIds.includes(cid);
      });

      setBookings(bookingsList);

      // Filter saved properties: exclude any properties deleted by admin
      const allProps = Array.isArray(allPropsData?.properties)
        ? allPropsData.properties
        : Array.isArray(allPropsData)
        ? allPropsData
        : [];

      const userSavedIds = (user?.savedProperties || []).map((p) =>
        typeof p === 'object' ? p._id : p
      );
      const filteredSaved = allProps.filter((p) => {
        const pid = String(p._id || p.id || '');
        const cid = String(p.customId || '');
        return userSavedIds.includes(p._id) && !deletedIds.includes(pid) && !deletedIds.includes(cid);
      });
      setSavedProperties(filteredSaved);
    } catch (error) {
      console.error('Renter data load error:', error);
      showToast('Could not load renter dashboard data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRenterData();
  }, [user]);

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation / lease application?')) return;
    try {
      await bookingService.cancelBooking(id);
      showToast('Reservation has been cancelled', 'info');
      loadRenterData();
    } catch (error) {
      showToast(error.message || 'Could not cancel booking', 'error');
    }
  };

  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeSaved = Array.isArray(savedProperties) ? savedProperties : [];

  const activeBookings = safeBookings.filter((b) => b.status === 'confirmed');
  const monthlyTotal = activeBookings.reduce(
    (sum, b) => sum + (b.property?.rentPerMonth || b.property?.price || b.monthlyRent || b.basePrice || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-900 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
            TENANT PORTAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">
            Welcome back, {user?.name || 'Renter'}!
          </h1>
          <p className="text-xs text-emerald-100 max-w-md">
            Manage your active leases, view verified deposit receipts, and browse saved properties across Kerala.
          </p>
        </div>

        <div className="z-10">
          <Link to="/explore">
            <Button
              variant="accent"
              size="md"
              icon={Compass}
              className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold"
            >
              Browse Residences
            </Button>
          </Link>
        </div>

        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-800/40 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Key Metrics in INR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Active Leases
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {activeBookings.length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <Home className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Monthly Outflow
            </span>
            <span className="text-2xl font-black text-emerald-800 mt-1 block">
              {formatINR(monthlyTotal)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Wishlist Saved
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {safeSaved.length}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Heart className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Next Rent Due
            </span>
            <span className="text-sm font-black text-slate-800 mt-2 block">
              1st of Next Month
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('leases')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'leases'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          My Rentals &amp; Leases ({safeBookings.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'saved'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Saved Wishlist ({safeSaved.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tours')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'tours'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Scheduled Walkthroughs (0)
        </button>
      </div>

      {/* TAB 1: RENTALS & LEASES */}
      {activeTab === 'leases' && (
        <div className="space-y-4">
          {safeBookings.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-500 max-w-md mx-auto">
              <Home className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-800">No active leases yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Explore verified listings across Kochi, Kakkanad, and Trivandrum.
              </p>
              <Link to="/explore">
                <Button variant="primary" size="sm">
                  Explore Stays
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {safeBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="flex gap-4 items-center">
                    <img
                      src={
                        booking.property?.images?.[0] ||
                        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80'
                      }
                      alt="Property"
                      className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 line-clamp-1">
                          {booking.property?.title || 'Nestora Residence'}
                        </span>
                        <Badge
                          variant={
                            booking.status === 'confirmed'
                              ? 'success'
                              : booking.status === 'rejected' || booking.status === 'cancelled'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                          className="capitalize font-bold"
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {booking.property?.location?.city || booking.property?.address?.city || 'Kochi'}, Kerala
                      </p>
                      <p className="text-xs text-slate-600 font-semibold">
                        Move-in: {formatDateIndian(booking.checkIn || booking.moveInDate)} • Term: {booking.duration || '11 Months'}
                      </p>
                      <p className="text-xs font-black text-emerald-800">
                        Monthly Rent: {formatINR(booking.property?.rentPerMonth || booking.property?.price || booking.monthlyRent || 25000)}/mo
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full md:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={FileCheck}
                      onClick={() => setSelectedReceipt(booking)}
                    >
                      Lease Receipt
                    </Button>
                    {booking.status === 'confirmed' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancelBooking(booking._id)}
                      >
                        Cancel Lease
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAVED WISHLIST */}
      {activeTab === 'saved' && (
        <div>
          {safeSaved.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-500 max-w-md mx-auto">
              <Heart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-800">Your wishlist is currently empty</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Click the heart icon on any listing to save residences here.
              </p>
              <Link to="/explore">
                <Button variant="primary" size="sm">
                  Browse Properties
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {safeSaved.map((prop) => (
                <PropertyCard key={prop._id} property={prop} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SCHEDULED TOURS */}
      {activeTab === 'tours' && (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-500 max-w-md mx-auto space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-1" />
          <p className="font-bold text-slate-800">No walkthroughs scheduled</p>
          <p className="text-xs text-slate-400">
            When you request an in-person or virtual property tour with a host, your appointment details will appear here.
          </p>
          <Link to="/explore">
            <Button variant="primary" size="sm">
              Explore Available Properties
            </Button>
          </Link>
        </div>
      )}

      {/* LEASE RECEIPT MODAL */}
      {selectedReceipt && (
        <Modal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          title="Residential Lease Agreement & Deposit Receipt"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Receipt Number:</span>
                <span>REC-{selectedReceipt._id?.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tenant:</span>
                <span>{selectedReceipt.user?.name || user?.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Property:</span>
                <span className="font-semibold text-slate-900">{selectedReceipt.property?.title}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Move-in Date:</span>
                <span>{formatDateIndian(selectedReceipt.checkIn || selectedReceipt.moveInDate)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Monthly Rent:</span>
                <span className="font-bold text-emerald-800">
                  {formatINR(selectedReceipt.property?.rentPerMonth || selectedReceipt.property?.price || selectedReceipt.monthlyRent || 25000)}/month
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Refundable Security Deposit:</span>
                <span>{formatINR((selectedReceipt.property?.rentPerMonth || 25000) * 2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Agreement &amp; Digital Stamp Fee:</span>
                <span>₹500</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                <span>Total Amount Paid:</span>
                <span className="text-emerald-800 font-black">
                  {formatINR((selectedReceipt.property?.rentPerMonth || 25000) * 3 + 500)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                icon={Printer}
                onClick={() => {
                  const rent = selectedReceipt.property?.rentPerMonth || selectedReceipt.property?.price || selectedReceipt.monthlyRent || 25000;
                  const deposit = (selectedReceipt.property?.rentPerMonth || 25000) * 2;
                  const stamp = 500;
                  const total = (selectedReceipt.property?.rentPerMonth || 25000) * 3 + 500;
                  const recId = `REC-${String(selectedReceipt._id || selectedReceipt.id || '').slice(-8).toUpperCase()}`;

                  printReceiptWindow({
                    receiptNumber: recId,
                    tenantName: selectedReceipt.user?.name || user?.name || 'Verified Tenant',
                    tenantEmail: selectedReceipt.user?.email || user?.email || 'renter@nestora.com',
                    ownerName: selectedReceipt.property?.owner?.name || selectedReceipt.owner?.name || 'Verified Property Owner',
                    ownerEmail: selectedReceipt.property?.owner?.email || selectedReceipt.owner?.email || 'host@nestora.com',
                    propertyTitle: selectedReceipt.property?.title || 'Nestora Verified Residence',
                    propertyAddress: selectedReceipt.property?.address?.city
                      ? `${selectedReceipt.property.address.street || ''}, ${selectedReceipt.property.address.city}, Kerala`
                      : (selectedReceipt.property?.location || 'Kochi, Kerala'),
                    moveInDate: formatDateIndian(selectedReceipt.checkIn || selectedReceipt.moveInDate || new Date()),
                    durationMonths: selectedReceipt.duration || 11,
                    monthlyRent: rent,
                    securityDeposit: deposit,
                    stampDuty: stamp,
                    totalPaid: total,
                    bookingId: String(selectedReceipt._id || selectedReceipt.id || recId),
                  });
                }}
              >
                Print / Save PDF
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Download}
                onClick={() => {
                  const rent = selectedReceipt.property?.rentPerMonth || selectedReceipt.property?.price || selectedReceipt.monthlyRent || 25000;
                  const deposit = (selectedReceipt.property?.rentPerMonth || 25000) * 2;
                  const stamp = 500;
                  const total = (selectedReceipt.property?.rentPerMonth || 25000) * 3 + 500;
                  const recId = `REC-${String(selectedReceipt._id || selectedReceipt.id || '').slice(-8).toUpperCase()}`;

                  const ok = downloadReceiptPdf({
                    receiptNumber: recId,
                    tenantName: selectedReceipt.user?.name || user?.name || 'Verified Tenant',
                    tenantEmail: selectedReceipt.user?.email || user?.email || 'renter@nestora.com',
                    ownerName: selectedReceipt.property?.owner?.name || selectedReceipt.owner?.name || 'Verified Property Owner',
                    ownerEmail: selectedReceipt.property?.owner?.email || selectedReceipt.owner?.email || 'host@nestora.com',
                    propertyTitle: selectedReceipt.property?.title || 'Nestora Verified Residence',
                    propertyAddress: selectedReceipt.property?.address?.city
                      ? `${selectedReceipt.property.address.street || ''}, ${selectedReceipt.property.address.city}, Kerala`
                      : (selectedReceipt.property?.location || 'Kochi, Kerala'),
                    moveInDate: formatDateIndian(selectedReceipt.checkIn || selectedReceipt.moveInDate || new Date()),
                    durationMonths: selectedReceipt.duration || 11,
                    monthlyRent: rent,
                    securityDeposit: deposit,
                    stampDuty: stamp,
                    totalPaid: total,
                    bookingId: String(selectedReceipt._id || selectedReceipt.id || recId),
                  });

                  if (ok) {
                    showToast(`Receipt ${recId} downloaded as PDF!`, 'success');
                    setSelectedReceipt(null);
                  } else {
                    showToast('Failed to download PDF. Please try again.', 'error');
                  }
                }}
              >
                Download PDF
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedReceipt(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RenterDashboard;
