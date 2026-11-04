import React from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Loader from "./Loader";

export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <Loader text="Verifying admin authorization..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-2xl bg-white border border-[#E7EAF0] text-center space-y-6 animate-fade-in shadow-xs">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m0 4h.01M5.07 19A9 9 0 1118.93 5.07 9 9 0 015.07 19z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#172033] font-display">403 — Access Denied</h2>
          <p className="text-sm text-[#667085] leading-relaxed">
            System Observability Telemetry is restricted to Administrator accounts. Your account (<span className="text-[#4F7CFF] font-mono">{user?.email}</span>) does not have administrative privileges.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-[#4F7CFF] hover:bg-[#3D68E8] text-white text-xs font-semibold transition-colors shadow-xs"
          >
            Return to Student Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
