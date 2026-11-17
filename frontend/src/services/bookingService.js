import api from './api';
import { mockBookings } from '../data/mockData';

const BOOKINGS_STORAGE_KEY = 'nestora_bookings_store';

const getStoredBookings = () => {
  try {
    const data = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (err) {
    console.warn('Failed reading bookings from storage:', err);
  }
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(mockBookings));
  return mockBookings;
};

const saveBookings = (bookings) => {
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
};

export const bookingService = {
  async getBookings() {
    const deletedIds = JSON.parse(localStorage.getItem('nestora_deleted_properties') || '[]');
    let serverBookings = [];
    try {
      const res = await api.get('/bookings');
      const list = res?.data?.bookings || res?.bookings;
      if (Array.isArray(list)) {
        serverBookings = list;
      }
    } catch (err) {
      console.warn('Backend getBookings offline, using local store:', err.message);
    }

    const localBookings = getStoredBookings();
    // Merge by unique ID
    const mergedMap = new Map();
    serverBookings.forEach((b) => {
      const id = String(b._id || b.id || b.customId);
      mergedMap.set(id, b);
    });
    localBookings.forEach((b) => {
      const id = String(b._id || b.id || b.customId);
      if (!mergedMap.has(id)) {
        mergedMap.set(id, b);
      }
    });

    const result = Array.from(mergedMap.values()).filter((b) => {
      const propId = String(b.property?._id || b.property?.id || b.property || '');
      const propCustomId = String(b.property?.customId || '');
      return !deletedIds.includes(propId) && !deletedIds.includes(propCustomId);
    });

    // Sync localStorage clean if stale deleted property bookings exist
    if (deletedIds.length > 0 && localBookings.length > result.length) {
      saveBookings(result);
    }

    result.bookings = result;
    return result;
  },

  async getMyBookings() {
    const deletedIds = JSON.parse(localStorage.getItem('nestora_deleted_properties') || '[]');
    const user = JSON.parse(localStorage.getItem('nestora_user') || '{}');
    const userEmail = (user.email || '').toLowerCase().trim();
    const userId = String(user._id || '');

    try {
      const res = await api.get('/bookings/my-bookings');
      const list = res?.data?.bookings || res?.bookings;
      if (Array.isArray(list)) {
        const cleanList = list.filter((b) => {
          const rEmail = (b.renter?.email || b.user?.email || '').toLowerCase().trim();
          const rId = String(b.renter?._id || b.user?._id || b.renter || b.user || '');
          const isMine = (userId && rId === userId) || (userEmail && rEmail === userEmail);
          if (!isMine && userEmail) return false;

          const propId = String(b.property?._id || b.property?.id || b.property || '');
          const propCustomId = String(b.property?.customId || '');
          return !deletedIds.includes(propId) && !deletedIds.includes(propCustomId);
        });
        cleanList.bookings = cleanList;
        return cleanList;
      }
    } catch (apiErr) {
      console.warn('Backend API offline, falling back to local bookings:', apiErr.message);
    }

    const all = getStoredBookings();
    const my = all.filter((b) => {
      const rEmail = (b.renter?.email || b.user?.email || '').toLowerCase().trim();
      const rId = String(b.renter?._id || b.user?._id || b.renter || b.user || '');
      const isMine = (userId && rId === userId) || (userEmail && rEmail === userEmail);
      if (!isMine) return false;

      const propId = String(b.property?._id || b.property?.id || b.property || '');
      const propCustomId = String(b.property?.customId || '');
      return !deletedIds.includes(propId) && !deletedIds.includes(propCustomId);
    });

    my.bookings = my;
    return my;
  },

  async getHostBookings() {
    const deletedIds = JSON.parse(localStorage.getItem('nestora_deleted_properties') || '[]');
    const user = JSON.parse(localStorage.getItem('nestora_user') || '{}');
    const userEmail = (user.email || '').toLowerCase().trim();
    const userId = String(user._id || '');

    // Collect all property IDs belonging to this host
    let myPropIds = new Set();
    let myPropTitles = new Set();
    let storedProps = [];
    try {
      storedProps = JSON.parse(localStorage.getItem('nestora_properties_store') || '[]');
      if (!Array.isArray(storedProps) || storedProps.length === 0) {
        storedProps = mockProperties;
      }
      storedProps.forEach((p) => {
        const pEmail = (p.owner?.email || p.host?.email || '').toLowerCase().trim();
        const pId = String(p.owner?._id || p.host?._id || p.owner || p.host || '');
        if ((userId && pId === userId) || (userEmail && pEmail === userEmail)) {
          if (p._id) myPropIds.add(String(p._id));
          if (p.id) myPropIds.add(String(p.id));
          if (p.customId) myPropIds.add(String(p.customId));
          if (p.title) myPropTitles.add(String(p.title).toLowerCase().trim());
        }
      });
    } catch {}

    const isMatchForHost = (b) => {
      // 1. Direct owner email or ID match
      const oEmail = (b.owner?.email || b.host?.email || b.property?.owner?.email || b.property?.host?.email || '').toLowerCase().trim();
      const oId = String(b.owner?._id || b.host?._id || b.owner || b.host || b.property?.owner?._id || b.property?.owner || '');
      if (userEmail && oEmail && oEmail === userEmail) return true;
      if (userId && oId && (oId === userId || oId.endsWith(userId))) return true;

      // 2. Property ID match: was this booking made for one of my properties?
      const propId = String(b.property?._id || b.property?.id || b.property || '');
      const propCustomId = String(b.property?.customId || '');
      if (myPropIds.has(propId) || (propCustomId && myPropIds.has(propCustomId))) return true;

      // 3. Property title match
      const propTitle = String(b.property?.title || '').toLowerCase().trim();
      if (propTitle && myPropTitles.has(propTitle)) return true;

      return false;
    };

    let serverBookings = [];
    try {
      const res = await api.get('/bookings/host-bookings');
      const list = res?.data?.bookings || res?.bookings;
      if (Array.isArray(list)) {
        serverBookings = list;
      }
    } catch (apiErr) {
      console.warn('Backend API offline, falling back to host bookings:', apiErr.message);
    }

    const localBookings = getStoredBookings();
    // Merge serverBookings and localBookings
    const mergedMap = new Map();
    serverBookings.forEach((b) => {
      const id = String(b._id || b.id || b.customId);
      mergedMap.set(id, b);
    });
    localBookings.forEach((b) => {
      const id = String(b._id || b.id || b.customId);
      if (!mergedMap.has(id)) {
        mergedMap.set(id, b);
      }
    });

    const cleanList = Array.from(mergedMap.values()).filter((b) => {
      if (!isMatchForHost(b)) return false;
      const propId = String(b.property?._id || b.property?.id || b.property || '');
      const propCustomId = String(b.property?.customId || '');
      return !deletedIds.includes(propId) && !deletedIds.includes(propCustomId);
    });

    // Enrich bookings with true property rentPerMonth
    const enrichedList = cleanList.map((b) => {
      const propId = String(b.property?._id || b.property?.id || b.property || '');
      const propCustomId = String(b.property?.customId || '');
      const matchedProp = storedProps.find(
        (p) => String(p._id || p.id || '') === propId || (propCustomId && String(p.customId || '') === propCustomId)
      );
      if (matchedProp) {
        const trueRent = Number(matchedProp.rentPerMonth || matchedProp.price || 0);
        return {
          ...b,
          monthlyRent: trueRent > 0 ? trueRent : b.monthlyRent,
          property: typeof b.property === 'object' && b.property?.title ? { ...matchedProp, ...b.property } : matchedProp,
        };
      }
      return b;
    });

    enrichedList.bookings = enrichedList;
    return enrichedList;
  },

  async getBookingById(id) {
    const all = getStoredBookings();
    const found = all.find((b) => String(b._id) === String(id));
    if (!found) throw new Error('Booking not found');
    return { booking: found };
  },

  async createBooking(bookingData) {
    // Resolve property owner accurately before creating or saving
    const propOwner =
      bookingData.propertyData?.owner ||
      bookingData.propertyData?.host ||
      bookingData.property?.owner ||
      bookingData.property?.host ||
      (bookingData.owner ? { ...bookingData.owner } : null) || {
        name: 'Verified Landlord',
        email: 'owner@nestora.com',
        phone: '+91 98470 12345',
      };

    try {
      const payload = {
        ...bookingData,
        owner: propOwner,
        propertyData: bookingData.propertyData || bookingData.property,
      };
      const res = await api.post('/bookings', payload);
      let b = res?.data?.booking || res?.booking || res;

      // Ensure b has property and owner objects populated
      if (!b.owner || typeof b.owner !== 'object' || !b.owner.email) {
        b.owner = propOwner;
      }
      if (!b.property || typeof b.property !== 'object' || !b.property.title) {
        b.property = bookingData.propertyData || bookingData.property;
      }

      const bookings = getStoredBookings();
      bookings.unshift(b);
      saveBookings(bookings);
      return { booking: b, success: true };
    } catch (apiErr) {
      const msg = apiErr.message || '';
      if (msg.includes('Move-in') || msg.includes('duration') || msg.includes('confirmed booking') || msg.includes('own property')) {
        throw apiErr;
      }
      console.warn('Backend API offline, saving booking locally:', apiErr.message);
      const bookings = getStoredBookings();
      const user = JSON.parse(localStorage.getItem('nestora_user') || '{}');

      const rawDate = bookingData.moveInDate || bookingData.checkIn;
      const startDate = new Date(rawDate || Date.now());
      const leaseMonths = Number(bookingData.duration || 11);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + leaseMonths);

      const propId = bookingData.property?._id || bookingData.property;
      const hasConflict = bookings.some((b) => {
        const bPropId = b.property?._id || b.property;
        if (String(bPropId) === String(propId) && b.status === 'confirmed') {
          const bStart = new Date(b.moveInDate || b.checkIn);
          const bEnd = new Date(bStart);
          bEnd.setMonth(bEnd.getMonth() + (b.duration || 1));
          return startDate < bEnd && endDate > bStart;
        }
        return false;
      });

      if (hasConflict) {
        throw new Error('This property already has a confirmed booking for the selected rental dates');
      }

      // Accurately resolve property owner (preserves admin / owner ownership)
      const propOwner =
        bookingData.propertyData?.owner ||
        bookingData.propertyData?.host ||
        bookingData.property?.owner ||
        bookingData.property?.host ||
        (bookingData.owner ? { ...bookingData.owner } : null) || {
          name: 'Verified Landlord',
          email: 'owner@nestora.com',
          phone: '+91 98470 12345',
        };

      const newBooking = {
        _id: `bk_${Date.now()}`,
        property: bookingData.propertyData || bookingData.property,
        renter: {
          _id: user._id || 'usr_renter_01',
          name: user.name || 'Rahul Varma',
          email: user.email || 'renter@nestora.com',
          phone: user.phone || '+91 97455 88990',
          avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        },
        user: {
          _id: user._id || 'usr_renter_01',
          name: user.name || 'Rahul Varma',
          email: user.email || 'renter@nestora.com',
          phone: user.phone || '+91 97455 88990',
        },
        owner: propOwner,
        moveInDate: startDate.toISOString(),
        checkIn: startDate.toISOString(),
        checkOut: endDate.toISOString(),
        duration: leaseMonths,
        monthlyRent: Number(
          bookingData.monthlyRent ||
          bookingData.propertyData?.rentPerMonth ||
          bookingData.propertyData?.price ||
          bookingData.property?.rentPerMonth ||
          bookingData.property?.price ||
          25000
        ),
        securityDeposit: bookingData.securityDeposit || 50000,
        totalAmount:
          Number(
            bookingData.totalAmount ||
            (bookingData.monthlyRent ||
              bookingData.propertyData?.rentPerMonth ||
              bookingData.propertyData?.price ||
              bookingData.property?.rentPerMonth ||
              bookingData.property?.price ||
              25000) * leaseMonths
          ),
        status: 'pending',
        createdAt: new Date().toISOString(),
        specialRequests: bookingData.specialRequests || '',
      };

      bookings.unshift(newBooking);
      saveBookings(bookings);
      return { booking: newBooking, success: true };
    }
  },

  async updateBookingStatus(id, status) {
    try {
      const res = await api.patch(`/bookings/${id}/status`, { status });
      const b = res?.data?.booking || res?.booking || res;
      const bookings = getStoredBookings();
      const idx = bookings.findIndex((bk) => String(bk._id) === String(id));
      if (idx !== -1) {
        bookings[idx] = { ...bookings[idx], ...b };
        saveBookings(bookings);
      }
      return { booking: b, success: true };
    } catch (apiErr) {
      const msg = apiErr.message || '';
      if (msg.includes('confirmed booking') || msg.includes('Not authorized') || msg.includes('Cannot approve')) {
        throw apiErr;
      }
      console.warn('Backend API offline, updating booking locally:', apiErr.message);
      const bookings = getStoredBookings();
      const index = bookings.findIndex((b) => String(b._id) === String(id));
      if (index === -1) throw new Error('Booking not found');

      // Check conflict if confirming locally
      if (status === 'confirmed') {
        const cur = bookings[index];
        const startA = new Date(cur.moveInDate || cur.checkIn);
        const endA = new Date(startA);
        endA.setMonth(endA.getMonth() + (cur.duration || 1));
        const propId = cur.property?._id || cur.property;

        const hasConflict = bookings.some((b) => {
          if (String(b._id) !== String(id) && (String(b.property?._id) === String(propId) || String(b.property) === String(propId)) && b.status === 'confirmed') {
            const startB = new Date(b.moveInDate || b.checkIn);
            const endB = new Date(startB);
            endB.setMonth(endB.getMonth() + (b.duration || 1));
            return startA < endB && endA > startB;
          }
          return false;
        });

        if (hasConflict) {
          throw new Error('Cannot approve booking: This property already has a confirmed booking for the selected rental period');
        }
      }

      bookings[index].status = status;
      saveBookings(bookings);
      return { booking: bookings[index], success: true };
    }
  },

  async approveBooking(id) {
    return this.updateBookingStatus(id, 'confirmed');
  },

  async rejectBooking(id) {
    return this.updateBookingStatus(id, 'rejected');
  },

  async cancelBooking(id) {
    return this.updateBookingStatus(id, 'cancelled');
  },
};
