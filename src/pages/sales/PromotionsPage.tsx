import React from "react";
import { Link } from "react-router-dom";
import { Tag, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePromotions, Promotion } from "@/context/PromotionsContext";
import { useSession } from '@/context/SessionContext'; // Importar useSession
import { useRestaurant } from '@/context/RestaurantContext'; // Importar useRestaurant
import { formatCurrency, getRestaurantTypePath } from "@/lib/utils"; // Importar getRestaurantTypePath

const CustomerPromotionsPage = () => {
  const { promotions, isLoadingPromotions } = usePromotions();
  const { isLoading: isLoadingSession, isCustomer, profile } = useSession(); // Obter isCustomer e profile
  const { isLoadingRestaurants, currentRestaurant } = useRestaurant(); // Obter currentRestaurant

  if (isLoadingPromotions || isLoadingSession || isLoadingRestaurants) {
    return <div className="flex min-h-screen items-center justify-center">Carregando promoções...</div>;
  }

  // NOVO: Tratamento para quando o restaurante não é encontrado
  if (!currentRestaurant) {
    return (
      <div className="container py-8 text-center min-h-screen flex flex-col justify-center items-center">
        <h2 className="text-3xl font-bold text-destructive">Estabelecimento Não Encontrado</h2>
        <p className="text-lg text-muted-foreground mt-4">
          Não foi possível carregar os dados do estabelecimento. Verifique a URL ou se o estabelecimento existe.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Voltar para a página inicial</Link>
        </Button>
      </div>
    );
  }

  const activePromotions = promotions.filter(promo => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(promo.start_date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(promo.end_date);
    endDate.setHours(23, 59, 59, 999);

    console.log(`--- Promoção: ${promo.name} (ID: ${promo.id}) ---`);
    console.log(`Data Atual (início do dia): ${today.toISOString()}`);
    console.log(`Data Início Promoção: ${startDate.toISOString()}`);
    console.log(`Data Fim Promoção: ${endDate.toISOString()}`);
    console.log(`is_active: ${promo.is_active}`);
    console.log(`today >= startDate: ${today >= startDate}`);
    console.log(`today <= endDate: ${today <= endDate}`);
    console.log(`Resultado do filtro: ${promo.is_active && today >= startDate && today <= endDate}`);
    console.log('-------------------------------------------------');

    return promo.is_active && today >= startDate && today <= endDate;
  });

  const getDiscountDisplay = (promotion: Promotion) => {
    if (promotion.discount_type === "Porcentagem") {
      return `${promotion.discount_value}% OFF`;
    } else if (promotion.discount_type === "Valor Fixo") {
      return `${formatCurrency(promotion.discount_value || 0)} OFF`;
    } else if (promotion.discount_type === "Frete Grátis") {
      return "Frete Grátis";
    }
    return "";
  };

  // Derivar baseRoute para links de navegação
  const storeIdentifier = currentRestaurant?.slug || currentRestaurant?.id;
  const baseRoute = storeIdentifier ? `/${getRestaurantTypePath(currentRestaurant.type)}/${storeIdentifier}` : ''; // Usar getRestaurantTypePath


  return (
    <div className="container py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Nossas Promoções</h1>
        <p className="text-lg text-muted-foreground">Aproveite nossos descontos e ofertas especiais!</p>
      </div>

      {activePromotions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activePromotions.map(promo => (
            <Card key={promo.id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl font-bold text-primary">{promo.name}</CardTitle>
                  <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                    <Tag className="h-4 w-4 mr-1" /> {getDiscountDisplay(promo)}
                  </Badge>
                </div>
                <CardDescription>{promo.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Válido de {promo.start_date} a {promo.end_date}</span>
                </div>
                {promo.minimum_order_value && (
                  <p className="text-sm text-muted-foreground">
                    Pedido mínimo: {formatCurrency(promo.minimum_order_value)}
                  </p>
                )}
                {promo.applicable_items && promo.applicable_items.length > 0 && promo.applicable_items[0] !== "Todos" && (
                  <p className="text-sm text-muted-foreground">
                    Aplicável a: {promo.applicable_items.join(", ")}
                  </p>
                )}
                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link to={`${baseRoute}/menu?promoId=${promo.id}`}>Ver Cardápio</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">Nenhuma promoção ativa no momento.</h3>
          <p className="text-muted-foreground">Fique de olho para futuras ofertas!</p>
          <Button asChild className="mt-4 bg-orange-500 hover:bg-orange-600 text-white">
            <Link to="/menu">Explorar o Cardápio</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default CustomerPromotionsPage;