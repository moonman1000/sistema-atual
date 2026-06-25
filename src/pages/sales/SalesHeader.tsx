import React from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { ShoppingCart, Search, User, LayoutDashboard, Menu as MenuIcon, LogOut, Pill, Store, PawPrint, Briefcase, UtensilsCrossed, Percent, LifeBuoy, Home } from "lucide-react"; // Adicionado LifeBuoy e Home
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCart } from "@/context/CartContext";
import { useSession } from "@/context/SessionContext";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useRestaurant } from "@/context/RestaurantContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getRestaurantTypePath } from "@/lib/utils";
import * as LucideIcons from "lucide-react"; // NOVO: Importar todos os ícones Lucide

const SalesHeader = () => {
  const { cartItemCount } = useCart();
  const { session, user, profile, isLoading: isLoadingSession, isAdmin, isCustomer, setMockSession } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const location = useLocation();

  const getMenuLinkText = () => {
    if (!currentRestaurant) return "Cardápio"; // Fallback if restaurant not loaded
    switch (currentRestaurant.type) {
      case "pharmacy":
      case "market":
      case "service":
        return "Produtos";
      case "petshop":
        return "Animais";
      default:
        return "Cardápio";
    }
  };

  const storeIdentifier = currentRestaurant?.slug || currentRestaurant?.id || restaurantId;
  const restaurantTypePrefix = currentRestaurant ? getRestaurantTypePath(currentRestaurant.type) : 'loja';
  const baseRoute = storeIdentifier ? `/${restaurantTypePrefix}/${storeIdentifier}` : '';

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao fazer logout: " + error.message);
    } else {
      toast.info("Você foi desconectado.");
      setMockSession(null, null);
    }
  };

  const userFirstName = profile?.first_name || user?.user_metadata?.first_name || 'Usuário';
  const userLastName = profile?.last_name || user?.user_metadata?.last_metadata?.last_name || '';
  const userAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${userFirstName[0]}${userLastName[0]}`;
  
  const restaurantDisplayName = currentRestaurant?.display_name || currentRestaurant?.name || "PedeJá";
  const restaurantLogoUrl = currentRestaurant?.logo_url || currentRestaurant?.image || "https://media.istockphoto.com/id/971654072/vector/red-call-icon.jpg?s=612x612&w=0&k=20&c=bwlNm0pnNs98evZv4x8N3Cq3XQAWIKLEzJPmQpbMgWY=";
  const AppIconComponent = (LucideIcons as any)[currentRestaurant?.app_icon || "Pizza"]; // NOVO: Obter o ícone do app

  const isGeneralListingPage = location.pathname === '/' ||
                               location.pathname === '/inicio' ||
                               location.pathname === '/restaurants' ||
                               location.pathname === '/farmacias' ||
                               location.pathname === '/mercados' ||
                               location.pathname === '/petshops' ||
                               location.pathname === '/servicos';

  const isOnSpecificStorePage = !!currentRestaurant;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center space-x-4">
          <Link to={baseRoute || "/inicio"} className="flex items-center gap-2 font-bold text-lg">
            <AppIconComponent className="h-12 w-12 object-contain" /> {/* NOVO: Usar AppIconComponent */}
            <span className="text-xl font-display font-extrabold">{restaurantDisplayName}</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-4 text-sm font-medium">
            {isGeneralListingPage && (
              <>
                <Link to="/inicio" className="text-muted-foreground hover:text-primary flex items-center gap-1">
                  <Home className="h-4 w-4" /> Início
                </Link>
                <Link to="/restaurants" className="text-muted-foreground hover:text-primary flex items-center gap-1">
                  <UtensilsCrossed className="h-4 w-4" /> Restaurantes
                </Link>
                <Link to="/farmacias" className="text-muted-foreground hover:text-primary flex items-center gap-1">
                  <Pill className="h-4 w-4" /> Farmácias
                </Link>
                <Link to="/mercados" className="text-muted-foreground hover:text-primary flex items-center gap-1">
                  <Store className="h-4 w-4" /> Mercados
                </Link>
                <Link to="/petshops" className="text-muted-foreground hover:text-primary flex items-center gap-1">
                  <PawPrint className="h-4 w-4" /> Petshops
                </Link>
                <Link to="/servicos" className="text-muted-foreground hover:text-primary flex items-center gap-1">
                  <Briefcase className="h-4 w-4" /> Serviços
                </Link>
              </>
            )}
            {isOnSpecificStorePage && (
              <>
                <Link to={`${baseRoute}/menu`} className="text-muted-foreground hover:text-primary flex items-center gap-1">
                  <UtensilsCrossed className="h-4 w-4" /> {getMenuLinkText()}
                </Link>
                <Link to={`${baseRoute}/promotions`} className="text-muted-foreground hover:text-primary flex items-center gap-1">
                  <Percent className="h-4 w-4" /> Promoções
                </Link>
              </>
            )}
            <Link to={`${baseRoute}/support`} className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <LifeBuoy className="h-4 w-4" /> Suporte
            </Link>
            <Link to="/admin/dashboard" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <LayoutDashboard className="h-4 w-4" /> Painel Admin
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Busque em ${restaurantDisplayName}...`}
              className="pl-8 w-[180px] lg:w-[250px]"
            />
          </div>

          <ThemeToggle />

          {isOnSpecificStorePage && (
            <Link to={`${baseRoute}/checkout`} className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
              </Button>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {cartItemCount}
                </span>
              )}
            </Link>
          )}

          {isLoadingSession ? (
            <div>Carregando...</div>
          ) : session && isCustomer ? (
            <div className="flex items-center space-x-2">
              <Link to="/profile">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userAvatar} alt={`${userFirstName} ${userLastName}`} />
                  <AvatarFallback>{userFirstName[0]}{userLastName[0]}</AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="ghost" onClick={handleLogout}>Sair</Button>
            </div>
          ) : (
            <Button asChild>
              <Link to={`${baseRoute}/customer-login`}>Entrar</Link>
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] sm:w-[300px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <AppIconComponent className="h-12 w-12 object-contain" /> {/* NOVO: Usar AppIconComponent */}
                  <span className="text-xl font-display font-extrabold">{restaurantDisplayName}</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6 text-sm font-medium">
                {isGeneralListingPage && (
                  <>
                    <Link to="/inicio" className="text-muted-foreground hover:text-primary flex items-center gap-1">
                      <Home className="h-4 w-4" /> Início
                    </Link>
                    <Link to="/restaurants" className="text-muted-foreground hover:text-primary flex items-center gap-1">
                      <UtensilsCrossed className="h-4 w-4" /> Restaurantes
                    </Link>
                    <Link to="/farmacias" className="text-muted-foreground hover:text-primary flex items-center gap-1">
                      <Pill className="h-4 w-4" /> Farmácias
                    </Link>
                    <Link to="/mercados" className="text-muted-foreground hover:text-primary flex items-center gap-1">
                      <Store className="h-4 w-4" /> Mercados
                    </Link>
                    <Link to="/petshops" className="text-muted-foreground hover:text-primary flex items-center gap-1">
                      <PawPrint className="h-4 w-4" /> Petshops
                    </Link>
                    <Link to="/servicos" className="text-muted-foreground hover:text-primary flex items-center gap-1">
                      <Briefcase className="h-4 w-4" /> Serviços
                    </Link>
                  </>
                )}
                {isOnSpecificStorePage && (
                  <>
                    <Link to={`${baseRoute}/menu`} className="text-muted-foreground hover:text-primary flex items-center gap-1">
                      <UtensilsCrossed className="h-4 w-4" /> {getMenuLinkText()}
                    </Link>
                    <Link to={`${baseRoute}/promotions`} className="text-muted-foreground hover:text-primary flex items-center gap-1">
                      <Percent className="h-4 w-4" /> Promoções
                    </Link>
                  </>
                )}
                <Link to={`${baseRoute}/support`} className="text-muted-foreground hover:text-primary flex items-center gap-1">
                  <LifeBuoy className="h-4 w-4" /> Suporte
                </Link>
                <Link to="/admin/dashboard" className="text-muted-foreground hover:text-primary flex items-center gap-1">
                  <LayoutDashboard className="h-4 w-4" /> Painel Admin
                </Link>
                <div className="relative mt-4">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={`Busque em ${restaurantDisplayName}...`}
                    className="pl-8 w-full"
                  />
                </div>
                {isOnSpecificStorePage && (
                  <Link to={`${baseRoute}/checkout`} className="relative">
                    <Button variant="ghost" size="icon">
                      <ShoppingCart className="h-5 w-5" />
                    </Button>
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                )}
                {isLoadingSession ? (
                  <div>Carregando...</div>
                ) : session && isCustomer ? (
                  <>
                    <Link to="/profile" className="flex items-center gap-2 text-muted-foreground hover:text-primary mt-4">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={userAvatar} alt={`${userFirstName} ${userLastName}`} />
                        <AvatarFallback>{userFirstName[0]}{userLastName[0]}</AvatarFallback>
                      </Avatar>
                      <span>Meu Perfil</span>
                    </Link>
                    <Button variant="ghost" className="justify-start text-destructive hover:text-destructive/10" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" /> Sair
                    </Button>
                  </>
                ) : (
                  <Button asChild>
                    <Link to={`${baseRoute}/customer-login`}>Entrar</Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default SalesHeader;