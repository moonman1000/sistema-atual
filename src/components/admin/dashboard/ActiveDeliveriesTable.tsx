import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Delivery } from "@/context/DeliveryContext";
import { Order } from "@/context/OrderContext"; // Importar Order

interface ActiveDeliveriesTableProps {
  activeDeliveries: Delivery[];
  orders: Order[]; // NOVO: Receber a lista completa de pedidos
  getDeliveryStatusBadgeVariant: (status: Delivery["status"]) => "default" | "secondary" | "success" | "destructive" | "outline";
}

const ActiveDeliveriesTable: React.FC<ActiveDeliveriesTableProps> = ({ activeDeliveries, orders, getDeliveryStatusBadgeVariant }) => {
  const safeOrders = orders || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entregas Ativas</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto"> {/* Adicionado overflow-x-auto para mobile */}
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Nº Diário</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Entregador</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeDeliveries.map((delivery) => {
              const order = safeOrders.find(o => o.id === delivery.orderid);
              const dailyNumber = order?.daily_order_number || 'N/A';

              return (
                <TableRow key={delivery.id}>
                  <TableCell className="font-bold text-lg">{dailyNumber}</TableCell>
                  <TableCell>
                    <span className="font-medium">{delivery.clientname}</span>
                    <br />
                    <span className="text-muted-foreground text-xs line-clamp-1">
                      {delivery.client_address}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getDeliveryStatusBadgeVariant(delivery.status)}
                    >
                      {delivery.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{delivery.deliveryman}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="link" size="sm" asChild>
                      <Link to="/admin/entregas">Ver</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ActiveDeliveriesTable;