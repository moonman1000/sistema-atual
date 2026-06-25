import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Package, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils"; // Importar cn para classes condicionais

interface MetricCardsProps {
  dailyRevenue: number;
  totalRevenue: number;
  totalOrdersCount: number;
  averageTicket: number;
  // NOVO: Adicionar monthlyRevenue para uso
  monthlyRevenue: number; 
}

const MetricCards: React.FC<MetricCardsProps> = ({
  dailyRevenue,
  totalRevenue,
  totalOrdersCount,
  averageTicket,
  monthlyRevenue, // Desestruturar monthlyRevenue
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Faturamento do Dia (Daily Revenue) - Success/Green */}
      <Card className="border-l-4 border-success bg-green-50/50 dark:bg-green-900/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Faturamento do Dia
          </CardTitle>
          <DollarSign className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(dailyRevenue)}
          </div>
          <p className="text-xs text-muted-foreground">
            Pedidos confirmados hoje
          </p>
        </CardContent>
      </Card>

      {/* Faturamento Mensal (Monthly Revenue) - Primary/Blue */}
      <Card className="border-l-4 border-primary bg-blue-50/50 dark:bg-blue-900/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Faturamento Mensal
          </CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(monthlyRevenue)}
          </div>
          <p className="text-xs text-muted-foreground">
            Receita bruta no mês
          </p>
        </CardContent>
      </Card>

      {/* Pedidos (Orders) - Activity/Orange */}
      <Card className="border-l-4 border-orange-500 bg-orange-50/50 dark:bg-orange-900/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pedidos do Dia</CardTitle> {/* ATUALIZADO: Título do card */}
          <Package className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalOrdersCount}</div>
          <p className="text-xs text-muted-foreground">Total de pedidos do dia</p> {/* ATUALIZADO: Descrição do card */}
        </CardContent>
      </Card>

      {/* Ticket Médio (Average Ticket) - Trending/Purple */}
      <Card className="border-l-4 border-purple-500 bg-purple-50/50 dark:bg-purple-900/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ticket Médio
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(averageTicket)}
          </div>
          <p className="text-xs text-muted-foreground">
            Valor médio por pedido
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricCards;