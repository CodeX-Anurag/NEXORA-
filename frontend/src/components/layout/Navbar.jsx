import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../common/Button";
import NotificationCenter from "../notifications/NotificationCenter";

export const Navbar = ({ apiStatus }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            NEXORA
          </span>
        </Link>
        <span className="px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 rounded-full uppercase">
          Phase 12 In-App Notifications
        </span>
      </div>

      {/* Backend API Health & User Auth Section */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/60 border border-slate-800 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              apiStatus === "healthy"
                ? "bg-emerald-500 shadow-sm shadow-emerald-500"
                : apiStatus === "checking"
                ? "bg-amber-500 animate-ping"
                : "bg-rose-500"
            }`}
          />
          <span className="text-slate-400">
            API:{" "}
            <span
              className={`font-medium ${
                apiStatus === "healthy" ? "text-emerald-400" : apiStatus === "checking" ? "text-amber-400" : "text-rose-400"
              }`}
            >
              {apiStatus === "healthy" ? "Online" : apiStatus === "checking" ? "Checking" : "Offline"}
            </span>
          </span>
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-slate-200">{user?.name}</p>
              <p className="text-[10px] text-slate-400">{user?.email}</p>
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
