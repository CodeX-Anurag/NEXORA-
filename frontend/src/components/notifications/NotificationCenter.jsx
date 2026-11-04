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
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
      case "TASK_OVERDUE":
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case "TASK_COMPLETED":
        return (
          <div className="w-8 h-8 rounded-xl bg-[#12B76A]/10 border border-[#12B76A]/20 text-[#12B76A] flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
        );
      case "STUDY_REMINDER":
        return (
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
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
        className="relative p-2 sm:p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#161F30] border border-[#E7EAF0] dark:border-[#1F2937] text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white hover:bg-[#F1F4F9] dark:hover:bg-[#1E293B] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer shadow-2xs"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] px-1 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] shadow-xl z-50 overflow-hidden animate-fade-in">
          {/* Panel Header */}
          <div className="p-4 bg-white dark:bg-[#111827] border-b border-[#E7EAF0] dark:border-[#1F2937] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#172033] dark:text-white font-display">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 font-mono">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCheckReminders}
                disabled={isCheckingReminders}
                title="Scan task deadlines and refresh reminders"
                className="p-1 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-slate-800 text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white transition-colors text-xs flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isCheckingReminders ? "animate-spin text-blue-500" : ""}`} />
                <span className="text-[10px] hidden sm:inline">Scan Reminders</span>
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 py-2 bg-[#F8FAFC] dark:bg-[#161F30] border-b border-[#E7EAF0] dark:border-[#1F2937] flex items-center gap-4 text-xs">
            <button
              onClick={() => setActiveTab("all")}
              className={`pb-1 font-medium transition-colors border-b-2 cursor-pointer ${
                activeTab === "all"
                  ? "text-blue-600 dark:text-blue-400 border-blue-500 font-semibold"
                  : "text-[#667085] dark:text-slate-400 border-transparent hover:text-[#172033] dark:hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`pb-1 font-medium transition-colors border-b-2 cursor-pointer ${
                activeTab === "unread"
                  ? "text-blue-600 dark:text-blue-400 border-blue-500 font-semibold"
                  : "text-[#667085] dark:text-slate-400 border-transparent hover:text-[#172033] dark:hover:text-white"
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`pb-1 font-medium transition-colors border-b-2 cursor-pointer ${
                activeTab === "archived"
                  ? "text-blue-600 dark:text-blue-400 border-blue-500 font-semibold"
                  : "text-[#667085] dark:text-slate-400 border-transparent hover:text-[#172033] dark:hover:text-white"
              }`}
            >
              Archived
            </button>
          </div>

          {/* Notification List Body */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#E7EAF0]">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-[#667085]">Loading notifications...</div>
            ) : error ? (
              <div className="p-6 text-center text-xs text-rose-500">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-[#F8FAFC] flex items-center justify-center text-[#98A2B3]">
                  <Bell className="w-4 h-4 opacity-50" />
                </div>
                <p className="text-xs font-medium text-[#172033]">No notifications here.</p>
                <p className="text-[10px] text-[#667085]">
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
                      ? "bg-[#EEF2FF]/40 hover:bg-[#EEF2FF]/70 border-l-2 border-[#4F7CFF]"
                      : "hover:bg-[#F8FAFC]"
                  }`}
                >
                  {renderTypeIcon(item.type)}

                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-[#172033] truncate flex items-center gap-1">
                        {item.title}
                        {item.relatedEntityType === "Task" && (
                          <ExternalLink className="w-2.5 h-2.5 text-[#4F7CFF] opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </p>
                      <span className="text-[10px] text-[#98A2B3] shrink-0 font-mono">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#667085] leading-relaxed line-clamp-2">
                      {item.message}
                    </p>

                    {/* Action buttons on hover */}
                    <div className="flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!item.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(item._id, e)}
                          className="text-[10px] text-[#4F7CFF] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Check className="w-2.5 h-2.5" /> Mark read
                        </button>
                      )}
                      <button
                        onClick={(e) => handleArchive(item._id, e)}
                        className="text-[10px] text-[#667085] hover:text-[#172033] flex items-center gap-0.5 cursor-pointer"
                      >
                        <Archive className="w-2.5 h-2.5" /> Archive
                      </button>
                      <button
                        onClick={(e) => handleDelete(item._id, e)}
                        className="text-[10px] text-rose-500 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer ml-auto"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
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
