"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

interface MetricCardsProps {
  dailyRevenue: number;
  monthlyRevenue: number;
  annualRevenue: number;
  monthlyExpenses: number;
  annualExpenses: number;
  netAnnualRevenue: number;
  formatCurrency: (value: number) => string;
}

const MetricCards: React.FC<MetricCardsProps> = ({
  dailyRevenue,
  monthlyRevenue,
  annualRevenue,
  monthlyExpenses,
  annualExpenses,
  netAnnualRevenue,
  formatCurrency,
}) => {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento do Dia</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(dailyRevenue)}</div>
            <p className="text-xs text-muted-foreground">Pedidos confirmados hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">Receita bruta no mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Mensal</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(monthlyExpenses)}</div>
            <p className="text-xs text-muted-foreground">Despesas registradas no mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Anual Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(netAnnualRevenue)}</div>
            <p className="text-xs text-muted-foreground">Receita - Custos no ano</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Anual Total</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(annualRevenue)}</div>
            <p className="text-xs text-muted-foreground">Receita bruta no ano</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Anuais</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(annualExpenses)}</div>
            <p className="text-xs text-muted-foreground">Custos totais registrados no ano</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MetricCards;