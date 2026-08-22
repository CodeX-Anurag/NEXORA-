import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export const PageLayout = ({ children, apiStatus }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar apiStatus={apiStatus} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto bg-slate-950">{children}</main>
      </div>
    </div>
  );
};

export default PageLayout;
