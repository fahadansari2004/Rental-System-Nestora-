import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import BookingCard from '../components/booking/BookingCard';
import Spinner from '../components/common/Loader';
import { useToast } from '../hooks/useToast';
import { formatINR, formatDateIndian } from '../utils/formatters';
import { Calendar, Compass, FileCheck, Download, Printer } from 'lucide-react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { downloadReceiptPdf, printReceiptWindow } from '../utils/receiptPdfGenerator';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const { showToast } = useToast();

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const data = await bookingService.getMyBookings();
      const rawList = Array.isArray(data)
        ? data
        : Array.isArray(data?.bookings)
        ? data.bookings
        : Array.isArray(data?.data)
        ? data.data
        : [];

      // Sort newest first
      const sorted = [...rawList].sort((a, b) => {
        const da = new Date(a.createdAt || a.checkIn || a.moveInDate || 0);
        const db = new Date(b.createdAt || b.checkIn || b.moveInDate || 0);
        return db - da;
      });

      setBookings(sorted);
    } catch (error) {
      showToast('Unable to fetch bookings from server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    const conf = window.confirm('Are you sure you wish to cancel this rental booking reservation?');
    if (!conf) return;

    try {
      await bookingService.cancelBooking(bookingId);
      showToast('Reservation has been cancelled', 'info');
      fetchBookings();
    } catch (error) {
      showToast(error.message || 'Could not cancel booking', 'error');
    }
  };

  const getReceiptPayload = (booking) => {
    if (!booking) return null;
    const rent =
      booking.property?.rentPerMonth ||
      booking.property?.price ||
      booking.basePrice ||
      booking.monthlyRent ||
      25000;
    const deposit = booking.property?.securityDeposit || rent * 2;
    const stamp = 500;
    const total = booking.totalAmount || rent + deposit + stamp;
    const recId = `REC-${String(booking._id || booking.id || Date.now()).slice(-8).toUpperCase()}`;

    return {
      receiptNumber: recId,
      tenantName: booking.user?.name || booking.renter?.name || 'Verified Tenant',
      tenantEmail: booking.user?.email || booking.renter?.email || 'renter@nestora.com',
      ownerName: booking.property?.owner?.name || booking.owner?.name || 'Verified Property Owner',
      ownerEmail: booking.property?.owner?.email || booking.owner?.email || 'host@nestora.com',
      propertyTitle: booking.property?.title || 'Nestora Verified Residence',
      propertyAddress: booking.property?.address?.city
        ? `${booking.property?.address?.street || ''}, ${booking.property.address.city}, Kerala`
        : booking.property?.location || 'Kochi, Kerala',
      moveInDate: formatDateIndian(booking.checkIn || booking.moveInDate || new Date()),
      durationMonths: booking.duration || 11,
      monthlyRent: rent,
      securityDeposit: deposit,
      stampDuty: stamp,
      totalPaid: total,
      bookingId: String(booking._id || booking.id || recId),
    };
  };

  const handleDownloadReceipt = (booking) => {
    const payload = getReceiptPayload(booking);
    if (!payload) return;
    const ok = downloadReceiptPdf(payload);
    if (ok) {
      showToast(`Receipt ${payload.receiptNumber} downloaded as PDF!`, 'success');
      setSelectedReceipt(null);
    } else {
      showToast('Downloading failed. Opening print window...', 'info');
      printReceiptWindow(payload);
    }
  };

  const handlePrintReceipt = (booking) => {
    const payload = getReceiptPayload(booking);
    if (payload) {
      printReceiptWindow(payload);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const safeBookings = Array.isArray(bookings) ? bookings : [];

  const filteredBookings = safeBookings.filter((b) => {
    const s = (b.status || '').toLowerCase();
    if (filterStatus === 'all') return true;
    return s === filterStatus;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-800 block mb-1">
            TENANT LEASE OVERVIEW
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            My Reservations &amp; Leases
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track move-in dates, download official lease receipts to PDF, and manage active rental agreements in Kerala.
          </p>
        </div>

        <Link to="/explore">
          <Button variant="outline" size="sm" icon={Compass}>
            Explore Residences
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'confirmed', 'rejected', 'cancelled'].map((st) => {
          const count =
            st === 'all'
              ? safeBookings.length
              : safeBookings.filter((b) => (b.status || '').toLowerCase() === st).length;

          return (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                filterStatus === st
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st} ({count})
            </button>
          );
        })}
      </div>

      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Bookings Found</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            You don't have any reservations under this category. Start planning your next lease today.
          </p>
          <Link to="/explore">
            <Button variant="primary" size="md" icon={Compass}>
              Browse Verified Residences
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              onCancel={handleCancelBooking}
              onViewReceipt={() => setSelectedReceipt(booking)}
            />
          ))}
        </div>
      )}

      {/* Lease Receipt Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          title="Official Lease & Deposit Agreement Receipt"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Receipt Number:</span>
                <span>REC-{String(selectedReceipt._id || selectedReceipt.id || '').slice(-8).toUpperCase()}</span>
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
                  {formatINR(
                    selectedReceipt.property?.rentPerMonth ||
                      selectedReceipt.property?.price ||
                      selectedReceipt.basePrice ||
                      25000
                  )}/mo
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Refundable Deposit:</span>
                <span>
                  {formatINR(
                    selectedReceipt.property?.securityDeposit ||
                      (selectedReceipt.property?.rentPerMonth || 25000) * 2
                  )}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>e-Stamp & Processing:</span>
                <span>₹500</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                <span>Total Amount Paid:</span>
                <span className="text-emerald-800">
                  {formatINR(
                    selectedReceipt.totalAmount ||
                      (selectedReceipt.property?.rentPerMonth || 25000) * 3 + 500
                  )}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                icon={Printer}
                onClick={() => handlePrintReceipt(selectedReceipt)}
              >
                Print / Save PDF
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Download}
                onClick={() => handleDownloadReceipt(selectedReceipt)}
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

export default MyBookings;
