import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import authService from "../services/auth.service";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Silent session restore on initial page load
  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await authService.refresh();
      if (data && data.accessToken && data.user) {
        setAccessToken(data.accessToken);
        setUser(data.user);
      } else {
        setAccessToken(null);
        setUser(null);
      }
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    setAccessToken(data.accessToken);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    setUser(data.user);
    setAccessToken(data.accessToken);
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  const updateProfile = async (updateData) => {
    if (!accessToken) throw new Error("Not authenticated");
    const data = await authService.updateProfile(accessToken, updateData);
    setUser(data.user);
    return data;
  };

  const deleteAccount = async () => {
    if (!accessToken) throw new Error("Not authenticated");
    await authService.deleteAccount(accessToken);
    setUser(null);
    setAccessToken(null);
  };

  const value = {
    user,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    deleteAccount,
    restoreSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
