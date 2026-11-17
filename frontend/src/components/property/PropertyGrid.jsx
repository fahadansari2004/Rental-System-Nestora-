import React from 'react';
import PropertyCard from './PropertyCard';
import { CardSkeleton } from '../common/Loader';
import { Home, RefreshCw } from 'lucide-react';
import Button from '../common/Button';

const PropertyGrid = ({
  properties = [],
  isLoading = false,
  onResetFilters,
  viewMode = 'grid',
}) => {
  if (isLoading) {
    return (
      <div
        className={
          viewMode === 'list'
            ? 'space-y-4'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
        }
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs max-w-lg mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-4">
          <Home className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No Properties Found</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          We couldn't find any rentals matching your criteria. Try adjusting your category, location, or monthly budget in ₹.
        </p>
        {onResetFilters && (
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={onResetFilters}>
            Reset Filters
          </Button>
        )}
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {properties.map((property) => (
          <PropertyCard
            key={property._id}
            property={property}
            viewMode="list"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <PropertyCard
          key={property._id}
          property={property}
          viewMode="grid"
        />
      ))}
    </div>
  );
};

export default PropertyGrid;
