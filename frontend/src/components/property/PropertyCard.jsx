import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Star,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Users,
  Wind,
  Utensils,
  Briefcase,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatINR, formatArea } from '../../utils/formatters';

const PropertyCard = ({ property, viewMode = 'grid' }) => {
  if (!property) return null;
  const deletedIds = JSON.parse(localStorage.getItem('nestora_deleted_properties') || '[]');
  const pid = String(property._id || property.id || '');
  const cid = String(property.customId || '');
  if (deletedIds.includes(pid) || (cid && deletedIds.includes(cid))) {
    return null;
  }

  const { isAuthenticated, isFavorite, toggleFavorite } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isSaved = isFavorite(property._id);

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast('Please sign in to save properties to your wishlist', 'info');
      navigate('/login');
      return;
    }

    try {
      const res = await toggleFavorite(property._id);
      showToast(
        res.isFavorite ? 'Saved to your wishlist!' : 'Removed from wishlist',
        'success'
      );
    } catch {
      showToast('Could not update favorites', 'error');
    }
  };

  const imageSrc =
    property.images?.[0] ||
    property.featuredImage ||
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80';

  const category = property.category || 'Residential';
  const rent = property.rentPerMonth || property.price || 0;

  // Category badge colors
  const getBadgeStyle = () => {
    if (category === 'Rooms & PG') return 'bg-indigo-700 text-white';
    if (category === 'Commercial') return 'bg-amber-700 text-white';
    return 'bg-emerald-800 text-white';
  };

  if (viewMode === 'list') {
    return (
      <div className="group relative flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300">
        {/* Left: Image Container */}
        <Link
          to={`/properties/${property._id}`}
          className="relative w-full md:w-80 aspect-[16/10] md:aspect-auto overflow-hidden bg-slate-100 shrink-0"
        >
          <img
            src={imageSrc}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />

          <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 items-center">
            <span
              className={`px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg shadow-md ${getBadgeStyle()}`}
            >
              {category}
            </span>
            <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white/95 backdrop-blur-md text-slate-800 shadow-md">
              {property.propertyType}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 shadow-md transition-all hover:scale-110 active:scale-95"
            title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-600 hover:text-rose-500'
              }`}
            />
          </button>
        </Link>

        {/* Right: Content */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="flex items-center gap-1 font-semibold text-slate-700 truncate max-w-[70%]">
                <MapPin className="w-3.5 h-3.5 text-emerald-800 flex-shrink-0" />
                <span>
                  {property.location?.city || property.address?.city || 'Kochi'},{' '}
                  {property.location?.state || property.address?.state || 'Kerala'}
                </span>
              </span>

              <span className="flex items-center gap-1 font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/70 text-[11px]">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {property.averageRating ? property.averageRating.toFixed(1) : '4.9'}
                {property.numReviews > 0 && (
                  <span className="text-slate-400 font-normal">({property.numReviews})</span>
                )}
              </span>
            </div>

            <Link to={`/properties/${property._id}`}>
              <h3 className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors text-lg leading-snug">
                {property.title}
              </h3>
            </Link>

            <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
              {property.description}
            </p>

            {/* Category Specs */}
            {category === 'Residential' && (
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600 mt-3">
                <span className="font-bold text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded">
                  {property.residentialSpecs?.bhk || `${property.specifications?.bedrooms || 2} BHK`}
                </span>
                <span className="flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5 text-slate-400" />
                  {property.residentialSpecs?.bedrooms || property.specifications?.bedrooms || 2} Beds
                </span>
                <span className="flex items-center gap-1">
                  <Bath className="w-3.5 h-3.5 text-slate-400" />
                  {property.residentialSpecs?.bathrooms || property.specifications?.bathrooms || 2} Baths
                </span>
                <span className="flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                  {formatArea(property.residentialSpecs?.areaSqFt || property.specifications?.areaSqFt || 1200)}
                </span>
                {property.residentialSpecs?.furnishing && (
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                    {property.residentialSpecs.furnishing}
                  </span>
                )}
              </div>
            )}

            {category === 'Rooms & PG' && (
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 mt-3">
                <span className="flex items-center gap-1 bg-indigo-50 text-indigo-900 px-2.5 py-0.5 rounded font-bold">
                  <Users className="w-3 h-3" />
                  {property.roomSpecs?.occupancy || 'Single'}
                </span>
                <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                  <Wind className="w-3 h-3 text-slate-500" />
                  {property.roomSpecs?.airConditioning || 'AC Room'}
                </span>
                {property.roomSpecs?.foodInclusion && (
                  <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                    <Utensils className="w-3 h-3 text-slate-500" />
                    {property.roomSpecs?.foodInclusion}
                  </span>
                )}
                {property.roomSpecs?.genderPreference && (
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                    {property.roomSpecs.genderPreference}
                  </span>
                )}
              </div>
            )}

            {category === 'Commercial' && (
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 mt-3">
                <span className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded font-bold">
                  <Maximize2 className="w-3 h-3" />
                  {formatArea(property.commercialSpecs?.carpetAreaSqFt || property.specifications?.areaSqFt || 1500)}
                </span>
                {property.commercialSpecs?.floor && (
                  <span className="bg-slate-100 px-2 py-0.5 rounded">
                    {property.commercialSpecs.floor}
                  </span>
                )}
                {property.commercialSpecs?.suitableFor && (
                  <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                    <Briefcase className="w-3 h-3 text-slate-500" />
                    {property.commercialSpecs.suitableFor}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Pricing & CTA */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block -mb-0.5">
                Monthly Rent
              </span>
              <span className="text-xl font-black text-emerald-800">
                {formatINR(rent, false)}
              </span>
              <span className="text-xs text-slate-500 font-medium">/month</span>
            </div>

            <Link
              to={`/properties/${property._id}`}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-all duration-200 shadow-sm"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Default: Grid Card
  return (
    <div className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300">
      {/* Property Image Container */}
      <Link
        to={`/properties/${property._id}`}
        className="block relative aspect-[4/3] overflow-hidden bg-slate-100"
      >
        <img
          src={imageSrc}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Category & Property Type Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 items-center">
          <span
            className={`px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg shadow-md ${getBadgeStyle()}`}
          >
            {category}
          </span>
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white/95 backdrop-blur-md text-slate-800 shadow-md">
            {property.propertyType}
          </span>
        </div>

        {/* Wishlist / Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 shadow-md transition-all hover:scale-110 active:scale-95"
          title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-600 hover:text-rose-500'
            }`}
          />
        </button>
      </Link>

      {/* Property Card Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Location & Star Rating */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="flex items-center gap-1 font-semibold text-slate-700 truncate max-w-[70%]">
              <MapPin className="w-3.5 h-3.5 text-emerald-800 flex-shrink-0" />
              <span>
                {property.location?.city || property.address?.city || 'Kochi'},{' '}
                {property.location?.state || property.address?.state || 'Kerala'}
              </span>
            </span>

            <span className="flex items-center gap-1 font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/70 text-[11px]">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {property.averageRating ? property.averageRating.toFixed(1) : '4.9'}
              {property.numReviews > 0 && (
                <span className="text-slate-400 font-normal">({property.numReviews})</span>
              )}
            </span>
          </div>

          {/* Title */}
          <Link to={`/properties/${property._id}`}>
            <h3 className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1 text-base leading-snug">
              {property.title}
            </h3>
          </Link>

          {/* Category-Specific Specifications */}
          {category === 'Residential' && (
            <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mt-2.5">
              <span className="font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded">
                {property.residentialSpecs?.bhk || `${property.specifications?.bedrooms || 2} BHK`}
              </span>
              <span className="flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-slate-400" />
                {property.residentialSpecs?.bedrooms || property.specifications?.bedrooms || 2} Beds
              </span>
              <span className="flex items-center gap-1">
                <Bath className="w-3.5 h-3.5 text-slate-400" />
                {property.residentialSpecs?.bathrooms || property.specifications?.bathrooms || 2} Baths
              </span>
              <span className="flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                {formatArea(property.residentialSpecs?.areaSqFt || property.specifications?.areaSqFt || 1200)}
              </span>
            </div>
          )}

          {category === 'Rooms & PG' && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 mt-2.5">
              <span className="flex items-center gap-1 bg-indigo-50 text-indigo-900 px-2 py-0.5 rounded font-bold">
                <Users className="w-3 h-3" />
                {property.roomSpecs?.occupancy || 'Single'}
              </span>
              <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                <Wind className="w-3 h-3 text-slate-500" />
                {property.roomSpecs?.airConditioning || 'AC Room'}
              </span>
              {property.roomSpecs?.foodInclusion && (
                <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[130px]">
                  <Utensils className="w-3 h-3 text-slate-500" />
                  {property.roomSpecs?.foodInclusion}
                </span>
              )}
            </div>
          )}

          {category === 'Commercial' && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 mt-2.5">
              <span className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-0.5 rounded font-bold">
                <Maximize2 className="w-3 h-3" />
                {formatArea(property.commercialSpecs?.carpetAreaSqFt || property.specifications?.areaSqFt || 1500)}
              </span>
              {property.commercialSpecs?.floor && (
                <span className="bg-slate-100 px-2 py-0.5 rounded">
                  {property.commercialSpecs.floor}
                </span>
              )}
              {property.commercialSpecs?.suitableFor && (
                <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[160px]">
                  <Briefcase className="w-3 h-3 text-slate-500" />
                  {property.commercialSpecs.suitableFor}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pricing: Monthly Rent in INR & View Details Action */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block -mb-0.5">
              Monthly Rent
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-800">
              {formatINR(rent, false)}
            </span>
            <span className="text-xs text-slate-500 font-medium">/mo</span>
          </div>

          <Link
            to={`/properties/${property._id}`}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-800 hover:text-white text-slate-800 font-bold text-xs transition-all duration-200 shadow-xs"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
