import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { History, User, Truck, CreditCard, MapPin, LogOut, PlusCircle, Trash2, Pizza, Percent } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/context/SessionContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { usePaymentMethods, PaymentMethod } from "@/context/PaymentMethodContext";
import { useRestaurant } from '@/context/RestaurantContext'; // Importar useRestaurant

const PaymentMethodsPage = () => {
  const { session, user, profile, isLoading: isLoadingSession, isCustomer, setMockSession } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant(); // Obter currentRestaurant
  const { paymentMethods, isLoadingPaymentMethods, addPaymentMethod, deletePaymentMethod, setDefaultPaymentMethod } = usePaymentMethods();
  const navigate = useNavigate();

  const [newCardNumber, setNewCardNumber] = React.useState("");
  const [newExpiry, setNewExpiry] = React.useState("");
  const [newCvv, setNewCvv] = React.useState("");
  const [newCardHolder, setNewCardHolder] = React.useState("");

  useEffect(() => {
    if (!isLoadingSession) {
      if (!session || !isCustomer) {
        navigate("/customer-login");
        toast.info("Você precisa estar logado como cliente para acessar esta página.");
      }
    }
  }, [session, isLoadingSession, isCustomer, navigate]);

  if (isLoadingSession || isLoadingPaymentMethods || isLoadingRestaurants || !profile) {
    return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  }

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

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardNumber || !newExpiry || !newCvv || !newCardHolder) {
      toast.error("Por favor, preencha todos os campos do novo cartão.");
      return;
    }

    const lastFour = newCardNumber.slice(-4);
    const brand = "Desconhecido";
    const type = "Credit Card";

    try {
      await addPaymentMethod({
        type,
        brand,
        last_four: lastFour,
        expiry: newExpiry,
        is_default: paymentMethods.length === 0,
      });
      setNewCardNumber("");
      setNewExpiry("");
      setNewCvv("");
      setNewCardHolder("");
    } catch (error) {
      // Erro já tratado no contexto com toast
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      await deletePaymentMethod(id);
    } catch (error) {
      // Erro já tratado no contexto com toast
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultPaymentMethod(id);
    } catch (error) {
      // Erro já tratado no contexto com toast
    }
  };

  const userFirstName = profile?.first_name || 'Usuário';
  const userLastName = profile?.last_name || '';
  const userAvatar = profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${userFirstName[0]}${userLastName[0]}`;
  const isLoyaltyMember = true;

  // Derivar baseRoute para links de navegação
  const storeIdentifier = currentRestaurant?.slug || currentRestaurant?.id;
  const baseRoute = storeIdentifier ? `/loja/${storeIdentifier}` : '';

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
          {/* REMOVIDO: Cardápio e Promoções da barra lateral */}
          <Link to="/profile/order-history" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary hover:bg-muted">
            <History className="h-4 w-4" />
            Histórico de Pedidos
          </Link>
          <Link to="/profile/track-order" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary hover:bg-muted">
            <Truck className="h-4 w-4" />
            Rastrear Pedido
          </Link>
          <Link to="/profile/payment-methods" className="flex items-center gap-3 rounded-lg px-3 py-2 text-primary bg-muted">
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

      {/* Main Content - Payment Methods */}
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Meus Métodos de Pagamento</CardTitle>
            <CardDescription>Gerencie seus cartões de crédito e débito salvos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethods.length > 0 ? (
              paymentMethods.map(method => (
                <div key={method.id} className="flex items-center justify-between border rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{method.brand} **** {method.last_four}</p>
                      <p className="text-sm text-muted-foreground">Expira em {method.expiry}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {method.is_default ? (
                      <Badge variant="default">Padrão</Badge>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleSetDefault(method.id)}>
                        Definir como Padrão
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeletePaymentMethod(method.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center">Nenhum método de pagamento salvo.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Método de Pagamento</CardTitle>
            <CardDescription>Adicione um novo cartão de crédito ou débito.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPaymentMethod} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="newCardHolder">Nome no Cartão</Label>
                <Input id="newCardHolder" placeholder="Nome Completo" value={newCardHolder} onChange={(e) => setNewCardHolder(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newCardNumber">Número do Cartão</Label>
                <Input id="newCardNumber" placeholder="XXXX XXXX XXXX XXXX" value={newCardNumber} onChange={(e) => setNewCardNumber(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="newExpiry">MM/AA</Label>
                  <Input id="newExpiry" placeholder="12/25" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="newCvv">CVV</Label>
                  <Input id="newCvv" placeholder="123" value={newCvv} onChange={(e) => setNewCvv(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Cartão
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentMethodsPage;