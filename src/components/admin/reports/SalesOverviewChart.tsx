"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface SalesData {
  name: string;
  vendas: number;
  pedidos: number;
}

interface SalesOverviewChartProps {
  salesData: SalesData[];
  formatCurrency: (value: number) => string;
}

const SalesOverviewChart: React.FC<SalesOverviewChartProps> = ({ salesData, formatCurrency }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visão Geral de Vendas</CardTitle>
        <CardDescription>Vendas e pedidos por mês.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
              <Legend />
              <Bar dataKey="vendas" fill="#0F4C75" name="Vendas (R$)" />
              <Bar dataKey="pedidos" fill="#FF7A00" name="Pedidos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesOverviewChart;