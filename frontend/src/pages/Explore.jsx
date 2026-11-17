import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { propertyService } from '../services/propertyService';
import PropertyFilters from '../components/property/PropertyFilters';
import PropertyGrid from '../components/property/PropertyGrid';
import Pagination from '../components/common/Pagination';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { Search, X, LayoutGrid, List, RefreshCw, AlertTriangle } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialPropertyType = searchParams.get('propertyType') || '';
  const initialCity = searchParams.get('city') || '';
  const initialMinPrice = searchParams.get('minPrice') || '';
  const initialMaxPrice = searchParams.get('maxPrice') || '';
  const initialBhk = searchParams.get('bhk') || '';
  const initialBedrooms = searchParams.get('bedrooms') || '';
  const initialBathrooms = searchParams.get('bathrooms') || '';
  const initialOccupancy = searchParams.get('occupancy') || '';
  const initialFurnishing = searchParams.get('furnishing') || '';
  const initialSortBy = searchParams.get('sortBy') || 'newest';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchInput, 400);

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const [filters, setFilters] = useState({
    search: initialSearch,
    category: initialCategory,
    propertyType: initialPropertyType,
    city: initialCity,
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
    bhk: initialBhk,
    bedrooms: initialBedrooms,
    bathrooms: initialBathrooms,
    occupancy: initialOccupancy,
    furnishing: initialFurnishing,
    sortBy: initialSortBy,
    page: initialPage,
  });

  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    totalCount: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync debounced search input with filters
  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  // Sync URL search params when external changes happen (like clicking category card on Home)
  useEffect(() => {
    const urlCat = searchParams.get('category') || '';
    const urlCity = searchParams.get('city') || '';
    const urlType = searchParams.get('propertyType') || '';
    const urlSearch = searchParams.get('search') || '';
    const urlMin = searchParams.get('minPrice') || '';
    const urlMax = searchParams.get('maxPrice') || '';
    const urlBedrooms = searchParams.get('bedrooms') || '';
    const urlBathrooms = searchParams.get('bathrooms') || '';

    setFilters((prev) => ({
      ...prev,
      category: urlCat,
      city: urlCity,
      propertyType: urlType,
      search: urlSearch,
      minPrice: urlMin,
      maxPrice: urlMax,
      bedrooms: urlBedrooms,
      bathrooms: urlBathrooms,
    }));
    setSearchInput(urlSearch);
  }, [searchParams]);

  const fetchProperties = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await propertyService.getProperties(filters);
      setProperties(data.properties || []);

      // Support both nested pagination object and top-level fields
      const pg = data.pagination || {
        page: data.page || 1,
        limit: data.limit || 9,
        totalCount: data.total || (data.properties || []).length,
        totalPages: data.totalPages || 1,
      };
      setPagination(pg);

      // Keep URL clean & synced
      const newParams = {};
      if (filters.search) newParams.search = filters.search;
      if (filters.category) newParams.category = filters.category;
      if (filters.propertyType) newParams.propertyType = filters.propertyType;
      if (filters.city) newParams.city = filters.city;
      if (filters.minPrice) newParams.minPrice = filters.minPrice;
      if (filters.maxPrice) newParams.maxPrice = filters.maxPrice;
      if (filters.bhk) newParams.bhk = filters.bhk;
      if (filters.bedrooms) newParams.bedrooms = filters.bedrooms;
      if (filters.bathrooms) newParams.bathrooms = filters.bathrooms;
      if (filters.occupancy) newParams.occupancy = filters.occupancy;
      if (filters.furnishing) newParams.furnishing = filters.furnishing;
      if (filters.sortBy && filters.sortBy !== 'newest') newParams.sortBy = filters.sortBy;
      if (filters.page > 1) newParams.page = filters.page.toString();

      setSearchParams(newParams, { replace: true });
    } catch (error) {
      console.error('Failed to load properties:', error);
      setError('Could not load properties. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, setSearchParams]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleResetFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      category: '',
      propertyType: '',
      city: '',
      minPrice: '',
      maxPrice: '',
      bhk: '',
      bedrooms: '',
      bathrooms: '',
      occupancy: '',
      furnishing: '',
      sortBy: 'newest',
      page: 1,
    });
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters =
    filters.category ||
    filters.propertyType ||
    filters.city ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.bhk ||
    filters.bedrooms ||
    filters.bathrooms ||
    filters.occupancy ||
    filters.furnishing;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header and Search input */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-800 block mb-1">
            RENTAL PROPERTIES IN KERALA &amp; INDIA
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Explore Property Listings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse verified residential apartments, student/working PG rooms, and commercial retail or office spaces.
          </p>
        </div>

        {/* Search input field */}
        <div className="w-full md:w-80">
          <Input
            icon={Search}
            placeholder="Search by city, title, or locality..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Tabs and Detailed Criteria Drawer */}
      <PropertyFilters
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
      />

      {/* Results Header: Count, Clear Filters & Grid/List View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 mb-6 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-slate-900 font-black">{properties.length}</strong> of{' '}
            <strong className="text-slate-900 font-black">{pagination.totalCount}</strong> verified rentals
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-bold ml-2 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"
            >
              Clear filters
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* View Mode Toggle: Grid vs List */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            title="Grid View"
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-emerald-800 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            title="List View"
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-white text-emerald-800 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error State Banner */}
      {error && !isLoading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center my-6 max-w-lg mx-auto">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-rose-900 mb-1">Failed to Load Properties</h3>
          <p className="text-xs text-rose-600 mb-4">{error}</p>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchProperties}
          >
            Retry Search
          </Button>
        </div>
      )}

      {/* Properties Grid / List */}
      <PropertyGrid
        properties={properties}
        isLoading={isLoading}
        onResetFilters={handleResetFilters}
        viewMode={viewMode}
      />

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default Explore;
