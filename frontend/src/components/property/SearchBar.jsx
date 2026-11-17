import React, { useState } from 'react';
import { Search, MapPin, Home, Building2, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchBar = ({ initialQuery = '', className = '' }) => {
  const [search, setSearch] = useState(initialQuery);
  const [category, setCategory] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const navigate = useNavigate();

  // Dynamic types based on selected Category
  const getTypesForCategory = () => {
    if (category === 'Residential') {
      return ['Apartment', 'Flat', 'Villa', 'Independent House', 'Studio Apartment'];
    }
    if (category === 'Rooms & PG') {
      return ['Single Room', 'Shared Room', 'Paying Guest', 'Hostel Room'];
    }
    if (category === 'Commercial') {
      return ['Retail Shop', 'Showroom', 'Office Space', 'Commercial Building', 'Warehouse', 'Commercial Floor'];
    }
    return [
      'Apartment',
      'Villa',
      'Flat',
      'Independent House',
      'Single Room',
      'Paying Guest',
      'Retail Shop',
      'Office Space',
      'Showroom',
      'Warehouse',
    ];
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (category) params.append('category', category);
    if (propertyType) params.append('propertyType', propertyType);
    if (maxPrice) params.append('maxPrice', maxPrice);

    navigate(`/explore?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className={`w-full bg-white rounded-2xl md:rounded-full p-2.5 md:p-1.5 md:pl-5 shadow-xl shadow-slate-900/10 border border-slate-200/90 flex flex-col md:flex-row items-center gap-2 md:gap-1 transition-shadow hover:shadow-2xl ${className}`}
    >
      {/* 1. Location / City Input */}
      <div className="flex items-center gap-3 w-full md:flex-[1.2] min-w-0 px-3 py-1.5 rounded-xl md:hover:bg-transparent hover:bg-slate-50/80 transition-colors">
        <MapPin className="w-5 h-5 text-emerald-800 stroke-[2.2] shrink-0" />
        <div className="flex-1 min-w-0">
          <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 select-none">
            LOCATION / CITY
          </label>
          <input
            type="text"
            placeholder="Kochi, Kakkanad, Trivandrum..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
          />
        </div>
      </div>

      <div className="hidden md:block h-8 w-px bg-slate-200 shrink-0 mx-1" />

      {/* 2. Category Selector */}
      <div className="flex items-center gap-2.5 w-full md:flex-1 min-w-0 px-3 py-1.5 rounded-xl md:hover:bg-transparent hover:bg-slate-50/80 transition-colors group">
        <Home className="w-4 h-4 text-emerald-800 stroke-[2.2] shrink-0" />
        <div className="flex-1 min-w-0 relative">
          <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 select-none">
            CATEGORY
          </label>
          <div className="relative flex items-center">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPropertyType(''); // reset type when category shifts
              }}
              className="w-full text-xs sm:text-sm font-bold text-slate-800 bg-transparent focus:outline-none appearance-none cursor-pointer pr-5"
            >
              <option value="">All Categories</option>
              <option value="Residential">Residential</option>
              <option value="Rooms & PG">Rooms & PG</option>
              <option value="Commercial">Commercial</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors pointer-events-none absolute right-0 shrink-0" />
          </div>
        </div>
      </div>

      <div className="hidden md:block h-8 w-px bg-slate-200 shrink-0 mx-1" />

      {/* 3. Property Type Dropdown */}
      <div className="flex items-center gap-2.5 w-full md:flex-1 min-w-0 px-3 py-1.5 rounded-xl md:hover:bg-transparent hover:bg-slate-50/80 transition-colors group">
        <Building2 className="w-4 h-4 text-emerald-800 stroke-[2.2] shrink-0" />
        <div className="flex-1 min-w-0 relative">
          <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 select-none">
            PROPERTY TYPE
          </label>
          <div className="relative flex items-center">
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full text-xs sm:text-sm font-bold text-slate-800 bg-transparent focus:outline-none appearance-none cursor-pointer pr-5"
            >
              <option value="">All Types</option>
              {getTypesForCategory().map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors pointer-events-none absolute right-0 shrink-0" />
          </div>
        </div>
      </div>

      <div className="hidden md:block h-8 w-px bg-slate-200 shrink-0 mx-1" />

      {/* 4. Monthly Budget Dropdown (INR) */}
      <div className="flex items-center gap-2 w-full md:flex-1 min-w-0 px-3 py-1.5 rounded-xl md:hover:bg-transparent hover:bg-slate-50/80 transition-colors group">
        <span className="text-base font-black text-emerald-800 shrink-0">₹</span>
        <div className="flex-1 min-w-0 relative">
          <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 select-none">
            MAX BUDGET
          </label>
          <div className="relative flex items-center">
            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full text-xs sm:text-sm font-bold text-slate-800 bg-transparent focus:outline-none appearance-none cursor-pointer pr-5"
            >
              <option value="">Any Monthly Budget</option>
              <option value="10000">Under ₹10,000</option>
              <option value="20000">Under ₹20,000</option>
              <option value="35000">Under ₹35,000</option>
              <option value="50000">Under ₹50,000</option>
              <option value="75000">Under ₹75,000</option>
              <option value="150000">Under ₹1,50,000</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors pointer-events-none absolute right-0 shrink-0" />
          </div>
        </div>
      </div>

      {/* 5. Search Rentals Action CTA */}
      <button
        type="submit"
        className="w-full md:w-auto h-11 md:h-12 px-6 rounded-xl md:rounded-full bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-800/25 transition-all hover:scale-[1.02] active:scale-95 shrink-0"
      >
        <Search className="w-4 h-4 stroke-[2.5]" />
        <span className="whitespace-nowrap">Search Rentals</span>
      </button>
    </form>
  );
};

export default SearchBar;
