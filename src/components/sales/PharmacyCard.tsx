import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Pill } from "lucide-react"; // Usando o ícone Pill
import { Restaurant } from "@/context/RestaurantContext"; // Reutilizando a interface Restaurant
import { slugify, getRestaurantTypePath } from "@/lib/utils"; // Importar getRestaurantTypePath

interface PharmacyCardProps {
  pharmacy: Restaurant; // Usando a interface Restaurant para a farmácia
}

const PharmacyCard: React.FC<PharmacyCardProps> = ({ pharmacy }) => {
  const [imageError, setImageError] = useState(false);

  const effectiveSlug = pharmacy.slug && pharmacy.slug.length > 0 && pharmacy.slug !== pharmacy.id 
                        ? pharmacy.slug 
                        : slugify(pharmacy.name);

  const pharmacyTypePrefix = getRestaurantTypePath(pharmacy.type); // Usar getRestaurantTypePath
  const pharmacyLink = `/${pharmacyTypePrefix}/${effectiveSlug}/menu`;

  console.log(`[PharmacyCard] Pharmacy: ${pharmacy.name}`);
  console.log(`[PharmacyCard]   DB Slug: ${pharmacy.slug}`);
  console.log(`[PharmacyCard]   DB ID: ${pharmacy.id}`);
  console.log(`[PharmacyCard]   Effective Slug: ${effectiveSlug}`);
  console.log(`[PharmacyCard]   Generated Link: ${pharmacyLink}`);

  return (
    <Card className="flex flex-col overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-800">
      <Link to={pharmacyLink} className="block relative overflow-hidden group">
        <img
          src={imageError || !pharmacy.image ? "/images/placeholder.svg" : pharmacy.image} // Placeholder genérico
          alt={pharmacy.name}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <span className="text-white text-lg font-semibold">Ver Produtos</span>
        </div>
      </Link>
      <CardContent className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <CardTitle className="text-2xl font-bold mb-2 text-primary">{pharmacy.name}</CardTitle>
          <CardDescription className="text-muted-foreground line-clamp-3 mb-4">
            {pharmacy.description || "Sua farmácia de confiança para saúde e bem-estar."}
          </CardDescription>
          {pharmacy.address && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4 mr-1 text-secondary-foreground" /> {pharmacy.address}
            </p>
          )}
        </div>
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4 text-base font-semibold">
          <Link to={pharmacyLink}>
            <Pill className="h-4 w-4 mr-2" /> Comprar Agora
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default PharmacyCard;