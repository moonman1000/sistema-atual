import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  DollarSign,
  Package,
  TrendingUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useOrders } from "@/context/OrderContext";
import { useDeliveries } from "@/context/DeliveryContext";
import { useMenu } from "@/context/MenuContext";
import { useRestaurant } from "@/context/RestaurantContext";
import { useSession } from "@/context/SessionContext";
import { formatCurrency } from "@/lib/utils";

const DashboardPage = () => {
  // ✅ TODOS os hooks devem vir ANTES de qualquer return condicional
  const { orders = [], isLoadingOrders = false } = useOrders() || {};
  const { deliveries = [] } = useDeliveries() || {};
  const { menuItems = [], isLoadingMenuItems = false } = useMenu() || {};
  const { currentRestaurant, isLoadingRestaurants = false } = useRestaurant() || {};
  const { isLoading: isLoadingSession = false } = useSession() || {};

  // 🔊 Controle de som (MOVIDO PARA O TOPO)
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Carrega da memória se o som já foi habilitado antes
  useEffect(() => {
    const wasEnabled = localStorage.getItem("soundEnabled") === "true";
    setSoundEnabled(wasEnabled);
  }, []);

  // Dados para o gráfico
  const dailyOrdersData = useMemo(() => {
    const today = new Date();
    const last7Days: { [key: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split("T")[0];
      last7Days[dateString] = 0;
    }

    orders.forEach((order) => {
      if (last7Days.hasOwnProperty(order.order_date)) {
        last7Days[order.order_date]++;
      }
    });

    return Object.keys(last7Days).map((date) => ({
      date: date.substring(5),
      pedidos: last7Days[date],
    }));
  }, [orders]);

  // ✅ AGORA o return condicional vem DEPOIS de todos os hooks
  if (
    isLoadingOrders ||
    isLoadingMenuItems ||
    isLoadingRestaurants ||
    isLoadingSession
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Carregando dados do dashboard...
      </div>
    );
  }

  // 🧮 Funções auxiliares
  const getTodayDateString = () => new Date().toISOString().split("T")[0];

  const enableSound = () => {
    const audio = new Audio("/sounds/sale-success.mp3");
    audio.volume = 0.2;
    audio
      .play()
      .then(() => {
        setSoundEnabled(true);
        localStorage.setItem("soundEnabled", "true");
        console.log("🔊 Som habilitado com sucesso!");
      })
      .catch((err) => {
        console.warn("⚠️ Não foi possível tocar o som:", err);
        setSoundEnabled(true);
        localStorage.setItem("soundEnabled", "true");
      });
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrdersCount = orders.length;
  const averageTicket =
    totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  const todayStr = getTodayDateString();
  const dailyRevenue = orders.reduce((sum, order) => {
    if (order.status !== "Cancelado" && order.order_date === todayStr) {
      return sum + order.total;
    }
    return sum;
  }, 0);

  const recentOrders = orders
    .sort(
      (a, b) =>
        new Date(b.created_at || b.order_date).getTime() -
        new Date(a.created_at || a.order_date).getTime()
    )
    .slice(0, 5);

  const activeDeliveries = deliveries.filter(
    (delivery) =>
      delivery.status === "Em Rota" || delivery.status === "Atribuído"
  );

  const getDeliveryStatusBadgeVariant = (
    status: string
  ): "default" | "secondary" | "success" | "destructive" | "outline" => {
    switch (status) {
      case "Atribuído":
        return "default";
      case "Em Rota":
        return "secondary";
      case "Entregue":
        return "success";
      case "Problema":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getOrderStatusBadgeVariant = (
    status: string
  ): "default" | "secondary" | "success" | "destructive" | "outline" => {
    switch (status) {
      case "Confirmado":
        return "default";
      case "Em Preparo":
        return "secondary";
      case "Em Entrega":
        return "outline";
      case "Entregue":
        return "success";
      case "Cancelado":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      {/* Botão para ativar áudio */}
      <div className="flex items-center justify-end">
        <button
          onClick={enableSound}
          className={`flex items-center gap-2 px-4 py-2 mb-2 rounded-md transition-colors ${
            soundEnabled
              ? "bg-green-500 text-white"
              : "bg-amber-500 text-white hover:bg-amber-600 animate-pulse"
          }`}
        >
          {soundEnabled ? (
            <>
              <Volume2 size={18} /> Som Ativo
            </>
          ) : (
            <>
              <VolumeX size={18} /> Ativar Som
            </>
          )}
        </button>
      </div>

      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">
        Visão geral das operações da pizzaria
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Faturamento do Dia */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento do Dia
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
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

        {/* Faturamento Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              +8% vs período anterior
            </p>
          </CardContent>
        </Card>

        {/* Pedidos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrdersCount}</div>
            <p className="text-xs text-muted-foreground">+5% vs ontem</p>
          </CardContent>
        </Card>

        {/* Ticket Médio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageTicket)}
            </div>
            <p className="text-xs text-muted-foreground">
              +3% vs período anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gerenciamento de Entregas */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Entregas</CardTitle>
          <CardDescription>
            Acompanhe e gerencie o status dos pedidos em rota.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="link" className="p-0" asChild>
            <Link to="/admin/entregas">Ir para Entregas</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Pedidos Diários */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Diários</CardTitle>
          <CardDescription>
            Volume de pedidos nos últimos dias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyOrdersData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pedidos" fill="#8884d8" name="Pedidos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Entregas e Últimos Pedidos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tabela de Entregas Ativas */}
        <Card>
          <CardHeader>
            <CardTitle>Entregas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entregador</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-medium">
                      {delivery.orderid}
                    </TableCell>
                    <TableCell>
                      {delivery.clientname}
                      <br />
                      <span className="text-muted-foreground text-xs">
                        {delivery.client_address}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getDeliveryStatusBadgeVariant(delivery.status)}
                      >
                        {delivery.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{delivery.deliveryman}</TableCell>
                    <TableCell>
                      <Button variant="link" size="sm" asChild>
                        <Link to="/admin/entregas">Ver Detalhes</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Últimos Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle>Últimos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.client_name}</TableCell>
                    <TableCell>{order.items}</TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <Badge variant={getOrderStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Navegação rápida */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <CardTitle className="text-lg font-semibold mb-2">
            Criar Novo Pedido
          </CardTitle>
          <CardDescription>
            Adicionar pedido para balcão ou telefone.
          </CardDescription>
          <Button className="mt-4" asChild>
            <Link to="/admin/pedidos">Novo Pedido</Link>
          </Button>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <CardTitle className="text-lg font-semibold mb-2">
            Gerenciar Cardápio
          </CardTitle>
          <CardDescription>
            Atribuir rotas e acompanhar status.
          </CardDescription>
          <Button className="mt-4" asChild>
            <Link to="/admin/cardapio">Ir para Cardápio</Link>
          </Button>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <CardTitle className="text-lg font-semibold mb-2">
            Relatórios
          </CardTitle>
          <CardDescription>
            Visualizar performance e métricas.
          </CardDescription>
          <Button className="mt-4" asChild>
            <Link to="/admin/relatorios">Ver Relatórios</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;