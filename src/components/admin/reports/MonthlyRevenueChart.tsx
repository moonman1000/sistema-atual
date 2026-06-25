"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface MonthlyRevenueData {
  name: string;
  vendas: number;
}

interface MonthlyRevenueChartProps {
  monthlyRevenueData: MonthlyRevenueData[];
  formatCurrency: (value: number) => string;
}

const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({ monthlyRevenueData, formatCurrency }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Faturamento Mensal</CardTitle>
        <CardDescription>Visão geral do faturamento ao longo do ano.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
              <Legend />
              <Line type="monotone" dataKey="vendas" stroke="#8884d8" name="Vendas" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyRevenueChart;