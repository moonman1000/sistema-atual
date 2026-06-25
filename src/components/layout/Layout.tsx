import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom"; // Importar Outlet

interface LayoutProps {
  children?: React.ReactNode; // Tornar children opcional
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // All authentication and authorization logic is now handled by ProtectedRoute.
  // This component simply provides the layout structure.
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
          {children || <Outlet />} {/* Render children if provided, otherwise render Outlet */}
        </main>
      </div>
    </div>
  );
};

export default Layout;