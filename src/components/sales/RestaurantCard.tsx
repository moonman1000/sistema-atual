import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, UtensilsCrossed } from "lucide-react";
import { Restaurant } from "@/context/RestaurantContext";
import { slugify, getRestaurantTypePath } from "@/lib/utils"; // Importar getRestaurantTypePath

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
  const [imageError, setImageError] = useState(false);

  // Ensure slug is always generated if not present or if it's an ID
  // Prioritize existing slug, then slugify name, fallback to ID if all else fails (though slugify should always produce something)
  const effectiveSlug = restaurant.slug && restaurant.slug.length > 0 && restaurant.slug !== restaurant.id 
                        ? restaurant.slug 
                        : slugify(restaurant.name);
  
  const restaurantTypePrefix = getRestaurantTypePath(restaurant.type); // Usar getRestaurantTypePath
  const restaurantLink = `/${restaurantTypePrefix}/${effectiveSlug}/menu`;

  console.log(`[RestaurantCard] Restaurant: ${restaurant.name}`);
  console.log(`[RestaurantCard]   DB Slug: ${restaurant.slug}`);
  console.log(`[RestaurantCard]   DB ID: ${restaurant.id}`);
  console.log(`[RestaurantCard]   Effective Slug: ${effectiveSlug}`);
  console.log(`[RestaurantCard]   Generated Link: ${restaurantLink}`);

  return (
    <Card className="flex flex-col overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-800">
      <Link to={restaurantLink} className="block relative overflow-hidden group">
        <img
          src={imageError || !restaurant.image ? "/images/pizza_logo.png" : restaurant.image}
          alt={restaurant.name}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <span className="text-white text-lg font-semibold">Ver Cardápio</span>
        </div>
      </Link>
      <CardContent className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <CardTitle className="text-2xl font-bold mb-2 text-primary">{restaurant.name}</CardTitle>
          <CardDescription className="text-muted-foreground line-clamp-3 mb-4">
            {restaurant.description || "Um lugar incrível para desfrutar de comida deliciosa."}
          </CardDescription>
          {restaurant.address && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4 mr-1 text-secondary-foreground" /> {restaurant.address}
            </p>
          )}
        </div>
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4 text-base font-semibold">
          <Link to={restaurantLink}>
            <UtensilsCrossed className="h-4 w-4 mr-2" /> Pedir Agora
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default RestaurantCard;