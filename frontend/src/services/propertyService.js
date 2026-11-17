import api from './api';
import { mockProperties } from '../data/mockData';

const STORAGE_KEY = 'nestora_properties_store';

// Initialize local store with sample data if not present
const getStoredProperties = () => {
  let list = [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      list = JSON.parse(data);
    }
  } catch (err) {
    console.warn('Failed reading properties from storage:', err);
  }
  if (!Array.isArray(list) || list.length === 0) {
    list = [...mockProperties];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
  const deletedIds = JSON.parse(localStorage.getItem('nestora_deleted_properties') || '[]');
  if (deletedIds.length > 0) {
    list = list.filter((p) => {
      const pid = String(p._id || p.id || '');
      const cid = String(p.customId || '');
      return !deletedIds.includes(pid) && !deletedIds.includes(cid);
    });
  }
  return list;
};

const saveProperties = (properties) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
  } catch (err) {
    console.error('Error saving properties to storage:', err);
  }
};

export const propertyService = {
  // Query properties with advanced multi-category filters, search, and pagination
  async getProperties(params = {}) {
    // --- Try backend API first ---
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.set('search', params.search);
      if (params.city && params.city !== 'All') queryParams.set('city', params.city);
      if (params.category && params.category !== 'All') queryParams.set('category', params.category);
      if (params.propertyType && params.propertyType !== 'All') queryParams.set('propertyType', params.propertyType);
      if (params.minPrice) queryParams.set('minPrice', params.minPrice);
      if (params.maxPrice) queryParams.set('maxPrice', params.maxPrice);
      if (params.bhk) queryParams.set('bhk', params.bhk);
      if (params.bedrooms) queryParams.set('bedrooms', params.bedrooms);
      if (params.bathrooms) queryParams.set('bathrooms', params.bathrooms);
      if (params.occupancy) queryParams.set('occupancy', params.occupancy);
      if (params.furnishing) queryParams.set('furnishing', params.furnishing);
      if (params.sortBy) {
        // Map frontend sort values to backend expected format
        const sortMap = { price_asc: 'price-asc', price_desc: 'price-desc', newest: 'newest', rating: 'rating' };
        queryParams.set('sortBy', sortMap[params.sortBy] || params.sortBy);
      }
      if (params.page) queryParams.set('page', params.page);
      if (params.limit) queryParams.set('limit', params.limit);

      const res = await api.get(`/properties?${queryParams.toString()}`);
      const d = res?.data || res;

      if (d && Array.isArray(d.properties)) {
        const deletedIds = JSON.parse(localStorage.getItem('nestora_deleted_properties') || '[]');
        const cleanProps = deletedIds.length > 0
          ? d.properties.filter((p) => {
              const pid = String(p._id || p.id || '');
              const cid = String(p.customId || '');
              return !deletedIds.includes(pid) && !deletedIds.includes(cid);
            })
          : d.properties;

        const total = d.total ? Math.max(0, d.total - deletedIds.length) : cleanProps.length;
        const page = d.page || 1;
        const limit = d.limit || 9;
        return {
          properties: cleanProps,
          total,
          count: cleanProps.length,
          page,
          limit,
          totalPages: d.totalPages || Math.ceil(total / limit) || 1,
          pagination: {
            page,
            limit,
            totalCount: total,
            totalPages: d.totalPages || Math.ceil(total / limit) || 1,
          },
        };
      }
    } catch (apiErr) {
      console.warn('Backend API offline, using local property store:', apiErr.message);
    }

    // --- Offline fallback: local storage filter (Instant 0ms response) ---
    let items = [...getStoredProperties()];
    // Only show approved+active properties for public listing (same as backend)
    items = items.filter((p) => p.approvalStatus === 'approved' && p.isActive !== false);

    // If local store had no approved properties, fall back to mock catalog
    if (items.length === 0) {
      items = mockProperties.filter((p) => p.approvalStatus === 'approved' && p.isActive !== false);
    }

    // Filter out permanently deleted properties
    let deletedIds = [];
    try {
      deletedIds = JSON.parse(localStorage.getItem('nestora_deleted_properties') || '[]');
    } catch {}
    if (Array.isArray(deletedIds) && deletedIds.length > 0) {
      items = items.filter((p) => {
        const pid = String(p._id || p.id || '');
        const cid = String(p.customId || '');
        return !deletedIds.includes(pid) && (!cid || !deletedIds.includes(cid));
      });
    }

    // 1. Category Filter
    if (params.category && params.category !== 'All') {
      items = items.filter(
        (p) => p.category?.toLowerCase() === params.category.toLowerCase()
      );
    }

    // 2. Property Type Filter
    if (params.propertyType && params.propertyType !== 'All') {
      items = items.filter(
        (p) => p.propertyType?.toLowerCase() === params.propertyType.toLowerCase()
      );
    }

    // 3. Location / City Filter
    if (params.city && params.city !== 'All') {
      const cityQuery = params.city.toLowerCase().trim();
      items = items.filter((p) => {
        const c = p.location?.city?.toLowerCase() || p.address?.city?.toLowerCase() || '';
        const a = p.location?.address?.toLowerCase() || p.address?.street?.toLowerCase() || '';
        return c.includes(cityQuery) || a.includes(cityQuery);
      });
    }

    // 4. Rent / Price Range Filter (in INR)
    if (params.minPrice) {
      const min = Number(params.minPrice);
      if (!isNaN(min)) items = items.filter((p) => (p.rentPerMonth || p.price || 0) >= min);
    }
    if (params.maxPrice) {
      const max = Number(params.maxPrice);
      if (!isNaN(max)) items = items.filter((p) => (p.rentPerMonth || p.price || 0) <= max);
    }

    // 5. Residential Specific: BHK
    if (params.bhk && params.bhk !== 'All') {
      items = items.filter((p) =>
        p.residentialSpecs?.bhk?.toLowerCase().includes(params.bhk.toLowerCase())
      );
    }

    // 5b. Bedrooms
    if (params.bedrooms && params.bedrooms !== 'All') {
      const minBeds = parseInt(params.bedrooms, 10);
      if (!isNaN(minBeds)) {
        items = items.filter((p) => {
          const beds = p.specifications?.bedrooms || p.residentialSpecs?.bedrooms || 0;
          return beds >= minBeds;
        });
      }
    }

    // 5c. Bathrooms
    if (params.bathrooms && params.bathrooms !== 'All') {
      const minBaths = parseInt(params.bathrooms, 10);
      if (!isNaN(minBaths)) {
        items = items.filter((p) => {
          const baths = p.specifications?.bathrooms || p.residentialSpecs?.bathrooms || 0;
          return baths >= minBaths;
        });
      }
    }

    // 6. Residential Specific: Furnishing
    if (params.furnishing && params.furnishing !== 'All') {
      items = items.filter(
        (p) => p.residentialSpecs?.furnishing?.toLowerCase() === params.furnishing.toLowerCase()
      );
    }

    // 7. Rooms Specific: Occupancy
    if (params.occupancy && params.occupancy !== 'All') {
      items = items.filter((p) =>
        p.roomSpecs?.occupancy?.toLowerCase().includes(params.occupancy.toLowerCase())
      );
    }

    // 8. Rooms Specific: AC / Non-AC
    if (params.ac && params.ac !== 'All') {
      items = items.filter((p) =>
        p.roomSpecs?.airConditioning?.toLowerCase().includes(params.ac.toLowerCase())
      );
    }

    // 9. Commercial Specific: Commercial Type or Business Usage
    if (params.commercialType && params.commercialType !== 'All') {
      items = items.filter((p) => {
        const type = p.commercialSpecs?.commercialType?.toLowerCase() || '';
        const suitable = p.commercialSpecs?.suitableFor?.toLowerCase() || '';
        const filter = params.commercialType.toLowerCase();
        return type.includes(filter) || suitable.includes(filter);
      });
    }

    // 10. General Search Keyword
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      items = items.filter((p) => {
        const title = p.title?.toLowerCase() || '';
        const desc = p.description?.toLowerCase() || '';
        const city = p.location?.city?.toLowerCase() || p.address?.city?.toLowerCase() || '';
        const addr = p.location?.address?.toLowerCase() || p.address?.street?.toLowerCase() || '';
        const cat = p.category?.toLowerCase() || '';
        const type = p.propertyType?.toLowerCase() || '';
        return (
          title.includes(q) ||
          desc.includes(q) ||
          city.includes(q) ||
          addr.includes(q) ||
          cat.includes(q) ||
          type.includes(q)
        );
      });
    }

    // 11. Approval & Active Status
    if (params.status && params.status !== 'all') {
      items = items.filter((p) => p.approvalStatus === params.status);
    }

    // 12. Sorting
    if (params.sortBy === 'price_asc' || params.sortBy === 'price-asc') {
      items.sort((a, b) => (a.rentPerMonth || a.price || 0) - (b.rentPerMonth || b.price || 0));
    } else if (params.sortBy === 'price_desc' || params.sortBy === 'price-desc') {
      items.sort((a, b) => (b.rentPerMonth || b.price || 0) - (a.rentPerMonth || a.price || 0));
    } else if (params.sortBy === 'rating') {
      items.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else {
      // Default: Newest first
      items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    const total = items.length;
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.max(1, parseInt(params.limit, 10) || 9);
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;

    const paginated = items.slice(skip, skip + limit);

    return {
      properties: paginated,
      total,
      count: paginated.length,
      page,
      limit,
      totalPages,
      pagination: {
        page,
        limit,
        totalCount: total,
        totalPages,
      },
    };
  },

  async getPropertyById(id) {
    const deletedIds = JSON.parse(localStorage.getItem('nestora_deleted_properties') || '[]');
    const idStr = String(id);
    if (deletedIds.includes(idStr)) {
      throw new Error('Property listing not found');
    }

    try {
      const res = await api.get(`/properties/${id}`);
      const prop = res?.data?.property || res?.property || res;
      if (prop) {
        const pid = String(prop._id || prop.id || '');
        const cid = String(prop.customId || '');
        if (!deletedIds.includes(pid) && !deletedIds.includes(cid)) {
          return { property: prop };
        }
      }
    } catch (apiErr) {
      console.warn('Backend getPropertyById offline, searching locally:', apiErr.message);
    }
    const items = getStoredProperties();
    let found = items.find((p) => String(p._id) === idStr && !deletedIds.includes(idStr));
    if (!found) {
      found = mockProperties.find((p) => String(p._id) === idStr && !deletedIds.includes(idStr));
    }
    if (!found) {
      throw new Error('Property listing not found');
    }
    return { property: found };
  },

  async createProperty(propertyData) {
    const user = JSON.parse(localStorage.getItem('nestora_user') || '{}');
    const userRole = (user.role || 'Owner').toLowerCase();
    const isAdmin = userRole === 'admin';
    const ownerObj = {
      _id: user._id || `usr_${Date.now()}`,
      name: user.name || 'Property Owner',
      email: (user.email || 'host@nestora.com').toLowerCase().trim(),
      phone: user.phone || '+91 98470 12345',
      role: user.role || 'Owner',
    };

    try {
      const res = await api.post('/properties', propertyData);
      const prop = res?.data?.property || res?.property || res;
      const items = getStoredProperties();
      const enrichedProp = {
        ...propertyData,
        ...prop,
        category: propertyData.category || prop?.category || 'Residential',
        owner: prop?.owner || ownerObj,
      };

      // Ensure the new property is not in nestora_deleted_properties
      try {
        const deletedKey = 'nestora_deleted_properties';
        const deleted = JSON.parse(localStorage.getItem(deletedKey) || '[]');
        const newPid = String(enrichedProp._id || enrichedProp.id || '');
        if (deleted.includes(newPid)) {
          localStorage.setItem(deletedKey, JSON.stringify(deleted.filter((id) => id !== newPid)));
        }
      } catch {}

      items.unshift(enrichedProp);
      saveProperties(items);
      return { property: enrichedProp, success: true };
    } catch (apiErr) {
      console.warn('Backend API note, saving property to active store:', apiErr?.message);
      const items = getStoredProperties();
      const newProperty = {
        ...propertyData,
        _id: `prop_${Date.now()}`,
        category: propertyData.category || 'Residential',
        createdAt: new Date().toISOString(),
        approvalStatus: isAdmin ? 'approved' : 'pending',
        isActive: propertyData.isActive !== undefined ? propertyData.isActive : true,
        averageRating: 5.0,
        numReviews: 0,
        isFeatured: false,
        owner: ownerObj,
      };

      items.unshift(newProperty);
      saveProperties(items);
      return { property: newProperty, success: true };
    }
  },

  async updateProperty(id, propertyData) {
    try {
      const res = await api.put(`/properties/${id}`, propertyData);
      const prop = res?.data?.property || res?.property || res;
      const items = getStoredProperties();
      const index = items.findIndex((p) => String(p._id) === String(id));
      if (index !== -1) {
        items[index] = { ...items[index], ...prop };
        saveProperties(items);
      }
      return { property: prop, success: true };
    } catch (apiErr) {
      const msg = apiErr.message || '';
      if (msg.includes('Not authorized') || msg.includes('Validation') || msg.includes('forbidden')) {
        throw apiErr;
      }
      console.warn('Backend API offline, updating property locally:', msg);
      const items = getStoredProperties();
      const index = items.findIndex((p) => String(p._id) === String(id));
      if (index === -1) {
        throw new Error('Property not found to update');
      }

      items[index] = {
        ...items[index],
        ...propertyData,
        _id: items[index]._id,
        updatedAt: new Date().toISOString(),
      };

      saveProperties(items);
      return { property: items[index], success: true };
    }
  },

  async deleteProperty(id) {
    const idStr = String(id);
    try {
      const deletedKey = 'nestora_deleted_properties';
      const deleted = JSON.parse(localStorage.getItem(deletedKey) || '[]');
      if (!deleted.includes(idStr)) {
        deleted.push(idStr);
        localStorage.setItem(deletedKey, JSON.stringify(deleted));
      }
    } catch {}

    try {
      await api.delete(`/admin/properties/${id}`);
    } catch {
      try {
        await api.delete(`/properties/${id}`);
      } catch (apiErr) {
        console.warn('Backend API delete note:', apiErr?.message);
      }
    }

    try {
      let items = getStoredProperties();
      items = items.filter((p) => String(p._id) !== idStr && String(p.id) !== idStr && String(p.customId) !== idStr);
      saveProperties(items);
    } catch {}

    return { success: true };
  },

  async getMyProperties(ownerEmail) {
    const items = getStoredProperties();
    const user = JSON.parse(localStorage.getItem('nestora_user') || '{}');
    const userEmail = (ownerEmail || user.email || '').toLowerCase().trim();
    const userId = String(user._id || '');

    try {
      const res = await api.get('/properties/my-properties');
      const list = res?.data?.properties || res?.properties;
      if (Array.isArray(list)) {
        // Merge locally created properties so user never misses a newly created listing
        const localCreated = items.filter((p) => {
          const pOwnerEmail = (p.owner?.email || p.host?.email || '').toLowerCase().trim();
          const pOwnerId = String(p.owner?._id || p.owner || '');
          const isMyLocal = (userId && pOwnerId === userId) || (userEmail && pOwnerEmail === userEmail);
          const alreadyInList = list.some((item) => String(item._id) === String(p._id));
          return isMyLocal && !alreadyInList;
        });

        const combined = [...localCreated, ...list];
        combined.properties = combined;
        combined.total = combined.length;
        return combined;
      }
    } catch (apiErr) {
      console.warn('Backend API offline, falling back to local properties:', apiErr.message);
    }

    const userProperties = items.filter((p) => {
      const ownerEm = (p.owner?.email || p.host?.email || '').toLowerCase().trim();
      const pOwnerId = String(p.owner?._id || p.owner || '');
      return (userId && pOwnerId === userId) || (userEmail && ownerEm === userEmail);
    });

    userProperties.properties = userProperties;
    userProperties.total = userProperties.length;
    return userProperties;
  },

  async toggleFavorite(propertyId) {
    const key = 'nestora_saved_favorites';
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      saved = [];
    }

    const isFav = saved.includes(propertyId);
    if (isFav) {
      saved = saved.filter((id) => id !== propertyId);
    } else {
      saved.push(propertyId);
    }

    localStorage.setItem(key, JSON.stringify(saved));
    return { isFavorite: !isFav, savedProperties: saved };
  },

  async updatePropertyStatus(id, approvalStatus, isActive) {
    const items = getStoredProperties();
    const index = items.findIndex((p) => String(p._id) === String(id));
    if (index !== -1) {
      if (approvalStatus !== undefined) items[index].approvalStatus = approvalStatus;
      if (isActive !== undefined) items[index].isActive = isActive;
      saveProperties(items);
      return { property: items[index], success: true };
    }
    throw new Error('Property not found');
  },
};
