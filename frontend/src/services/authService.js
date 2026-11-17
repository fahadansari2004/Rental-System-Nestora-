import api from './api';
import { mockUsers } from '../data/mockData';

const USERS_STORAGE_KEY = 'nestora_users_store';

const getStoredUsers = () => {
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (err) {
    console.warn('Failed reading users from storage:', err);
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mockUsers));
  return mockUsers;
};

const saveUsers = (users) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const authService = {
  // Login via Backend REST API (POST /api/auth/login)
  async login({ email, password }) {
    try {
      const response = await api.post('/auth/login', { email, password });
      const user = response?.data?.user || response?.user;
      const token = response?.data?.token || response?.token;

      if (!user || !token) {
        throw new Error('Invalid login response from server');
      }

      localStorage.setItem('nestora_token', token);
      localStorage.setItem('nestora_user', JSON.stringify(user));
      return { user, token };
    } catch (apiError) {
      // If error is an authentication error (401 invalid credentials, 400 validation), rethrow immediately
      const errMsg = apiError.message || '';
      const isAuthRejection =
        errMsg.toLowerCase().includes('credential') ||
        errMsg.toLowerCase().includes('password') ||
        errMsg.toLowerCase().includes('invalid') ||
        errMsg.toLowerCase().includes('user not found');

      if (isAuthRejection) {
        throw apiError;
      }

      // If backend is completely offline/unreachable, gracefully fall back to local test users
      console.warn('Backend server offline or unreachable. Using fallback authentication:', errMsg);
      const users = getStoredUsers();
      const lowerEmail = (email || '').toLowerCase().trim();
      const user = users.find((u) => u.email.toLowerCase() === lowerEmail);

      if (!user) {
        throw new Error('Invalid email or password credentials');
      }

      const roleStr = (user.role || 'renter').toLowerCase();
      const token = `nestora_token_${roleStr}_${user._id || `usr_${Date.now()}`}_${encodeURIComponent(user.email)}_${encodeURIComponent(user.name || 'Nestora User')}`;
      localStorage.setItem('nestora_token', token);
      localStorage.setItem('nestora_user', JSON.stringify(user));
      return { user, token };
    }
  },

  // Register via Backend REST API (POST /api/auth/register)
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      const user = response?.data?.user || response?.user;
      const token = response?.data?.token || response?.token;

      if (!user || !token) {
        throw new Error('Invalid registration response from server');
      }

      localStorage.setItem('nestora_token', token);
      localStorage.setItem('nestora_user', JSON.stringify(user));
      return { user, token };
    } catch (apiError) {
      const errMsg = apiError.message || '';
      const isValidationError =
        errMsg.toLowerCase().includes('already exists') ||
        errMsg.toLowerCase().includes('forbidden') ||
        errMsg.toLowerCase().includes('required') ||
        errMsg.toLowerCase().includes('prohibited');

      if (isValidationError) {
        throw apiError;
      }

      // Offline fallback
      console.warn('Backend server offline or unreachable. Registering locally:', errMsg);
      const users = getStoredUsers();
      const lowerEmail = (userData.email || '').toLowerCase().trim();

      if (users.some((u) => u.email.toLowerCase() === lowerEmail)) {
        throw new Error('A user with this email address already exists');
      }

      const assignedRole = (userData.role || '').toLowerCase() === 'owner' ? 'Owner' : 'Renter';

      const newUser = {
        _id: `usr_${Date.now()}`,
        name: userData.name,
        email: lowerEmail,
        role: assignedRole,
        phone: userData.phone || '+91 98470 00000',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        bio: 'Verified member at Nestora.',
        savedProperties: [],
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveUsers(users);

      const token = `nestora_token_${newUser.role.toLowerCase()}_${newUser._id}_${encodeURIComponent(newUser.email)}_${encodeURIComponent(newUser.name)}`;
      localStorage.setItem('nestora_token', token);
      localStorage.setItem('nestora_user', JSON.stringify(newUser));
      return { user: newUser, token };
    }
  },

  // Get current authenticated user profile (GET /api/auth/me)
  async getMe() {
    try {
      const response = await api.get('/auth/me');
      const user = response?.data?.user || response?.user;
      if (user) {
        localStorage.setItem('nestora_user', JSON.stringify(user));
        return user;
      }
    } catch (err) {
      console.warn('Failed to fetch user from backend /api/auth/me:', err.message);
    }
    const stored = localStorage.getItem('nestora_user');
    return stored ? JSON.parse(stored) : null;
  },

  // Update profile details (PUT /api/auth/profile)
  async updateProfile(profileData) {
    try {
      // Strip any role property to prevent role escalation attempts
      const { role, ...allowedUpdates } = profileData;
      const response = await api.put('/auth/profile', allowedUpdates);
      const user = response?.data?.user || response?.user;
      if (user) {
        localStorage.setItem('nestora_user', JSON.stringify(user));
        return user;
      }
    } catch (err) {
      console.warn('Backend updateProfile offline, persisting locally:', err.message);
    }

    const current = JSON.parse(localStorage.getItem('nestora_user') || '{}');
    const { role, ...safeUpdates } = profileData;
    const updated = { ...current, ...safeUpdates };
    localStorage.setItem('nestora_user', JSON.stringify(updated));

    const users = getStoredUsers();
    const idx = users.findIndex((u) => u._id === updated._id || u.email === updated.email);
    if (idx !== -1) {
      users[idx] = updated;
      saveUsers(users);
    }
    return updated;
  },

  // Change password (PUT /api/auth/change-password)
  async changePassword({ currentPassword, newPassword }) {
    return await api.put('/auth/change-password', { currentPassword, newPassword });
  },

  // Logout (POST /api/auth/logout)
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('nestora_token');
      localStorage.removeItem('nestora_user');
    }
  },
};
