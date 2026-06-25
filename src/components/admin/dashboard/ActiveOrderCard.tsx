import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pizza } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrders, Order } from "@/context/OrderContext"; // Import useOrders
import { formatCurrency } from "@/lib/utils";

interface ActiveOrderCardProps {
  activeOrder: Order | null;
  getOrderStatusBadgeVariant: (status: Order["status"]) => "default" | "secondary" | "success" | "destructive" | "outline";
  onViewDetails: (order: Order) => void; // NEW PROP
}

const ActiveOrderCard: React.FC<ActiveOrderCardProps> = ({ activeOrder, getOrderStatusBadgeVariant, onViewDetails }) => {
  const { newOrderIds } = useOrders(); // NOVO: Obter newOrderIds
  const isNew = activeOrder ? newOrderIds.includes(activeOrder.id) : false;

  const orderTitle = activeOrder?.daily_order_number 
    ? `Pedido #${activeOrder.daily_order_number} (Ativo)` 
    : "Pedido Mais Recente (Ativo)";

  return (
    <div 
      className={cn(
        "col-span-full lg:col-span-2 block group", // Ocupa 2 colunas em lg, e full em mobile
        !activeOrder && "pointer-events-none"
      )}
      onClick={() => activeOrder && onViewDetails(activeOrder)} // Use onClick handler
    >
      <Card 
        className={cn(
          "h-full transition-all duration-300 ease-in-out",
          activeOrder 
            ? "bg-yellow-50/50 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-700 transform group-hover:scale-[1.01] group-hover:shadow-xl"
            : "bg-card border-border",
          isNew && "animate-pulse-new-order" // Removido border-l-4 border-orange-500
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">
            {orderTitle}
          </CardTitle>
          <Pizza className="h-5 w-5 text-orange-500" />
        </CardHeader>
        <CardContent>
          {activeOrder ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(activeOrder.total)}
                </span>
                <Badge variant={getOrderStatusBadgeVariant(activeOrder.status)}>
                  {activeOrder.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                Itens: {activeOrder.items}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-1">
                Cliente: {activeOrder.client_name}
              </p>
              <Button variant="link" className="p-0 h-auto text-sm">
                Ver Detalhes
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Nenhum pedido ativo no momento.</p>
              <Button variant="link" className="p-0 h-auto text-sm mt-2" asChild>
                <Link to="/admin/pedidos">Ver todos os pedidos</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActiveOrderCard;