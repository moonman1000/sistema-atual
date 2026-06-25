import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLoginPage from "./pages/AdminLoginPage";
import CustomerLoginPage from "./pages/sales/CustomerLoginPage";
import DashboardPage from "./pages/DashboardPage";
import MenuManagementPage from "./pages/MenuManagementPage";
import OrdersPage from "./pages/OrdersPage";
import ClientsPage from "./pages/ClientsPage";
import DeliveriesPage from "./pages/DeliveriesPage";
import EmployeesPage from "./pages/EmployeesPage";
import InventoryPage from "./pages/InventoryPage";
import PromotionsPage from "./pages/PromotionsPage";
import ReservationsPage from "./pages/ReservationsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import AdminProfilePage from "./pages/AdminProfilePage";
import CreateRestaurantPage from "./pages/admin/CreateRestaurantPage";
import SuperAdminPage from "./pages/SuperAdminPage";
import CategoriesPage from "./pages/CategoriesPage";
import SuppliersPage from "./pages/SuppliersPage";
import ExpensesPage from "./pages/ExpensesPage";
import PayrollPage from "./pages/PayrollPage";
import PaymentRequiredPage from "./pages/admin/PaymentRequiredPage";
import NotFound from "./pages/NotFound";

import HomePage from "./pages/sales/HomePage";
import CategoryPage from "./pages/sales/CategoryPage";
import ProductDetailsPage from "./pages/sales/ProductDetailsPage";
import CheckoutPage from "./pages/sales/CheckoutPage";
import SupportPage from "./pages/sales/SupportPage";
import ProfilePage from "./pages/sales/ProfilePage";
import OrderHistoryPage from "./pages/sales/OrderHistoryPage";
import TrackOrderPage from "./pages/sales/TrackOrderPage";
import PaymentMethodsPage from "./pages/sales/PaymentMethodsPage";
import AddressesPage from "./pages/sales/AddressesPage";
import PostCheckoutAuthPage from "./pages/sales/PostCheckoutAuthPage";
import CustomerPromotionsPage from "./pages/sales/PromotionsPage";
import RestaurantsListingPage from "./pages/sales/RestaurantsListingPage";
import InicioPage from "./pages/sales/InicioPage";
import FarmaciasPage from "./pages/sales/FarmaciasPage";
import MercadosPage from "./pages/sales/MercadosPage";
import PetshopsPage from "./pages/sales/PetshopsPage";
import ServicosPage from "./pages/sales/ServicosPage";
import ResetPasswordPage from "./pages/sales/ResetPasswordPage";

import DeliveryDriverPage from "./pages/DeliveryDriverPage";

