"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, DollarSign, TrendingDown, TrendingUp, FileText, Loader2 } from "lucide-react";
import { useExpenses } from "@/context/ExpenseContext";
import { useOrders } from "@/context/OrderContext";
import { useMenu } from "@/context/MenuContext";
import { useCategories } from "@/context/CategoryContext"; // Importar useCategories
import { formatCurrency, createLocalDate } from "@/lib/utils"; // Importar createLocalDate
import { generateReportPdf } from "@/utils/reportGenerator";
import { toast } from "sonner";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

// Importar os novos componentes modulares
import ReportHeader from "@/components/admin/reports/ReportHeader";
import ReportSelectorCard from "@/components/admin/reports/ReportSelectorCard";
import MetricCards from "@/components/admin/reports/MetricCards";
import SalesOverviewChart from "@/components/admin/reports/SalesOverviewChart";
import MonthlyRevenueChart from "@/components/admin/reports/MonthlyRevenueChart";
import RevenueVsExpenseChart from "@/components/admin/reports/RevenueVsExpenseChart";
import SalesByCategoryChart from "@/components/admin/reports/SalesByCategoryChart";
import TopSellingProductsTable from "@/components/admin/reports/TopSellingProductsTable";
import OrderStatusSummaryTable from "@/components/admin/reports/OrderStatusSummaryTable";

const COLORS = ['#0F4C75', '#FF7A00', '#82ca9d', '#4CAF50', '#2196F3', '#9C27B0', '#FFC107', '#795548']; // Mais cores para mais categorias

