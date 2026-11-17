import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { propertyService } from '../services/propertyService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import Spinner from '../components/common/Loader';
import Badge from '../components/common/Badge';
import { compressImageFile, compressImageFiles } from '../utils/imageCompressor';
import {
  Building2,
  Sparkles,
  Plus,
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  X,
  IndianRupee,
  Home,
  Users,
  Store,
  MapPin,
  Calendar,
  Compass,
  CheckCircle,
  Clock,
  AlertTriangle,
  Power,
  ShieldCheck,
} from 'lucide-react';

const keralaCities = [
  'Kochi',
  'Ernakulam',
  'Kakkanad',
  'Thiruvananthapuram',
  'Kozhikode',
  'Thrissur',
  'Kottayam',
  'Alappuzha',
  'Kannur',
  'Palakkad',
  'Malappuram',
  'Kollam',
  'Bengaluru',
  'Chennai',
  'Hyderabad',
  'Mumbai',
  'Pune',
  'Delhi',
];

const cityCoordinates = {
  Kochi: { lat: 9.9312, lng: 76.2673 },
  Ernakulam: { lat: 9.9816, lng: 76.2999 },
  Kakkanad: { lat: 10.0159, lng: 76.3419 },
  Thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  Kozhikode: { lat: 11.2588, lng: 75.7804 },
  Thrissur: { lat: 10.5276, lng: 76.2144 },
  Kottayam: { lat: 9.5916, lng: 76.5222 },
  Alappuzha: { lat: 9.4981, lng: 76.3388 },
  Kannur: { lat: 11.8745, lng: 75.3704 },
  Palakkad: { lat: 10.7867, lng: 76.6548 },
  Malappuram: { lat: 11.051, lng: 76.0711 },
  Kollam: { lat: 8.8932, lng: 76.6141 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Delhi: { lat: 28.7041, lng: 77.1025 },
};

const indianAmenities = [
  '24/7 Security & Guard',
  'CCTV Surveillance',
  '100% Power Backup (Generator)',
  'Reserved Covered Car Parking',
  'High-Speed Fiber Wi-Fi',
  'Lift / Elevator',
  'Modular Kitchen',
  'Solar Water Heater',
  'Gated Community',
  'Rainwater Harvesting',
  'Air Conditioning',
  'Waste Management & Bio-Gas',
  'Gym / Fitness Area',
  'Swimming Pool',
  'Children Play Area',
  'Intercom Facility',
];

const presetDemoImages = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
];

