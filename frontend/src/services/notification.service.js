import apiClient from "./api";

/**
 * Frontend Notification Service for Substep 12A
 */
export const getNotifications = async (accessToken, { limit = 50, unreadOnly = false } = {}) => {
  if (!accessToken) throw new Error("Authentication token required.");

  const params = new URLSearchParams();
  if (limit) params.append("limit", limit);
  if (unreadOnly) params.append("unreadOnly", "true");

  return await apiClient(`/notifications?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
};

export const markAsRead = async (accessToken, notificationId) => {
  if (!accessToken || !notificationId) throw new Error("Missing parameters for markAsRead.");

  return await apiClient(`/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
};

export const markAllAsRead = async (accessToken) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/notifications/read-all", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
};

export default {
  getNotifications,
  markAsRead,
  markAllAsRead
};
