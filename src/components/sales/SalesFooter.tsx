import React from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { Pizza, Pill, ShoppingCart, PawPrint, Briefcase, UtensilsCrossed, Loader2 } from "lucide-react";
import { Facebook, Instagram, Twitter } from "lucide-react";
import { useRestaurant } from "@/context/RestaurantContext";
import { useCategories } from "@/context/CategoryContext";
import { slugify, getRestaurantTypePath } from "@/lib/utils"; // Importar getRestaurantTypePath

const SalesFooter = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const location = useLocation();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const { categories, isLoadingCategories } = useCategories();

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
  const restaurantTypePrefix = currentRestaurant ? getRestaurantTypePath(currentRestaurant.type) : 'loja'; // Usar getRestaurantTypePath
  const baseRoute = storeIdentifier ? `/${restaurantTypePrefix}/${storeIdentifier}` : '';

  const isGeneralListingPage = location.pathname === '/' ||
                               location.pathname === '/inicio' ||
                               location.pathname === '/restaurants' ||
                               location.pathname === '/farmacias' ||
                               location.pathname === '/mercados' ||
                               location.pathname === '/petshops' ||
                               location.pathname === '/servicos';

  const isOnSpecificStorePage = !!currentRestaurant;

  if (isLoadingRestaurants || isLoadingCategories) {
    return (
      <footer className="border-t bg-background py-8 flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Carregando rodapé...</p>
      </footer>
    );
  }

  const restaurantDisplayName = currentRestaurant?.display_name || currentRestaurant?.name || "PedeJá";
  const restaurantLogoUrl = currentRestaurant?.logo_url || currentRestaurant?.image || "https://media.istockphoto.com/id/971654072/vector/red-call-icon.jpg?s=612x612&w=0&k=20&c=bwlNm0pnNs98evZv4x8N3Cq3XQAWIKLEzJPmQpbMgWY=";

  return (
    <footer className="border-t bg-background py-8">
      <div className="container grid grid-cols-1 gap-8 px-4 md:grid-cols-4 md:px-6">
        <div className="space-y-4">
          <Link to={baseRoute || "/inicio"} className="flex items-center gap-2 font-bold text-lg">
            <img src={restaurantLogoUrl} alt={`Logo ${restaurantDisplayName}`} className="h-12 w-12" />
            <span className="text-xl font-display font-extrabold">{restaurantDisplayName}</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            {currentRestaurant?.description || "Seu lugar favorito para pizzas deliciosas."}
          </p>
        </div>
        {isOnSpecificStorePage && (
          <div className="space-y-2">
            <h3 className="font-semibold">{getMenuLinkText()}</h3>
            <nav className="grid gap-2 text-sm">
              {categories.length > 0 ? (
                categories.map(category => (
                  <Link key={category.id} to={`${baseRoute}/menu?category=${slugify(category.name)}`} className="text-muted-foreground hover:text-primary">
                    {category.name}
                  </Link>
                ))
              ) : (
                <span className="text-muted-foreground">Nenhuma categoria</span>
              )}
            </nav>
          </div>
        )}
        <div className="space-y-2">
          <h3 className="font-semibold">Empresa</h3>
          <nav className="grid gap-2 text-sm">
            <Link to="/inicio" className="text-muted-foreground hover:text-primary">
              Início
            </Link>
            <Link to={`${baseRoute}/about`} className="text-muted-foreground hover:text-primary">
              Sobre Nós
            </Link>
            <Link to={`${baseRoute}/careers`} className="text-muted-foreground hover:text-primary">
              Carreiras
            </Link>
            <Link to={`${baseRoute}/support`} className="text-muted-foreground hover:text-primary">
              Contato
            </Link>
            {isGeneralListingPage && (
              <>
                <Link to="/restaurants" className="text-muted-foreground hover:text-primary flex items-center gap-1">
                  <UtensilsCrossed className="h-4 w-4" /> Restaurantes
                </Link>
                <Link to="/farmacias" className="text-muted-foreground hover:text-primary flex items-center gap-1">
                  <Pill className="h-4 w-4" /> Farmácias
                </Link>
                <Link to="/mercados" className="text-muted-foreground hover:text-primary flex items-center gap-1">
                  <ShoppingCart className="h-4 w-4" /> Mercados
                </Link>
                <Link to="/petshops" className="text-muted-foreground hover:text-primary flex items-center gap-1">
                  <PawPrint className="h-4 w-4" /> Petshops
                </Link>
                <Link to="/servicos" className="text-muted-foreground hover:text-primary flex items-center gap-1">
                  <Briefcase className="h-4 w-4" /> Serviços
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Siga-nos</h3>
          <div className="flex gap-4">
            <Link to="#" className="text-muted-foreground hover:text-primary">
              <Facebook className="h-5 w-5" />
            </Link>
            <Link to="#" className="text-muted-foreground hover:text-primary">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link to="#" className="text-muted-foreground hover:text-primary">
              <Instagram className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center text-sm text-muted-foreground">
        © 2024 {restaurantDisplayName}. Todos os direitos reservados.
      </div>
    </footer>
  );
};

export default SalesFooter;