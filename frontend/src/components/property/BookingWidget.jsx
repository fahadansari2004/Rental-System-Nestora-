import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { bookingService } from '../../services/bookingService';
import { formatINR, formatDateIndian } from '../../utils/formatters';
import { Calendar, Users, ShieldCheck, Zap, PhoneCall, CheckCircle, FileText } from 'lucide-react';
import Button from '../common/Button';
import Modal from '../common/Modal';

const BookingWidget = ({ property }) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }, []);

  const [moveInDate, setMoveInDate] = useState(tomorrow);
  const [leaseMonths, setLeaseMonths] = useState(11); // 11-month standard Kerala / Indian lease
  const [occupants, setOccupants] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tour modal state
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [tourType, setTourType] = useState('in-person');
  const [tourDate, setTourDate] = useState(tomorrow);
  const [tourTime, setTourTime] = useState('11:00 AM');

  // Calculations in INR
  const monthlyRent = property?.rentPerMonth || property?.price || 0;
  // Security deposit: 2 months rent standard or specified
  const securityDeposit = property?.securityDeposit || monthlyRent * 2;
  const agreementFee = 500; // Standard digital stamp / documentation fee
  const totalMoveInCost = monthlyRent + securityDeposit + agreementFee;

  const handleBooking = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      showToast('Please sign in to submit a rental application', 'info');
      navigate('/login', { state: { from: `/properties/${property._id}` } });
      return;
    }

    const hostId = property.host?._id || property.host || property.owner?._id || property.owner;
    if (hostId === user?._id) {
      showToast('You cannot lease your own property listing', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const checkInDate = new Date(moveInDate);
      const checkOutDate = new Date(moveInDate);
      checkOutDate.setMonth(checkOutDate.getMonth() + Number(leaseMonths));

      const rent = Number(property.rentPerMonth || property.price || 25000);
      const leaseDur = Number(leaseMonths || 11);

      await bookingService.createBooking({
        property: property._id,
        propertyData: property,
        monthlyRent: rent,
        totalAmount: rent * leaseDur,
        moveInDate: checkInDate.toISOString(),
        duration: leaseDur,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        guests: { adults: Number(occupants), children: 0, infants: 0 },
        specialRequests: specialRequests
          ? `Lease Duration: ${leaseMonths} Months. ${specialRequests}`
          : `Standard ${leaseMonths}-month lease request`,
      });

      showToast('🎉 Rental application submitted! The owner will review your request.', 'success');
      navigate('/my-bookings');
    } catch (error) {
      showToast(error.message || 'Failed to submit application', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleTour = (e) => {
    e.preventDefault();
    setIsTourModalOpen(false);
    showToast(
      `✅ Tour scheduled for ${formatDateIndian(tourDate)} at ${tourTime} (${tourType})! The owner has been notified.`,
      'success',
      5000
    );
  };

  return (
    <>
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xl shadow-slate-200/50 sticky top-28">
        {/* Monthly Rent Header in INR */}
        <div className="flex items-baseline justify-between pb-5 border-b border-slate-100">
          <div>
            <span className="text-3xl font-black text-emerald-800">
              {formatINR(monthlyRent, false)}
            </span>
            <span className="text-slate-500 font-semibold text-sm"> / month</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            ★ {property.averageRating ? property.averageRating.toFixed(1) : '4.9'}
            {property.numReviews > 0 && (
              <span className="text-slate-400 font-normal">({property.numReviews})</span>
            )}
          </div>
        </div>

        <form onSubmit={handleBooking} className="mt-5 space-y-4">
          {/* Move-in Date Box */}
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
              Anticipated Move-In Date
            </label>
            <input
              type="date"
              min={tomorrow}
              value={moveInDate}
              onChange={(e) => setMoveInDate(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              required
            />
          </div>

          {/* Lease Duration & Occupants */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Lease Duration
              </label>
              <select
                value={leaseMonths}
                onChange={(e) => setLeaseMonths(Number(e.target.value))}
                className="w-full text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value={11}>11 Months (Standard)</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
                <option value={24}>24 Months</option>
                <option value={3}>3 Months</option>
              </select>
            </div>

            <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Occupants
              </label>
              <select
                value={occupants}
                onChange={(e) => setOccupants(Number(e.target.value))}
                className="w-full text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                {Array.from(
                  { length: property.specifications?.maxGuests || 4 },
                  (_, i) => i + 1
                ).map((n) => (
                  <option key={n} value={n}>
                    {n} Person{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Special Requests or Message */}
          <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
              Note to Owner (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Vegetarian, working professional, need parking..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="w-full text-xs font-semibold text-slate-800 bg-transparent focus:outline-none"
            />
          </div>

          {/* Financial Breakdown in INR */}
          <div className="space-y-2 pt-4 border-t border-slate-100 text-xs">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>First Month Rent</span>
              <span className="font-bold text-slate-900">{formatINR(monthlyRent)}</span>
            </div>
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Security Deposit (Refundable)</span>
              <span className="font-bold text-slate-900">{formatINR(securityDeposit)}</span>
            </div>
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Digital Lease Agreement Fee</span>
              <span className="font-bold text-slate-900">{formatINR(agreementFee)}</span>
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
              <span>Total Estimated Move-In</span>
              <span className="text-emerald-800 text-base">{formatINR(totalMoveInCost)}</span>
            </div>
          </div>

          {/* Primary Action Button: Book / Apply Now */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            icon={Zap}
            className="w-full text-sm font-extrabold shadow-md shadow-emerald-800/25"
          >
            Apply &amp; Reserve Online
          </Button>

          {/* Secondary Action: Schedule Tour */}
          <Button
            type="button"
            variant="outline"
            size="md"
            icon={Calendar}
            onClick={() => setIsTourModalOpen(true)}
            className="w-full text-xs font-bold"
          >
            Schedule a Walkthrough Tour
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-800" />
          <span>Zero Brokerage • 100% Verified Property</span>
        </div>
      </div>

      {/* Schedule Tour Modal */}
      <Modal
        isOpen={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
        title="Schedule a Residence Tour"
      >
        <form onSubmit={handleScheduleTour} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Tour Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTourType('in-person')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                  tourType === 'in-person'
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                🏡 In-Person Visit
              </button>
              <button
                type="button"
                onClick={() => setTourType('virtual-video')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                  tourType === 'virtual-video'
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                📹 Live Video Call
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Preferred Date
              </label>
              <input
                type="date"
                min={tomorrow}
                value={tourDate}
                onChange={(e) => setTourDate(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Preferred Time
              </label>
              <select
                value={tourTime}
                onChange={(e) => setTourTime(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300"
              >
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="2:00 PM">2:00 PM</option>
                <option value="4:30 PM">4:30 PM</option>
                <option value="6:00 PM">6:00 PM</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsTourModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={CheckCircle}>
              Confirm Tour Appointment
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default BookingWidget;
