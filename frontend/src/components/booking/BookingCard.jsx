import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Ban, ExternalLink, Download, FileText } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatINR, formatDateIndian } from '../../utils/formatters';
import { downloadReceiptPdf } from '../../utils/receiptPdfGenerator';

const BookingCard = ({ booking, onCancel, onViewReceipt, isHostView = false }) => {
  const property = booking.property || {};
  const statusVariant = {
    confirmed: 'success',
    pending: 'warning',
    rejected: 'danger',
    cancelled: 'danger',
    completed: 'primary',
  }[booking.status?.toLowerCase()] || 'default';

  const rentAmount = property.rentPerMonth || property.price || booking.basePrice || booking.totalAmount || 0;

  const handleDownloadReceipt = () => {
    const rent = property.rentPerMonth || property.price || booking.basePrice || rentAmount || 25000;
    const deposit = property.securityDeposit || rent * 2;
    const stamp = 500;
    const total = booking.totalAmount || (rent + deposit + stamp);
    const recId = `REC-${String(booking._id || booking.id || Date.now()).slice(-8).toUpperCase()}`;

    downloadReceiptPdf({
      receiptNumber: recId,
      tenantName: booking.user?.name || booking.renter?.name || 'Verified Tenant',
      tenantEmail: booking.user?.email || booking.renter?.email || 'renter@nestora.com',
      ownerName: property.owner?.name || booking.owner?.name || 'Verified Property Owner',
      ownerEmail: property.owner?.email || booking.owner?.email || 'host@nestora.com',
      propertyTitle: property.title || 'Nestora Verified Residence',
      propertyAddress: property.address?.city 
        ? `${property.address.street || ''}, ${property.address.city}, Kerala`
        : (property.location || 'Kochi, Kerala'),
      moveInDate: formatDateIndian(booking.checkIn || booking.moveInDate || new Date()),
      durationMonths: booking.duration || 11,
      monthlyRent: rent,
      securityDeposit: deposit,
      stampDuty: stamp,
      totalPaid: total,
      bookingId: String(booking._id || booking.id || recId),
    });
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row">
      {/* Property Thumbnail */}
      <div className="w-full md:w-64 h-48 md:h-auto bg-slate-100 flex-shrink-0 relative">
        <img
          src={
            property.images?.[0] ||
            property.featuredImage ||
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80'
          }
          alt={property.title || 'Property'}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <Badge variant={statusVariant} size="sm" className="capitalize font-bold shadow-sm">
            {booking.status}
          </Badge>
        </div>
      </div>

      {/* Booking Details */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Lease #{booking._id?.slice(-6).toUpperCase()}
            </span>
            <span className="text-xs text-slate-400">
              Submitted on {formatDateIndian(booking.createdAt)}
            </span>
          </div>

          <Link
            to={`/properties/${property._id}`}
            className="text-lg font-bold text-slate-900 hover:text-emerald-800 transition-colors line-clamp-1"
          >
            {property.title || 'Nestora Verified Residence'}
          </Link>

          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 mb-4">
            <MapPin className="w-3.5 h-3.5 text-emerald-800" />
            {property.location?.city || property.address?.city || 'Kochi'}, Kerala
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl text-xs mb-4">
            <div>
              <span className="text-slate-400 block font-medium">Move-In Date</span>
              <span className="font-bold text-slate-800">
                {formatDateIndian(booking.checkIn || booking.moveInDate)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Lease Term</span>
              <span className="font-bold text-slate-800">
                {booking.duration || '11 Months'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Occupants</span>
              <span className="font-bold text-slate-800">
                {booking.guests?.adults || 1} Person(s)
              </span>
            </div>
          </div>
        </div>

        {/* Footer info & action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div>
            <span className="text-xs text-slate-400 block">Monthly Rent</span>
            <span className="text-xl font-black text-emerald-800">
              {formatINR(rentAmount, false)}/mo
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {booking.status === 'confirmed' && (
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={onViewReceipt ? () => onViewReceipt(booking) : handleDownloadReceipt}
                className="flex-1 sm:flex-none text-emerald-800 border-emerald-300 hover:bg-emerald-50"
              >
                PDF Receipt
              </Button>
            )}

            <Link to={`/properties/${property._id}`} className="flex-1 sm:flex-none">
              <Button variant="outline" size="sm" icon={ExternalLink} className="w-full sm:w-auto">
                View Residence
              </Button>
            </Link>

            {(booking.status === 'confirmed' || booking.status === 'pending') && onCancel && (
              <Button
                variant="danger"
                size="sm"
                icon={Ban}
                onClick={() => onCancel(booking._id)}
                className="flex-1 sm:flex-none"
              >
                {booking.status === 'pending' ? 'Cancel Request' : 'Cancel Lease'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
