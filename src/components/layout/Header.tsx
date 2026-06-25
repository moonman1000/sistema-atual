import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { Bell, User, Store, LogOut, Settings, Menu as MenuIcon, Home, Pizza, Users, Truck, ClipboardList, Percent, Calendar, BarChart, UtensilsCrossed, ShieldCheck, ListFilter, Package, DollarSign, FileText, Terminal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from '@/context/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRestaurant } from "@/context/RestaurantContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import SoundToggleButton from "@/components/admin/dashboard/SoundToggleButton"; // Importar SoundToggleButton

interface MobileNavLinkProps {
  to: string;
  iconName: string;
  label: string;
  onCloseSheet: () => void;
}

const MobileNavLink: React.FC<MobileNavLinkProps> = ({ to, iconName, label, onCloseSheet }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const IconComponent = (LucideIcons as any)[iconName] || Terminal; // Fallback para Terminal

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
        isActive 
          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          : "text-foreground hover:bg-muted hover:text-primary",
      )}
      onClick={onCloseSheet}
    >
      <IconComponent className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Header = () => {
  const { user, profile, isLoading: isLoadingSession, setMockSession, isSuperAdmin } = useSession();
  const { currentRestaurant } = useRestaurant();
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao fazer logout: " + error.message);
    } else {
      toast.info("Você foi desconectado.");
      setMockSession(null, null);
      navigate("/");
    }
  };

  const userFirstName = profile?.first_name || 'Admin';
  const userLastName = profile?.last_name || '';
  const userAvatar = profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${userFirstName[0]}${userLastName[0]}`;
  
  const storeIdentifier = currentRestaurant?.slug || currentRestaurant?.id;
  const storeLink = storeIdentifier ? `/${currentRestaurant?.type === 'restaurant' ? 'loja' : currentRestaurant?.type}/${storeIdentifier}` : '/';

  // Função para obter o ícone ou usar um fallback
  const getIcon = (key: keyof import("@/context/RestaurantContext").Restaurant, defaultIcon: string) => {
    return (currentRestaurant?.[key] as string) || defaultIcon;
  };

  // Função para obter o label ou usar um fallback
  const getLabel = (key: keyof import("@/context/RestaurantContext").Restaurant, defaultLabel: string) => {
    return (currentRestaurant?.[key] as string) || defaultLabel;
  };

  const adminHeaderTitle = currentRestaurant?.admin_header_title || "PizzaApp Admin";
  const appName = currentRestaurant?.app_name || "Pizza Manager";
  const appIcon = currentRestaurant?.app_icon || "Pizza"; // NOVO: Obter o ícone principal do aplicativo

  const AppIconComponent = (LucideIcons as any)[appIcon] || Terminal; // Componente do ícone principal

  const adminLinks = [
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
    <header className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Trigger */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <MenuIcon className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[250px] sm:w-[300px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-primary dark:text-primary-foreground font-extrabold text-xl">
                <AppIconComponent className="h-6 w-6" /> {/* NOVO: Usar AppIconComponent */}
                {appName}
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 mt-6 text-sm font-medium">
              {adminLinks.map((link) => (
                <MobileNavLink
                  key={link.to}
                  to={link.to}
                  iconName={link.iconName}
                  label={link.label}
                  onCloseSheet={() => setIsSheetOpen(false)}
                />
              ))}
              {/* Render Super Admin Link */}
              {isSuperAdmin && (
                <MobileNavLink
                  key={superAdminLink.to}
                  to={superAdminLink.to}
                  iconName={superAdminLink.iconName}
                  label={superAdminLink.label}
                  onCloseSheet={() => setIsSheetOpen(false)}
                />
              )}
              <Link to={storeLink} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary mt-4 border-t pt-4" onClick={() => setIsSheetOpen(false)}>
                <Store className="h-5 w-5" /> Ver Loja
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/admin/dashboard" className="text-xl font-bold text-primary dark:text-primary-foreground">
          {adminHeaderTitle}
        </Link>
        
        {/* Desktop Navigation (Simplificado) */}
        <nav className="hidden md:flex space-x-4">
          {/* Mantemos apenas os links mais críticos para acesso rápido */}
          <Link to="/admin/pedidos" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-1">
            <LucideIcons.ClipboardList className="h-4 w-4" /> {getLabel('sidebar_orders_label', 'Pedidos')}
          </Link>
          <Link to="/admin/cardapio" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-1">
            <LucideIcons.Pizza className="h-4 w-4" /> {getLabel('sidebar_menu_label', 'Cardápio')}
          </Link>
          <Link to="/admin/relatorios" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-1">
            <LucideIcons.BarChart className="h-4 w-4" /> {getLabel('sidebar_reports_label', 'Relatórios')}
          </Link>
          <Link to={storeLink} className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-1">
            <Store className="h-4 w-4" /> Ver Loja
          </Link>
        </nav>
      </div>
      <div className="flex items-center space-x-4">
        {/* Sound Toggle Button */}
        <SoundToggleButton />
        
        <ThemeToggle />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userAvatar} alt={`${userFirstName} ${userLastName}`} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userFirstName} {userLastName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/admin/configuracoes">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </Link>
            </DropdownMenuItem>
            {isSuperAdmin && (
              <DropdownMenuItem asChild>
                <Link to="/super-admin/manage-profiles">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  <span>Gerenciar Perfis</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;