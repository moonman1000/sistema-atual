"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface SalesByCategoryData {
  name: string;
  value: number;
}

interface SalesByCategoryChartProps {
  salesByCategoryData: SalesByCategoryData[];
  COLORS: string[];
  formatCurrency: (value: number) => string;
}

const SalesByCategoryChart: React.FC<SalesByCategoryChartProps> = ({ salesByCategoryData, COLORS, formatCurrency }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Distribuição de Vendas por Categoria</CardTitle>
        <CardDescription>Percentual de vendas por tipo de produto.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={salesByCategoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {salesByCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Valor']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesByCategoryChart;