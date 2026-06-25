import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Importar Button
import { Badge } from "@/components/ui/badge"; // Importar Badge
import { Promotion } from "@/context/PromotionsContext";
import { MenuItem } from "@/context/MenuContext";
import { useRestaurant } from "@/context/RestaurantContext";
import { formatCurrency, slugify, getRestaurantTypePath } from "@/lib/utils"; // Importar getRestaurantTypePath
import { Tag } from "lucide-react";

interface PromotionsCarouselProps {
  promotions: Promotion[];
  menuItems: MenuItem[];
}

const PromotionsCarousel: React.FC<PromotionsCarouselProps> = ({ promotions, menuItems }) => {
  const { allRestaurants } = useRestaurant();

  if (!promotions || promotions.length === 0) {
    return null;
  }

  const getDiscountDisplay = (promotion: Promotion) => {
    if (promotion.discount_type === "Porcentagem" && promotion.discount_value !== undefined) {
      return `${promotion.discount_value}% OFF`;
    } else if (promotion.discount_type === "Valor Fixo" && promotion.discount_value !== undefined) {
      return `${formatCurrency(promotion.discount_value)}`;
    } else if (promotion.discount_type === "Frete Grátis") {
      return "Frete Grátis";
    }
    return "";
  };

  const getDiscountBadgeVariant = (promotion: Promotion) => {
    if (promotion.discount_type === "Frete Grátis") {
      return "blue"; // Custom class or variant for blue
    }
    return "orange"; // Custom class or variant for orange
  };

  const calculateDiscountedPrice = (item: MenuItem, promotion: Promotion) => {
    let price = item.base_price;
    if (promotion.discount_type === "Porcentagem" && promotion.discount_value !== undefined) {
      return price * (1 - promotion.discount_value / 100);
    } else if (promotion.discount_type === "Valor Fixo" && promotion.discount_value !== undefined) {
      return Math.max(0, price - promotion.discount_value);
    }
    return price;
  };

  const getPromotionItemsForDisplay = () => {
    const itemsToDisplay: {
      promotion: Promotion;
      menuItem: MenuItem;
      originalPrice: number;
      discountedPrice: number;
      discountText: string;
      link: string;
      restaurantName: string;
    }[] = [];

    promotions.forEach(promo => {
      const restaurant = allRestaurants.find(r => r.id === promo.restaurant_id);
      if (!restaurant) {
        console.warn(`[PromotionsCarousel] Restaurant not found for promotion ID: ${promo.id}`);
        return;
      }

      // Correctly derive restaurantSlug and restaurantTypePrefix from the found restaurant
      const restaurantSlug = restaurant.slug || restaurant.id;
      const restaurantTypePrefix = getRestaurantTypePath(restaurant.type); // Usar getRestaurantTypePath
      console.log(`[PromotionsCarousel] Processing promo "${promo.name}" (ID: ${promo.id}) for restaurant "${restaurant.name}" (type: ${restaurant.type}, slug: ${restaurantSlug})`);


      if (promo.applicable_items && promo.applicable_items.length > 0 && promo.applicable_items[0] !== "Todos") {
        promo.applicable_items.forEach(itemName => {
          const item = menuItems.find(mi => mi.name === itemName && mi.restaurant_id === promo.restaurant_id);
          if (item) {
            const discountedPrice = calculateDiscountedPrice(item, promo);
            const generatedLink = `/${restaurantTypePrefix}/${restaurantSlug}/product/${item.id}`;
            console.log(`[PromotionsCarousel] Generated link for specific item promo "${promo.name}" (item: ${item.name}, item.id: ${item.id}, restaurantSlug: ${restaurantSlug}): ${generatedLink}`);
            itemsToDisplay.push({
              promotion: promo,
              menuItem: item,
              originalPrice: item.base_price,
              discountedPrice: discountedPrice,
              discountText: getDiscountDisplay(promo),
              link: generatedLink,
              restaurantName: restaurant.name,
            });
          } else {
            console.warn(`[PromotionsCarousel] Menu item "${itemName}" not found for promotion ID: ${promo.id} in restaurant ${restaurant.name}.`);
          }
        });
      } else if (promo.applicable_items && promo.applicable_items.includes("Todos")) {
        const representativeItem = menuItems.find(mi => mi.restaurant_id === promo.restaurant_id && mi.is_featured) ||
                                   menuItems.find(mi => mi.restaurant_id === promo.restaurant_id);
        
        // Se nenhum item de cardápio específico for encontrado, crie um item "virtual" para exibição
        const itemForDisplay: MenuItem = representativeItem || {
          id: `virtual-item-${promo.id}`, // ID único para o item virtual
          name: promo.name, // Usa o nome da promoção como nome do item
          description: promo.description || "Aproveite esta oferta especial!",
          base_price: 0, // Preço base placeholder
          image: restaurant.image || "/images/pizza_logo.png", // Usa a imagem do restaurante ou um fallback genérico
          category: "Promoção",
          dietary: [],
          is_featured: false,
          restaurant_id: promo.restaurant_id,
          sizes: [],
          toppings: [],
          reviews: []
        };

        const originalPrice = representativeItem ? representativeItem.base_price : 0; // Se não houver item real, o preço original é 0
        const discountedPrice = calculateDiscountedPrice(itemForDisplay, promo); // Calcula com base no itemForDisplay
        const generatedLink = `/${restaurantTypePrefix}/${restaurantSlug}/menu?promoId=${promo.id}`; // Link to menu with promoId
        console.log(`[PromotionsCarousel] Generated link for "Todos" item promo "${promo.name}" (promo.id: ${promo.id}, restaurantSlug: ${restaurantSlug}): ${generatedLink}`);
        itemsToDisplay.push({
          promotion: promo,
          menuItem: itemForDisplay, // Usa o item virtual ou real
          originalPrice: originalPrice,
          discountedPrice: discountedPrice,
          discountText: getDiscountDisplay(promo),
          link: generatedLink,
          restaurantName: restaurant.name,
        });
      }
    });
    return itemsToDisplay;
  };

  const displayItems = getPromotionItemsForDisplay();

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <React.Fragment>
      <section className="py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-primary">Promoções Ativas</h2>
          <Link to="/promotions" className="text-primary hover:underline text-sm font-medium">
            Ver todas <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {displayItems.map((promoItem, index) => (
              <CarouselItem key={index} className="pl-4 basis-[58%] sm:basis-[40%] md:basis-[27%] lg:basis-1/5 xl:basis-[16%]"> {/* Reduzido em 20% */}
                <Card className="flex flex-col overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-800 h-full">
                  <Link to={promoItem.link} className="block relative overflow-hidden group">
                    <img
                      src={promoItem.menuItem.image || "/images/pizza_logo.png"}
                      alt={promoItem.menuItem.name}
                      className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-white text-lg font-semibold">Ver Detalhes</span>
                    </div>
                  </Link>
                  <CardContent className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground mb-1 line-clamp-1">
                        {promoItem.menuItem.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                        {promoItem.restaurantName}
                      </p>
                      <CardDescription className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {promoItem.promotion.description || promoItem.menuItem.description}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col mt-auto">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                          <span className="text-sm text-muted-foreground line-through">
                            {formatCurrency(promoItem.originalPrice)}
                          </span>
                          <span className="text-2xl font-bold text-green-600">
                            {formatCurrency(promoItem.discountedPrice)}
                          </span>
                        </div>
                        <Badge className={`px-3 py-1 rounded-full text-xs font-semibold ${getDiscountBadgeVariant(promoItem.promotion) === 'orange' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}`}>
                          <Tag className="h-3 w-3 mr-1" /> {promoItem.discountText}
                        </Badge>
                      </div>
                      <Button asChild className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Link to={promoItem.link}>Aproveitar Oferta</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </section>
    </React.Fragment>
  );
};

export default PromotionsCarousel;