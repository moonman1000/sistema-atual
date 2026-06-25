import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Delivery } from "@/context/DeliveryContext";
import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrders } from "@/context/OrderContext"; // NOVO: Importar useOrders

interface RecentDeliveriesSummaryCardsProps {
  recentDeliveries: Delivery[];
  getDeliveryStatusBadgeVariant: (status: Delivery["status"]) => "default" | "secondary" | "success" | "destructive" | "outline";
  newDeliveryIds: string[]; // NOVO: IDs de novas entregas
  onViewDetails: (delivery: Delivery) => void; // NOVO: Handler para ver detalhes
}

const RecentDeliveriesSummaryCards: React.FC<RecentDeliveriesSummaryCardsProps> = ({ recentDeliveries, getDeliveryStatusBadgeVariant, newDeliveryIds, onViewDetails }) => {
  const { orders } = useOrders(); // NOVO: Obter pedidos do contexto

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-3 h-full">
      {recentDeliveries.length > 0 ? (
        recentDeliveries.map((delivery, index) => {
          const isNew = newDeliveryIds.includes(delivery.id); // Verificar se é novo
          const isDelivered = delivery.status === "Entregue"; // NOVO: Verificar se foi entregue
          const order = orders.find(o => o.id === delivery.orderid); // NOVO: Encontrar o pedido correspondente
          const dailyOrderNumber = order?.daily_order_number || 'N/A'; // NOVO: Obter o número diário

          return (
            <div 
              key={delivery.id} 
              className="group block h-full cursor-pointer"
              onClick={() => onViewDetails(delivery)} // Usar onClick handler
            >
              <Card 
                className={cn(
                  "p-3 shadow-sm flex flex-col justify-between bg-blue-50 border-blue-400 dark:bg-blue-900/20 dark:border-blue-700 h-full",
                  "transition-all duration-300 ease-in-out transform group-hover:scale-[1.01] group-hover:shadow-xl",
                  isNew && "animate-pulse-new-order", // Aplicar animação se for novo (removido border-l-4)
                  isDelivered && "bg-red-50/50 border-red-400 dark:bg-red-900/20 dark:border-red-700" // NOVO: Estilo para entregue
                )}
              >
                <CardContent className="p-0 space-y-1">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-semibold truncate text-blue-800 dark:text-blue-200">
                      Entrega #{dailyOrderNumber} {/* NOVO: Exibir número diário */}
                    </CardTitle>
                    <Badge variant={getDeliveryStatusBadgeVariant(delivery.status)} className="text-xs h-4">
                      {delivery.status}
                    </Badge>
                  </div>
                  <p className="text-xs font-bold text-primary">
                    Pedido: {delivery.orderid.substring(0, 8)}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    Entregador: {delivery.deliveryman}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    Estimativa: {delivery.estimateddeliverytime}
                  </p>
                  <Button variant="link" className="p-0 h-auto text-xs pt-1">
                    Ver
                  </Button>
                </CardContent>
              </Card>
            </div>
          );
        })
      ) : (
        <Card className="col-span-full flex items-center justify-center p-4 text-muted-foreground">
          <p className="text-sm">Nenhuma entrega recente para exibir.</p>
        </Card>
      )}
    </div>
  );
};

export default RecentDeliveriesSummaryCards;