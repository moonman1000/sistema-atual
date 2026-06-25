"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TopProduct {
  id: string;
  name: string;
  category: string;
  sales: number;
  revenue: number;
}

interface TopSellingProductsTableProps {
  topProducts: TopProduct[];
  formatCurrency: (value: number) => string;
}

const TopSellingProductsTable: React.FC<TopSellingProductsTableProps> = ({ topProducts, formatCurrency }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos Mais Vendidos</CardTitle>
        <CardDescription>Os itens de cardápio com maior volume de vendas.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Vendas</TableHead>
              <TableHead className="text-right">Faturamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.sales}</TableCell>
                <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TopSellingProductsTable;