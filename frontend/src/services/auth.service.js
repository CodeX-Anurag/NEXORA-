const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

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

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || `HTTP Error: Status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
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
