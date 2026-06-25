import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ShoppingCart } from "lucide-react"; // Usando o ícone ShoppingCart
import { Restaurant } from "@/context/RestaurantContext"; // Importação corrigida
import { slugify, getRestaurantTypePath } from "@/lib/utils"; // Importar getRestaurantTypePath

interface MarketCardProps {
  market: Restaurant; // Usando a interface Restaurant para o mercado
}

const MarketCard: React.FC<MarketCardProps> = ({ market }) => {
  const [imageError, setImageError] = useState(false);

  const effectiveSlug = market.slug && market.slug.length > 0 && market.slug !== market.id 
                        ? market.slug 
                        : slugify(market.name);

  const marketTypePrefix = getRestaurantTypePath(market.type); // Usar getRestaurantTypePath
  const marketLink = `/${marketTypePrefix}/${effectiveSlug}/menu`;

  console.log(`[MarketCard] Market: ${market.name}`);
  console.log(`[MarketCard]   DB Slug: ${market.slug}`);
  console.log(`[MarketCard]   DB ID: ${market.id}`);
  console.log(`[MarketCard]   Effective Slug: ${effectiveSlug}`);
  console.log(`[MarketCard]   Generated Link: ${marketLink}`);

  return (
    <Card className="flex flex-col overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-800">
      <Link to={marketLink} className="block relative overflow-hidden group">
        <img
          src={imageError || !market.image ? "/images/placeholder.svg" : market.image} // Placeholder genérico
          alt={market.name}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <span className="text-white text-lg font-semibold">Ver Produtos</span>
        </div>
      </Link>
      <CardContent className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <CardTitle className="text-2xl font-bold mb-2 text-primary">{market.name}</CardTitle>
          <CardDescription className="text-muted-foreground line-clamp-3 mb-4">
            {market.description || "Seu mercado de confiança para produtos de qualidade."}
          </CardDescription>
          {market.address && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4 mr-1 text-secondary-foreground" /> {market.address}
            </p>
          )}
        </div>
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4 text-base font-semibold">
          <Link to={marketLink}>
            <ShoppingCart className="h-4 w-4 mr-2" /> Comprar Agora
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default MarketCard;