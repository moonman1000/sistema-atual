import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, MoreHorizontal, User as UserIcon, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import AddClientDialog from "@/components/admin/AddClientDialog";
import EditClientDialog from "@/components/admin/EditClientDialog";
import ViewClientDetailsDialog from "@/components/admin/ViewClientDetailsDialog";
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/context/SessionContext';
import { useRestaurant } from '@/context/RestaurantContext';

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: 'admin' | 'customer' | 'super_admin'; // NOVO: Adicionado super_admin
  restaurant_id?: string;
}

const ClientsPage = () => {
  const { session, profile, isLoading: isLoadingSession, isAdmin, isSuperAdmin } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [isEditClientDialogOpen, setIsEditClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const fetchClients = async () => {
    setIsLoadingClients(true);
    console.log("ClientsPage: Debugging fetchClients.");
    console.log("ClientsPage: session:", session);
    console.log("ClientsPage: isAdmin:", isAdmin);
    console.log("ClientsPage: isSuperAdmin:", isSuperAdmin);
    console.log("ClientsPage: currentRestaurant:", currentRestaurant);
    console.log("ClientsPage: targetRestaurantId:", currentRestaurant?.id);
    console.log("Fetching clients...");

    // Apenas admins ou super_admins com restaurante selecionado podem ver clientes
    if (!session || !(isAdmin || isSuperAdmin) || !currentRestaurant?.id) {
      setClients([]);
      setIsLoadingClients(false);
      console.log("ClientsPage: Not authorized (not admin/super_admin) or no restaurant selected, clearing clients.");
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        avatar_url,
        role,
        phone,
        email,
        restaurant_id
      `)
      .eq('role', 'customer')
      .eq('restaurant_id', currentRestaurant.id); // Filtrar por restaurant_id do admin

    if (error) {
      console.error("Erro ao carregar clientes:", error);
      toast.error("Erro ao carregar clientes.");
      setClients([]);
    } else {
      console.log("Raw data from Supabase (profiles):", data);
      const fetchedClients: Client[] = data.map((profile: any) => ({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email || 'N/A',
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        role: profile.role,
        restaurant_id: profile.restaurant_id,
      }));
      setClients(fetchedClients);
      console.log("Processed clients:", fetchedClients);
    }
    setIsLoadingClients(false);
  };

  useEffect(() => {
    let cancelled = false;
    const runFetch = async () => {
      if (isLoadingSession || isLoadingRestaurants) {
        if (!cancelled) {
          setClients([]);
          setIsLoadingClients(true);
        }
        return;
      }
      // Permitir admin ou super_admin buscar clientes se um restaurante estiver selecionado
      if (session && (isAdmin || isSuperAdmin) && currentRestaurant?.id) {
        await fetchClients();
      } else {
        if (!cancelled) {
          setClients([]);
          setIsLoadingClients(false);
        }
      }
    };
    runFetch();
    return () => { cancelled = true; };
  }, [isLoadingSession, isLoadingRestaurants, session, isAdmin, isSuperAdmin, currentRestaurant?.id]);

  const filteredClients = useMemo(() => {
    let currentClients = clients;

    if (searchTerm) {
      currentClients = currentClients.filter(
        (client) =>
          client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    currentClients.sort((a, b) => {
      const nameA = `${a.first_name} ${a.last_name}`;
      const nameB = `${b.first_name} ${b.last_name}`;
      if (sortBy === "name-asc") {
        return nameA.localeCompare(nameB);
      }
      if (sortBy === "name-desc") {
        return nameB.localeCompare(nameA);
      }
      return 0;
    });

    return currentClients;
  }, [searchTerm, sortBy, clients]);

  const handleEditClient = async (updatedClient: Client) => {
    setIsLoadingClients(true);
    if (!currentRestaurant?.id || updatedClient.restaurant_id !== currentRestaurant.id) {
      toast.error("Acesso não autorizado para atualizar este cliente.");
      setIsLoadingClients(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: updatedClient.first_name,
        last_name: updatedClient.last_name,
        phone: updatedClient.phone,
        avatar_url: updatedClient.avatar_url,
        email: updatedClient.email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatedClient.id)
      .eq('restaurant_id', currentRestaurant.id);

    if (error) {
      console.error("Erro ao atualizar cliente:", error);
      toast.error("Erro ao atualizar cliente.");
    } else {
      toast.success("Cliente atualizado com sucesso!");
      fetchClients();
    }
    setIsLoadingClients(false);
  };

  const handleViewDetails = (client: Client) => {
    setViewingClient(client);
    setIsViewDetailsDialogOpen(true);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setIsEditClientDialogOpen(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    setIsLoadingClients(true);
    if (!currentRestaurant?.id) {
      toast.error("Nenhum restaurante selecionado para excluir cliente.");
      setIsLoadingClients(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', clientId)
      .eq('restaurant_id', currentRestaurant.id);

    if (error) {
      console.error("Erro ao excluir cliente:", error);
      toast.error("Erro ao excluir cliente.");
    } else {
      toast.success(`Cliente ${clientId} foi excluído.`);
      fetchClients();
    }
    setIsLoadingClients(false);
  };

  if (isLoadingClients || isLoadingSession || isLoadingRestaurants) {
    return <div className="flex min-h-screen items-center justify-center">Carregando clientes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Clientes</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddClientDialogOpen(true)}>Adicionar Cliente</Button>
          <Button variant="outline" onClick={fetchClients}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Buscar por nome, e-mail ou telefone..."
          className="max-w-sm flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Ordenar por <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy("name-asc")}>Nome (A-Z)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("name-desc")}>Nome (Z-A)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Função</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <Avatar>
                    <AvatarImage src={client.avatar_url} alt={`${client.first_name} ${client.last_name}`} />
                    <AvatarFallback>
                      <UserIcon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{client.first_name} {client.last_name}</TableCell>
                <TableCell>
                  {client.email}
                  <br />
                  <span className="text-muted-foreground text-xs">{client.phone || 'N/A'}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={client.role === 'admin' || client.role === 'super_admin' ? 'destructive' : 'secondary'}>
                    {client.role === 'super_admin' ? 'Super Administrador' : client.role === 'admin' ? 'Administrador' : 'Cliente'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(client)}>
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(client)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClient(client.id)}>
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AddClientDialog
        isOpen={isAddClientDialogOpen}
        onClose={() => setIsAddClientDialogOpen(false)}
      />

      <ViewClientDetailsDialog
        isOpen={isViewDetailsDialogOpen}
        onClose={() => setIsViewDetailsDialogOpen(false)}
        client={viewingClient}
      />

      {editingClient && (
        <EditClientDialog
          isOpen={isEditClientDialogOpen}
          onClose={() => setIsEditClientDialogOpen(false)}
          client={editingClient}
          onEditClient={handleEditClient}
        />
      )}
    </div>
  );
};

export default ClientsPage;