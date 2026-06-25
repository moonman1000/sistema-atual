import React from "react";
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
import { ChevronDown, MoreHorizontal, Truck, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AddDeliveryDialog from "@/components/admin/AddDeliveryDialog";
import EditDeliveryDialog from "@/components/admin/EditDeliveryDialog";
import ViewDeliveryDetailsDialog from "@/components/admin/ViewDeliveryDetailsDialog";
import { useDeliveries, Delivery } from "@/context/DeliveryContext";
import { useOrders, Order } from "@/context/OrderContext";
import { useEmployees } from "@/context/EmployeeContext";
import { useSession } from '@/context/SessionContext';
import { useRestaurant } from '@/context/RestaurantContext';
import AdminTableFiltersWrapper from "@/components/admin/AdminTableFiltersWrapper";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; // adicionado

type DeliverymanObj = { id: string; name: string };

const DeliveriesPage = () => {
  const { session, isAdmin, isLoading: isLoadingSession } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const { deliveries, addDelivery, updateDelivery, deleteDelivery, fetchDeliveries } = useDeliveries();
  const { orders, updateOrder } = useOrders();
  // removi o uso direto de availableDeliverymenNames do contexto e faremos fetch aqui
  // const { availableDeliverymenNames } = useEmployees();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("Todos");
  const [sortBy, setSortBy] = React.useState("estimatedTime-asc");

  const [isAddDeliveryDialogOpen, setIsAddDeliveryDialogOpen] = React.useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = React.useState(false);
  const [viewingDelivery, setViewingDelivery] = React.useState<Delivery | null>(null);
  const [isEditDeliveryDialogOpen, setIsEditDeliveryDialogOpen] = React.useState(false);
  const [editingDelivery, setEditingDelivery] = React.useState<Delivery | null>(null);

  const availableOrders = orders;

  // novo estado: lista de entregadores como objetos {id, name}
  const [availableDeliverymen, setAvailableDeliverymen] = React.useState<DeliverymanObj[]>([]);
  // para compatibilidade com AddDeliveryDialog (se ele esperar apenas nomes), mantemos também array de strings
  const [availableDeliverymenNames, setAvailableDeliverymenNames] = React.useState<string[]>([]);

  // Buscar entregadores quando o restaurante atual mudar
  React.useEffect(() => {
    const fetchDeliverymen = async () => {
      if (!currentRestaurant?.id) {
        setAvailableDeliverymen([]);
        setAvailableDeliverymenNames([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('employees')
          .select('id, name, role, status, restaurant_id')
          .eq('restaurant_id', currentRestaurant.id)
          .eq('role', 'Entregador')
          .eq('status', 'Ativo');

        if (error) {
          console.error("Erro ao buscar entregadores:", error);
          setAvailableDeliverymen([]);
          setAvailableDeliverymenNames([]);
          return;
        }

        const list: DeliverymanObj[] = (data || []).map((r: any) => ({ id: r.id, name: r.name }));
        setAvailableDeliverymen(list);
        setAvailableDeliverymenNames(list.map(d => d.name));
      } catch (err) {
        console.error("Erro inesperado ao buscar entregadores:", err);
        setAvailableDeliverymen([]);
        setAvailableDeliverymenNames([]);
      }
    };

    fetchDeliverymen();
  }, [currentRestaurant?.id]);

  const getStatusBadgeVariant = (status: Delivery["status"]) => {
    switch (status) {
      case "Atribuído":
        return "default";
      case "Em Entrega":
        return "secondary";
      case "Entregue":
        return "success";
      case "Problema":
        return "destructive";
      case "Recusado":
        return "destructive";
      case "Devolvido":
        return "destructive";
      default:
        return "outline";
    }
  };

  const filteredDeliveries = React.useMemo(() => {
    let currentDeliveries = deliveries || [];

    if (searchTerm) {
      currentDeliveries = currentDeliveries.filter(
        (delivery) =>
          (delivery.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (delivery.orderid || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (delivery.clientname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (delivery.deliveryman || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "Todos") {
      currentDeliveries = currentDeliveries.filter(
        (delivery) => delivery.status === filterStatus
      );
    }

    currentDeliveries.sort((a, b) => {
      if (sortBy === "estimatedTime-asc") {
        return (a.estimateddeliverytime || "").localeCompare(b.estimateddeliverytime || "");
      }
      if (sortBy === "estimatedTime-desc") {
        return (b.estimateddeliverytime || "").localeCompare(a.estimateddeliverytime || "");
      }
      if (sortBy === "status-asc") {
        return (a.status || "").localeCompare(b.status || "");
      }
      if (sortBy === "status-desc") {
        return (b.status || "").localeCompare(a.status || "");
      }
      return 0;
    });

    return currentDeliveries;
  }, [searchTerm, filterStatus, sortBy, deliveries]);

  const handleAddDelivery = async (newDeliveryData: Omit<Delivery, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => {
    try {
      // Se newDeliveryData trouxer driver_profile_id (uid), ele será persistido pelo addDelivery do contexto
      await addDelivery(newDeliveryData);
      toast.success("Entrega adicionada com sucesso!");

      const orderToUpdate = orders.find(order => order.id === newDeliveryData.orderid);
      if (orderToUpdate) {
        let newOrderStatus: Order["status"] = "Em Preparo";
        if (newDeliveryData.status === "Em Entrega") {
          newOrderStatus = "Em Entrega";
        } else if (newDeliveryData.status === "Entregue") {
          newOrderStatus = "Entregue";
        } else if (newDeliveryData.status === "Problema") {
          newOrderStatus = "Problema";
        } else if (newDeliveryData.status === "Recusado") {
          newOrderStatus = "Recusado";
        } else if (newDeliveryData.status === "Devolvido") {
          newOrderStatus = "Devolvido";
        }

        if (orderToUpdate.status !== newOrderStatus) {
          await updateOrder({ ...orderToUpdate, status: newOrderStatus, tracking_link: newDeliveryData.trackinglink });
        }
      }
    } catch (error) {
      toast.error("Erro ao adicionar entrega.");
      console.error("Erro ao adicionar entrega:", error);
    }
  };

  const handleEditDelivery = async (updatedDelivery: Delivery) => {
    try {
      // updatedDelivery vindo do EditDeliveryDialog já contém driver_profile_id (se selecionado)
      await updateDelivery(updatedDelivery);
      toast.success("Entrega atualizada com sucesso!");

      const orderToUpdate = orders.find(order => order.id === updatedDelivery.orderid);
      if (orderToUpdate) {
        let newOrderStatus: Order["status"] = "Em Preparo";
        if (updatedDelivery.status === "Em Entrega") {
          newOrderStatus = "Em Entrega";
        } else if (updatedDelivery.status === "Entregue") {
          newOrderStatus = "Entregue";
        } else if (updatedDelivery.status === "Problema") {
          newOrderStatus = "Problema";
        } else if (updatedDelivery.status === "Recusado") {
          newOrderStatus = "Recusado";
        } else if (updatedDelivery.status === "Devolvido") {
          newOrderStatus = "Devolvido";
        }

        if (orderToUpdate.status !== newOrderStatus) {
          await updateOrder({ ...orderToUpdate, status: newOrderStatus, tracking_link: updatedDelivery.trackinglink });
        }
      }
    } catch (error) {
      toast.error("Erro ao atualizar entrega.");
      console.error("Erro ao atualizar entrega:", error);
    }
  };

  const handleViewDetails = (delivery: Delivery) => {
    setViewingDelivery(delivery);
    setIsViewDetailsDialogOpen(true);
  };

  const openEditDialog = (delivery: Delivery) => {
    setEditingDelivery(delivery);
    setIsEditDeliveryDialogOpen(true);
  };

  const handleDeleteDelivery = async (deliveryId: string) => {
    try {
      await deleteDelivery(deliveryId);
      toast.success(`Entrega ${deliveryId} foi excluída.`);
    } catch (error) {
      toast.error("Erro ao excluir entrega.");
      console.error("Erro ao excluir entrega:", error);
    }
  };

  const statusOptions = ["Todos", "Atribuído", "Em Entrega", "Entregue", "Problema", "Recusado", "Devolvido"];

  if (isLoadingSession || isLoadingRestaurants) {
    return <div className="flex min-h-screen items-center justify-center">Carregando entregas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Entregas</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDeliveryDialogOpen(true)}>Adicionar Entrega</Button>
          <Button variant="outline" onClick={fetchDeliveries}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
          <Button asChild variant="secondary">
            <Link to="/delivery-driver">
              <Truck className="h-4 w-4 mr-2" /> Página do Entregador
            </Link>
          </Button>
        </div>
      </div>

      <AdminTableFiltersWrapper>
        <Input
          placeholder="Buscar por ID, pedido, cliente ou entregador..."
          className="max-w-sm flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Status: {filterStatus} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {statusOptions.map((status) => (
              <DropdownMenuItem key={status} onClick={() => setFilterStatus(status as Delivery["status"] | "Todos")}>
                {status}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Ordenar por <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy("estimatedTime-asc")}>Estimativa (Crescente)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("estimatedTime-desc")}>Estimativa (Decrescente)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("status-asc")}>Status (A-Z)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("status-desc")}>Status (Z-A)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </AdminTableFiltersWrapper>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID Entrega</TableHead>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Entregador</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Estimativa</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeliveries.map((delivery) => (
              <TableRow key={delivery.id}>
                <TableCell className="font-medium">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="cursor-default">
                        {delivery.id.substring(0, 8)}...
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{delivery.id}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>{delivery.orderid}</TableCell>
                <TableCell>
                  {delivery.clientname}
                  <br />
                  <span className="text-muted-foreground text-xs">{delivery.client_address}</span>
                </TableCell>
                <TableCell>{delivery.deliveryman}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(delivery.status)}>{delivery.status}</Badge>
                </TableCell>
                <TableCell>{delivery.estimateddeliverytime}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(delivery)}>
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(delivery)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteDelivery(delivery.id)}>
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

      <AddDeliveryDialog
        isOpen={isAddDeliveryDialogOpen}
        onClose={() => setIsAddDeliveryDialogOpen(false)}
        onAddDelivery={handleAddDelivery}
        availableOrders={availableOrders}
        availableDeliverymen={availableDeliverymenNames} // compatibilidade com Add dialog atual
      />

      <ViewDeliveryDetailsDialog
        isOpen={isViewDetailsDialogOpen}
        onClose={() => setIsViewDetailsDialogOpen(false)}
        delivery={viewingDelivery}
      />

      {editingDelivery && (
        <EditDeliveryDialog
          isOpen={isEditDeliveryDialogOpen}
          onClose={() => setIsEditDeliveryDialogOpen(false)}
          delivery={editingDelivery}
          onEditDelivery={handleEditDelivery}
          availableOrders={availableOrders}
          availableDeliverymen={availableDeliverymen} // agora passamos [{id, name}]
        />
      )}
    </div>
  );
};

export default DeliveriesPage;
