import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export const PageLayout = ({ children, apiStatus, onRefreshHealth }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#121110] text-[#FAF7F2] font-sans antialiased selection:bg-[#E0693B]/25 selection:text-[#FAF7F2]">
      <Navbar
        apiStatus={apiStatus}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        onRefreshHealth={onRefreshHealth}
      />
      <div className="flex flex-1 relative">
        <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#121110] w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageLayout;
