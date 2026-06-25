import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Loader2, ChevronDown, MapPin, Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Importar Card components
import { useRestaurant } from "@/context/RestaurantContext";
import { usePromotions } from "@/context/PromotionsContext";
import { useMenu } from "@/context/MenuContext";
import PromotionsCarousel from "@/components/sales/PromotionsCarousel";
import RestaurantCard from "@/components/sales/RestaurantCard"; // Importar o novo componente
import { slugify, getRestaurantTypePath } from "@/lib/utils"; // Importar getRestaurantTypePath
import * as LucideIcons from "lucide-react"; // NOVO: Importar todos os ícones Lucide

const RestaurantsListingPage = () => {
  const { allRestaurants, isLoadingRestaurants } = useRestaurant();
  const { allGlobalPromotions, isLoadingGlobalPromotions } = usePromotions();
  const { allGlobalMenuItems, isLoadingGlobalMenuItems } = useMenu();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [addressSearchTerm, setAddressSearchTerm] = useState("");

  const filteredAndSortedRestaurants = useMemo(() => {
    let currentRestaurants = allRestaurants;

    // Filtrar para mostrar apenas estabelecimentos do tipo 'restaurant'
    currentRestaurants = currentRestaurants.filter(r => r.type === 'restaurant');

    if (searchTerm) {
      currentRestaurants = currentRestaurants.filter(
        (restaurant) =>
          restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          restaurant.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          restaurant.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (addressSearchTerm) {
      currentRestaurants = currentRestaurants.filter(
        (restaurant) =>
          restaurant.address?.toLowerCase().includes(addressSearchTerm.toLowerCase())
      );
    }

    const sortedRestaurants = [...currentRestaurants];

    sortedRestaurants.sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name) * -1;
      }
      return 0;
    });

    return currentRestaurants;
  }, [searchTerm, sortBy, addressSearchTerm, allRestaurants]);

  // Filter promotions to only include those from 'restaurant' type establishments
  const restaurantTypePromotions = useMemo(() => {
    const restaurantIds = allRestaurants.filter(r => r.type === 'restaurant').map(r => r.id);
    return allGlobalPromotions.filter(promo => restaurantIds.includes(promo.restaurant_id));
  }, [allGlobalPromotions, allRestaurants]);

  if (isLoadingRestaurants || isLoadingGlobalPromotions || isLoadingGlobalMenuItems) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando restaurantes e promoções...</p>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-display font-extrabold mb-4 text-primary">Descubra Nossos Restaurantes</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore uma variedade de sabores e encontre seu próximo pedido favorito.
        </p>
      </div>

      {/* Search and Filter Section */}
      <Card className="mb-12 p-6 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold">Encontre seu Restaurante</CardTitle>
          <CardDescription>Busque por nome, descrição ou endereço, e ordene os resultados.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou descrição..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative flex-1 w-full">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por endereço..."
              className="pl-10 w-full"
              value={addressSearchTerm}
              onChange={(e) => setAddressSearchTerm(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 w-full md:w-auto">
                Ordenar por <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("name-asc")}>Nome (A-Z)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name-desc")}>Nome (Z-A)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      {/* Promotions Carousel Section */}
      <PromotionsCarousel promotions={restaurantTypePromotions} menuItems={allGlobalMenuItems} />

      {/* Restaurants Grid */}
      {filteredAndSortedRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {filteredAndSortedRestaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/50 mt-12">
          <h3 className="text-2xl font-semibold mb-2 text-primary">Nenhum restaurante encontrado.</h3>
          <p className="text-lg text-muted-foreground">
            Ajuste sua busca ou verifique se há restaurantes cadastrados.
          </p>
        </div>
      )}
    </div>
  );
};

export default RestaurantsListingPage;