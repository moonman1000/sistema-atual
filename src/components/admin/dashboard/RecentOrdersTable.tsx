import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/context/OrderContext";
import { formatCurrency } from "@/lib/utils";

interface RecentOrdersTableProps {
  recentOrders: Order[];
  getOrderStatusBadgeVariant: (status: Order["status"]) => "default" | "secondary" | "success" | "destructive" | "outline";
}

const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({ recentOrders, getOrderStatusBadgeVariant }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimos Pedidos</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto"> {/* Adicionado overflow-x-auto para mobile */}
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Nº Diário</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-bold text-lg">{order.daily_order_number || 'N/A'}</TableCell>
                <TableCell>
                  <span className="font-medium">{order.client_name}</span>
                  <br />
                  <span className="text-muted-foreground text-xs line-clamp-1">{order.items}</span>
                </TableCell>
                <TableCell>{formatCurrency(order.total)}</TableCell>
                <TableCell>
                  <Badge variant={getOrderStatusBadgeVariant(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RecentOrdersTable;