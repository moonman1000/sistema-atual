import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase } from "lucide-react"; // Usando o ícone Briefcase
import { Restaurant } from "@/context/RestaurantContext"; // Reutilizando a interface Restaurant
import { slugify, getRestaurantTypePath } from "@/lib/utils"; // Importar getRestaurantTypePath

interface ServiceCardProps {
  service: Restaurant; // Usando a interface Restaurant para o serviço
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const [imageError, setImageError] = useState(false);

  const effectiveSlug = service.slug && service.slug.length > 0 && service.slug !== service.id 
                        ? service.slug 
                        : slugify(service.name);

  const serviceTypePrefix = getRestaurantTypePath(service.type); // Usar getRestaurantTypePath
  const serviceLink = `/${serviceTypePrefix}/${effectiveSlug}/menu`;

  console.log(`[ServiceCard] Service: ${service.name}`);
  console.log(`[ServiceCard]   DB Slug: ${service.slug}`);
  console.log(`[ServiceCard]   DB ID: ${service.id}`);
  console.log(`[ServiceCard]   Effective Slug: ${effectiveSlug}`);
  console.log(`[ServiceCard]   Generated Link: ${serviceLink}`);

  return (
    <Card className="flex flex-col overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-800">
      <Link to={serviceLink} className="block relative overflow-hidden group">
        <img
          src={imageError || !service.image ? "/images/placeholder.svg" : service.image} // Placeholder genérico
          alt={service.name}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <span className="text-white text-lg font-semibold">Ver Serviços</span>
        </div>
      </Link>
      <CardContent className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <CardTitle className="text-2xl font-bold mb-2 text-primary">{service.name}</CardTitle>
          <CardDescription className="text-muted-foreground line-clamp-3 mb-4">
            {service.description || "Provedor de serviços de alta qualidade para suas necessidades."}
          </CardDescription>
          {service.address && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4 mr-1 text-secondary-foreground" /> {service.address}
            </p>
          )}
        </div>
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4 text-base font-semibold">
          <Link to={serviceLink}>
            <Briefcase className="h-4 w-4 mr-2" /> Contratar Agora
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;