import { SessionProvider } from "./context/SessionContext";
import { EmployeeProvider } from "./context/EmployeeContext";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import SalesProvidersWrapper from "./components/sales/SalesProvidersWrapper";
import AdminProvidersAndLayoutWrapper from "./components/layout/AdminProvidersAndLayoutWrapper";
import RestaurantProviderWrapper from "./components/RestaurantProviderWrapper";
import DeliveryDriverProvidersWrapper from "./components/DeliveryDriverProvidersWrapper";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <SessionProvider>
          <RestaurantProviderWrapper>
            <EmployeeProvider>
              <Routes>
                {/* Rotas públicas */}
                <Route path="/login" element={<AdminLoginPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Rota entregador com wrapper próprio */}
                <Route path="/delivery-driver" element={<DeliveryDriverProvidersWrapper />}>
                  <Route index element={<DeliveryDriverPage />} />
                </Route>

                {/* Rotas vendas gerais */}
                <Route element={<SalesProvidersWrapper />}>
                  <Route path="/" element={<InicioPage />} />
                  <Route path="/inicio" element={<InicioPage />} />
                  <Route path="/restaurants" element={<RestaurantsListingPage />} />
                  <Route path="/farmacias" element={<FarmaciasPage />} />
                  <Route path="/mercados" element={<MercadosPage />} />
                  <Route path="/petshops" element={<PetshopsPage />} />
                  <Route path="/servicos" element={<ServicosPage />} />
                  <Route path="/customer-login" element={<CustomerLoginPage />} />
                  <Route path="/support" element={<SupportPage />} />

                  {/* Perfil cliente protegido */}
                  <Route path="/profile">
                    <Route index element={<ProtectedRoute allowedRoles={['customer']} redirectPath="/customer-login"><ProfilePage /></ProtectedRoute>} />
                    <Route path="order-history" element={<ProtectedRoute allowedRoles={['customer']} redirectPath="/customer-login"><OrderHistoryPage /></ProtectedRoute>} />
                    <Route path="track-order" element={<ProtectedRoute allowedRoles={['customer']} redirectPath="/customer-login"><TrackOrderPage /></ProtectedRoute>} />
                    <Route path="payment-methods" element={<ProtectedRoute allowedRoles={['customer']} redirectPath="/customer-login"><PaymentMethodsPage /></ProtectedRoute>} />
                    <Route path="addresses" element={<ProtectedRoute allowedRoles={['customer']} redirectPath="/customer-login"><AddressesPage /></ProtectedRoute>} />
                  </Route>
                </Route>

                {/* Rotas admin protegidas */}
                <Route path="/admin" element={<AdminProvidersAndLayoutWrapper />}>
                  <Route path="dashboard" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} redirectPath="/login"><DashboardPage /></ProtectedRoute>} />
                  <Route path="cardapio" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} redirectPath="/login"><MenuManagementPage /></ProtectedRoute>} />
                  <Route path="categorias" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} redirectPath="/login"><CategoriesPage /></ProtectedRoute>} />
                  <Route path="pedidos" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} redirectPath="/login"><OrdersPage /></ProtectedRoute>} />
                  <Route path="clientes" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} redirectPath="/login"><ClientsPage /></ProtectedRoute>} />
                  <Route path="entregas" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} redirectPath="/login"><DeliveriesPage /></ProtectedRoute>} />
                  <Route path="funcionarios" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} redirectPath="/login"><EmployeesPage /></ProtectedRoute>} />
                  <Route path="folha-pagamentos" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} redirectPath="/login"><PayrollPage /></ProtectedRoute>} />
                  <Route path="inventario" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} redirectPath="/login"><InventoryPage /></ProtectedRoute>} />
                  <Route path="fornecedores" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} redirectPath="/login"><SuppliersPage /></ProtectedRoute>} />
                  <Route path="custos" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} redirectPath="/login"><ExpensesPage /></ProtectedRoute>} />
                  <Route path="promocoes" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} redirectPath="/login"><PromotionsPage /></ProtectedRoute>} />
                  <Route path="reservas" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} redirectPath="/login"><ReservationsPage /></ProtectedRoute>} />
                  <Route path="relatorios" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} redirectPath="/login"><ReportsPage /></ProtectedRoute>} />
                  <Route path="configuracoes" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} redirectPath="/login"><SettingsPage /></ProtectedRoute>} />
                  <Route path="profile" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} redirectPath="/login"><AdminProfilePage /></ProtectedRoute>} />
                  <Route path="create-restaurant" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} redirectPath="/login"><CreateRestaurantPage /></ProtectedRoute>} />
                  <Route path="payment-required" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} redirectPath="/login"><PaymentRequiredPage /></ProtectedRoute>} />
                </Route>

                {/* Rota super admin protegida */}
                <Route path="/super-admin/manage-profiles" element={<AdminProvidersAndLayoutWrapper />}>
                  <Route index element={<ProtectedRoute allowedRoles={['super_admin']} redirectPath="/login"><SuperAdminPage /></ProtectedRoute>} />
                </Route>

                {/* Rotas multi-tenant vendas */}
                <Route path="/loja/:restaurantId" element={<SalesProvidersWrapper />}>
                  <Route index element={<HomePage />} />
                  <Route path="menu" element={<CategoryPage />} />
                  <Route path="product/:id" element={<ProductDetailsPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="support" element={<SupportPage />} />
                  <Route path="promotions" element={<CustomerPromotionsPage />} />
                  <Route path="post-checkout-auth" element={<PostCheckoutAuthPage />} />
                  <Route path="customer-login" element={<CustomerLoginPage />} />
                </Route>

                <Route path="/farmacia/:restaurantId" element={<SalesProvidersWrapper />}>
                  <Route index element={<HomePage />} />
                  <Route path="menu" element={<CategoryPage />} />
                  <Route path="product/:id" element={<ProductDetailsPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="support" element={<SupportPage />} />
                  <Route path="promotions" element={<CustomerPromotionsPage />} />
                  <Route path="post-checkout-auth" element={<PostCheckoutAuthPage />} />
                  <Route path="customer-login" element={<CustomerLoginPage />} />
                </Route>

                <Route path="/mercado/:restaurantId" element={<SalesProvidersWrapper />}>
                  <Route index element={<HomePage />} />
                  <Route path="menu" element={<CategoryPage />} />
                  <Route path="product/:id" element={<ProductDetailsPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="support" element={<SupportPage />} />
                  <Route path="promotions" element={<CustomerPromotionsPage />} />
                  <Route path="post-checkout-auth" element={<PostCheckoutAuthPage />} />
                  <Route path="customer-login" element={<CustomerLoginPage />} />
                </Route>

                <Route path="/petshop/:restaurantId" element={<SalesProvidersWrapper />}>
                  <Route index element={<HomePage />} />
                  <Route path="menu" element={<CategoryPage />} />
                  <Route path="product/:id" element={<ProductDetailsPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="support" element={<SupportPage />} />
                  <Route path="promotions" element={<CustomerPromotionsPage />} />
                  <Route path="post-checkout-auth" element={<PostCheckoutAuthPage />} />
                  <Route path="customer-login" element={<CustomerLoginPage />} />
                </Route>

                <Route path="/servico/:restaurantId" element={<SalesProvidersWrapper />}>
                  <Route index element={<HomePage />} />
                  <Route path="menu" element={<CategoryPage />} />
                  <Route path="product/:id" element={<ProductDetailsPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="support" element={<SupportPage />} />
                  <Route path="promotions" element={<CustomerPromotionsPage />} />
                  <Route path="post-checkout-auth" element={<PostCheckoutAuthPage />} />
                  <Route path="customer-login" element={<CustomerLoginPage />} />
                </Route>

                {/* Catch-all 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </EmployeeProvider>
          </RestaurantProviderWrapper>
        </SessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
