import api from './api';
import { mockUsers, mockProperties, mockBookings } from '../data/mockData';

const USERS_STORAGE_KEY = 'nestora_users_store';

const getStoredUsers = () => {
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (err) {
    console.warn(err);
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mockUsers));
  return mockUsers;
};

const saveUsers = (users) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const userService = {
  // Query users with search and role filter
  async getUsers(params = {}) {
    try {
      const qp = new URLSearchParams();
      if (params.search) qp.set('search', params.search);
      if (params.role && params.role !== 'All') qp.set('role', params.role);
      if (params.page) qp.set('page', params.page);
      if (params.limit) qp.set('limit', params.limit);

      const res = await api.get(`/admin/users?${qp.toString()}`);
      const d = res?.data || res;
      if (d && Array.isArray(d.users)) {
        return {
          users: d.users,
          total: d.total || d.users.length,
          page: d.page || 1,
          limit: d.limit || 10,
          totalPages: d.totalPages || 1,
        };
      }
    } catch (apiErr) {
      console.warn('Backend getUsers API offline, filtering locally:', apiErr.message);
    }

    let users = getStoredUsers();

    if (params.role && params.role !== 'All') {
      users = users.filter((u) => u.role?.toLowerCase() === params.role.toLowerCase());
    }
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      users = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q)
      );
    }

    return { users, total: users.length, page: 1, limit: users.length, totalPages: 1 };
  },

  async updateUserRole(id, role) {
    try {
      const res = await api.patch(`/admin/users/${id}/role`, { role });
      const u = res?.data?.user || res?.user || res;
      return { user: u };
    } catch (apiErr) {
      console.warn('Backend updateUserRole offline, updating locally:', apiErr.message);
    }

    const users = getStoredUsers();
    const idx = users.findIndex((u) => String(u._id) === String(id));
    if (idx !== -1) {
      users[idx].role = role;
      saveUsers(users);
      return { user: users[idx] };
    }
    throw new Error('User not found');
  },

  async toggleUserStatus(id) {
    const users = getStoredUsers();
    const idx = users.findIndex((u) => String(u._id) === String(id));
    if (idx !== -1) {
      users[idx].status = users[idx].status === 'suspended' ? 'active' : 'suspended';
      saveUsers(users);
      return { user: users[idx] };
    }
    throw new Error('User not found');
  },

  async deleteUser(id) {
    try {
      await api.delete(`/admin/users/${id}`);
    } catch (apiErr) {
      console.warn('Backend deleteUser offline, removing locally:', apiErr.message);
    }
    let users = getStoredUsers();
    users = users.filter((u) => String(u._id) !== String(id));
    saveUsers(users);
    return { success: true };
  },

  async getHostStats() {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const user = JSON.parse(localStorage.getItem('nestora_user') || '{}');
    const userEmail = (user.email || '').toLowerCase().trim();
    const userId = String(user._id || '');

    let props = [];
    try {
      props = JSON.parse(localStorage.getItem('nestora_properties_store') || '[]');
    } catch {
      props = mockProperties;
    }
    if (!Array.isArray(props) || props.length === 0) props = mockProperties;
    const deletedIds = JSON.parse(localStorage.getItem('nestora_deleted_properties') || '[]');
    if (deletedIds.length > 0) {
      props = props.filter((p) => {
        const pid = String(p._id || p.id || '');
        const cid = String(p.customId || '');
        return !deletedIds.includes(pid) && (!cid || !deletedIds.includes(cid));
      });
    }

    let bks = [];
    try {
      bks = JSON.parse(localStorage.getItem('nestora_bookings_store') || '[]');
    } catch {
      bks = mockBookings;
    }
    if (!Array.isArray(bks) || bks.length === 0) bks = mockBookings;

    // Filter properties strictly belonging to this host
    const hostProperties = props.filter((p) => {
      const pEmail = (p.owner?.email || p.host?.email || '').toLowerCase().trim();
      const pId = String(p.owner?._id || p.host?._id || p.owner || p.host || '');
      return (userId && pId === userId) || (userEmail && pEmail && pEmail === userEmail);
    });

    const hostPropIds = new Set(
      hostProperties.map((p) => String(p._id || p.id || p.customId || ''))
    );

    // Filter bookings strictly for this host
    const hostBookings = bks.filter((b) => {
      const oEmail = (b.owner?.email || b.host?.email || b.property?.owner?.email || b.property?.host?.email || '').toLowerCase().trim();
      const oId = String(b.owner?._id || b.host?._id || b.owner || b.host || b.property?.owner?._id || b.property?.owner || '');
      const isDirectMatch = (userId && oId === userId) || (userEmail && oEmail && oEmail === userEmail);
      if (isDirectMatch) return true;

      const propId = String(b.property?._id || b.property?.id || b.property || '');
      const propCustomId = String(b.property?.customId || '');
      return hostPropIds.has(propId) || (propCustomId && hostPropIds.has(propCustomId));
    });

    const confirmedBookings = hostBookings.filter(
      (b) => (b.status || '').toLowerCase() === 'confirmed'
    );

    // Calculate actual monthly revenue from confirmed active leases
    const monthlyRevenue = confirmedBookings.reduce((sum, b) => {
      const propId = String(b.property?._id || b.property?.id || b.property || '');
      const propCustomId = String(b.property?.customId || '');
      const matchedProp = hostProperties.find(
        (p) => String(p._id || p.id || '') === propId || (propCustomId && String(p.customId || '') === propCustomId)
      );
      const rent = Number(
        matchedProp?.rentPerMonth ||
        matchedProp?.price ||
        b.property?.rentPerMonth ||
        b.property?.price ||
        b.monthlyRent ||
        (b.totalAmount && b.duration ? Math.round(b.totalAmount / b.duration) : b.totalAmount || 0)
      );
      return sum + (isNaN(rent) ? 0 : rent);
    }, 0);

    const totalContractValue = confirmedBookings.reduce((sum, b) => {
      const total = Number(b.totalAmount || b.monthlyRent || b.property?.rentPerMonth || 0);
      return sum + (isNaN(total) ? 0 : total);
    }, 0);

    return {
      totalEarnings: monthlyRevenue,
      monthlyRevenue,
      totalContractValue,
      totalListings: hostProperties.length,
      properties: hostProperties,
      totalBookings: hostBookings.length,
      activeBookings: confirmedBookings.length,
    };
  },

  // Complete Administrative Analytics
  async getAdminStats() {
    try {
      const res = await api.get('/admin/stats');
      const d = res?.data || res;
      if (d && d.stats) {
        return {
          totalUsers: d.totalUsers || d.stats.users?.total || 0,
          activeListings: d.activeListings || d.stats.properties?.active || 0,
          totalBookings: d.totalBookings || d.stats.bookings?.total || 0,
          flaggedContent: d.flaggedContent || d.stats.properties?.flagged || 0,
          stats: d.stats,
          recentActivity: d.recentActivity || {},
        };
      }
    } catch (apiErr) {
      console.warn('Backend getAdminStats offline, calculating locally:', apiErr.message);
    }

    await new Promise((resolve) => setTimeout(resolve, 60));
    const users = getStoredUsers();
    let props = [];
    try {
      props = JSON.parse(localStorage.getItem('nestora_properties_store') || '[]');
    } catch {
      props = mockProperties;
    }
    if (props.length === 0) props = mockProperties;
    const deletedIds = JSON.parse(localStorage.getItem('nestora_deleted_properties') || '[]');
    if (deletedIds.length > 0) {
      props = props.filter((p) => !deletedIds.includes(String(p._id)));
    }

    let bks = [];
    try {
      bks = JSON.parse(localStorage.getItem('nestora_bookings_store') || '[]');
    } catch {
      bks = mockBookings;
    }
    if (bks.length === 0) bks = mockBookings;
    if (deletedIds.length > 0) {
      bks = bks.filter((b) => {
        const propId = String(b.property?._id || b.property?.id || b.property || '');
        const propCustomId = String(b.property?.customId || '');
        return !deletedIds.includes(propId) && !deletedIds.includes(propCustomId);
      });
    }

    const totalRevenue = bks.reduce(
      (sum, b) => sum + (b.monthlyRent || b.rentPerMonth || b.totalAmount || 25000),
      0
    );

    const activeListings = props.filter((p) => p.approvalStatus === 'approved' && p.isActive !== false).length;
    const flaggedListings = props.filter((p) => p.isFlagged).length;

    return {
      totalUsers: users.length,
      activeListings,
      totalBookings: bks.length,
      flaggedContent: flaggedListings,
      totalRevenue,
      users,
      properties: props,
      bookings: bks,
      stats: {
        users: {
          total: users.length,
          owners: users.filter((u) => u.role === 'Owner' || u.role === 'host').length,
          renters: users.filter((u) => u.role === 'Renter' || u.role === 'renter').length,
          admins: users.filter((u) => u.role === 'Admin' || u.role === 'admin').length,
        },
        properties: {
          total: props.length,
          active: activeListings,
          approved: props.filter((p) => p.approvalStatus === 'approved').length,
          pending: props.filter((p) => p.approvalStatus === 'pending').length,
          flagged: flaggedListings,
          residential: props.filter((p) => p.category === 'Residential').length,
          rooms: props.filter((p) => p.category === 'Rooms & PG').length,
          commercial: props.filter((p) => p.category === 'Commercial').length,
        },
        bookings: {
          total: bks.length,
          confirmed: bks.filter((b) => b.status === 'confirmed').length,
          pending: bks.filter((b) => b.status === 'pending').length,
        },
        financials: {
          totalRevenue,
        },
      },
      recentUsers: users.slice(0, 5),
      recentProperties: props.slice(0, 5),
      recentBookings: bks.slice(0, 5),
    };
  },

  // Admin Property Listing Controls
  async getAdminProperties(params = {}) {
    try {
      const qp = new URLSearchParams();
      if (params.search) qp.set('search', params.search);
      if (params.approvalStatus && params.approvalStatus !== 'all') qp.set('approvalStatus', params.approvalStatus);
      if (params.isActive !== undefined && params.isActive !== 'all') qp.set('isActive', params.isActive);
      if (params.isFlagged !== undefined) qp.set('isFlagged', params.isFlagged);
      if (params.page) qp.set('page', params.page);
      if (params.limit) qp.set('limit', params.limit);

      const res = await api.get(`/admin/properties?${qp.toString()}`);
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

        return {
          properties: cleanProps,
          total: d.total ? Math.max(0, d.total - deletedIds.length) : cleanProps.length,
          page: d.page || 1,
          limit: d.limit || 10,
          totalPages: d.totalPages || 1,
        };
      }
    } catch (apiErr) {
      console.warn('Backend getAdminProperties offline, searching locally:', apiErr.message);
    }

    let props = [];
    try {
      props = JSON.parse(localStorage.getItem('nestora_properties_store') || '[]');
    } catch {
      props = mockProperties;
    }
    if (props.length === 0) props = mockProperties;
    const deletedIds = JSON.parse(localStorage.getItem('nestora_deleted_properties') || '[]');
    if (deletedIds.length > 0) {
      props = props.filter((p) => {
        const pid = String(p._id || p.id || '');
        const cid = String(p.customId || '');
        return !deletedIds.includes(pid) && !deletedIds.includes(cid);
      });
    }

    let filtered = [...props];
    if (params.approvalStatus && params.approvalStatus !== 'all') {
      filtered = filtered.filter((p) => p.approvalStatus === params.approvalStatus);
    }
    if (params.isActive !== undefined && params.isActive !== 'all') {
      const isAct = params.isActive === 'true' || params.isActive === true;
      filtered = filtered.filter((p) => (p.isActive !== undefined ? p.isActive : true) === isAct);
    }
    if (params.isFlagged !== undefined) {
      const isFlg = params.isFlagged === 'true' || params.isFlagged === true;
      filtered = filtered.filter((p) => Boolean(p.isFlagged) === isFlg);
    }
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.location?.city?.toLowerCase().includes(q) ||
          p.address?.city?.toLowerCase().includes(q) ||
          p.propertyType?.toLowerCase().includes(q)
      );
    }

    return {
      properties: filtered,
      total: filtered.length,
      page: 1,
      limit: filtered.length,
      totalPages: 1,
    };
  },

  async approveProperty(id) {
    try {
      const res = await api.patch(`/admin/properties/${id}/approve`);
      return res?.data?.property || res?.property || res;
    } catch (apiErr) {
      console.warn('Backend approveProperty offline, updating locally:', apiErr.message);
      let props = [];
      try {
        props = JSON.parse(localStorage.getItem('nestora_properties_store') || '[]');
      } catch { }
      if (!Array.isArray(props) || props.length === 0) {
        props = [...mockProperties];
      }
      let idx = props.findIndex((p) => String(p._id) === String(id));
      if (idx === -1) {
        const mockItem = mockProperties.find((p) => String(p._id) === String(id));
        if (mockItem) {
          props.push({ ...mockItem });
          idx = props.length - 1;
        }
      }
      if (idx !== -1) {
        props[idx].approvalStatus = 'approved';
        props[idx].isActive = true;
        localStorage.setItem('nestora_properties_store', JSON.stringify(props));
        return props[idx];
      }
      throw apiErr;
    }
  },

  async rejectProperty(id) {
    try {
      const res = await api.patch(`/admin/properties/${id}/reject`);
      return res?.data?.property || res?.property || res;
    } catch (apiErr) {
      console.warn('Backend rejectProperty offline, updating locally:', apiErr.message);
      let props = [];
      try {
        props = JSON.parse(localStorage.getItem('nestora_properties_store') || '[]');
      } catch { }
      if (!Array.isArray(props) || props.length === 0) {
        props = [...mockProperties];
      }
      let idx = props.findIndex((p) => String(p._id) === String(id));
      if (idx === -1) {
        const mockItem = mockProperties.find((p) => String(p._id) === String(id));
        if (mockItem) {
          props.push({ ...mockItem });
          idx = props.length - 1;
        }
      }
      if (idx !== -1) {
        props[idx].approvalStatus = 'rejected';
        props[idx].isActive = false;
        localStorage.setItem('nestora_properties_store', JSON.stringify(props));
        return props[idx];
      }
      throw apiErr;
    }
  },

  async togglePropertyActive(id, currentActive) {
    const nextActive = !currentActive;
    try {
      const res = await api.patch(`/admin/properties/${id}/deactivate`, { isActive: nextActive });
      return res?.data?.property || res?.property || res;
    } catch (apiErr) {
      console.warn('Backend togglePropertyActive offline, updating locally:', apiErr.message);
      let props = [];
      try {
        props = JSON.parse(localStorage.getItem('nestora_properties_store') || '[]');
      } catch { }
      if (!Array.isArray(props) || props.length === 0) {
        props = [...mockProperties];
      }
      let idx = props.findIndex((p) => String(p._id) === String(id));
      if (idx === -1) {
        const mockItem = mockProperties.find((p) => String(p._id) === String(id));
        if (mockItem) {
          props.push({ ...mockItem });
          idx = props.length - 1;
        }
      }
      if (idx !== -1) {
        props[idx].isActive = nextActive;
        localStorage.setItem('nestora_properties_store', JSON.stringify(props));
        return props[idx];
      }
      throw apiErr;
    }
  },

  async flagProperty(id, isFlagged, flagReason = '') {
    try {
      const res = await api.patch(`/admin/properties/${id}/flag`, { isFlagged, flagReason });
      return res?.data?.property || res?.property || res;
    } catch (apiErr) {
      console.warn('Backend flagProperty offline, updating locally:', apiErr.message);
      let props = [];
      try {
        props = JSON.parse(localStorage.getItem('nestora_properties_store') || '[]');
      } catch { }
      if (!Array.isArray(props) || props.length === 0) {
        props = [...mockProperties];
      }
      let idx = props.findIndex((p) => String(p._id) === String(id));
      if (idx === -1) {
        const mockItem = mockProperties.find((p) => String(p._id) === String(id));
        if (mockItem) {
          props.push({ ...mockItem });
          idx = props.length - 1;
        }
      }
      if (idx !== -1) {
        props[idx].isFlagged = isFlagged;
        props[idx].flagReason = flagReason;
        localStorage.setItem('nestora_properties_store', JSON.stringify(props));
        return props[idx];
      }
      throw apiErr;
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
    } catch { }

    try {
      await api.delete(`/admin/properties/${id}`);
    } catch {
      try {
        await api.delete(`/properties/${id}`);
      } catch (err) {
        console.warn('Backend deleteProperty note:', err.message);
      }
    }

    try {
      let props = JSON.parse(localStorage.getItem('nestora_properties_store') || '[]');
      props = props.filter((p) => String(p._id) !== idStr && String(p.id) !== idStr && String(p.customId) !== idStr);
      localStorage.setItem('nestora_properties_store', JSON.stringify(props));
    } catch { }

    return { success: true };
  },
};
