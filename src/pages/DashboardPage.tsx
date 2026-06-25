import React, { useMemo, useState, useEffect } from "react";
import { CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react"; // Importar AlertCircle
import { useOrders, Order } from "@/context/OrderContext";
import { useDeliveries, Delivery } from "@/context/DeliveryContext"; // Importar Delivery
import { useMenu } from "@/context/MenuContext";
import { useRestaurant } from "@/context/RestaurantContext";
import { useSession } from "@/context/SessionContext";
import { formatCurrency, getBusinessDateString, createLocalDate } from "@/lib/utils"; // Importar createLocalDate

// Import modular components
import SoundToggleButton from "@/components/admin/dashboard/SoundToggleButton";
import MetricCards from "@/components/admin/dashboard/MetricCards";
import ActiveOrderCard from "@/components/admin/dashboard/ActiveOrderCard";
import DailyOrdersChart from "@/components/admin/dashboard/DailyOrdersChart";
import ActiveDeliveriesTable from "@/components/admin/dashboard/ActiveDeliveriesTable";
import RecentOrdersTable from "@/components/admin/dashboard/RecentOrdersTable";
import QuickNavigationCards from "@/components/admin/dashboard/QuickNavigationCards";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RecentOrdersSummaryCards from "@/components/admin/dashboard/RecentOrdersSummaryCards";
import RecentDeliveriesSummaryCards from "@/components/admin/dashboard/RecentDeliveriesSummaryCards";
import ViewOrderDetailsDialog from "@/components/admin/ViewOrderDetailsDialog"; // Import dialog
import ViewDeliveryDetailsDialog from "@/components/admin/ViewDeliveryDetailsDialog"; // NOVO: Importar dialog de entrega
import ProblemReportCard from "@/components/admin/dashboard/ProblemReportCard"; // NOVO: Importar ProblemReportCard

const DashboardPage = () => {
  const { orders = [], isLoadingOrders = false, fetchOrders, markOrderAsViewed, newOrderIds } = useOrders() || {};
  const { deliveries = [], fetchDeliveries, newDeliveryIds, markDeliveryAsViewed, markDeliveryAsResolved, updateDelivery } = useDeliveries() || {}; // NOVO: Adicionado markDeliveryAsResolved, updateDelivery
  const { isLoadingMenuItems = false } = useMenu() || {};
  const { currentRestaurant, isLoadingRestaurants = false } = useRestaurant() || {};
  const { isLoading: isLoadingSession } = useSession() || {};

  const [isViewOrderDetailsDialogOpen, setIsViewOrderDetailsDialogOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isViewDeliveryDetailsDialogOpen, setIsViewDeliveryDetailsDialogOpen] = useState(false); // NOVO: Estado para dialog de entrega
  const [viewingDelivery, setViewingDelivery] = useState<Delivery | null>(null); // NOVO: Estado para entrega
  const [activeProblemReports, setActiveProblemReports] = useState<Delivery[]>([]); // NOVO: Estado para relatórios de problema

  const isLoading =
    isLoadingOrders ||
    isLoadingMenuItems ||
    isLoadingRestaurants ||
    isLoadingSession;

  // --- Data Calculations ---

  const getCurrentMonthYearString = () => new Date().toISOString().substring(0, 7);

  const { totalRevenue, totalOrdersCount, averageTicket, dailyRevenue, monthlyRevenue } = useMemo(() => {
    const businessTodayStr = getBusinessDateString(); // Use business date for daily metrics
    const monthYearStr = getCurrentMonthYearString(); // Monthly calculation remains based on calendar month for simplicity unless specified otherwise
    
    let totalRevenue = 0;
    let dailyRevenue = 0;
    let monthlyRevenue = 0;
    let dailyOrdersCount = 0; // NOVO: Contagem de pedidos do dia

    orders.forEach(order => {
      // EXCLUIR pedidos com status 'Cancelado', 'Recusado' e 'Devolvido' do faturamento
      if (order.status !== 'Cancelado' && order.status !== 'Recusado' && order.status !== 'Devolvido') {
        totalRevenue += order.total;
        if (order.order_date.startsWith(monthYearStr)) {
          monthlyRevenue += order.total;
          // Filter daily metrics using the business date
          if (order.order_date === businessTodayStr) {
            dailyRevenue += order.total;
            dailyOrdersCount++; // NOVO: Incrementa a contagem de pedidos do dia
          }
        }
      }
    });

    const totalOrdersCount = dailyOrdersCount; // ATUALIZADO: Agora é a contagem de pedidos do dia
    const averageTicket = totalOrdersCount > 0 ? dailyRevenue / totalOrdersCount : 0; // ATUALIZADO: Ticket médio do dia

    return { totalRevenue, totalOrdersCount, averageTicket, dailyRevenue, monthlyRevenue };
  }, [orders]);

  const dailyOrdersData = useMemo(() => {
    const today = new Date();
    const last7Days: { [key: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      // Note: We use the calendar date here to define the 7 days, 
      // but the data aggregation relies on order.order_date (which is the business date from DB).
      const dateString = d.toISOString().split("T")[0];
      last7Days[dateString] = 0;
    }

    orders.forEach((order) => {
      // Adicionar uma verificação para garantir que order.order_date não é nulo/indefinido
      if (order.order_date && last7Days.hasOwnProperty(order.order_date)) {
        last7Days[order.order_date]++;
      }
    });

    return Object.values(last7Days).map((pedidos, index) => ({ // Corrigido para usar Object.values e mapear corretamente
      date: Object.keys(last7Days)[index].substring(5),
      pedidos: pedidos,
    }));
  }, [orders]);

  const activeOrder = useMemo(() => {
    return orders
      .filter(order => order.status !== "Entregue" && order.status !== "Cancelado" && order.status !== "Recusado" && order.status !== "Devolvido") // ADICIONADO: Recusado, Devolvido
      .sort(
        (a, b) =>
          createLocalDate(b.created_at || b.order_date).getTime() - 
          createLocalDate(a.created_at || a.order_date).getTime() 
      )[0] || null;
  }, [orders]);

  const recentSummaryOrders = useMemo(() => {
    const activeOrderId = activeOrder?.id;
    return orders
      .filter(order => order.id !== activeOrderId) // Exclude the currently active order
      .sort(
        (a, b) =>
          createLocalDate(b.created_at || b.order_date).getTime() - 
          createLocalDate(a.created_at || a.order_date).getTime() 
      )
      .slice(0, 3); // Take the top 3
  }, [orders, activeOrder]);

  // NEW: Calculate the top 3 most recent deliveries, sorted by updated_at
  const recentDeliveries = useMemo(() => {
    return deliveries
      .sort(
        (a, b) =>
          createLocalDate(b.updated_at || b.created_at || "").getTime() - 
          createLocalDate(a.updated_at || a.created_at || "").getTime() 
      )
      .slice(0, 3);
  }, [deliveries]);

  const recentOrders = useMemo(() => {
    return orders
      .sort(
        (a, b) =>
          createLocalDate(b.created_at || b.order_date).getTime() - 
          createLocalDate(a.created_at || a.order_date).getTime() 
      )
      .slice(0, 5);
  }, [orders]);

  const activeDeliveries = useMemo(() => {
    return deliveries.filter(
      (delivery) =>
        delivery.status === "Em Entrega" || delivery.status === "Atribuído" || delivery.status === "Problema" || delivery.status === "Devolvido" // ADICIONADO: Problema, Devolvido
    );
  }, [deliveries]);

  // --- Helper Functions (Moved here or kept local) ---

  const getDeliveryStatusBadgeVariant = (
    status: string
  ): "default" | "secondary" | "success" | "destructive" | "outline" => {
    switch (status) {
      case "Atribuído": return "default";
      case "Em Entrega": return "secondary";
      case "Entregue": return "success";
      case "Problema": return "destructive";
      case "Recusado": return "destructive"; // ADICIONADO: Recusado
      case "Devolvido": return "destructive"; // ADICIONADO: Devolvido
      default: return "outline";
    }
  };

  const getOrderStatusBadgeVariant = (
    status: string

  ): "default" | "secondary" | "success" | "destructive" | "outline" | "info" => {
    switch (status) {
      case "Confirmado": return "default";
      case "Em Preparo": return "secondary";
      case "Em Entrega": return "outline";
      case "Entregue": return "success";
      case "Cancelado": return "destructive";
      case "Pendente": return "info";
      case "Problema": return "destructive";
      case "Recusado": return "destructive"; // ADICIONADO: Recusado
      case "Devolvido": return "destructive"; // ADICIONADO: Devolvido
      default: return "default";
    }
  };

  const handleViewOrderDetails = (order: Order) => {
    markOrderAsViewed(order.id); // MARCAR COMO VISUALIZADO
    setViewingOrder(order);
    setIsViewOrderDetailsDialogOpen(true);
  };

  const handleViewDeliveryDetails = (delivery: Delivery) => { // NOVO: Handler para ver detalhes da entrega
    markDeliveryAsViewed(delivery.id); // MARCAR COMO VISUALIZADO
    setViewingDelivery(delivery);
    setIsViewDeliveryDetailsDialogOpen(true);
  };

  // NOVO: Efeito para identificar e adicionar relatórios de problema
  useEffect(() => {
    const problems = deliveries.filter(d => 
      (d.status === "Problema" || d.status === "Recusado" || d.status === "Devolvido") && 
      (d.problem_resolved === false || d.problem_resolved === null || d.problem_resolved === undefined) // ATUALIZADO: Filtra por !d.problem_resolved para incluir null/undefined
    );
    setActiveProblemReports(problems); // ATUALIZADO: Define diretamente a lista filtrada
  }, [deliveries]);

  // NOVO: Função para descartar um relatório de problema
  const handleDismissProblemReport = async (deliveryId: string, newStatus: Delivery["status"]) => {
    const deliveryToUpdate = deliveries.find(d => d.id === deliveryId);
    if (!deliveryToUpdate) {
      toast.error("Entrega não encontrada para marcar como resolvida.");
      return;
    }

    let resolvedStatus = false;
    // O problema é resolvido se o admin marca como "Entregue" ou "Devolvido"
    if (newStatus === "Entregue" || newStatus === "Devolvido") {
      resolvedStatus = true;
    }
    // Se o status for "Problema" ou "Recusado", o problema não está resolvido (resolvedStatus permanece false)

    try {
      await updateDelivery({ ...deliveryToUpdate, status: newStatus, problem_resolved: resolvedStatus });
      // A atualização do estado local `activeProblemReports` será feita pelo useEffect
      toast.success(`Problema de entrega marcado como ${newStatus === "Entregue" ? "resolvido" : newStatus.toLowerCase()}.`);
    } catch (error) {
      console.error("Erro ao marcar problema como resolvido:", error);
      toast.error("Falha ao marcar problema como resolvido.");
    }
  };

  // --- Rendering ---

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando dados do dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <CardDescription>Visão geral das operações do seu estabelecimento</CardDescription>

      {/* NOVO: Seção de Relatórios de Problemas */}
      {activeProblemReports.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-destructive flex items-center gap-2">
            <AlertCircle className="h-6 w-6" /> Relatórios de Problemas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProblemReports.map(report => (
              <ProblemReportCard key={report.id} delivery={report} onDismiss={handleDismissProblemReport} onResolveProblem={handleDismissProblemReport} />
            ))}
          </div>
        </div>
      )}

      {/* 1. Metric Cards (Sempre no topo, responsivo) */}
      <MetricCards
        dailyRevenue={dailyRevenue}
        totalRevenue={totalRevenue}
        totalOrdersCount={totalOrdersCount}
        averageTicket={averageTicket}
        monthlyRevenue={monthlyRevenue}
      />

      {/* 2. Active Order Card (Prioridade 1) */}
      <ActiveOrderCard
        activeOrder={activeOrder}
        getOrderStatusBadgeVariant={getOrderStatusBadgeVariant}
        onViewDetails={handleViewOrderDetails}
      />

      {/* 3. Resumos de Pedidos e Entregas (Otimizado para Mobile) */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pedidos Recentes (Summary Cards) */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Pedidos Recentes</CardTitle>
            <Button variant="link" size="sm" onClick={fetchOrders} className="p-0 h-auto">
              Ver Todos
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <RecentOrdersSummaryCards
              recentOrders={recentSummaryOrders}
              getOrderStatusBadgeVariant={getOrderStatusBadgeVariant}
              onViewDetails={handleViewOrderDetails}
              newOrderIds={newOrderIds}
            />
          </CardContent>
        </Card>

        {/* Entregas Recentes (Summary Cards) */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Entregas Recentes</CardTitle>
            <Button variant="link" size="sm" onClick={fetchDeliveries} className="p-0 h-auto">
              Ver Todas
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <RecentDeliveriesSummaryCards
              recentDeliveries={recentDeliveries}
              getDeliveryStatusBadgeVariant={getDeliveryStatusBadgeVariant}
              newDeliveryIds={newDeliveryIds}
              onViewDetails={handleViewDeliveryDetails}
            />
          </CardContent>
        </Card>
      </div>

      {/* 4. Daily Orders Chart */}
      <DailyOrdersChart dailyOrdersData={dailyOrdersData} />

      {/* 5. Tables (Menor prioridade em mobile, mas essenciais no desktop) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Deliveries Table */}
        <ActiveDeliveriesTable
          activeDeliveries={activeDeliveries}
          orders={orders}
          getDeliveryStatusBadgeVariant={getDeliveryStatusBadgeVariant}
        />

        {/* Recent Orders Table (Full Table) */}
        <RecentOrdersTable
          recentOrders={recentOrders}
          getOrderStatusBadgeVariant={getOrderStatusBadgeVariant}
        />
      </div>

      {/* 6. Quick Navigation Cards */}
      <QuickNavigationCards />

      {/* View Order Details Dialog */}
      <ViewOrderDetailsDialog
        isOpen={isViewOrderDetailsDialogOpen}
        onClose={() => setIsViewOrderDetailsDialogOpen(false)}
        order={viewingOrder}
        markOrderAsViewed={markOrderAsViewed} // Passar a função para marcar como visto
      />

      {/* View Delivery Details Dialog (NOVO) */}
      <ViewDeliveryDetailsDialog
        isOpen={isViewDeliveryDetailsDialogOpen}
        onClose={() => setIsViewDeliveryDetailsDialogOpen(false)}
        delivery={viewingDelivery}
        markDeliveryAsViewed={markDeliveryAsViewed}
      />
    </div>
  );
};

export default DashboardPage;