const ReportsPage = () => {
  const { expenses, isLoadingExpenses } = useExpenses();
  const { orders, isLoadingOrders } = useOrders();
  const { menuItems, isLoadingMenuItems } = useMenu();
  const { categories, isLoadingCategories } = useCategories(); // Usar useCategories
  const [selectedReport, setSelectedReport] = React.useState("visao-geral-vendas");
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);

  // Helper functions for date comparison
  const getTodayDateString = () => new Date().toISOString().split('T')[0];
  const getCurrentMonthYearString = () => new Date().toISOString().substring(0, 7);
  const getCurrentYearString = () => new Date().toISOString().substring(0, 4);

  const {
    dailyRevenue,
    monthlyRevenue,
    annualRevenue,
    monthlyExpenses,
    annualExpenses,
    netAnnualRevenue,
  } = React.useMemo(() => {
    if (isLoadingOrders || isLoadingExpenses) {
      return {
        dailyRevenue: 0,
        monthlyRevenue: 0,
        annualRevenue: 0,
        monthlyExpenses: 0,
        annualExpenses: 0,
        netAnnualRevenue: 0,
      };
    }

    const todayStr = getTodayDateString();
    const monthYearStr = getCurrentMonthYearString();
    const yearStr = getCurrentYearString();

    let dailyRevenue = 0;
    let monthlyRevenue = 0;
    let annualRevenue = 0;

    orders.forEach(order => {
      if (order.status !== 'Cancelado' && order.status !== 'Recusado') { // ADICIONADO: Recusado
        if (order.order_date.startsWith(yearStr)) {
          annualRevenue += order.total;
          if (order.order_date.startsWith(monthYearStr)) {
            monthlyRevenue += order.total;
            if (order.order_date === todayStr) {
              dailyRevenue += order.total;
            }
          }
        }
      }
    });

    let monthlyExpenses = 0;
    let annualExpenses = 0;

    expenses.forEach(expense => {
      if (expense.date.startsWith(yearStr)) {
        annualExpenses += expense.amount;
        if (expense.date.startsWith(monthYearStr)) {
          monthlyExpenses += expense.amount;
        }
      }
    });

    const netAnnualRevenue = annualRevenue - annualExpenses;

    return {
      dailyRevenue,
      monthlyRevenue,
      annualRevenue,
      monthlyExpenses,
      annualExpenses,
      netAnnualRevenue,
    };
  }, [orders, expenses, isLoadingOrders, isLoadingExpenses]);

  // Dados reais para Visão Geral de Vendas
  const realSalesData = React.useMemo(() => {
    if (isLoadingOrders) return [];

    const salesByMonth: { [key: string]: { monthKey: string; vendas: number; pedidos: number; name: string } } = {};
    const today = new Date();

    // Initialize data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(today, i);
      const monthKey = format(date, "yyyy-MM");
      const monthLabel = format(date, "MMM/yyyy", { locale: ptBR });
      salesByMonth[monthKey] = { monthKey, vendas: 0, pedidos: 0, name: monthLabel };
    }

    orders.forEach(order => {
      if (order.status !== 'Cancelado' && order.status !== 'Recusado') { // ADICIONADO: Recusado
        const orderMonthKey = order.order_date.substring(0, 7); // "YYYY-MM"
        if (salesByMonth[orderMonthKey]) {
          salesByMonth[orderMonthKey].vendas += order.total;
          salesByMonth[orderMonthKey].pedidos += 1;
        }
      }
    });

    return Object.values(salesByMonth).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [orders, isLoadingOrders]);

  // NOVO: Dados reais para Faturamento Mensal
  const realMonthlyRevenueData = React.useMemo(() => {
    if (isLoadingOrders) return [];

    const monthlyData: { [key: string]: { monthKey: string; vendas: number; name: string } } = {};
    const today = new Date();

    // Initialize data for the last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(today, i);
      const monthKey = format(date, "yyyy-MM");
      const monthLabel = format(date, "MMM/yyyy", { locale: ptBR });
      monthlyData[monthKey] = { monthKey, vendas: 0, name: monthLabel };
    }

    orders.forEach(order => {
      if (order.status !== 'Cancelado' && order.status !== 'Recusado') { // ADICIONADO: Recusado
        const orderMonthKey = order.order_date.substring(0, 7); // "YYYY-MM"
        if (monthlyData[orderMonthKey]) {
          monthlyData[orderMonthKey].vendas += order.total;
        }
      }
    });

    return Object.values(monthlyData).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [orders, isLoadingOrders]);

  // NOVO: Dados reais para Vendas vs Custos Mensais
  const realRevenueVsExpenseData = React.useMemo(() => {
    if (isLoadingOrders || isLoadingExpenses) return [];

    const dataByMonth: { [key: string]: { monthKey: string; Receita: number; Custo: number; name: string } } = {};
    const today = new Date();

    // Initialize data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(today, i);
      const monthKey = format(date, "yyyy-MM");
      const monthLabel = format(date, "MMM/yyyy", { locale: ptBR });
      dataByMonth[monthKey] = { monthKey, Receita: 0, Custo: 0, name: monthLabel };
    }

    orders.forEach(order => {
      if (order.status !== 'Cancelado' && order.status !== 'Recusado') { // ADICIONADO: Recusado
        const orderMonthKey = order.order_date.substring(0, 7);
        if (dataByMonth[orderMonthKey]) {
          dataByMonth[orderMonthKey].Receita += order.total;
        }
      }
    });

    expenses.forEach(expense => {
      const expenseMonthKey = expense.date.substring(0, 7);
      if (dataByMonth[expenseMonthKey]) {
        dataByMonth[expenseMonthKey].Custo += expense.amount;
      }
    });

    return Object.values(dataByMonth).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [orders, expenses, isLoadingOrders, isLoadingExpenses]);


  // Dados reais para Distribuição de Vendas por Categoria
  const realSalesByCategoryData = React.useMemo(() => {
    if (isLoadingOrders || isLoadingMenuItems || isLoadingCategories) return [];

    const salesByCategoryMap: { [key: string]: number } = {};

    // Initialize all categories with 0 sales
    categories.forEach(cat => {
      salesByCategoryMap[cat.name] = 0;
    });

    orders.forEach(order => {
      if (order.status !== 'Cancelado' && order.status !== 'Recusado' && order.order_items) { // ADICIONADO: Recusado
        order.order_items.forEach(orderItem => {
          const menuItem = menuItems.find(item => item.id === orderItem.menu_item_id);
          if (menuItem) {
            const category = menuItem.category;
            let itemTotal = orderItem.base_price * orderItem.quantity;

            // Adicionar modificadores de tamanho
            if (orderItem.selected_size_price_modifier) {
              itemTotal += orderItem.selected_size_price_modifier * orderItem.quantity;
            }
            // Adicionar preços de coberturas
            if (orderItem.selected_toppings) {
              orderItem.selected_toppings.forEach(topping => {
                itemTotal += topping.price * orderItem.quantity;
              });
            }

            salesByCategoryMap[category] = (salesByCategoryMap[category] || 0) + itemTotal;
          }
        });
      }
    });

    const filteredData = Object.keys(salesByCategoryMap)
      .map(category => ({
        name: category,
        value: salesByCategoryMap[category],
      }))
      .sort((a, b) => b.value - a.value); // Ordenar do maior para o menor

    return filteredData;
  }, [orders, menuItems, categories, isLoadingOrders, isLoadingMenuItems, isLoadingCategories]);

  // Dados reais para Produtos Mais Vendidos
  const realTopProducts = React.useMemo(() => {
    if (isLoadingOrders || isLoadingMenuItems) return [];

    const productSalesMap: { [key: string]: { sales: number; revenue: number; menuItem: typeof menuItems[0] } } = {};

    orders.forEach(order => {
      if (order.status !== 'Cancelado' && order.status !== 'Recusado' && order.order_items) { // ADICIONADO: Recusado
        order.order_items.forEach(orderItem => {
          const menuItem = menuItems.find(item => item.id === orderItem.menu_item_id);
          if (menuItem) {
            const productId = menuItem.id;
            if (!productSalesMap[productId]) {
              productSalesMap[productId] = { sales: 0, revenue: 0, menuItem: menuItem };
            }

            let itemTotalRevenue = orderItem.base_price * orderItem.quantity;
            if (orderItem.selected_size_price_modifier) {
              itemTotalRevenue += orderItem.selected_size_price_modifier * orderItem.quantity;
            }
            if (orderItem.selected_toppings) {
              orderItem.selected_toppings.forEach(topping => {
                itemTotalRevenue += topping.price * orderItem.quantity;
              });
            }

            productSalesMap[productId].sales += orderItem.quantity;
            productSalesMap[productId].revenue += itemTotalRevenue;
          }
        });
      }
    });

    return Object.values(productSalesMap)
      .map(data => ({
        id: data.menuItem.id,
        name: data.menuItem.name,
        category: data.menuItem.category,
        sales: data.sales,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.sales - a.sales) // Sort by sales quantity descending
      .slice(0, 5); // Get top 5 products
  }, [orders, menuItems, isLoadingOrders, isLoadingMenuItems]);

  // NOVO: Dados reais para Resumo do Status dos Pedidos
  const realOrderStatusSummary = React.useMemo(() => {
    if (isLoadingOrders) return [];

    const statusCounts: { [key: string]: number } = {
      "Pendente": 0, // Adicionado Pendente
      "Confirmado": 0,
      "Em Preparo": 0,
      "Em Entrega": 0,
      "Entregue": 0,
      "Cancelado": 0,
      "Problema": 0, // Adicionado Problema
      "Recusado": 0, // ADICIONADO: Recusado
    };

    orders.forEach(order => {
      if (statusCounts.hasOwnProperty(order.status)) {
        statusCounts[order.status]++;
      }
    });

    const getStatusBadgeVariant = (status: string) => {
      switch (status) {
        case "Pendente": return "info";
        case "Confirmado": return "default";
        case "Em Preparo": return "secondary";
        case "Em Entrega": return "outline";
        case "Entregue": return "success";
        case "Cancelado": return "destructive";
        case "Problema": return "destructive";
        case "Recusado": return "destructive"; // ADICIONADO: Recusado
        default: return "default";
      }
    };

    return Object.keys(statusCounts).map(status => ({
      status: status,
      count: statusCounts[status],
      variant: getStatusBadgeVariant(status),
    }));
  }, [orders, isLoadingOrders]);


  if (isLoadingExpenses || isLoadingOrders || isLoadingMenuItems || isLoadingCategories) {
    return <div className="flex min-h-screen items-center justify-center">Carregando relatórios...</div>;
  }

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateReportPdf({
        selectedReport,
        salesData: realSalesData,
        monthlyRevenueData: realMonthlyRevenueData, // Usar dados reais aqui
        revenueVsExpenseData: realRevenueVsExpenseData, // Usar dados reais aqui
        topProducts: realTopProducts,
        orderStatusSummary: realOrderStatusSummary, // Usar dados reais aqui
        salesByCategoryData: realSalesByCategoryData,
        dailyRevenue,
        monthlyRevenue,
        annualRevenue,
        monthlyExpenses,
        annualExpenses,
        netAnnualRevenue,
      });
      toast.success("Relatório PDF gerado com sucesso!");
    } catch (error: any) { // Capturar o erro como 'any' para acessar 'message'
      console.error("Erro ao gerar PDF do relatório:", error);
      toast.error(`Erro ao gerar PDF do relatório: ${error.message || "Erro desconhecido."}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <React.Fragment>
      <div className="space-y-6">
        <ReportHeader onGeneratePdf={handleGeneratePdf} isGeneratingPdf={isGeneratingPdf} />

        <ReportSelectorCard selectedReport={selectedReport} setSelectedReport={setSelectedReport} />

        <MetricCards
          dailyRevenue={dailyRevenue}
          monthlyRevenue={monthlyRevenue}
          annualRevenue={annualRevenue}
          monthlyExpenses={monthlyExpenses}
          annualExpenses={annualExpenses}
          netAnnualRevenue={netAnnualRevenue}
          formatCurrency={formatCurrency}
        />
        
        {selectedReport === "visao-geral-vendas" && (
          <SalesOverviewChart salesData={realSalesData} formatCurrency={formatCurrency} />
        )}

        {selectedReport === "faturamento-mensal" && (
          <MonthlyRevenueChart monthlyRevenueData={realMonthlyRevenueData} formatCurrency={formatCurrency} />
        )}

        {selectedReport === "vendas-vs-custos" && (
          <RevenueVsExpenseChart revenueVsExpenseData={realRevenueVsExpenseData} formatCurrency={formatCurrency} />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Relatório de Produtos</CardTitle>
            <CardDescription>Informações detalhadas e gráficos para o relatório selecionado.</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesByCategoryChart salesByCategoryData={realSalesByCategoryData} COLORS={COLORS} formatCurrency={formatCurrency} />
            <TopSellingProductsTable topProducts={realTopProducts} formatCurrency={formatCurrency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análise de Pedidos</CardTitle>
            <CardDescription>Distribuição atual dos pedidos por status.</CardDescription>
          </CardHeader>
          <CardContent>
            <OrderStatusSummaryTable orderStatusSummary={realOrderStatusSummary} />
          </CardContent>
        </Card>
      </div>
    </React.Fragment>
  );
};

export default ReportsPage;