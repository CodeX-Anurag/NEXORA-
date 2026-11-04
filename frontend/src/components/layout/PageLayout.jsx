import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export const PageLayout = ({ children, apiStatus, onRefreshHealth }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FC] dark:bg-[#0B0F19] text-[#172033] dark:text-slate-100 font-sans antialiased selection:bg-[#4F7CFF]/20 selection:text-[#172033]">
      <Navbar
        apiStatus={apiStatus}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        onRefreshHealth={onRefreshHealth}
      />
      <div className="flex flex-1 relative">
        <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#F7F8FC] dark:bg-[#0B0F19] w-full max-w-full">
          <div className="animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PageLayout;
