import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Navigate, Outlet } from "react-router-dom"; // Importar Outlet
import { useSession } from '@/context/SessionContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { toast } from "sonner"; // Usar sonner
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react"; // Import Loader2 icon

interface ProtectedRouteProps {
  children: React.ReactNode; // Agora aceita children
  allowedRoles: Array<'admin' | 'customer' | 'super_admin'>;
  redirectPath: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, redirectPath }) => {
  const { session, isLoading: isLoadingSession, profile, isAdmin, isCustomer, isSuperAdmin, isAdminPaid, softRevalidateSession } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const location = useLocation();
  const [showLoadingWatchdog, setShowLoadingWatchdog] = useState(false);

  // Use state to hold the redirection target, which is safer than calling navigate() inside useEffect
  const [redirectTarget, setRedirectTarget] = useState<{ path: string; state?: any } | null>(null);

  useEffect(() => {
    console.log("ProtectedRoute useEffect triggered.");
    
    if (isLoadingSession || isLoadingRestaurants) {
      const watchdogTimer = setTimeout(() => {
        console.warn("ProtectedRoute: Loading session/restaurant taking too long (>5s). Triggering soft revalidation.");
        setShowLoadingWatchdog(true);
        softRevalidateSession();
      }, 5000);
      return () => clearTimeout(watchdogTimer);
    } else {
      setShowLoadingWatchdog(false); // Reset watchdog if loading finishes
      
      const userRole = profile?.role;
      const isUserAuthorizedForRoute = session && userRole && allowedRoles.includes(userRole);

      // --- Redirection Logic ---
      if (!session) {
        console.log("ProtectedRoute: No session, redirecting to login.");
        toast.info("Você precisa estar logado para acessar esta página.");

        let stateToPass: { fromSalesPageId?: string } = {};
        const salesPathMatch = location.pathname.match(/^\/loja\/([^/]+)/);
        if (salesPathMatch && salesPathMatch[1]) {
          stateToPass = { fromSalesPageId: salesPathMatch[1] };
        }
        setRedirectTarget({ path: redirectPath, state: stateToPass });
        return;
      }

      // ✅ CORREÇÃO APLICADA: Super Admin nunca é bloqueado por falta de pagamento
      if (isAdmin && !isAdminPaid && !isSuperAdmin && location.pathname !== "/admin/payment-required") {
        console.log("ProtectedRoute: Admin not paid, redirecting to payment required page.");
        toast.error("Seu acesso administrativo está suspenso por falta de pagamento.");
        setRedirectTarget({ path: "/admin/payment-required" });
        return;
      }

      if (isAdmin && isAdminPaid && !currentRestaurant && location.pathname !== "/admin/create-restaurant" && !isSuperAdmin) {
        console.log("ProtectedRoute: Admin paid but no restaurant, redirecting to create restaurant page.");
        toast.info("Por favor, crie seu restaurante para continuar.");
        setRedirectTarget({ path: "/admin/create-restaurant" });
        return;
      }

      if (isCustomer && !profile?.restaurant_id && location.pathname.startsWith("/profile")) {
        console.log("ProtectedRoute: Customer profile not linked to a restaurant. Profile role:", profile?.role, "Profile ID:", profile?.id);
        toast.error("Seu perfil não está associado a um restaurante. Por favor, entre em contato com o suporte.");
        setRedirectTarget({ path: "/" });
        return;
      }

      if (!isUserAuthorizedForRoute) {
        console.log("ProtectedRoute: User not authorized for this specific route, redirecting based on role.");
        toast.error("Acesso negado. Você não tem permissão para acessar esta área.");
        if (isSuperAdmin) {
          setRedirectTarget({ path: "/super-admin/manage-profiles" });
        } else if (isAdmin) {
          setRedirectTarget({ path: "/admin/dashboard" });
        } else if (isCustomer) {
          setRedirectTarget({ path: "/profile" });
        } else {
          setRedirectTarget({ path: redirectPath });
        }
        return;
      }
      
      // If authorized and no specific redirection needed, clear target
      setRedirectTarget(null);
      console.log("ProtectedRoute: User is authorized and no redirection needed. Proceeding to render children.");
    }
  }, [
    isLoadingSession,
    isLoadingRestaurants,
    session,
    profile,
    isAdmin,
    isCustomer,
    isSuperAdmin,
    isAdminPaid,
    currentRestaurant,
    allowedRoles,
    redirectPath,
    location.pathname,
    softRevalidateSession
  ]);

  // --- Loading State Rendering ---
  if (isLoadingSession || isLoadingRestaurants) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Card className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <CardTitle className="text-xl font-bold">Carregando autenticação e dados do restaurante...</CardTitle>
          {showLoadingWatchdog && (
            <CardDescription className="mt-2 text-muted-foreground">
              Isso está demorando mais que o esperado. Tentando reconectar.
            </CardDescription>
          )}
        </Card>
      </div>
    );
  }

  // --- Redirection Rendering (uses Navigate component) ---
  if (redirectTarget) {
    return <Navigate to={redirectTarget.path} state={redirectTarget.state} replace />;
  }

  // --- Final Rendering ---
  console.log("ProtectedRoute: Final render - Rendering the provided children.");
  return <>{children}</>; // Render the provided children directly
};

export default ProtectedRoute;
