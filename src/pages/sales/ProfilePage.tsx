import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, History, Truck, CreditCard, MapPin, LogOut, Pizza, Loader2, Percent } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/context/SessionContext";
import { useOrders, Order } from "@/context/OrderContext";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from '@/context/RestaurantContext';
import { formatDate, formatCurrency, getRestaurantTypePath, createLocalDate } from "@/lib/utils"; // Importar createLocalDate
import * as LucideIcons from "lucide-react"; // Importar todos os ícones Lucide

const ProfilePage = () => {
  // --- HOOKS INCONDICIONAIS (DEVE ESTAR NO TOPO) ---
  // CORRIGIDO: Desestruturar id e restaurantId em uma única chamada a useParams
  const { session, user, profile, isLoading: isLoadingSession, isCustomer, setMockSession } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const { orders, isLoadingOrders } = useOrders();
  const navigate = useNavigate();

  // --- Logs de Depuração ---
  console.log("ProfilePage Render - session:", session ? "present" : "null");
  console.log("ProfilePage Render - user:", user ? user.id : "null");
  console.log("ProfilePage Render - profile:", profile ? profile.role : "null", "profile.restaurant_id:", profile?.restaurant_id);
  console.log("ProfilePage Render - isLoadingSession:", isLoadingSession);
  console.log("ProfilePage Render - isLoadingOrders:", isLoadingOrders);
  console.log("ProfilePage Render - isLoadingRestaurants:", isLoadingRestaurants);
  console.log("ProfilePage Render - isCustomer:", isCustomer);
  // --- Fim dos Logs de Depuração ---

  const [firstName, setFirstName] = React.useState(profile?.first_name || "");
  const [lastName, setLastName] = React.useState(profile?.last_name || "");
  const [email, setEmail] = React.useState(user?.email || "");
  const [phone, setPhone] = React.useState(profile?.phone || "");

  React.useEffect(() => {
    // --- Logs de Depuração no useEffect ---
    console.log("ProfilePage useEffect - session:", session ? "present" : "null");
    console.log("ProfilePage useEffect - isLoadingSession:", isLoadingSession);
    console.log("ProfilePage useEffect - isCustomer:", isCustomer);
    console.log("ProfilePage useEffect - profile:", profile ? profile.role : "null", "profile.restaurant_id:", profile?.restaurant_id);
    // --- Fim dos Logs de Depuração no useEffect ---

    if (!isLoadingSession) {
      if (!session || !isCustomer) {
        console.log("ProfilePage useEffect: Not logged in or not a customer, navigating to /customer-login");
        navigate("/customer-login");
        toast.info("Você precisa estar logado como cliente para acessar esta página.");
      } else if (session && profile) {
        console.log("ProfilePage useEffect: Session and profile exist, setting form fields.");
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setEmail(user?.email || "");
        setPhone(profile.phone || "");
      } else if (session && !profile) {
        console.log("ProfilePage useEffect: Session exists but profile is null. This might be a transient state or an issue with profile fetching.");
      }
    }
  }, [session, user, profile, isLoadingSession, isCustomer, navigate]);

  if (isLoadingSession || isLoadingOrders || isLoadingRestaurants || !profile) {
    console.log("ProfilePage: Showing internal loading state. Conditions: isLoadingSession=", isLoadingSession, "isLoadingOrders=", isLoadingOrders, "isLoadingRestaurants=", isLoadingRestaurants, "profile=", profile);
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Card className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <CardTitle className="text-xl font-bold">Carregando dados do seu perfil...</CardTitle>
        </Card>
      </div>
    );
  }

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      toast.error("Você precisa estar logado para salvar as alterações.");
      return;
    }

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .eq('restaurant_id', profile.restaurant_id);

      if (profileError) {
        throw profileError;
      }

      if (user.user_metadata.first_name !== firstName || user.user_metadata.last_name !== lastName) {
        const { error: userError } = await supabase.auth.updateUser({
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        });
        if (userError) {
          // Log the error but don't necessarily fail the whole operation if profile update succeeded
          console.warn("Erro ao atualizar metadados do usuário:", userError);
        }
      }

      const updatedProfile = { ...profile, first_name: firstName, last_name: lastName, phone: phone };
      const updatedUser = { ...user, user_metadata: { ...user.user_metadata, first_name: firstName, last_name: lastName } };
      const updatedSession = { ...session, user: updatedUser };
      setMockSession(updatedSession, updatedProfile);

      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar alterações do perfil:", error);
      toast.error("Erro ao salvar alterações: " + error.message);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) {
      toast.error("Não foi possível encontrar seu e-mail para redefinir a senha.");
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin + '/reset-password', // Redireciona para a nova página de redefinição de senha
      });
      if (error) {
        throw error;
      }
      toast.success("Um e-mail de redefinição de senha foi enviado para o seu endereço de e-mail.");
    } catch (error: any) {
      console.error("Erro ao solicitar redefinição de senha:", error);
      toast.error("Erro ao solicitar redefinição de senha: " + error.message);
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

  const userFirstName = profile?.first_name || 'Usuário';
  const userLastName = profile?.last_name || '';
  const userInitials = `${userFirstName.charAt(0) || ''}${userLastName.charAt(0) || ''}`; // Safely get first char, fallback to empty string
  const userAvatar = profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${userInitials}`;
  const isLoyaltyMember = true;

  // Derivar baseRoute para links de navegação
  const storeIdentifier = currentRestaurant?.slug || currentRestaurant?.id;
  const baseRoute = storeIdentifier ? `/${getRestaurantTypePath(currentRestaurant.type)}/${storeIdentifier}` : '';

  const userFullName = `${firstName} ${lastName}`; // This variable is used in JSX, keep it.

  const currentOrder = orders.find(order => order.status === "Em Entrega" || order.status === "Em Preparo" || order.status === "Confirmado");
  const recentOrders = orders
    .filter(order => order.status === "Entregue" || order.status === "Cancelado")
    .sort((a, b) => createLocalDate(b.created_at || b.order_date)!.getTime() - createLocalDate(a.created_at || a.order_date)!.getTime()) // Usar createLocalDate
    .slice(0, 2);

  const handleReorder = (orderId: string) => {
    toast.success(`Pedido ${orderId} adicionado ao carrinho para reordenar! (Funcionalidade completa a ser implementada)`);
  };

  const AppIconComponent = (LucideIcons as any)[currentRestaurant?.app_icon || "Pizza"]; // NOVO: Obter o ícone do app

  return (
    <div className="container py-8 grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8">
      {/* Sidebar Navigation */}
      <aside className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/profile">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userAvatar} alt={userFirstName} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <h2 className="text-xl font-bold">{userFirstName} {userLastName}</h2>
            {isLoyaltyMember && <Badge variant="secondary">Membro Fidelidade</Badge>}
          </div>
        </div>
        <nav className="grid gap-2 text-sm font-medium">
          <Link to="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-primary bg-muted">
            <User className="h-4 w-4" />
            Meu Perfil
          </Link>
          {/* REMOVIDO: Cardápio e Promoções da barra lateral */}
          <Link to="/profile/order-history" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary hover:bg-muted">
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

      {/* Main Content */}
      <div className="space-y-8">
        {/* My Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Meu Perfil</CardTitle>
            <CardDescription>Atualize suas informações pessoais.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="email">Endereço de E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="phone">Número de Telefone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-4">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handleSaveChanges}>Salvar Alterações</Button>
              <Button variant="outline" onClick={handleResetPassword}>Redefinir Senha</Button> {/* NOVO: Botão de redefinir senha */}
            </div>
          </CardContent>
        </Card>

        {/* Current Order Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pedido Atual</CardTitle>
            {currentOrder && (
              <Link to="/profile/track-order" className="flex items-center text-sm font-medium text-primary hover:underline">
                Rastrear <Truck className="ml-1 h-4 w-4" />
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {currentOrder ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="font-medium">Pedido {currentOrder.id}</p>
                  <Badge variant="secondary">{currentOrder.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Entrega estimada: {currentOrder.estimateddeliverytime || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Itens: {currentOrder.items}</p>
              </>
            ) : (
              <p className="text-muted-foreground">Nenhum pedido em andamento.</p>
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
                <div key={order.id}>
                  <div className="flex items-center gap-3">
                    <AppIconComponent className="h-4 w-4" /> {/* NOVO: Usar AppIconComponent */}
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
                  <Separator className="mt-4" />
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

export default ProfilePage;