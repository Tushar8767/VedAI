import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const token = localStorage.getItem('vedai_token');
      if (token) {
        const res = await api.getMe();
        if (res.success && !res.isGuest) {
          setUser(res.user);
          setIsGuest(false);
          setLoading(false);
          return;
        }
      }

      // Initialize guest session
      let guestId = localStorage.getItem('vedai_guest_session_id');
      if (!guestId) {
        const guestRes = await api.getGuestSession();
        if (guestRes.success) {
          localStorage.setItem('vedai_guest_session_id', guestRes.guestSessionId);
        }
      }
      setUser({ name: 'Guest Traveler', email: null });
      setIsGuest(true);
    } catch (err) {
      console.warn('Auth initialization fallback to guest:', err);
      setUser({ name: 'Guest Traveler', email: null });
      setIsGuest(true);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success) {
      localStorage.setItem('vedai_token', res.token);
      setUser(res.user);
      setIsGuest(false);
      return { success: true };
    }
    return { success: false, message: res.message };
  };

  const register = async (name, email, password) => {
    const res = await api.register(name, email, password);
    if (res.success) {
      localStorage.setItem('vedai_token', res.token);
      setUser(res.user);
      setIsGuest(false);
      return { success: true };
    }
    return { success: false, message: res.message };
  };

  const logout = () => {
    localStorage.removeItem('vedai_token');
    setUser({ name: 'Guest Traveler', email: null });
    setIsGuest(true);
  };

  return (
    <AuthContext.Provider value={{ user, isGuest, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
