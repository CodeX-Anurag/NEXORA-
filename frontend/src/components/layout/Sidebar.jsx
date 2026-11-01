import React from "react";
import { NavLink } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export const Sidebar = ({ mobileOpen = false, onCloseMobile }) => {
  const { user } = useAuth();
  const { theme, toggleTheme, isDay } = useTheme();

  const activeNavItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    },
    {
      label: "Tasks",
      path: "/tasks",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
    },
    {
      label: "Study Tracker",
      path: "/study",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    },
    {
      label: "Career Intelligence",
      path: "/career",
      icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
    },
    {
      label: "Projects Portfolio",
      path: "/projects",
      icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
    },
    {
      label: "Resume & Portfolio",
      path: "/resume",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    },
    {
      label: "Analytics",
      path: "/analytics",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    },
    {
      label: "AI Coach",
      path: "/ai-coach",
      icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
    },
    {
      label: "AI Socratic Viva",
      path: "/viva",
      badge: "Voice AI",
      icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"
    },
    {
      label: "Memory & Privacy",
      path: "/memory-settings",
      icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    }
  ];

  if (user?.role === "admin") {
    activeNavItems.push({
      label: "System Observability",
      path: "/observability",
      icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
    });
  }

  const navContent = (
    <aside className="w-64 bg-[#161513] border-r border-[#2B2723] p-4 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 z-20">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#9C9384] mb-2 font-display">
            Platform Suite
          </p>
          <nav className="space-y-1">
            {activeNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#E0693B]/10 text-[#FAF7F2] border border-[#E0693B]/30 font-semibold shadow-sm"
                      : "text-[#A89F91] hover:text-[#FAF7F2] hover:bg-[#201E1B] border border-transparent"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <svg
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isActive ? "text-[#E0693B]" : "text-[#877E71]"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d={item.icon} />
                    </svg>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#E0693B]/20 text-[#E0693B] border border-[#E0693B]/30 tracking-tight">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <div className="pt-4 border-t border-[#2B2723] px-2 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center justify-between p-2 rounded-xl bg-[#1C1A17] hover:bg-[#22201D] border border-[#2D2925] hover:border-[#38332E] transition-all text-xs cursor-pointer group"
          title={isDay ? "Switch to Night Mode" : "Switch to Day Mode"}
        >
          <div className="flex items-center gap-2">
            {isDay ? (
              <Sun className="w-4 h-4 text-[#E0693B] animate-spin-slow" />
            ) : (
              <Moon className="w-4 h-4 text-[#E0693B]" />
            )}
            <span className="font-medium text-[#CDC5B6] group-hover:text-[#FAF7F2]">
              {isDay ? "Day Mode" : "Night Mode"}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#25221F] text-[#E0693B] border border-[#3D3833]">
            {isDay ? "Light" : "Dark"}
          </span>
        </button>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-[#877E71] font-mono">NEXORA Platform</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#22201D] text-[#CDC5B6] border border-[#332F2A]">
            v1.0.0 Pro
          </span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop view */}
      <div className="hidden lg:block shrink-0">{navContent}</div>

      {/* Mobile Drawer view */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer */}
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl animate-fade-in">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
