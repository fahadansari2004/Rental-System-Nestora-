import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Home,
  Users,
  Briefcase,
  Sparkles,
  MapPin,
  X,
  IndianRupee,
  Layers,
} from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';

const mainCategories = [
  { label: 'All', icon: Sparkles },
  { label: 'Residential', icon: Home },
  { label: 'Rooms & PG', icon: Users },
  { label: 'Commercial', icon: Briefcase },
];

const keralaLocations = [
  { value: '', label: 'All Locations / Cities' },
  { value: 'Kochi', label: 'Kochi' },
  { value: 'Ernakulam', label: 'Ernakulam' },
  { value: 'Kakkanad', label: 'Kakkanad (Infopark)' },
  { value: 'Thiruvananthapuram', label: 'Thiruvananthapuram' },
  { value: 'Kozhikode', label: 'Kozhikode' },
  { value: 'Thrissur', label: 'Thrissur' },
  { value: 'Kottayam', label: 'Kottayam' },
  { value: 'Alappuzha', label: 'Alappuzha' },
  { value: 'Kannur', label: 'Kannur' },
  { value: 'Palakkad', label: 'Palakkad' },
  { value: 'Malappuram', label: 'Malappuram' },
  { value: 'Kollam', label: 'Kollam' },
  { value: 'Bengaluru', label: 'Bengaluru' },
  { value: 'Chennai', label: 'Chennai' },
  { value: 'Hyderabad', label: 'Hyderabad' },
  { value: 'Mumbai', label: 'Mumbai' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest Listed' },
  { value: 'price_asc', label: 'Rent: Low to High (₹)' },
  { value: 'price_desc', label: 'Rent: High to Low (₹)' },
  { value: 'rating', label: 'Highest Rated' },
];

const PropertyFilters = ({ filters, onFilterChange, onResetFilters }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeCategory = filters.category || '';

  // Dynamic types based on selected Category
  const getTypesForCategory = () => {
    if (activeCategory === 'Residential') {
      return [
        { value: '', label: 'All Residential Types' },
        { value: 'Apartment', label: 'Apartment' },
        { value: 'Flat', label: 'Flat' },
        { value: 'Villa', label: 'Villa' },
        { value: 'Independent House', label: 'Independent House' },
        { value: 'Studio Apartment', label: 'Studio Apartment' },
      ];
    }
    if (activeCategory === 'Rooms & PG') {
      return [
        { value: '', label: 'All Room & PG Types' },
        { value: 'Single Room', label: 'Single Room' },
        { value: 'Shared Room', label: 'Shared Room' },
        { value: 'Paying Guest', label: 'Paying Guest (PG)' },
        { value: 'Hostel Room', label: 'Hostel Room' },
      ];
    }
    if (activeCategory === 'Commercial') {
      return [
        { value: '', label: 'All Commercial Types' },
        { value: 'Retail Shop', label: 'Retail Shop' },
        { value: 'Showroom', label: 'Showroom' },
        { value: 'Office Space', label: 'Office Space' },
        { value: 'Commercial Building', label: 'Commercial Building' },
        { value: 'Warehouse', label: 'Warehouse' },
        { value: 'Commercial Floor', label: 'Commercial Floor' },
      ];
    }
    return [
      { value: '', label: 'All Property Types' },
      { value: 'Apartment', label: 'Apartment' },
      { value: 'Villa', label: 'Villa' },
      { value: 'Flat', label: 'Flat' },
      { value: 'Independent House', label: 'Independent House' },
      { value: 'Single Room', label: 'Single Room' },
      { value: 'Paying Guest', label: 'Paying Guest (PG)' },
      { value: 'Retail Shop', label: 'Retail Shop' },
      { value: 'Office Space', label: 'Office Space' },
      { value: 'Showroom', label: 'Showroom' },
    ];
  };

  const handleCategorySelect = (categoryLabel) => {
    const newCategory = categoryLabel === 'All' ? '' : categoryLabel;
    onFilterChange({
      ...filters,
      category: newCategory,
      propertyType: '',
      bhk: '',
      bedrooms: '',
      bathrooms: '',
      occupancy: '',
      page: 1,
    });
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Category Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {mainCategories.map((cat) => {
          const Icon = cat.icon;
          const isSelected =
            (cat.label === 'All' && !filters.category) ||
            filters.category === cat.label;

          return (
            <button
              key={cat.label}
              type="button"
              onClick={() => handleCategorySelect(cat.label)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all duration-200 border ${
                isSelected
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-md shadow-emerald-800/20 scale-[1.02]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}

        {/* Filter Toggle Button */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all ml-auto border ${
            showAdvanced
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
          Filter &amp; Sort
        </button>
      </div>

      {/* Advanced Filters Expandable Drawer */}
      {showAdvanced && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg shadow-slate-200/50 animate-in fade-in-50 zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-800" />
              Detailed Rental Search Criteria
            </h4>
            <button
              type="button"
              onClick={() => setShowAdvanced(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Location / City Selector */}
            <Select
              label="City / Location"
              value={filters.city || ''}
              onChange={(e) =>
                onFilterChange({ ...filters, city: e.target.value, page: 1 })
              }
              options={keralaLocations}
            />

            {/* Property Type Dropdown */}
            <Select
              label="Property Type"
              value={filters.propertyType || ''}
              onChange={(e) =>
                onFilterChange({ ...filters, propertyType: e.target.value, page: 1 })
              }
              options={getTypesForCategory()}
            />

            {/* Min Monthly Rent in INR */}
            <Input
              label="Min Rent (₹/month)"
              type="number"
              placeholder="e.g. 8000"
              value={filters.minPrice || ''}
              onChange={(e) =>
                onFilterChange({ ...filters, minPrice: e.target.value, page: 1 })
              }
            />

            {/* Max Monthly Rent in INR */}
            <Input
              label="Max Rent (₹/month)"
              type="number"
              placeholder="e.g. 50000"
              value={filters.maxPrice || ''}
              onChange={(e) =>
                onFilterChange({ ...filters, maxPrice: e.target.value, page: 1 })
              }
            />

            {/* Residential Specific: BHK */}
            {(!activeCategory || activeCategory === 'Residential') && (
              <Select
                label="BHK Configuration"
                value={filters.bhk || ''}
                onChange={(e) =>
                  onFilterChange({ ...filters, bhk: e.target.value, page: 1 })
                }
                options={[
                  { value: '', label: 'Any BHK' },
                  { value: '1 BHK', label: '1 BHK' },
                  { value: '2 BHK', label: '2 BHK' },
                  { value: '3 BHK', label: '3 BHK' },
                  { value: '4 BHK', label: '4 BHK' },
                  { value: '5 BHK', label: '5+ BHK' },
                ]}
              />
            )}

            {/* Bedrooms Filter */}
            {(!activeCategory || activeCategory === 'Residential') && (
              <Select
                label="Min Bedrooms"
                value={filters.bedrooms || ''}
                onChange={(e) =>
                  onFilterChange({ ...filters, bedrooms: e.target.value, page: 1 })
                }
                options={[
                  { value: '', label: 'Any Bedrooms' },
                  { value: '1', label: '1+ Bedroom' },
                  { value: '2', label: '2+ Bedrooms' },
                  { value: '3', label: '3+ Bedrooms' },
                  { value: '4', label: '4+ Bedrooms' },
                ]}
              />
            )}

            {/* Bathrooms Filter */}
            {(!activeCategory || activeCategory === 'Residential') && (
              <Select
                label="Min Bathrooms"
                value={filters.bathrooms || ''}
                onChange={(e) =>
                  onFilterChange({ ...filters, bathrooms: e.target.value, page: 1 })
                }
                options={[
                  { value: '', label: 'Any Bathrooms' },
                  { value: '1', label: '1+ Bathroom' },
                  { value: '2', label: '2+ Bathrooms' },
                  { value: '3', label: '3+ Bathrooms' },
                ]}
              />
            )}

            {/* Rooms Specific: Occupancy */}
            {activeCategory === 'Rooms & PG' && (
              <Select
                label="Occupancy Type"
                value={filters.occupancy || ''}
                onChange={(e) =>
                  onFilterChange({ ...filters, occupancy: e.target.value, page: 1 })
                }
                options={[
                  { value: '', label: 'Any Occupancy' },
                  { value: 'Single', label: 'Single Occupancy' },
                  { value: 'Double', label: 'Double Sharing' },
                  { value: 'Triple', label: 'Triple Sharing' },
                ]}
              />
            )}

            {/* Furnishing */}
            {(!activeCategory || activeCategory === 'Residential' || activeCategory === 'Commercial') && (
              <Select
                label="Furnishing Status"
                value={filters.furnishing || ''}
                onChange={(e) =>
                  onFilterChange({ ...filters, furnishing: e.target.value, page: 1 })
                }
                options={[
                  { value: '', label: 'Any Furnishing' },
                  { value: 'Fully Furnished', label: 'Fully Furnished' },
                  { value: 'Semi-Furnished', label: 'Semi-Furnished' },
                  { value: 'Unfurnished', label: 'Unfurnished' },
                  { value: 'Warm Shell', label: 'Warm Shell (Commercial)' },
                  { value: 'Bare Shell', label: 'Bare Shell (Commercial)' },
                ]}
              />
            )}

            {/* Sort Order */}
            <Select
              label="Sort Listings By"
              value={filters.sortBy || 'newest'}
              onChange={(e) =>
                onFilterChange({ ...filters, sortBy: e.target.value, page: 1 })
              }
              options={sortOptions}
            />
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Prices formatted in Indian Rupees (₹/month)
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onResetFilters}>
                Reset All Filters
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAdvanced(false)}
              >
                Apply Criteria
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyFilters;
