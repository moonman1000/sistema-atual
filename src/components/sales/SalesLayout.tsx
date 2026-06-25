import React from "react";
import SalesHeader from "./SalesHeader";
import SalesFooter from "./SalesFooter";
import { Outlet } from "react-router-dom"; // Importar Outlet

interface SalesLayoutProps {
  children?: React.ReactNode; // Tornar children opcional
}

const SalesLayout: React.FC<SalesLayoutProps> = ({ children }) => {
  // All authentication and authorization logic is now handled by ProtectedRoute.
  // This component simply provides the layout structure for sales pages.
  return (
    <div className="flex min-h-screen flex-col">
      <SalesHeader />
      <main className="flex-1">
        {children || <Outlet />} {/* Render children if provided, otherwise render Outlet */}
      </main>
      <SalesFooter />
    </div>
  );
};

export default SalesLayout;