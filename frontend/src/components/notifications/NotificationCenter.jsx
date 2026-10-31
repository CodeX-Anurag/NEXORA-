import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  Archive,
  Trash2,
  Clock,
  AlertTriangle,
  BookOpen,
  Info,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import notificationService from "../../services/notification.service";

/**
 * Format timestamp to relative human readable string
 */
const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `${hours}h ago`;
  }
  const days = Math.floor(diffSec / 86400);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const NotificationCenter = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'unread' | 'archived'
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingReminders, setIsCheckingReminders] = useState(false);
  const [error, setError] = useState("");

  const isMountedRef = useRef(true);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(
    async (isSilent = false) => {
      if (!accessToken) return;
      if (!isSilent) setIsLoading(true);

      try {
        const data = await notificationService.getNotifications(accessToken, {
          limit: 50,
          filter: activeTab
        });
        if (isMountedRef.current && data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
          setError("");
        }
      } catch (err) {
        if (isMountedRef.current && !isSilent) {
          setError(err.message || "Failed to load notifications.");
        }
      } finally {
        if (isMountedRef.current && !isSilent) {
          setIsLoading(false);
        }
      }
    },
    [accessToken, activeTab]
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchNotifications(false);

    const timer = setInterval(() => {
      fetchNotifications(true);
    }, 25000);

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (notificationId, e) => {
    if (e) e.stopPropagation();
    try {
      setNotifications((prev) =>
        prev.map((item) => (item._id === notificationId ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await notificationService.markAsRead(accessToken, notificationId);
    } catch {
      // Revert if failed
      fetchNotifications(true);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      await notificationService.markAllAsRead(accessToken);
    } catch {
      fetchNotifications(true);
    }
  };

  const handleArchive = async (notificationId, e) => {
    if (e) e.stopPropagation();
    try {
      const target = notifications.find((n) => n._id === notificationId);
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((item) => item._id !== notificationId));
      await notificationService.archiveNotification(accessToken, notificationId);
    } catch {
      fetchNotifications(true);
    }
  };

  const handleDelete = async (notificationId, e) => {
    if (e) e.stopPropagation();
    try {
      const target = notifications.find((n) => n._id === notificationId);
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((item) => item._id !== notificationId));
      await notificationService.deleteNotification(accessToken, notificationId);
    } catch {
      fetchNotifications(true);
    }
  };

  const handleCheckReminders = async () => {
    setIsCheckingReminders(true);
    try {
      await notificationService.checkReminders(accessToken);
      await fetchNotifications(false);
    } catch {
      // Swallowed safely
    } finally {
      setIsCheckingReminders(false);
    }
  };

  const handleNotificationClick = (item) => {
    if (!item.isRead) {
      handleMarkAsRead(item._id);
    }
    if (item.relatedEntityType === "Task" && item.relatedEntityId) {
      setIsOpen(false);
      navigate(`/tasks?taskId=${item.relatedEntityId}`);
    }
  };

  const renderTypeIcon = (type) => {
    switch (type) {
      case "TASK_DUE_SOON":
      case "TASK_REMINDER":
      case "DEADLINE_APPROACHING":
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
      case "TASK_OVERDUE":
        return (
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case "TASK_COMPLETED":
        return (
          <div className="w-8 h-8 rounded-lg bg-[#2EA366]/10 border border-[#2EA366]/25 text-[#2EA366] flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
        );
      case "STUDY_REMINDER":
        return (
          <div className="w-8 h-8 rounded-lg bg-[#2EA366]/10 border border-[#2EA366]/25 text-[#2EA366] flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-[#E0693B]/10 border border-[#E0693B]/25 text-[#E0693B] flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2.5 rounded-xl bg-[#1C1A17] border border-[#2D2925] text-[#CDC5B6] hover:text-[#FAF7F2] hover:bg-[#25221E] transition-colors focus:outline-none focus:ring-1 focus:ring-[#E0693B] cursor-pointer"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[1.125rem] px-1 items-center justify-center rounded-full bg-[#E0693B] text-[10px] font-bold text-white shadow-md shadow-[#E0693B]/40 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#191816] border border-[#332F2A] shadow-2xl z-50 overflow-hidden animate-fade-in">
          {/* Panel Header */}
          <div className="p-4 bg-[#1E1C19] border-b border-[#2D2925] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#FAF7F2] font-display">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#E0693B]/15 text-[#E0693B] border border-[#E0693B]/30 font-mono">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCheckReminders}
                disabled={isCheckingReminders}
                title="Scan task deadlines and refresh reminders"
                className="p-1 rounded-lg hover:bg-[#25221F] text-[#9C9384] hover:text-[#FAF7F2] transition-colors text-xs flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isCheckingReminders ? "animate-spin text-[#E0693B]" : ""}`} />
                <span className="text-[10px] hidden sm:inline">Scan Reminders</span>
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-semibold text-[#E0693B] hover:text-[#EB784B] transition-colors cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 py-2 bg-[#161513] border-b border-[#2D2925] flex items-center gap-4 text-xs">
            <button
              onClick={() => setActiveTab("all")}
              className={`pb-1 font-medium transition-colors border-b-2 cursor-pointer ${
                activeTab === "all"
                  ? "text-[#E0693B] border-[#E0693B] font-semibold"
                  : "text-[#9C9384] border-transparent hover:text-[#FAF7F2]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`pb-1 font-medium transition-colors border-b-2 cursor-pointer ${
                activeTab === "unread"
                  ? "text-[#E0693B] border-[#E0693B] font-semibold"
                  : "text-[#9C9384] border-transparent hover:text-[#FAF7F2]"
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`pb-1 font-medium transition-colors border-b-2 cursor-pointer ${
                activeTab === "archived"
                  ? "text-[#E0693B] border-[#E0693B] font-semibold"
                  : "text-[#9C9384] border-transparent hover:text-[#FAF7F2]"
              }`}
            >
              Archived
            </button>
          </div>

          {/* Notification List Body */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#262420]">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-[#9C9384]">Loading notifications...</div>
            ) : error ? (
              <div className="p-6 text-center text-xs text-rose-400">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-[#22201D] flex items-center justify-center text-[#787165]">
                  <Bell className="w-4 h-4 opacity-40" />
                </div>
                <p className="text-xs font-medium text-[#CDC5B6]">No notifications here.</p>
                <p className="text-[10px] text-[#877E71]">
                  {activeTab === "unread"
                    ? "You've read all your notifications."
                    : activeTab === "archived"
                    ? "No archived notifications."
                    : "Task deadline reminders will appear here."}
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group ${
                    !item.isRead
                      ? "bg-[#E0693B]/5 hover:bg-[#E0693B]/10 border-l-2 border-[#E0693B]"
                      : "hover:bg-[#201E1B] opacity-80"
                  }`}
                >
                  {renderTypeIcon(item.type)}

                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#FAF7F2] truncate flex items-center gap-1">
                        {item.title}
                        {item.relatedEntityType === "Task" && (
                          <ExternalLink className="w-2.5 h-2.5 text-[#E0693B] opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </p>
                      <span className="text-[10px] text-[#877E71] shrink-0 font-mono">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#CDC5B6] line-clamp-2 leading-relaxed">{item.message}</p>

                    {/* Quick Item Actions */}
                    <div className="flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!item.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(item._id, e)}
                          className="text-[10px] text-[#E0693B] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Check className="w-2.5 h-2.5" /> Mark read
                        </button>
                      )}
                      {!item.isArchived && (
                        <button
                          onClick={(e) => handleArchive(item._id, e)}
                          className="text-[10px] text-[#9C9384] hover:text-[#FAF7F2] flex items-center gap-0.5 cursor-pointer"
                        >
                          <Archive className="w-2.5 h-2.5" /> Archive
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(item._id, e)}
                        className="text-[10px] text-rose-400/80 hover:text-rose-400 flex items-center gap-0.5 ml-auto cursor-pointer"
                      >
                        <Trash2 className="w-2.5 h-2.5" /> Delete
                      </button>
                    </div>
                  </div>

                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#E0693B] shrink-0 mt-1.5" title="Unread" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
