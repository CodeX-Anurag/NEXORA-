const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/v1";

/**
 * Helper to execute fetch requests with credentials (cookies) included
 */
const authFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  const config = {
    ...options,
    headers,
    credentials: "include" // Send httpOnly cookies for refresh token & CORS
  };

  try {
    const response = await fetch(url, config);
    let data;
    try {
      data = await response.json();
    } catch {
      data = { message: `Server returned HTTP ${response.status} (${response.statusText || "Unknown"})` };
    }

    if (!response.ok) {
      const error = new Error(data.message || `HTTP Error: Status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      const netError = new Error("Unable to connect to the NEXORA backend. Please verify the API server is online.");
      netError.status = 503;
      throw netError;
    }
    throw error;
  }
};

export const authService = {
  // POST /api/v1/auth/register
  register: async (name, email, password) => {
    return await authFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
  },

  // POST /api/v1/auth/login
  login: async (email, password) => {
    return await authFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },

  // POST /api/v1/auth/forgot-password
  forgotPassword: async (email) => {
    return await authFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  },

  // POST /api/v1/auth/verify-reset-token
  verifyResetToken: async (token) => {
    return await authFetch("/auth/verify-reset-token", {
      method: "POST",
      body: JSON.stringify({ token })
    });
  },

  // POST /api/v1/auth/reset-password
  resetPassword: async (token, password) => {
    return await authFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password })
    });
  },

  // POST /api/v1/auth/refresh
  refresh: async () => {
    return await authFetch("/auth/refresh", {
      method: "POST"
    });
  },

  // POST /api/v1/auth/logout
  logout: async () => {
    return await authFetch("/auth/logout", {
      method: "POST"
    });
  },

  // GET /api/v1/users/me
  getProfile: async (accessToken) => {
    return await authFetch("/users/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  },

  // PUT /api/v1/users/me
  updateProfile: async (accessToken, updateData) => {
    return await authFetch("/users/me", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(updateData)
    });
  },

  // PUT /api/v1/users/me (preferences shortcut)
  updatePreferences: async (accessToken, preferences) => {
    return await authFetch("/users/me", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ preferences })
    });
  },

  // DELETE /api/v1/users/me
  deleteAccount: async (accessToken) => {
    return await authFetch("/users/me", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }
};

export default authService;
