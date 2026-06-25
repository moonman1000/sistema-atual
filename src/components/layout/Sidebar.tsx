import React from "react";
import { Link, useLocation } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import {
  Home,
  Pizza,
  Users,
  Truck,
  Settings,
  ClipboardList,
  Percent,
  Calendar,
  BarChart,
  UtensilsCrossed,
  User as UserIcon,
  ShieldCheck,
  ListFilter,
  Package,
  DollarSign,
  FileText,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from '@/context/SessionContext';
import { useRestaurant } from '@/context/RestaurantContext'; // Importar useRestaurant

interface SidebarLinkProps {
  to: string;
  iconName: string; // Agora recebe o nome do ícone como string
  label: string;
  isActive: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, iconName, label, isActive }) => {
  const IconComponent = (LucideIcons as any)[iconName] || Terminal; // Fallback para Terminal
  
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
        isActive 
          ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" // Estilo moderno para ativo
          : "text-muted-foreground hover:bg-muted hover:text-foreground", // Estilo limpo para inativo
      )}
    >
      <IconComponent className="h-5 w-5" /> {/* Ícones ligeiramente maiores */}
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { isSuperAdmin } = useSession();
  const { currentRestaurant } = useRestaurant();

  // Função para obter o ícone ou usar um fallback
  const getIcon = (key: keyof import("@/context/RestaurantContext").Restaurant, defaultIcon: string) => {
    return (currentRestaurant?.[key] as string) || defaultIcon;
  };

  // Função para obter o label ou usar um fallback
  const getLabel = (key: keyof import("@/context/RestaurantContext").Restaurant, defaultLabel: string) => {
    return (currentRestaurant?.[key] as string) || defaultLabel;
  };

  const appName = currentRestaurant?.app_name || "Pizza Manager";
  const appIcon = currentRestaurant?.app_icon || "Pizza"; // NOVO: Obter o ícone principal do aplicativo

  const AppIconComponent = (LucideIcons as any)[appIcon] || Terminal; // Componente do ícone principal

  const links = [
    { to: "/admin/dashboard", iconName: "Home", label: "Dashboard" },
    { to: "/admin/pedidos", iconName: getIcon('sidebar_orders_icon', 'ClipboardList'), label: getLabel('sidebar_orders_label', 'Pedidos') },
    { to: "/admin/cardapio", iconName: getIcon('sidebar_menu_icon', 'Pizza'), label: getLabel('sidebar_menu_label', 'Cardápio') },
    { to: "/admin/categorias", iconName: getIcon('sidebar_categories_icon', 'ListFilter'), label: getLabel('sidebar_categories_label', 'Categorias') },
    { to: "/admin/clientes", iconName: getIcon('sidebar_clients_icon', 'Users'), label: getLabel('sidebar_clients_label', 'Clientes') },
    { to: "/admin/entregas", iconName: getIcon('sidebar_deliveries_icon', 'Truck'), label: getLabel('sidebar_deliveries_label', 'Entregas') },
    { to: "/admin/funcionarios", iconName: getIcon('sidebar_employees_icon', 'Users'), label: getLabel('sidebar_employees_label', 'Funcionários') },
    { to: "/admin/folha-pagamentos", iconName: getIcon('sidebar_payroll_icon', 'FileText'), label: getLabel('sidebar_payroll_label', 'Folha de Pagamentos') },
    { to: "/admin/inventario", iconName: getIcon('sidebar_inventory_icon', 'UtensilsCrossed'), label: getLabel('sidebar_inventory_label', 'Inventário') },
    { to: "/admin/fornecedores", iconName: getIcon('sidebar_suppliers_icon', 'Package'), label: getLabel('sidebar_suppliers_label', 'Fornecedores') },
    { to: "/admin/custos", iconName: getIcon('sidebar_expenses_icon', 'DollarSign'), label: getLabel('sidebar_expenses_label', 'Custos') },
    { to: "/admin/promocoes", iconName: getIcon('sidebar_promotions_icon', 'Percent'), label: getLabel('sidebar_promotions_label', 'Promoções') },
    { to: "/admin/reservas", iconName: getIcon('sidebar_reservations_icon', 'Calendar'), label: getLabel('sidebar_reservations_label', 'Reservas') },
    { to: "/admin/relatorios", iconName: getIcon('sidebar_reports_icon', 'BarChart'), label: getLabel('sidebar_reports_label', 'Relatórios') },
    { to: "/admin/configuracoes", iconName: getIcon('sidebar_settings_icon', 'Settings'), label: getLabel('sidebar_settings_label', 'Configurações') },
    { to: "/admin/profile", iconName: "User", label: "Meu Perfil" },
  ];

  const superAdminLink = { to: "/super-admin/manage-profiles", iconName: "ShieldCheck", label: "Gerenciar Perfis" };

  return (
    <aside className="hidden border-r bg-sidebar-background md:block w-64">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link to="/admin/dashboard" className="flex items-center gap-2 font-extrabold text-xl text-primary dark:text-primary-foreground">
            <AppIconComponent className="h-6 w-6" /> {/* NOVO: Usar AppIconComponent */}
            <span>{appName}</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium lg:px-4 space-y-1">
            {links.map((link) => (
              <SidebarLink
                key={link.to}
                to={link.to}
                iconName={link.iconName}
                label={link.label}
                isActive={currentPath === link.to}
              />
            ))}
            {/* Render Super Admin Link */}
            {isSuperAdmin && (
              <SidebarLink
                key={superAdminLink.to}
                to={superAdminLink.to}
                iconName={superAdminLink.iconName}
                label={superAdminLink.label}
                isActive={currentPath === superAdminLink.to}
              />
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;