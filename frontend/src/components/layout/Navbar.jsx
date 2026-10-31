import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../common/Button";
import NotificationCenter from "../notifications/NotificationCenter";

export const Navbar = ({ apiStatus, onToggleMobileMenu, onRefreshHealth }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="h-16 bg-[#161513]/90 backdrop-blur-md border-b border-[#2B2723] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-all">
      {/* Brand & Mobile Toggle */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-[#9C9384] hover:text-[#FAF7F2] hover:bg-[#22201D] transition-colors focus:outline-none focus:ring-1 focus:ring-[#E0693B]"
          aria-label="Toggle navigation drawer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C5572C] to-[#E0693B] flex items-center justify-center text-white shadow-md shadow-[#E0693B]/20 group-hover:scale-105 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-wider text-[#FAF7F2] font-display">
              NEXORA
            </span>
            <span className="text-[9px] font-medium tracking-tight text-[#9C9384] -mt-1 hidden sm:block">
              Career & Productivity Platform
            </span>
          </div>
        </Link>
      </div>

      {/* Backend API Health & User Auth Section */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Health status badge */}
        <button
          type="button"
          onClick={onRefreshHealth}
          title="Click to refresh API connection status"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C1A17] hover:bg-[#25221E] border border-[#2D2925] hover:border-[#3D3833] text-xs transition-all cursor-pointer"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              apiStatus === "healthy"
                ? "bg-[#2EA366] shadow-[0_0_8px_rgba(46,163,102,0.6)]"
                : apiStatus === "checking"
                ? "bg-[#D97706] animate-ping"
                : "bg-rose-500"
            }`}
          />
          <span className="text-[#9C9384]">
            API:{" "}
            <span
              className={`font-semibold ${
                apiStatus === "healthy" ? "text-[#2EA366]" : apiStatus === "checking" ? "text-[#D97706]" : "text-rose-400"
              }`}
            >
              {apiStatus === "healthy" ? "Online" : apiStatus === "checking" ? "Checking..." : "Offline"}
            </span>
          </span>
        </button>

        {isAuthenticated ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationCenter />
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-[#FAF7F2] leading-tight">{user?.name}</p>
              <p className="text-[10px] text-[#9C9384]">{user?.email}</p>
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
