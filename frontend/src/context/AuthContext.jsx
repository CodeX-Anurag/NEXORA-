import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import authService from "../services/auth.service";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Restore immediately from localStorage to avoid flashes or blank redirect loops
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("nexora_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState(() => {
    try {
      return localStorage.getItem("nexora_token") || null;
    } catch {
      return null;
    }
  });

  // If we already have stored credentials, don't block the screen with fullScreen loader
  const [isLoading, setIsLoading] = useState(() => {
    try {
      return !localStorage.getItem("nexora_token");
    } catch {
      return true;
    }
  });

  // Silent session restore / verification on initial page load
  const restoreSession = useCallback(async () => {
    try {
      // 1. Try refresh endpoint first (with httpOnly cookie)
      const data = await authService.refresh();
      if (data && data.accessToken && data.user) {
        setAccessToken(data.accessToken);
        setUser(data.user);
        try {
          localStorage.setItem("nexora_token", data.accessToken);
          localStorage.setItem("nexora_user", JSON.stringify(data.user));
        } catch {
          // ignore storage quota errors
        }
        return data;
      }
    } catch {
      // 2. If cookie refresh failed, check if stored token is still valid
      try {
        const storedToken = localStorage.getItem("nexora_token");
        if (storedToken) {
          const profileData = await authService.getProfile(storedToken);
          if (profileData && profileData.user) {
            setUser(profileData.user);
            setAccessToken(storedToken);
            localStorage.setItem("nexora_user", JSON.stringify(profileData.user));
            return;
          }
        }
      } catch {
        // Token expired or invalid, clear local storage
        try {
          localStorage.removeItem("nexora_token");
          localStorage.removeItem("nexora_user");
        } catch {
          // ignore
        }
        setAccessToken(null);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 4-second safety guard so isLoading can NEVER hang forever
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4000);

    restoreSession().finally(() => {
      clearTimeout(timer);
    });

    return () => clearTimeout(timer);
  }, [restoreSession]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    setAccessToken(data.accessToken);
    try {
      localStorage.setItem("nexora_token", data.accessToken);
      localStorage.setItem("nexora_user", JSON.stringify(data.user));
    } catch {
      // ignore
    }
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    setUser(data.user);
    setAccessToken(data.accessToken);
    try {
      localStorage.setItem("nexora_token", data.accessToken);
      localStorage.setItem("nexora_user", JSON.stringify(data.user));
    } catch {
      // ignore
    }
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
      try {
        localStorage.removeItem("nexora_token");
        localStorage.removeItem("nexora_user");
      } catch {
        // ignore
      }
    }
  };

  const refreshUser = async () => {
    if (!accessToken) return null;
    try {
      const data = await authService.getProfile(accessToken);
      if (data && data.user) {
        setUser(data.user);
        try {
          localStorage.setItem("nexora_user", JSON.stringify(data.user));
        } catch {
          // ignore
        }
        return data.user;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const updateProfile = async (updateData) => {
    if (!accessToken) throw new Error("Not authenticated");
    const data = await authService.updateProfile(accessToken, updateData);
    setUser(data.user);
    try {
      localStorage.setItem("nexora_user", JSON.stringify(data.user));
    } catch {
      // ignore
    }
    return data;
  };

  const deleteAccount = async () => {
    if (!accessToken) throw new Error("Not authenticated");
    await authService.deleteAccount(accessToken);
    setUser(null);
    setAccessToken(null);
    try {
      localStorage.removeItem("nexora_token");
      localStorage.removeItem("nexora_user");
    } catch {
      // ignore
    }
  };

  const value = {
    user,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
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
