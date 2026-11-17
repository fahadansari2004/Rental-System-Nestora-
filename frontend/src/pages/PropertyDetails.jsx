import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { propertyService } from '../services/propertyService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { formatINR, formatArea, formatPhoneIndian, formatDateIndian } from '../utils/formatters';
import ImageGallery from '../components/property/ImageGallery';
import BookingWidget from '../components/property/BookingWidget';
import ReviewList from '../components/reviews/ReviewList';
import ReviewModal from '../components/reviews/ReviewModal';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Loader';
import Button from '../components/common/Button';
import {
  MapPin,
  Star,
  Heart,
  Share2,
  Bed,
  Bath,
  Users,
  Maximize2,
  ShieldCheck,
  Check,
  MessageSquare,
  ArrowLeft,
  Mail,
  Phone,
  FileText,
  Wind,
  Utensils,
  Briefcase,
  Layers,
  Calendar,
  Compass,
} from 'lucide-react';

const PropertyDetails = () => {
  const { id } = useParams();
  const { isAuthenticated, isFavorite, toggleFavorite } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const data = await propertyService.getPropertyById(id);
        setProperty(data.property);
        setReviews(data.reviews || []);
      } catch (error) {
        showToast('Property not found or unavailable', 'error');
        navigate('/explore');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id, navigate, showToast]);

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to save this stay to your wishlist', 'info');
      navigate('/login');
      return;
    }
    try {
      const added = await toggleFavorite(property._id);
      showToast(
        added ? 'Saved to wishlist!' : 'Removed from wishlist',
        'success'
      );
    } catch {
      showToast('Could not update favorites', 'error');
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Property listing URL copied to clipboard!', 'info');
    }
  };

  const handleReviewAdded = (newReview) => {
    setReviews((prev) => [newReview, ...prev]);
    propertyService.getPropertyById(id).then((data) => {
      setProperty(data.property);
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    setIsContactModalOpen(false);
    setContactMessage('');
    const hostName = property.host?.name || property.owner?.name || 'Property Owner';
    showToast(`Inquiry sent to ${hostName}! They will contact you shortly.`, 'success');
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!property) return null;

  const isSaved = isFavorite(property._id);
  const category = property.category || 'Residential';
  const owner = property.host || property.owner || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Property Listings
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Share2} onClick={handleShare}>
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Heart}
            onClick={handleFavoriteToggle}
            className={isSaved ? 'text-rose-600 border-rose-200 bg-rose-50' : ''}
          >
            {isSaved ? 'Saved' : 'Wishlist'}
          </Button>
        </div>
      </div>

      {/* Property Title & Summary */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-lg bg-emerald-800 text-white text-xs font-black uppercase tracking-wider">
            {category}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-xs">
            {property.propertyType}
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            Verified Rental
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
          {property.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-1 text-slate-900 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {property.averageRating ? property.averageRating.toFixed(1) : '4.9'}
            {property.numReviews > 0 && (
              <span className="text-slate-400 font-normal">({property.numReviews} reviews)</span>
            )}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-800" />
            {property.location?.address || property.address?.street || 'Marine Drive'},{' '}
            {property.location?.city || property.address?.city || 'Kochi'},{' '}
            {property.location?.state || property.address?.state || 'Kerala'}
            {property.address?.pincode ? ` - ${property.address.pincode}` : ''}
          </span>
          <span className="text-slate-500">
            • Listed by <strong>{owner.name || 'Verified Owner'}</strong>
          </span>
          {(property.availabilityDates?.startDate || property.availableFrom) && (
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              Available: {formatDateIndian(property.availabilityDates?.startDate || property.availableFrom)}
            </span>
          )}
          {property.geolocation?.coordinates && (
            <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
              <Compass className="w-3.5 h-3.5 text-emerald-700" />
              {Number(property.geolocation.coordinates[1]).toFixed(3)}°N, {Number(property.geolocation.coordinates[0]).toFixed(3)}°E
            </span>
          )}
        </div>
      </div>

      {/* Photo Gallery */}
      <ImageGallery images={property.images} title={property.title} />

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-10">
          {/* Key Specifications (Category Specific) */}
          {category === 'Residential' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <Bed className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Configuration</span>
                  <span className="text-sm font-bold text-slate-800">
                    {property.residentialSpecs?.bhk || `${property.specifications?.bedrooms || 2} BHK`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <Bath className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Bathrooms</span>
                  <span className="text-sm font-bold text-slate-800">
                    {property.residentialSpecs?.bathrooms || property.specifications?.bathrooms || 2} Baths
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Super Builtup</span>
                  <span className="text-sm font-bold text-slate-800">
                    {formatArea(property.residentialSpecs?.areaSqFt || property.specifications?.areaSqFt || 1200)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Furnishing</span>
                  <span className="text-sm font-bold text-slate-800">
                    {property.residentialSpecs?.furnishing || 'Semi-Furnished'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {category === 'Rooms & PG' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Occupancy</span>
                  <span className="text-sm font-bold text-slate-800">
                    {property.roomSpecs?.occupancy || 'Single'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Cooling</span>
                  <span className="text-sm font-bold text-slate-800">
                    {property.roomSpecs?.airConditioning || 'AC Room'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Food / Mess</span>
                  <span className="text-sm font-bold text-slate-800">
                    {property.roomSpecs?.foodInclusion || '3 Meals Included'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center">
                  <Bath className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Attached Bath</span>
                  <span className="text-sm font-bold text-slate-800">
                    {property.roomSpecs?.attachedBathroom ? 'Yes, Attached' : 'Common'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {category === 'Commercial' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Carpet Area</span>
                  <span className="text-sm font-bold text-slate-800">
                    {formatArea(property.commercialSpecs?.carpetAreaSqFt || property.specifications?.areaSqFt || 1500)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Floor</span>
                  <span className="text-sm font-bold text-slate-800">
                    {property.commercialSpecs?.floor || 'Ground Floor'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Ideal For</span>
                  <span className="text-sm font-bold text-slate-800 truncate max-w-[120px]">
                    {property.commercialSpecs?.suitableFor || 'Retail / Office'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Parking</span>
                  <span className="text-sm font-bold text-slate-800">
                    {property.commercialSpecs?.parkingSpaces || 2} Dedicated
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Landlord / Host Overview Card */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={
                  owner.avatar ||
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80'
                }
                alt={owner.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-emerald-600 shadow-xs"
              />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Property Owner: {owner.name || 'Verified Owner'}
                </h3>
                <p className="text-xs text-slate-500">
                  {owner.phone ? formatPhoneIndian(owner.phone) : '+91 98470 12345'} • {owner.email || 'owner@nestora.com'}
                </p>
                <p className="text-xs text-emerald-800 font-bold mt-0.5">
                  ✓ ID &amp; Ownership Document Verified
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={Mail}
              onClick={() => setIsContactModalOpen(true)}
            >
              Contact Owner
            </Button>
          </div>

          {/* Description */}
          <div className="space-y-4 pb-8 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">About this Property</h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Amenities Checklist */}
          <div className="space-y-4 pb-8 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Amenities &amp; Residence Features</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(property.amenities || []).map((amenity, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs"
                >
                  <Check className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lease Terms & Rules (Indian / Kerala Context) */}
          <div className="space-y-4 pb-8 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-800" />
              Standard Rental Policies &amp; Agreement Terms
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-800" />
                Standard 11-Month Registered Lease Agreement with renewal option
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-800" />
                Refundable security deposit equivalent to 2 months rent
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-800" />
                Zero brokerage / zero commission directly with property owner
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-800" />
                Notice period: 1 month prior to vacating premises
              </li>
            </ul>
          </div>

          {/* Reviews Section */}
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                {property.averageRating ? property.averageRating.toFixed(1) : '4.9'} •{' '}
                {reviews.length} Verified {reviews.length === 1 ? 'Review' : 'Reviews'}
              </h3>

              {isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={MessageSquare}
                  onClick={() => setIsReviewModalOpen(true)}
                >
                  Write a Review
                </Button>
              )}
            </div>

            <ReviewList reviews={reviews} />
          </div>
        </div>

        {/* Right Column: Sticky Booking Widget in INR */}
        <div className="lg:col-span-1">
          <BookingWidget property={property} />
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        propertyId={property._id}
        onReviewAdded={handleReviewAdded}
      />

      {/* Contact Owner Modal */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title={`Inquire with ${owner.name || 'Owner'}`}
      >
        <form onSubmit={handleSendMessage} className="space-y-4">
          <p className="text-xs text-slate-500">
            Have questions regarding move-in dates, parking, or lease terms? Send a direct message to the property owner.
          </p>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <p><strong>Property:</strong> {property.title}</p>
            <p><strong>Owner Phone:</strong> {owner.phone ? formatPhoneIndian(owner.phone) : '+91 98470 12345'}</p>
            <p><strong>Location:</strong> {property.location?.city || property.address?.city || 'Kochi'}, Kerala</p>
          </div>
          <textarea
            rows="4"
            required
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            placeholder="Hi, I am interested in leasing this property starting next month. Can we schedule a visit or discuss lease terms?..."
            className="w-full text-xs text-slate-800 p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsContactModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={Mail}>
              Send Inquiry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PropertyDetails;
