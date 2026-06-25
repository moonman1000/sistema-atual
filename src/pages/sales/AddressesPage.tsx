import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { History, User, Truck, CreditCard, MapPin, LogOut, PlusCircle, Trash2, Home, Pizza, Percent } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/context/SessionContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { useAddresses, Address } from "@/context/AddressContext";
import { useRestaurant } from '@/context/RestaurantContext'; // Importar useRestaurant

const AddressesPage = () => {
  const { session, user, profile, isLoading: isLoadingSession, isCustomer, setMockSession } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant(); // Obter currentRestaurant
  const { addresses, isLoadingAddresses, addAddress, deleteAddress, setDefaultAddress } = useAddresses();
  const navigate = useNavigate();

  const [newStreet, setNewStreet] = React.useState("");
  const [newNumber, setNewNumber] = React.useState("");
  const [newComplement, setNewComplement] = React.useState("");
  const [newNeighborhood, setNewNeighborhood] = React.useState("");
  const [newCity, setNewCity] = React.useState("");
  const [newState, setNewState] = React.useState("");
  const [newZipCode, setNewZipCode] = React.useState("");

  useEffect(() => {
    if (!isLoadingSession) {
      if (!session || !isCustomer) {
        navigate("/customer-login");
        toast.info("Você precisa estar logado como cliente para acessar esta página.");
      }
    }
  }, [session, isLoadingSession, isCustomer, navigate]);

  if (isLoadingSession || isLoadingAddresses || isLoadingRestaurants || !profile) {
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

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet || !newNumber || !newNeighborhood || !newCity || !newState || !newZipCode) {
      toast.error("Por favor, preencha todos os campos obrigatórios do novo endereço.");
      return;
    }

    try {
      await addAddress({
        street: newStreet,
        number: newNumber,
        complement: newComplement || undefined,
        neighborhood: newNeighborhood,
        city: newCity,
        state: newState,
        zip_code: newZipCode,
        is_default: addresses.length === 0,
      });
      setNewStreet("");
      setNewNumber("");
      setNewComplement("");
      setNewNeighborhood("");
      setNewCity("");
      setNewState("");
      setNewZipCode("");
    } catch (error) {
      // Erro já tratado no contexto com toast
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddress(id);
    } catch (error) {
      // Erro já tratado no contexto com toast
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
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
          <Link to="/profile/payment-methods" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary hover:bg-muted">
            <CreditCard className="h-4 w-4" />
            Métodos de Pagamento
          </Link>
          <Link to="/profile/addresses" className="flex items-center gap-3 rounded-lg px-3 py-2 text-primary bg-muted">
            <MapPin className="h-4 w-4" />
            Endereços
          </Link>
          <Button variant="ghost" className="flex items-center justify-start gap-3 rounded-lg px-3 py-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </nav>
      </aside>

      {/* Main Content - Addresses */}
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Meus Endereços</CardTitle>
            <CardDescription>Gerencie seus endereços de entrega salvos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {addresses.length > 0 ? (
              addresses.map(address => (
                <div key={address.id} className="flex items-center justify-between border rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <Home className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{address.street}, {address.number} {address.complement && `- ${address.complement}`}</p>
                      <p className="text-sm text-muted-foreground">{address.neighborhood}, {address.city} - {address.state}, {address.zip_code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {address.is_default ? (
                      <Badge variant="default">Padrão</Badge>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleSetDefault(address.id)}>
                        Definir como Padrão
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteAddress(address.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center">Nenhum endereço salvo.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Endereço</CardTitle>
            <CardDescription>Adicione um novo endereço para suas entregas.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAddress} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="newStreet">Rua</Label>
                <Input id="newStreet" placeholder="Ex: Rua das Palmeiras" value={newStreet} onChange={(e) => setNewStreet(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="newNumber">Número</Label>
                  <Input id="newNumber" placeholder="Ex: 123" value={newNumber} onChange={(e) => setNewNumber(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="newComplement">Complemento (Opcional)</Label>
                  <Input id="newComplement" placeholder="Ex: Apto 404" value={newComplement} onChange={(e) => setNewComplement(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newNeighborhood">Bairro</Label>
                <Input id="newNeighborhood" placeholder="Ex: Centro" value={newNeighborhood} onChange={(e) => setNewNeighborhood(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="newCity">Cidade</Label>
                  <Input id="newCity" placeholder="Ex: São Paulo" value={newCity} onChange={(e) => setNewCity(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="newState">Estado (UF)</Label>
                  <Input id="newState" placeholder="Ex: SP" value={newState} onChange={(e) => setNewState(e.target.value)} required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newZipCode">CEP</Label>
                <Input id="newZipCode" placeholder="Ex: 01000-000" value={newZipCode} onChange={(e) => setNewZipCode(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Endereço
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddressesPage;