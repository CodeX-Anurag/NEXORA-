import React from "react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import { Compass, Home, LayoutDashboard } from "lucide-react";

export const NotFound = () => {
  return (
    <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-white border border-[#E7EAF0] text-center space-y-6 shadow-xs animate-fade-in">
      <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#4F7CFF]">
        <Compass className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4F7CFF]">
          404 Error
        </span>
        <h1 className="text-2xl font-bold text-[#172033] font-display">
          Page Not Found
        </h1>
        <p className="text-xs text-[#667085] leading-relaxed">
          The requested page could not be found or has moved. Choose a destination below to continue exploring NEXORA.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link to="/dashboard">
          <Button variant="primary" size="sm" className="flex items-center gap-1.5">
            <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
          </Button>
        </Link>
        <Link to="/">
          <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5" /> Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
