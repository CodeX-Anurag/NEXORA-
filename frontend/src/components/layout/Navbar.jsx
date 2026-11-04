import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sun, Moon, Sparkles, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Button from "../common/Button";
import NotificationCenter from "../notifications/NotificationCenter";

export const Navbar = ({ apiStatus: _apiStatus, onToggleMobileMenu, onRefreshHealth: _onRefreshHealth }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { toggleTheme, isDay } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <header className="h-16 bg-white/85 dark:bg-[#111827]/85 backdrop-blur-md border-b border-[#E7EAF0] dark:border-[#1F2937] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Brand & Mobile Toggle */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
          aria-label="Toggle navigation drawer"
        >
          <Menu size={20} />
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-indigo-500/30 transition-all duration-200">
            <Sparkles size={17} className="animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-tight text-[#172033] dark:text-white font-display">
              NEXORA
            </span>
            <span className="text-[10px] font-medium tracking-tight text-[#667085] dark:text-slate-400 -mt-1 hidden sm:block">
              Student Productivity Suite
            </span>
          </div>
        </Link>
      </div>

      {/* User Auth & Theme Section */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Day / Night Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDay ? "Switch to Night Mode" : "Switch to Day Mode"}
          aria-label={isDay ? "Switch to Night Mode" : "Switch to Day Mode"}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#F8FAFC] dark:bg-[#161F30] hover:bg-[#F1F4F9] dark:hover:bg-[#1E293B] border border-[#E7EAF0] dark:border-[#1F2937] hover:border-[#D0D5DD] dark:hover:border-slate-700 transition-all cursor-pointer shadow-2xs text-slate-600 dark:text-slate-300 active:scale-95"
        >
          {isDay ? (
            <Sun size={17} className="text-amber-500 transition-transform duration-300 hover:rotate-45" />
          ) : (
            <Moon size={17} className="text-violet-400 transition-transform duration-300 hover:-rotate-12" />
          )}
        </button>

        {isAuthenticated ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationCenter />
            <div className="flex items-center gap-2.5 pl-1">
              <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-violet-500 shadow-2xs">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                  {userInitials}
                </div>
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-semibold text-[#172033] dark:text-slate-100 leading-tight truncate max-w-[120px]">
                  {user?.name}
                </p>
                <p className="text-[10px] text-[#667085] dark:text-slate-400 truncate max-w-[120px]">
                  {user?.role === "admin" ? "Admin" : "Student"}
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="secondary" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">
                Register
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
