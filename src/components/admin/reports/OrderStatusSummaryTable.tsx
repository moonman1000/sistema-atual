"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface OrderStatusSummary {
  status: string;
  count: number;
  variant: string; // Assuming variant is a string that maps to Badge variants
}

interface OrderStatusSummaryTableProps {
  orderStatusSummary: OrderStatusSummary[];
}

const OrderStatusSummaryTable: React.FC<OrderStatusSummaryTableProps> = ({ orderStatusSummary }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo do Status dos Pedidos</CardTitle>
        <CardDescription>Distribuição atual dos pedidos.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderStatusSummary.map((statusItem) => (
              <TableRow key={statusItem.status}>
                <TableCell>
                  <Badge variant={statusItem.variant as any}>{statusItem.status}</Badge>
                </TableCell>
                <TableCell className="text-right">{statusItem.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default OrderStatusSummaryTable;