import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { propertyService } from '../services/propertyService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('nestora_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify user session on mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const storedToken = localStorage.getItem('nestora_token');
      const storedUser = localStorage.getItem('nestora_user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (isMounted) {
            setUser(parsedUser);
            setLoading(false); // Unblock rendering immediately with cached session
          }

          // Asynchronously verify or refresh user profile with backend
          authService.getMe()
            .then((freshUser) => {
              if (freshUser && isMounted) {
                setUser(freshUser);
              }
            })
            .catch((fetchErr) => {
              console.warn('Backend session verification note:', fetchErr.message);
            });
        } catch (error) {
          console.warn('Session parse error:', error.message);
          logout();
          if (isMounted) setLoading(false);
        }
      } else {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    setUser(data.user);
    setToken(data.token);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    setUser(data.user);
    setToken(data.token);
    return data;
  };

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Logout notice:', e.message);
    } finally {
      localStorage.removeItem('nestora_token');
      localStorage.removeItem('nestora_user');
      setUser(null);
      setToken(null);
    }
  }, []);

  const updateProfile = async (profileData) => {
    const updated = await authService.updateProfile(profileData);
    setUser((prev) => ({ ...prev, ...updated }));
    return updated;
  };

  // Instant role switch for testing Admin, Owner, and Renter views seamlessly
  const switchRole = (newRole) => {
    if (!user) return;
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    localStorage.setItem('nestora_user', JSON.stringify(updatedUser));
    const roleStr = newRole.toLowerCase();
    const newToken = `nestora_token_${roleStr}_${user._id || `usr_${Date.now()}`}_${encodeURIComponent(user.email || 'user@nestora.com')}_${encodeURIComponent(user.name || 'Nestora User')}`;
    setToken(newToken);
    localStorage.setItem('nestora_token', newToken);
  };

  const toggleFavorite = async (propertyId) => {
    if (!user) return false;
    try {
      const res = await propertyService.toggleFavorite(propertyId);
      setUser((prev) => {
        if (!prev) return prev;
        const currentSaved = prev.savedProperties || [];
        const isPresent = currentSaved.includes(propertyId);
        const updatedSaved = isPresent
          ? currentSaved.filter((id) => id !== propertyId)
          : [...currentSaved, propertyId];

        const updatedUser = { ...prev, savedProperties: updatedSaved };
        localStorage.setItem('nestora_user', JSON.stringify(updatedUser));
        return updatedUser;
      });
      return res.isFavorite;
    } catch (error) {
      console.error('Toggle favorite error:', error);
      throw error;
    }
  };

  const isFavorite = (propertyId) => {
    if (!user || !user.savedProperties) return false;
    return user.savedProperties.some((id) => {
      if (typeof id === 'object' && id?._id) {
        return id._id === propertyId;
      }
      return id === propertyId;
    });
  };

  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';
  const isHost = userRole === 'owner' || userRole === 'host' || isAdmin;
  const isRenter = userRole === 'renter';

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isHost,
    isAdmin,
    isRenter,
    role: user?.role || 'Owner',
    login,
    register,
    logout,
    updateProfile,
    switchRole,
    toggleFavorite,
    isFavorite,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
