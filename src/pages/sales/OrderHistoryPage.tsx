import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { History, User, Truck, CreditCard, MapPin, LogOut, FileText, Pizza, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/context/SessionContext";
import { useOrders, Order } from "@/context/OrderContext";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from '@/context/RestaurantContext';
import { formatDate, formatCurrency, createLocalDate } from "@/lib/utils";
import { generateInvoicePdf } from "@/utils/invoiceGenerator"; // Importar generateInvoicePdf
import * as LucideIcons from "lucide-react"; // NOVO: Importar todos os ícones Lucide

const OrderHistoryPage = () => {
  const { session, user, profile, isLoading: isLoadingSession, isCustomer, setMockSession } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const { orders, isLoadingOrders } = useOrders();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoadingSession) {
      if (!session || !isCustomer) {
        navigate("/customer-login");
        toast.info("Você precisa estar logado como cliente para acessar esta página.");
      }
    }
  }, [session, isLoadingSession, isCustomer, navigate]);

  if (isLoadingSession || isLoadingOrders || isLoadingRestaurants || !profile) {
    return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  }

  const userFirstName = profile?.first_name || 'Usuário';
  const userLastName = profile?.last_name || '';
  const userAvatar = profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${userFirstName[0]}${userLastName[0]}`;
  const isLoyaltyMember = true;

  const userOrders = orders.sort((a, b) => createLocalDate(b.created_at || b.order_date)!.getTime() - createLocalDate(a.created_at || a.order_date)!.getTime()); // Usar createLocalDate

  const getStatusBadgeVariant = (status: Order["status"]) => {
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
      case "Problema":
      case "Recusado":
      case "Devolvido": // NOVO: Adicionado Devolvido
        return "destructive";
      default:
        return "default";
    }
  };

  const handleReorder = (orderId: string) => {
    toast.success(`Pedido ${orderId} adicionado ao carrinho para reordenar! (Funcionalidade completa a ser implementada)`);
  };

  const handleGenerateInvoice = (order: Order) => {
    if (!currentRestaurant) {
      toast.error("Não foi possível gerar a nota fiscal: dados do restaurante ausentes.");
      return;
    }
    try {
      generateInvoicePdf('order', { order, restaurant: currentRestaurant });
      toast.success(`Nota fiscal para o pedido ${order.id?.substring(0, 8)} gerada com sucesso!`);
    } catch (error: any) {
      console.error("Erro ao gerar nota fiscal:", error);
      toast.error(`Erro ao gerar nota fiscal: ${error.message || "Erro desconhecido."}`);
    }
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

  return (
    <div className="container py-8 grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8">
      {/* Sidebar Navigation (similar to ProfilePage) */}
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
        </div
        ><nav className="grid gap-2 text-sm font-medium">
          <Link to="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary hover:bg-muted">
            <User className="h-4 w-4" />
            Meu Perfil
          </Link>
          {/* REMOVIDO: Cardápio e Promoções da barra lateral */}
          <Link to="/profile/order-history" className="flex items-center gap-3 rounded-lg px-3 py-2 text-primary bg-muted">
            <History className="h-4 w-4" />
            Histórico de Pedidos
          </Link>
          <Link to="/profile/track-order" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary hover:bg-muted">
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

      {/* Main Content - Order History */}
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pedidos</CardTitle>
            <CardDescription>Visualize todos os seus pedidos anteriores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userOrders.length > 0 ? (
              userOrders.map(order => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">Pedido {order.id}</h3>
                    <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Data: {formatDate(order.order_date)}</p>
                  <p className="text-sm text-muted-foreground mb-2">Itens: {order.items}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold">{formatCurrency(order.total)}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleReorder(order.id)}>
                        Pedir Novamente
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleGenerateInvoice(order)}>
                        <FileText className="h-4 w-4 mr-2" /> Nota Fiscal
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center">Você ainda não fez nenhum pedido.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderHistoryPage;