import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { History, Pizza, User, Truck, CreditCard, MapPin, LogOut, CheckCircle, XCircle, Package, Percent, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSession } from "@/context/SessionContext";
import { useOrders, Order } from "@/context/OrderContext";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import OrderTrackingMap from "@/components/sales/OrderTrackingMap";
import { useRestaurant } from '@/context/RestaurantContext';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatCurrency, createLocalDate } from "@/lib/utils";

const TRACKING_BASE_URL = "https://agoravai14.onrender.com";

const TrackOrderPage = () => {
  const { session, user, profile, isLoading: isLoadingSession, isCustomer, setMockSession } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const { orders, isLoadingOrders } = useOrders();
  const navigate = useNavigate();

  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!isLoadingSession) {
      if (!session || !isCustomer) {
        navigate("/customer-login");
        toast.info("Você precisa estar logado como cliente para acessar esta página.");
      }
    }
  }, [session, isLoadingSession, isCustomer, navigate]);

  if (isLoadingSession || isLoadingOrders || isLoadingRestaurants || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando...</p>
      </div>
    );
  }

  const userFirstName = profile?.first_name || 'Usuário';
  const userLastName = profile?.user_metadata?.last_name || '';
  const userAvatar = profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${userFirstName[0]}${userLastName[0]}`;
  const isLoyaltyMember = true;

  const currentOrder = orders.find(
    order =>
      order.status === "Confirmado" || order.status === "Em Preparo" || order.status === "Em Entrega" || order.status === "Problema" || order.status === "Recusado" || order.status === "Devolvido"
  );

  const getStatusBadgeVariant = (status: Order["status"]) => {
    switch (status) {
      case "Confirmado": return "default";
      case "Em Preparo": return "secondary";
      case "Em Entrega": return "outline";
      case "Entregue": return "success";
      case "Cancelado": return "destructive";
      case "Problema": return "destructive";
      case "Recusado": return "destructive";
      case "Devolvido": return "destructive";
      default: return "default";
    }
  };

  const getProgressValue = (status: Order["status"]) => {
    switch (status) {
      case "Confirmado": return 25;
      case "Em Preparo": return 50;
      case "Em Entrega": return 75;
      case "Entregue": return 100;
      case "Cancelado": return 0;
      case "Problema": return 0;
      case "Recusado": return 0;
      case "Devolvido": return 0;
      default: return 0;
    }
  };

  // ✅ NOVO: Abre rastreamento em tempo real SEM pedir endereço
  const handleOpenRealtimeTracking = () => {
    if (!currentOrder) {
      toast.error("Nenhum pedido ativo para rastrear.");
      return;
    }

    if (!currentOrder.client_lat || !currentOrder.client_lng) {
      toast.error(
        "Este pedido ainda não possui localização cadastrada. Entre em contato com o estabelecimento."
      );
      return;
    }

    // Salva coordenadas no sessionStorage para o rastrearpedido.html usar
    sessionStorage.setItem(
      "coordenadasDestino",
      JSON.stringify({
        lat: currentOrder.client_lat,
        lon: currentOrder.client_lng,
      })
    );

    // Abre a página de rastreio em tempo real no Render
    window.open(
      `${TRACKING_BASE_URL}/rastrearpedido.html?orderId=${currentOrder.id}`,
      "_blank"
    );
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao fazer logout: " + error.message);
    } else {
      toast.info("Você foi desconectado.");
      setMockSession(null, null);
      navigate("/");
    }
  };

  // Derivar baseRoute para links de navegação
  const storeIdentifier = currentRestaurant?.slug || currentRestaurant?.id;
  const baseRoute = storeIdentifier ? `/loja/${storeIdentifier}` : '';

  const recentOrders = orders
    .filter(order => order.status !== "Devolvido")
    .sort((a, b) => createLocalDate(b.created_at || b.order_date)!.getTime() - createLocalDate(a.created_at || a.order_date)!.getTime())
    .slice(0, 2);

  const handleReorder = (orderId: string) => {
    toast.success(`Pedido ${orderId} adicionado ao carrinho para reordenar! (Funcionalidade completa a ser implementada)`);
  };

  return (
    <div className="container py-8 grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8">
      {/* Sidebar Navigation */}
      <aside className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/profile">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userAvatar} alt={userFirstName} />
              <AvatarFallback>{userFirstName[0]}{userLastName[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <h2 className="text-xl font-bold">{userFirstName} {userLastName}</h2>
            {isLoyaltyMember && <Badge variant="secondary">Membro Fidelidade</Badge>}
          </div>
        </div>
        <nav className="grid gap-2 text-sm font-medium">
          <Link to="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary hover:bg-muted">
            <User className="h-4 w-4" />
            Meu Perfil
          </Link>
          <Link to="/profile/order-history" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary hover:bg-muted">
            <History className="h-4 w-4" />
            Histórico de Pedidos
          </Link>
          <Link to="/profile/track-order" className="flex items-center gap-3 rounded-lg px-3 py-2 text-primary bg-muted">
            <Truck className="h-4 w-4" />
            Rastrear Pedido
          </Link>
          <Link to="/profile/payment-methods" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary hover:bg-muted">
            <CreditCard className="h-4 w-4" />
            Métodos de Pagamento
          </Link>
          <Link to="/profile/addresses" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary hover:bg-muted">
            <MapPin className="h-4 w-4" />
            Endereços
          </Link>
          <Button variant="ghost" className="flex items-center justify-start gap-3 rounded-lg px-3 py-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pedido Atual</CardTitle>
            {currentOrder && (
              <button
                type="button"
                onClick={handleOpenRealtimeTracking}
                className="flex items-center text-sm font-medium text-primary hover:underline cursor-pointer"
              >
                Rastrear <Truck className="ml-1 h-4 w-4" />
              </button>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {currentOrder ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="font-medium">Pedido {currentOrder.id}</p>
                  <Badge variant={getStatusBadgeVariant(currentOrder.status)}>{currentOrder.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Entrega estimada: {currentOrder.estimateddeliverytime || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Itens: {currentOrder.items}</p>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <p className="font-medium">Progresso do Pedido:</p>
                  <Progress value={getProgressValue(currentOrder.status)} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Confirmado</span>
                    <span>Em Preparo</span>
                    <span>Em Entrega</span>
                    <span>Entregue</span>
                  </div>
                </div>

                {currentOrder.tracking_link && (
                  <div className="mt-4">
                    <Button variant="outline" className="w-full" onClick={() => setShowMap(!showMap)}>
                      {showMap ? "Esconder Mapa" : "Ver no Mapa"}
                    </Button>
                    {showMap && (
                      <div className="mt-4">
                        <OrderTrackingMap trackinglink={currentOrder.tracking_link} />
                      </div>
                    )}
                  </div>
                )}

                {/* ✅ NOVO: BOTÃO DE RASTREIO EM TEMPO REAL */}
                <div className="mt-4">
                  <Button
                    className="w-full"
                    disabled={currentOrder.status !== "Em Entrega"}
                    onClick={handleOpenRealtimeTracking}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Rastrear entrega em tempo real
                  </Button>
                  {currentOrder.status !== "Em Entrega" && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Rastreamento disponível quando o pedido estiver "Em Entrega"
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Nenhum pedido em andamento.</p>
                <Button variant="link" className="p-0 h-auto text-sm mt-2" asChild>
                  <Link to={`${baseRoute}/menu`}>Fazer um Pedido</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders Section */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{order.items}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(order.order_date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{formatCurrency(order.total)}</span>
                    <Button variant="link" size="sm" className="block h-auto p-0 text-xs" onClick={() => handleReorder(order.id)}>
                      Pedir Novamente
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center">Nenhum pedido recente.</p>
            )}
            <Button variant="link" className="w-full" asChild>
              <Link to="/profile/order-history">Ver Todos os Pedidos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrackOrderPage;