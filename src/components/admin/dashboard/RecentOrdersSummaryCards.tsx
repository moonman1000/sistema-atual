import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Order } from "@/context/OrderContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils"; // Importar cn para classes condicionais

interface RecentOrdersSummaryCardsProps {
  recentOrders: Order[];
  getOrderStatusBadgeVariant: (status: Order["status"]) => "default" | "secondary" | "success" | "destructive" | "outline";
  onViewDetails: (order: Order) => void;
  newOrderIds: string[]; // NOVO: Receber IDs de novos pedidos
}

const RecentOrdersSummaryCards: React.FC<RecentOrdersSummaryCardsProps> = ({ recentOrders, getOrderStatusBadgeVariant, onViewDetails, newOrderIds }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-3 h-full">
      {recentOrders.length > 0 ? (
        recentOrders.map((order, index) => {
          const isNew = newOrderIds.includes(order.id); // Verificar se é novo
          return (
            <div 
              key={order.id} 
              className="group block h-full cursor-pointer"
              onClick={() => onViewDetails(order)}
            >
              <Card 
                className={cn(
                  "p-3 shadow-sm flex flex-col justify-between bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-700 h-full",
                  "transition-all duration-300 ease-in-out transform group-hover:scale-[1.02] group-hover:shadow-xl",
                  isNew && "animate-pulse-new-order" // Removido border-l-4 border-orange-500
                )}
              >
                <CardContent className="p-0 space-y-1">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-semibold truncate">
                      {order.daily_order_number ? `Pedido #${order.daily_order_number}` : `Pedido #${order.id.substring(0, 8)}`}
                    </CardTitle>
                    <Badge variant={getOrderStatusBadgeVariant(order.status)} className="text-xs h-4">
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-xs font-bold text-primary">
                    {formatCurrency(order.total)}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {order.client_name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {formatDate(order.order_date)}
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
          <p className="text-sm">Nenhum pedido recente para exibir.</p>
        </Card>
      )}
    </div>
  );
};

export default RecentOrdersSummaryCards;