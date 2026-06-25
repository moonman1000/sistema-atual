import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, PawPrint } from "lucide-react"; // Usando o ícone PawPrint
import { Restaurant } from "@/context/RestaurantContext"; // Reutilizando a interface Restaurant
import { slugify, getRestaurantTypePath } from "@/lib/utils"; // Importar getRestaurantTypePath

interface PetshopCardProps {
  petshop: Restaurant; // Usando a interface Restaurant para o petshop
}

const PetshopCard: React.FC<PetshopCardProps> = ({ petshop }) => {
  const [imageError, setImageError] = useState(false);

  const effectiveSlug = petshop.slug && petshop.slug.length > 0 && petshop.slug !== petshop.id 
                        ? petshop.slug 
                        : slugify(petshop.name);

  const petshopTypePrefix = getRestaurantTypePath(petshop.type); // Usar getRestaurantTypePath
  const petshopLink = `/${petshopTypePrefix}/${effectiveSlug}/menu`;

  console.log(`[PetshopCard] Petshop: ${petshop.name}`);
  console.log(`[PetshopCard]   DB Slug: ${petshop.slug}`);
  console.log(`[PetshopCard]   DB ID: ${petshop.id}`);
  console.log(`[PetshopCard]   Effective Slug: ${effectiveSlug}`);
  console.log(`[PetshopCard]   Generated Link: ${petshopLink}`);

  return (
    <Card className="flex flex-col overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-800">
      <Link to={petshopLink} className="block relative overflow-hidden group">
        <img
          src={imageError || !petshop.image ? "/images/placeholder.svg" : petshop.image} // Placeholder genérico
          alt={petshop.name}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <span className="text-white text-lg font-semibold">Ver Produtos</span>
        </div>
      </Link>
      <CardContent className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <CardTitle className="text-2xl font-bold mb-2 text-primary">{petshop.name}</CardTitle>
          <CardDescription className="text-muted-foreground line-clamp-3 mb-4">
            {petshop.description || "Tudo para o seu pet, com carinho e qualidade."}
          </CardDescription>
          {petshop.address && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4 mr-1 text-secondary-foreground" /> {petshop.address}
            </p>
          )}
        </div>
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4 text-base font-semibold">
          <Link to={petshopLink}>
            <PawPrint className="h-4 w-4 mr-2" /> Comprar Agora
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default PetshopCard;