const AddEditProperty = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user, isAdmin, switchRole } = useAuth();
  const { showToast } = useToast();

  const [category, setCategory] = useState('Residential');
  const [approvalStatus, setApprovalStatus] = useState('pending');
  const [isActive, setIsActive] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Residential',
    propertyType: 'Apartment',
    rentPerMonth: 25000,
    securityDeposit: 50000,
    location: {
      address: '',
      city: 'Kochi',
      state: 'Kerala',
      country: 'India',
      pincode: '682011',
    },
    geolocation: {
      latitude: 9.9312,
      longitude: 76.2673,
    },
    availabilityDates: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    },
    residentialSpecs: {
      bhk: '2 BHK',
      bedrooms: 2,
      bathrooms: 2,
      furnishing: 'Semi-Furnished',
      areaSqFt: 1200,
    },
    roomSpecs: {
      occupancy: 'Single',
      attachedBathroom: true,
      airConditioning: 'AC',
      foodInclusion: '3 Meals Included',
      genderPreference: 'Any',
    },
    commercialSpecs: {
      commercialType: 'Retail Shop',
      carpetAreaSqFt: 850,
      floor: 'Ground Floor',
      roadFrontageFeet: 25,
      parkingSpaces: 2,
      suitableFor: 'Retail Showroom / Clinic',
    },
    amenities: [
      '24/7 Security & Guard',
      '100% Power Backup (Generator)',
      'Reserved Covered Car Parking',
      'High-Speed Fiber Wi-Fi',
    ],
    images: presetDemoImages,
  });

  const [errors, setErrors] = useState({});
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);

  // Fetch and verify ownership for edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchProperty = async () => {
        try {
          const data = await propertyService.getPropertyById(id);
          const p = data.property;

          if (!p) {
            showToast('Property listing not found', 'error');
            navigate('/my-properties');
            return;
          }

          // Enforce ownership check: owners cannot edit another owner's property
          const ownerId = p.owner?._id || p.owner || p.host?._id || p.host;
          const ownerEmail = p.owner?.email || p.host?.email;
          const isCurrentOwner =
            !user ||
            isAdmin ||
            (user?._id && String(ownerId) === String(user._id)) ||
            (user?.email && ownerEmail && user.email.toLowerCase() === ownerEmail.toLowerCase()) ||
            !ownerId; // mock compatibility

          if (!isCurrentOwner && !isAdmin) {
            showToast('Access denied: You can only edit your own listed properties.', 'error');
            navigate('/my-properties');
            return;
          }

          const pCat = p.category || 'Residential';
          setCategory(pCat);
          setApprovalStatus(p.approvalStatus || 'pending');
          setIsActive(p.isActive !== undefined ? p.isActive : p.isAvailable !== false);

          const defaultCoords = cityCoordinates[p.address?.city || p.location?.city || 'Kochi'] || {
            lat: 9.9312,
            lng: 76.2673,
          };

          const lat =
            p.geolocation?.coordinates?.[1] ||
            p.geolocation?.latitude ||
            p.latitude ||
            defaultCoords.lat;
          const lng =
            p.geolocation?.coordinates?.[0] ||
            p.geolocation?.longitude ||
            p.longitude ||
            defaultCoords.lng;

          const startDate = p.availabilityDates?.startDate
            ? new Date(p.availabilityDates.startDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

          const endDate = p.availabilityDates?.endDate
            ? new Date(p.availabilityDates.endDate).toISOString().split('T')[0]
            : '';

          setFormData({
            title: p.title || '',
            description: p.description || '',
            category: pCat,
            propertyType:
              p.propertyType ||
              (pCat === 'Residential'
                ? 'Apartment'
                : pCat === 'Rooms & PG'
                ? 'Single Room'
                : 'Retail Shop'),
            rentPerMonth: p.rentPerMonth || p.price || 25000,
            securityDeposit: p.securityDeposit || (p.rentPerMonth || p.price || 25000) * 2,
            location: {
              address: p.location?.address || p.address?.street || '',
              city: p.location?.city || p.address?.city || 'Kochi',
              state: p.location?.state || p.address?.state || 'Kerala',
              country: 'India',
              pincode: p.location?.pincode || p.address?.zipCode || '682011',
            },
            geolocation: {
              latitude: Number(lat),
              longitude: Number(lng),
            },
            availabilityDates: {
              startDate,
              endDate,
            },
            residentialSpecs: p.residentialSpecs || {
              bhk: `${p.specifications?.bedrooms || 2} BHK`,
              bedrooms: p.specifications?.bedrooms || 2,
              bathrooms: p.specifications?.bathrooms || 2,
              furnishing: 'Semi-Furnished',
              areaSqFt: p.specifications?.areaSqFt || 1200,
            },
            roomSpecs: p.roomSpecs || {
              occupancy: 'Single',
              attachedBathroom: true,
              airConditioning: 'AC',
              foodInclusion: '3 Meals Included',
              genderPreference: 'Any',
            },
            commercialSpecs: p.commercialSpecs || {
              commercialType: p.propertyType || 'Retail Shop',
              carpetAreaSqFt: p.specifications?.areaSqFt || 850,
              floor: 'Ground Floor',
              roadFrontageFeet: 25,
              parkingSpaces: 2,
              suitableFor: 'Retail / Office',
            },
            amenities: p.amenities || [],
            images: p.images && p.images.length > 0 ? p.images : presetDemoImages,
          });
        } catch (error) {
          showToast('Could not load property details', 'error');
          navigate('/my-properties');
        } finally {
          setIsFetching(false);
        }
      };
      fetchProperty();
    }
  }, [id, isEditMode, navigate, showToast, user, isAdmin]);

  // Handle city selection change and update default coordinates
  const handleCityChange = (cityName) => {
    const coords = cityCoordinates[cityName] || { lat: 9.9312, lng: 76.2673 };
    setFormData((prev) => ({
      ...prev,
      location: { ...prev.location, city: cityName },
      geolocation: {
        latitude: coords.lat,
        longitude: coords.lng,
      },
    }));
  };

  const handleCategorySwitch = (cat) => {
    setCategory(cat);
    let defaultType = 'Apartment';
    if (cat === 'Rooms & PG') defaultType = 'Single Room';
    if (cat === 'Commercial') defaultType = 'Retail Shop';

    setFormData((prev) => ({
      ...prev,
      category: cat,
      propertyType: defaultType,
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleFilesBatch = async (filesList) => {
    const rawFiles = Array.from(filesList || []).filter(
      (f) => f && f.type && f.type.startsWith('image/')
    );

    if (rawFiles.length === 0) {
      showToast('Please select valid image files (JPG, PNG, WEBP)', 'error');
      return;
    }

    setIsProcessingPhotos(true);
    showToast(`Processing & optimizing ${rawFiles.length} photo(s) from your device...`, 'info', 2000);

    try {
      const compressedImages = await compressImageFiles(rawFiles, 1280, 1280, 0.82);

      if (compressedImages.length === 0) {
        showToast('No valid images could be processed', 'error');
        return;
      }

      setFormData((prev) => {
        // If the property currently only has the default 3 preset demo images, replace with user's real images
        const isOnlyDemo =
          prev.images.length === presetDemoImages.length &&
          presetDemoImages.every((demo) => prev.images.includes(demo));

        const baseImages = isOnlyDemo ? [] : prev.images;
        return {
          ...prev,
          images: [...baseImages, ...compressedImages],
        };
      });

      showToast(`Added ${compressedImages.length} optimized photo(s) successfully!`, 'success');
      if (errors.images) setErrors((prev) => ({ ...prev, images: null }));
    } catch (err) {
      console.error('File compression error:', err);
      showToast('Failed to optimize uploaded photos', 'error');
    } finally {
      setIsProcessingPhotos(false);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesBatch(e.target.files);
      e.target.value = ''; // Reset input so re-selecting same files triggers change
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, imageUrlInput.trim()],
    }));
    setImageUrlInput('');
    showToast('Image URL added', 'success');
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Comprehensive Form Validation
  const validateForm = () => {
    const errs = {};

    if (!formData.title.trim()) {
      errs.title = 'Property title is required';
    } else if (formData.title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters long';
    }

    if (!formData.description.trim()) {
      errs.description = 'Property description is required';
    } else if (formData.description.trim().length < 15) {
      errs.description = 'Please provide a more descriptive summary (min 15 characters)';
    }

    if (!formData.rentPerMonth || Number(formData.rentPerMonth) <= 0) {
      errs.rentPerMonth = 'Monthly rent must be greater than ₹0';
    }

    if (!formData.location.address.trim()) {
      errs.address = 'Street address or locality is required';
    }

    if (!formData.location.city.trim()) {
      errs.city = 'City is required';
    }

    const lat = Number(formData.geolocation.latitude);
    const lng = Number(formData.geolocation.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errs.latitude = 'Valid latitude between -90 and 90 is required';
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errs.longitude = 'Valid longitude between -180 and 180 is required';
    }

    if (!formData.availabilityDates.startDate) {
      errs.startDate = 'Move-in availability start date is required';
    }

    if (!formData.images || formData.images.length === 0) {
      errs.images = 'Please provide at least one high-quality property photo';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please correct the highlighted fields before submitting', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const lat = Number(formData.geolocation.latitude);
      const lng = Number(formData.geolocation.longitude);

      const submission = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category,
        propertyType: formData.propertyType,
        rentPerMonth: Number(formData.rentPerMonth),
        price: Number(formData.rentPerMonth),
        securityDeposit: Number(formData.securityDeposit),
        address: {
          street: formData.location.address.trim(),
          city: formData.location.city.trim(),
          state: formData.location.state.trim(),
          country: 'India',
          zipCode: formData.location.pincode.trim(),
          formattedAddress: `${formData.location.address.trim()}, ${formData.location.city.trim()}, ${formData.location.state.trim()}`,
        },
        location: {
          address: formData.location.address.trim(),
          city: formData.location.city.trim(),
          state: formData.location.state.trim(),
          country: 'India',
          pincode: formData.location.pincode.trim(),
        },
        geolocation: {
          type: 'Point',
          coordinates: [lng, lat], // GeoJSON order: [longitude, latitude]
          latitude: lat,
          longitude: lng,
        },
        latitude: lat,
        longitude: lng,
        availabilityDates: {
          startDate: new Date(formData.availabilityDates.startDate),
          endDate: formData.availabilityDates.endDate
            ? new Date(formData.availabilityDates.endDate)
            : null,
        },
        availableFrom: formData.availabilityDates.startDate,
        amenities: formData.amenities,
        images: formData.images,
        isActive,
        isAvailable: isActive,
        specifications: {
          bedrooms: formData.residentialSpecs.bedrooms || 1,
          bathrooms: formData.residentialSpecs.bathrooms || 1,
          areaSqFt:
            category === 'Residential'
              ? formData.residentialSpecs.areaSqFt
              : category === 'Commercial'
              ? formData.commercialSpecs.carpetAreaSqFt
              : 250,
          maxGuests: category === 'Rooms & PG' ? 2 : 4,
        },
        residentialSpecs: formData.residentialSpecs,
        roomSpecs: formData.roomSpecs,
        commercialSpecs: formData.commercialSpecs,
      };

      if (isEditMode) {
        await propertyService.updateProperty(id, submission);
        showToast('Property listing updated successfully!', 'success');
      } else {
        await propertyService.createProperty(submission);
        if (user?.role === 'Renter') {
          if (typeof switchRole === 'function') switchRole('Owner');
        }
        if (user?.role === 'Admin') {
          showToast('🎉 Property created and published live!', 'success');
        } else {
          showToast('🎉 Listing submitted! It is currently in "Pending Review" and will appear publicly on Explore once approved by Admin.', 'info');
        }
      }
      navigate('/my-properties');
    } catch (error) {
      showToast(error.message || 'Failed to save property listing', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Determine current status styling for edit mode
  const getStatusDisplay = () => {
    if (!isActive) {
      return {
        label: 'Deactivated (Paused)',
        desc: 'This listing is paused and hidden from public search.',
        variant: 'default',
        icon: Power,
        className: 'bg-slate-100 text-slate-700 border-slate-300',
      };
    }
    if (approvalStatus === 'approved') {
      return {
        label: 'Approved & Live',
        desc: 'Verified by Nestora and actively visible to prospective renters.',
        variant: 'success',
        icon: CheckCircle,
        className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      };
    }
    if (approvalStatus === 'rejected') {
      return {
        label: 'Rejected by Admin',
        desc: 'This listing requires updates before it can be published.',
        variant: 'danger',
        icon: AlertTriangle,
        className: 'bg-rose-50 text-rose-800 border-rose-300',
      };
    }
    return {
      label: 'Pending Review',
      desc: 'Submitted and awaiting admin verification. Modifications will remain in review.',
      variant: 'warning',
      icon: Clock,
      className: 'bg-amber-50 text-amber-800 border-amber-300',
    };
  };

  const statusInfo = getStatusDisplay();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link
        to="/my-properties"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Properties
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 block mb-1">
              {isEditMode ? 'MODIFY RESIDENCE' : 'PROPERTY OWNER PORTAL'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isEditMode ? 'Edit Rental Property' : 'List a New Property for Rent'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Fill in lease terms, geolocation coordinates, availability dates, and upload property images.
            </p>
          </div>

          {/* Status Badge in Edit Mode */}
          {isEditMode && (
            <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${statusInfo.className}`}>
              <StatusIcon className="w-5 h-5 flex-shrink-0" />
              <div>
                <span className="text-xs font-black uppercase tracking-wider block">
                  Status: {statusInfo.label}
                </span>
                <span className="text-[11px] opacity-80 block">{statusInfo.desc}</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* STEP 1: CATEGORY SELECTOR TABS */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Property Category
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleCategorySwitch('Residential')}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                  category === 'Residential'
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Home className="w-5 h-5 text-emerald-800" />
                <div>
                  <div className="font-black text-sm">Residential</div>
                  <div className="text-[11px] opacity-75">Apartments, Flats, Villas</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleCategorySwitch('Rooms & PG')}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                  category === 'Rooms & PG'
                    ? 'border-indigo-700 bg-indigo-50 text-indigo-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Users className="w-5 h-5 text-indigo-700" />
                <div>
                  <div className="font-black text-sm">Rooms &amp; PG</div>
                  <div className="text-[11px] opacity-75">Single, Shared, PG Rooms</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleCategorySwitch('Commercial')}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                  category === 'Commercial'
                    ? 'border-amber-700 bg-amber-50 text-amber-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Store className="w-5 h-5 text-amber-700" />
                <div>
                  <div className="font-black text-sm">Commercial</div>
                  <div className="text-[11px] opacity-75">Retail Shops, Offices</div>
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: BASIC OVERVIEW & RENT IN INR */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              1. Title, Type &amp; Monthly Rent (₹ INR)
            </h3>

            <div>
              <Input
                label="Property Title"
                placeholder={
                  category === 'Residential'
                    ? 'e.g. Skyline Luxury 3 BHK Apartment with Sea View'
                    : category === 'Rooms & PG'
                    ? 'e.g. Fully Furnished AC PG Room with Food near Infopark'
                    : 'e.g. Prime Road-Front Commercial Retail Showroom'
                }
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
                }}
                error={errors.title}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase mb-1.5">
                Description
              </label>
              <textarea
                rows="4"
                required
                placeholder="Describe the property layout, natural light, security, neighborhood, lease guidelines..."
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
                }}
                className={`w-full rounded-xl border p-3.5 text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                  errors.description
                    ? 'border-rose-400 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:ring-emerald-500/20'
                }`}
              />
              {errors.description && (
                <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Dynamic Property Type */}
              {category === 'Residential' && (
                <Select
                  label="Residential Type"
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  options={[
                    'Apartment',
                    'Flat',
                    'Villa',
                    'Independent House',
                    'Studio Apartment',
                    'Penthouse',
                  ]}
                />
              )}

              {category === 'Rooms & PG' && (
                <Select
                  label="Room / PG Type"
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  options={[
                    'Single Room',
                    'Shared Room',
                    'Paying Guest',
                    'Hostel Room',
                  ]}
                />
              )}

              {category === 'Commercial' && (
                <Select
                  label="Commercial Type"
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  options={[
                    'Retail Shop',
                    'Showroom',
                    'Office Space',
                    'Commercial Building',
                    'Warehouse',
                    'Commercial Floor',
                  ]}
                />
              )}

              <Input
                label="Monthly Rent (₹ / month)"
                type="number"
                min="1000"
                step="500"
                value={formData.rentPerMonth}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFormData({
                    ...formData,
                    rentPerMonth: val,
                    securityDeposit: val * 2,
                  });
                  if (errors.rentPerMonth) setErrors((prev) => ({ ...prev, rentPerMonth: null }));
                }}
                error={errors.rentPerMonth}
                required
              />

              <Input
                label="Security Deposit (₹ Refundable)"
                type="number"
                min="0"
                step="1000"
                value={formData.securityDeposit}
                onChange={(e) =>
                  setFormData({ ...formData, securityDeposit: Number(e.target.value) })
                }
                required
              />
            </div>
          </div>

          {/* STEP 3: CATEGORY-SPECIFIC SPECIFICATIONS */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              2. {category} Specifications
            </h3>

            {category === 'Residential' && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <Select
                  label="BHK"
                  value={formData.residentialSpecs.bhk}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      residentialSpecs: {
                        ...formData.residentialSpecs,
                        bhk: e.target.value,
                      },
                    })
                  }
                  options={['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK', 'Studio']}
                />

                <Input
                  label="Bedrooms"
                  type="number"
                  min="1"
                  value={formData.residentialSpecs.bedrooms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      residentialSpecs: {
                        ...formData.residentialSpecs,
                        bedrooms: Number(e.target.value),
                      },
                    })
                  }
                />

                <Input
                  label="Bathrooms"
                  type="number"
                  min="1"
                  value={formData.residentialSpecs.bathrooms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      residentialSpecs: {
                        ...formData.residentialSpecs,
                        bathrooms: Number(e.target.value),
                      },
                    })
                  }
                />

                <Select
                  label="Furnishing"
                  value={formData.residentialSpecs.furnishing}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      residentialSpecs: {
                        ...formData.residentialSpecs,
                        furnishing: e.target.value,
                      },
                    })
                  }
                  options={['Fully Furnished', 'Semi-Furnished', 'Unfurnished']}
                />

                <Input
                  label="Area (Sq Ft)"
                  type="number"
                  value={formData.residentialSpecs.areaSqFt}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      residentialSpecs: {
                        ...formData.residentialSpecs,
                        areaSqFt: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            )}

            {category === 'Rooms & PG' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Select
                  label="Occupancy"
                  value={formData.roomSpecs.occupancy}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      roomSpecs: { ...formData.roomSpecs, occupancy: e.target.value },
                    })
                  }
                  options={['Single Occupancy', 'Double Sharing', 'Triple Sharing', 'Four+ Sharing']}
                />

                <Select
                  label="Air Conditioning"
                  value={formData.roomSpecs.airConditioning}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      roomSpecs: { ...formData.roomSpecs, airConditioning: e.target.value },
                    })
                  }
                  options={['AC', 'Non-AC']}
                />

                <Select
                  label="Food & Meals"
                  value={formData.roomSpecs.foodInclusion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      roomSpecs: { ...formData.roomSpecs, foodInclusion: e.target.value },
                    })
                  }
                  options={['3 Meals Included', 'Breakfast Included', 'No Food / Self Cooking']}
                />

                <Select
                  label="Tenant Preference"
                  value={formData.roomSpecs.genderPreference}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      roomSpecs: { ...formData.roomSpecs, genderPreference: e.target.value },
                    })
                  }
                  options={['Any / Unisex', 'Male Only', 'Female Only', 'Students Preferred']}
                />
              </div>
            )}

            {category === 'Commercial' && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <Input
                  label="Carpet Area (Sq Ft)"
                  type="number"
                  value={formData.commercialSpecs.carpetAreaSqFt}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commercialSpecs: {
                        ...formData.commercialSpecs,
                        carpetAreaSqFt: Number(e.target.value),
                      },
                    })
                  }
                />

                <Input
                  label="Floor Location"
                  placeholder="e.g. Ground Floor"
                  value={formData.commercialSpecs.floor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commercialSpecs: { ...formData.commercialSpecs, floor: e.target.value },
                    })
                  }
                />

                <Input
                  label="Road Frontage (Feet)"
                  type="number"
                  value={formData.commercialSpecs.roadFrontageFeet}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commercialSpecs: {
                        ...formData.commercialSpecs,
                        roadFrontageFeet: Number(e.target.value),
                      },
                    })
                  }
                />

                <Input
                  label="Parking Spaces"
                  type="number"
                  value={formData.commercialSpecs.parkingSpaces}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commercialSpecs: {
                        ...formData.commercialSpecs,
                        parkingSpaces: Number(e.target.value),
                      },
                    })
                  }
                />

                <Input
                  label="Suitable Business"
                  placeholder="e.g. Clinic, Bank, IT"
                  value={formData.commercialSpecs.suitableFor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commercialSpecs: {
                        ...formData.commercialSpecs,
                        suitableFor: e.target.value,
                      },
                    })
                  }
                />
              </div>
            )}
          </div>

          {/* STEP 4: ADDRESS & GEOLOCATION (LATITUDE / LONGITUDE) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-800" />
                3. Address &amp; Geolocation (Latitude &amp; Longitude)
              </h3>
              <span className="text-xs text-slate-400">Accurate GPS Map Coordinates</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="City / Metropolitan Area"
                value={formData.location.city}
                onChange={(e) => handleCityChange(e.target.value)}
                options={keralaCities}
              />

              <Input
                label="State"
                value={formData.location.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: { ...formData.location, state: e.target.value },
                  })
                }
                required
              />

              <Input
                label="PIN Code"
                placeholder="682011"
                value={formData.location.pincode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: { ...formData.location, pincode: e.target.value },
                  })
                }
                required
              />
            </div>

            <Input
              label="Street Address / Locality / Landmark"
              placeholder="e.g. Flat 402, Trinity Heights, Near Infopark Expressway, Kakkanad"
              value={formData.location.address}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  location: { ...formData.location, address: e.target.value },
                })
                if (errors.address) setErrors((prev) => ({ ...prev, address: null }));
              }}
              error={errors.address}
              required
            />

            {/* Exact Geolocation Coordinates */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/90 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                <Compass className="w-4 h-4 text-emerald-800" />
                <span>GPS Geolocation Coordinates (Auto-detected from City, Editable):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Latitude (° N)"
                  type="number"
                  step="0.0001"
                  placeholder="9.9312"
                  value={formData.geolocation.latitude}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      geolocation: {
                        ...formData.geolocation,
                        latitude: Number(e.target.value),
                      },
                    });
                    if (errors.latitude) setErrors((prev) => ({ ...prev, latitude: null }));
                  }}
                  error={errors.latitude}
                  required
                />

                <Input
                  label="Longitude (° E)"
                  type="number"
                  step="0.0001"
                  placeholder="76.2673"
                  value={formData.geolocation.longitude}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      geolocation: {
                        ...formData.geolocation,
                        longitude: Number(e.target.value),
                      },
                    });
                    if (errors.longitude) setErrors((prev) => ({ ...prev, longitude: null }));
                  }}
                  error={errors.longitude}
                  required
                />
              </div>
            </div>
          </div>

          {/* STEP 5: AVAILABILITY DATES & ACTIVE STATUS */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-800" />
              4. Availability Dates &amp; Listing Status
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Available From (Move-in Date)"
                type="date"
                value={formData.availabilityDates.startDate}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    availabilityDates: {
                      ...formData.availabilityDates,
                      startDate: e.target.value,
                    },
                  });
                  if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: null }));
                }}
                error={errors.startDate}
                required
              />

              <Input
                label="Available Until (Optional / Open Lease)"
                type="date"
                value={formData.availabilityDates.endDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    availabilityDates: {
                      ...formData.availabilityDates,
                      endDate: e.target.value,
                    },
                  })
                }
              />
            </div>

            {/* Listing Active Status Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  Listing Active Status
                </span>
                <span className="text-xs text-slate-500">
                  {isActive
                    ? 'Active — Listing is available for tenant inquiries and bookings'
                    : 'Deactivated — Listing is paused and hidden from search'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {isActive ? 'Active (Live)' : 'Deactivated (Paused)'}
              </button>
            </div>
          </div>

          {/* STEP 6: AMENITIES CHECKLIST */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              5. Features &amp; Amenities
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {indianAmenities.map((amenity) => {
                const checked = formData.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => handleAmenityToggle(amenity)}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      checked
                        ? 'bg-emerald-50 border-emerald-800 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {checked ? '✓ ' : '+ '}
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 7: PROPERTY PHOTOGRAPHS */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  6. Property Photographs
                </h3>
                <p className="text-xs text-slate-500">
                  Select and upload photos directly from your device, or paste web image URLs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {formData.images.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, images: [] }))}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    Clear All
                  </button>
                )}
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, images: presetDemoImages }))}
                  className="text-xs font-bold text-emerald-800 hover:underline"
                >
                  Reset to Demo Photos
                </button>
              </div>
            </div>

            {/* FILE UPLOAD DROPZONE */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFilesBatch(e.dataTransfer.files);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative ${
                isDragging
                  ? 'border-emerald-600 bg-emerald-100/70 scale-[1.01]'
                  : 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70'
              }`}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="property-file-upload"
              />
              <div className="space-y-2 pointer-events-none">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto transition-transform ${isDragging ? 'scale-110 bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                  {isProcessingPhotos ? (
                    <Spinner size="sm" />
                  ) : (
                    <Upload className="w-6 h-6 stroke-[2.2]" />
                  )}
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {isProcessingPhotos
                    ? 'Optimizing and compressing selected photos...'
                    : isDragging
                    ? 'Drop your property photos here!'
                    : 'Click or drag photos from your device'}
                </div>
                <p className="text-xs text-slate-500">
                  Supports multiple JPEG, PNG, WEBP, HEIC files. Images are automatically optimized for fast loading.
                </p>
              </div>
            </div>

            {/* Direct Image URL input */}
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Or paste direct image URL (https://...)"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                wrapperClassName="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="md"
                icon={Plus}
                onClick={handleAddImageUrl}
              >
                Add URL
              </Button>
            </div>

            {errors.images && (
              <p className="text-xs text-rose-500 font-semibold">{errors.images}</p>
            )}

            {/* Image Preview Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {formData.images.map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group bg-slate-100"
                >
                  <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1.5 right-1.5 bg-rose-600 text-white rounded-lg p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 bg-emerald-900/90 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link to="/my-properties">
              <Button variant="ghost" size="lg" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="px-8 shadow-md shadow-emerald-850/20 font-black"
            >
              {isEditMode ? 'Update Rental Listing' : 'Publish Property Listing'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditProperty;
