import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { propertyService } from '../services/propertyService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { formatINR } from '../utils/formatters';
import Spinner from '../components/common/Loader';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  Building2,
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Power,
  CalendarCheck,
  Compass,
} from 'lucide-react';

const MyProperties = () => {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'approved' | 'pending' | 'deactivated'
  const { user } = useAuth();
  const { showToast } = useToast();

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      const data = await propertyService.getMyProperties();
      let list = Array.isArray(data) ? data : data?.properties || [];
      const deletedIds = JSON.parse(localStorage.getItem('nestora_deleted_properties') || '[]');
      if (deletedIds.length > 0) {
        list = list.filter((p) => {
          const pid = String(p._id || p.id || '');
          const cid = String(p.customId || '');
          return !deletedIds.includes(pid) && !deletedIds.includes(cid);
        });
      }
      setProperties(list);
    } catch (error) {
      showToast('Could not load your listed properties', 'error');
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this property listing? This action cannot be undone.')) {
      return;
    }
    const idStr = String(id);
    try {
      setProperties((prev) =>
        prev.filter((p) => String(p._id) !== idStr && String(p.id) !== idStr && String(p.customId) !== idStr)
      );
      await propertyService.deleteProperty(id);
      showToast('Listing removed successfully', 'info');
      loadProperties();
    } catch (error) {
      showToast(error.message || 'Failed to delete listing', 'error');
    }
  };

  // Toggle between Active/Approved and Deactivated
  const handleToggleStatus = async (prop) => {
    try {
      const currentActive = prop.isActive !== undefined ? prop.isActive : prop.isAvailable !== false;
      const nextActive = !currentActive;

      await propertyService.updateProperty(prop._id, {
        isActive: nextActive,
        isAvailable: nextActive,
      });

      showToast(
        `Property ${nextActive ? 'activated & live' : 'deactivated (paused)'}`,
        'success'
      );
      loadProperties();
    } catch (error) {
      showToast(error.message || 'Failed to update property status', 'error');
    }
  };

  // Resolve status: Pending, Approved, or Deactivated
  const resolveStatus = (prop) => {
    const isAct = prop.isActive !== undefined ? prop.isActive : prop.isAvailable !== false;
    if (!isAct) {
      return {
        key: 'deactivated',
        label: 'Deactivated',
        badgeVariant: 'default',
        icon: Power,
        className: 'bg-slate-100 text-slate-700 border-slate-300',
      };
    }
    if (prop.approvalStatus === 'approved') {
      return {
        key: 'approved',
        label: 'Approved',
        badgeVariant: 'success',
        icon: CheckCircle,
        className: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      };
    }
    if (prop.approvalStatus === 'rejected') {
      return {
        key: 'rejected',
        label: 'Rejected',
        badgeVariant: 'danger',
        icon: AlertTriangle,
        className: 'bg-rose-50 text-rose-800 border-rose-300',
      };
    }
    return {
      key: 'pending',
      label: 'Pending',
      badgeVariant: 'warning',
      icon: Clock,
      className: 'bg-amber-50 text-amber-800 border-amber-300',
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const safeProperties = Array.isArray(properties) ? properties : [];

  const filteredProperties = safeProperties.filter((p) => {
    const st = resolveStatus(p).key;
    if (filterStatus === 'approved') return st === 'approved';
    if (filterStatus === 'pending') return st === 'pending';
    if (filterStatus === 'deactivated') return st === 'deactivated';
    return true;
  });

  const countApproved = safeProperties.filter((p) => resolveStatus(p).key === 'approved').length;
  const countPending = safeProperties.filter((p) => resolveStatus(p).key === 'pending').length;
  const countDeactivated = safeProperties.filter((p) => resolveStatus(p).key === 'deactivated').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-800 block mb-1">
            OWNER PORTFOLIO MANAGEMENT
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            My Listed Properties
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your verified residences across Kerala, check approval statuses, and manage tenant availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/dashboard/owner">
            <Button variant="outline" size="md" icon={CalendarCheck}>
              Rental &amp; Lease History
            </Button>
          </Link>
          <Link to="/properties/new">
            <Button variant="primary" size="md" icon={PlusCircle}>
              Add New Property
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs (All, Approved, Pending, Deactivated) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Listings ({safeProperties.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('approved')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'approved'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-emerald-800 bg-emerald-50/60 border border-emerald-200 hover:bg-emerald-100/60'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Approved ({countApproved})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 bg-amber-50/60 border border-amber-200 hover:bg-amber-100/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending ({countPending})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('deactivated')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'deactivated'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            Deactivated ({countDeactivated})
          </button>
        </div>

        <span className="text-xs text-slate-400 font-semibold">
          Showing {filteredProperties.length} of {safeProperties.length} properties
        </span>
      </div>

      {/* Pending Approval Notice Banner */}
      {countPending > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 leading-relaxed">
            <span className="font-bold">Pending Review Note: </span>
            You have <span className="font-bold">{countPending} property listing(s)</span> pending moderation. In accordance with platform policy, new listings are reviewed and approved by an Administrator before appearing publicly on the <strong>Property Listings</strong> page.
          </div>
        </div>
      )}

      {/* Properties List */}
      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500 max-w-lg mx-auto space-y-4">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h3 className="font-bold text-slate-900 text-lg">No listings in this view</h3>
            <p className="text-xs text-slate-400 mt-1">
              You do not have any properties currently under the "{filterStatus}" filter.
            </p>
          </div>
          <Link to="/properties/new">
            <Button variant="primary" size="sm" icon={PlusCircle}>
              Publish a Listing
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((prop) => {
            const status = resolveStatus(prop);
            const StatusIcon = status.icon;
            const isAct = prop.isActive !== undefined ? prop.isActive : prop.isAvailable !== false;

            return (
              <div
                key={prop._id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Property Image & Status Badges */}
                  <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                    <img
                      src={prop.featuredImage || prop.images?.[0]}
                      alt={prop.title}
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-[11px] font-bold">
                        {prop.category || prop.propertyType || 'Residential'}
                      </span>

                      {/* Display Pending, Approved, or Deactivated status badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black border ${status.className} backdrop-blur-xs`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Property Info */}
                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1">
                      {prop.title}
                    </h3>

                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-800 flex-shrink-0" />
                      <span className="truncate">
                        {prop.location?.address || prop.address?.street || 'Prime Location'},{' '}
                        {prop.location?.city || prop.address?.city || 'Kochi'}
                      </span>
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-base font-black text-emerald-800">
                        {formatINR(prop.rentPerMonth || prop.price || 0, false)}
                        <span className="text-xs font-normal text-slate-400"> / month</span>
                      </p>

                      {prop.geolocation?.coordinates && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                          <Compass className="w-3 h-3 text-emerald-700" />
                          {Number(prop.geolocation.coordinates[1]).toFixed(3)}°N,{' '}
                          {Number(prop.geolocation.coordinates[0]).toFixed(3)}°E
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(prop)}
                    className={`text-xs font-bold transition-colors ${
                      isAct ? 'text-slate-500 hover:text-rose-600' : 'text-emerald-700 hover:text-emerald-900'
                    }`}
                  >
                    {isAct ? 'Deactivate' : 'Activate (Live)'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <Link to={`/properties/${prop._id}`}>
                      <Button variant="ghost" size="sm" icon={Eye} title="View Live Listing" />
                    </Link>
                    <Link to={`/properties/${prop._id}/edit`}>
                      <Button variant="outline" size="sm" icon={Edit} title="Edit Listing">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleDelete(prop._id)}
                      title="Delete Listing"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyProperties;
