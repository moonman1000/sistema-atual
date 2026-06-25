"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface RevenueVsExpenseData {
  name: string;
  Receita: number;
  Custo: number;
}

interface RevenueVsExpenseChartProps {
  revenueVsExpenseData: RevenueVsExpenseData[];
  formatCurrency: (value: number) => string;
}

const RevenueVsExpenseChart: React.FC<RevenueVsExpenseChartProps> = ({ revenueVsExpenseData, formatCurrency }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas vs Custos Mensais</CardTitle>
        <CardDescription>Comparação entre receita e despesas operacionais.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueVsExpenseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), value === revenueVsExpenseData[0].Receita ? 'Receita' : 'Custo']} />
              <Legend />
              <Bar dataKey="Receita" fill="#0F4C75" />
              <Bar dataKey="Custo" fill="#DC2626" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueVsExpenseChart;