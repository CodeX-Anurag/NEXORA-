import apiClient from "./api";

/**
 * Frontend Notification Service
 */
export const getNotifications = async (accessToken, { limit = 50, filter = "all", unreadOnly = false } = {}) => {
  if (!accessToken) throw new Error("Authentication token required.");

  const params = new URLSearchParams();
  if (limit) params.append("limit", limit);
  if (filter) params.append("filter", filter);
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

export const archiveNotification = async (accessToken, notificationId) => {
  if (!accessToken || !notificationId) throw new Error("Missing parameters for archiveNotification.");

  return await apiClient(`/notifications/${notificationId}/archive`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
};

export const deleteNotification = async (accessToken, notificationId) => {
  if (!accessToken || !notificationId) throw new Error("Missing parameters for deleteNotification.");

  return await apiClient(`/notifications/${notificationId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
};

export const checkReminders = async (accessToken) => {
  if (!accessToken) throw new Error("Authentication token required.");

  return await apiClient("/notifications/check-reminders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
};

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  deleteNotification,
  checkReminders
};
