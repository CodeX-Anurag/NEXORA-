import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  TrendingUp,
  FolderKanban,
  FileText,
  BarChart2,
  MessageSquare,
  Mic,
  Shield,
  Activity,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { MODULE_THEMES } from "../../utils/colorSystem";

export const Sidebar = ({ mobileOpen = false, onCloseMobile }) => {
  const { user } = useAuth();
  const { toggleTheme, isDay } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeNavItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Tasks",
      path: "/tasks",
      icon: CheckSquare,
    },
    {
      label: "Study Tracker",
      path: "/study",
      icon: Clock,
    },
    {
      label: "Career Intelligence",
      path: "/career",
      icon: TrendingUp,
    },
    {
      label: "Projects Portfolio",
      path: "/projects",
      icon: FolderKanban,
    },
    {
      label: "Resume & Portfolio",
      path: "/resume",
      icon: FileText,
    },
    {
      label: "Analytics",
      path: "/analytics",
      icon: BarChart2,
    },
    {
      label: "AI Coach",
      path: "/ai-coach",
      icon: MessageSquare,
    },
    {
      label: "AI Socratic Viva",
      path: "/viva",
      badge: "Voice AI",
      icon: Mic,
    },
    {
      label: "Memory & Privacy",
      path: "/memory-settings",
      icon: Shield,
    }
  ];

  if (user?.role === "admin") {
    activeNavItems.push({
      label: "System Observability",
      path: "/observability",
      icon: Activity,
    });
  }

  const renderNavList = (collapsed = false) => (
    <nav className="space-y-1.5">
      {activeNavItems.map((item) => {
        const Icon = item.icon;
        const modTheme = MODULE_THEMES[item.path] || MODULE_THEMES["/dashboard"];

        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onCloseMobile}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `relative flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? `${modTheme.activeBg} ${modTheme.activeText} font-semibold shadow-2xs`
                  : "text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 hover:translate-x-0.5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                    isActive
                      ? "bg-white/80 dark:bg-black/30 shadow-2xs " + modTheme.iconColor
                      : "text-slate-400 dark:text-slate-500 group-hover:" + modTheme.iconColor
                  }`}
                >
                  <Icon size={17} className="shrink-0" />
                </div>

                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-300 border border-pink-200 dark:border-pink-800/40 tracking-tight shrink-0 shadow-2xs">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}

                {/* Module-specific vibrant indicator bar */}
                {isActive && (
                  <span
                    className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full ${modTheme.barColor} shadow-sm`}
                  />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop view */}
      <aside
        className={`hidden lg:flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 z-20 bg-white dark:bg-[#111827] border-r border-[#E7EAF0] dark:border-[#1F2937] p-3.5 transition-all duration-200 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="space-y-3 overflow-y-auto pr-0.5">
          {!isCollapsed && (
            <div className="px-2.5 flex items-center justify-between pt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3] dark:text-slate-500 font-sans">
                Platform Suite
              </p>
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="p-1 rounded-lg text-[#98A2B3] hover:text-[#172033] dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Collapse sidebar"
              >
                <ChevronLeft size={15} />
              </button>
            </div>
          )}

          {isCollapsed && (
            <div className="flex justify-center pb-1">
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                className="p-1.5 rounded-xl text-[#98A2B3] hover:text-[#172033] dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Expand sidebar"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          )}

          {renderNavList(isCollapsed)}
        </div>

        <div className="pt-3 border-t border-[#E7EAF0] dark:border-[#1F2937] flex flex-col gap-2.5">
          {/* Day / Night Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`flex items-center ${isCollapsed ? "justify-center p-2" : "justify-between p-2.5"} rounded-xl bg-[#F8FAFC] dark:bg-[#161F30] hover:bg-[#F1F4F9] dark:hover:bg-[#1E293B] border border-[#E7EAF0] dark:border-[#1F2937] hover:border-[#D0D5DD] dark:hover:border-slate-700 transition-all text-xs cursor-pointer group shadow-2xs active:scale-95`}
            title={isDay ? "Switch to Night Mode" : "Switch to Day Mode"}
            aria-label={isDay ? "Switch to Night Mode" : "Switch to Day Mode"}
          >
            <div className="flex items-center gap-2">
              {isDay ? (
                <Sun size={16} className="text-amber-500" />
              ) : (
                <Moon size={16} className="text-violet-400" />
              )}
              {!isCollapsed && (
                <span className="font-medium text-[#172033] dark:text-slate-200">
                  {isDay ? "Day Mode" : "Night Mode"}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 border border-[#E7EAF0] dark:border-[#1F2937] shadow-2xs">
                {isDay ? "Light" : "Dark"}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer view */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer */}
          <div className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-[#111827] shadow-2xl flex flex-col justify-between p-4 z-10 animate-fade-in border-r border-[#E7EAF0] dark:border-[#1F2937]">
            <div className="space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7EAF0] dark:border-[#1F2937]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/25">
                    <span className="font-bold text-sm">N</span>
                  </div>
                  <span className="font-display font-bold text-lg text-[#172033] dark:text-white">NEXORA</span>
                </div>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-lg text-[#98A2B3] hover:text-[#172033] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close navigation"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3] dark:text-slate-500 px-2 font-sans">
                Navigation
              </p>

              {renderNavList(false)}
            </div>

            <div className="pt-3 border-t border-[#E7EAF0] dark:border-[#1F2937] flex flex-col gap-2.5">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#161F30] hover:bg-[#F1F4F9] dark:hover:bg-[#1E293B] border border-[#E7EAF0] dark:border-[#1F2937] text-xs transition-colors cursor-pointer"
                title={isDay ? "Switch to Night Mode" : "Switch to Day Mode"}
              >
                <div className="flex items-center gap-2">
                  {isDay ? (
                    <Sun size={16} className="text-amber-500" />
                  ) : (
                    <Moon size={16} className="text-violet-400" />
                  )}
                  <span className="font-medium text-[#172033] dark:text-slate-200">
                    {isDay ? "Day Mode" : "Night Mode"}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 border border-[#E7EAF0] dark:border-[#1F2937]">
                  {isDay ? "Light" : "Dark"}
                </span>
              </button>

              <div className="flex items-center justify-between px-1 text-[11px] text-[#98A2B3] dark:text-slate-500">
                <span>NEXORA v1.0.0 Pro</span>
                <span className="text-emerald-500 font-semibold">Ready</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
