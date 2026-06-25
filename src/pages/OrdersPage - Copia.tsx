import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { ChevronDown, MoreHorizontal, RefreshCw, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AddOrderDialog from "@/components/admin/AddOrderDialog";
import ViewOrderDetailsDialog from "@/components/admin/ViewOrderDetailsDialog";
import EditOrderDialog from "@/components/admin/EditOrderDialog";
import { useOrders, Order } from "@/context/OrderContext";
import { useEmployees } from "@/context/EmployeeContext";
import { useDeliveries, Delivery } from "@/context/DeliveryContext";
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/context/SessionContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { generateInvoicePdf } from "@/utils/invoiceGenerator";
import AdminTableFiltersWrapper from "@/components/admin/AdminTableFiltersWrapper";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FormOrderItem {
  tempId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  basePrice: number;
  selectedSizeValue?: string;
  selectedSizeName?: string;
  selectedSizePriceModifier?: number;
  selectedToppings: { name: string; price: number; value: string }[];
}

const OrdersPage = () => {
  const { session, isAdmin, isLoading: isLoadingSession } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const {
    orders,
    addOrder,
    updateOrder,
    cancelOrder,
    deleteOrder,
    isLoadingOrders,
    fetchOrders,
    newOrderIds,
    markOrderAsViewed,
  } = useOrders();
  const { availableDeliverymenNames } = useEmployees();
  const { deliveries, addDelivery, updateDelivery } = useDeliveries();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [sortBy, setSortBy] = useState("order_date-desc");
  const [isAddOrderDialogOpen, setIsAddOrderDialogOpen] = useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [availableClients, setAvailableClients] = useState<string[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  const fetchClients = useCallback(async () => {
    setIsLoadingClients(true);
    const targetRestaurantId = currentRestaurant?.id;
    if (!session || !isAdmin || !targetRestaurantId) {
      setAvailableClients([]);
      setIsLoadingClients(false);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('role', 'customer')
      .eq('restaurant_id', targetRestaurantId);
    if (error) {
      console.error("Erro ao carregar clientes para OrdersPage:", error);
      toast.error("Erro ao carregar lista de clientes.");
      setAvailableClients([]);
    } else {
      const clientNames = (data || []).map((p: any) => `${p.first_name} ${p.last_name}`.trim());
      setAvailableClients(clientNames);
    }
    setIsLoadingClients(false);
  }, [session, isAdmin, currentRestaurant?.id]);

  useEffect(() => {
    let cancelled = false;
    const runFetch = async () => {
      if (isLoadingSession || isLoadingRestaurants) {
        if (!cancelled) setIsLoadingClients(true);
        return;
      }
      if (session && isAdmin && currentRestaurant?.id) {
        await fetchClients();
      } else {
        if (!cancelled) setIsLoadingClients(false);
      }
    };
    runFetch();
    return () => { cancelled = true; };
  }, [isLoadingSession, isLoadingRestaurants, session, isAdmin, currentRestaurant?.id, fetchClients]);

  const getStatusBadgeVariant = (status: Order["status"]) => {
    switch (status) {
      case "Pendente": return "info";
      case "Confirmado": return "default";
      case "Em Preparo": return "secondary";
      case "Em Entrega": return "outline";
      case "Entregue": return "success";
      case "Cancelado":
      case "Problema":
      case "Recusado":
      case "Devolvido": // NOVO: Adicionado Devolvido
        return "destructive";
      default: return "default";
    }
  };

  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    let currentOrders = orders;
    if (searchTerm) {
      currentOrders = currentOrders.filter(
        (order: any) =>
          (order.id || "").toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.client_name || "").toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.items || "").toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== "Todos") {
      currentOrders = currentOrders.filter((order: any) => order.status === filterStatus);
    }
    const sortedOrders = [...currentOrders];
    sortedOrders.sort((a: any, b: any) => {
      if (sortBy === "daily_number-asc") return (a.daily_order_number || 0) - (b.daily_order_number || 0);
      if (sortBy === "daily_number-desc") return (b.daily_order_number || 0) - (a.daily_order_number || 0);
      if (sortBy === "orderId-asc") return a.id.localeCompare(b.id);
      if (sortBy === "orderId-desc") return b.id.localeCompare(a.id);
      if (sortBy === "total-asc") return a.total - b.total;
      if (sortBy === "total-desc") return b.total - a.total;
      if (sortBy === "order_date-asc") return new Date(a.order_date).getTime() - new Date(b.order_date).getTime();
      if (sortBy === "order_date-desc") return new Date(b.order_date).getTime() - new Date(a.order_date).getTime();
      return 0;
    });
    return sortedOrders;
  }, [orders, searchTerm, filterStatus, sortBy]);

  useEffect(() => {
    console.log("OrdersPage DEBUG:", {
      isLoadingOrders,
      isLoadingClients,
      isLoadingSession,
      isLoadingRestaurants,
      ordersLength: Array.isArray(orders) ? orders.length : String(orders),
      filteredOrdersLength: filteredOrders.length,
      currentRestaurant,
      sessionId: session?.user?.id || null,
    });
  }, [isLoadingOrders, isLoadingClients, isLoadingSession, isLoadingRestaurants, orders, filteredOrders, currentRestaurant, session]);

  const handleViewDetails = (order: Order) => {
    markOrderAsViewed(order.id);
    setViewingOrder(order);
    setIsViewDetailsDialogOpen(true);
  };

  const handleAddOrder = async (newOrderData: any, orderItems: FormOrderItem[]) => {
    try {
      await addOrder(newOrderData, orderItems, currentRestaurant?.id || "");
      toast.success("Pedido adicionado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao adicionar pedido: " + (error?.message || String(error)));
      console.error("Erro ao adicionar pedido:", error);
    }
  };

  const handleEditOrder = async (updatedOrder: Order) => {
    try {
      await updateOrder(updatedOrder);
      markOrderAsViewed(updatedOrder.id);
      toast.success("Pedido atualizado com sucesso!");

      // Lógica para criar/atualizar delivery quando o status do pedido muda
      if (["Em Entrega", "Problema", "Entregue", "Recusado", "Devolvido"].includes(updatedOrder.status)) { // ADICIONADO: Recusado, Devolvido
        const existingDelivery = deliveries.find(d => d.orderid === updatedOrder.id);
        let deliveryStatus: Delivery["status"];
        let actualDeliveryTime: string | undefined = undefined;

        if (updatedOrder.status === "Em Entrega") {
          deliveryStatus = "Em Entrega";
        } else if (updatedOrder.status === "Problema") {
          deliveryStatus = "Problema";
        } else if (updatedOrder.status === "Recusado") {
          deliveryStatus = "Recusado";
        } else if (updatedOrder.status === "Devolvido") { // NOVO: Devolvido
          deliveryStatus = "Devolvido";
        } else { // Must be "Entregue"
          deliveryStatus = "Entregue";
          actualDeliveryTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }

        if (!existingDelivery) {
          await addDelivery({
            orderid: updatedOrder.id,
            clientname: updatedOrder.client_name,
            client_address: updatedOrder.client_address,
            deliveryman: updatedOrder.deliveryman,
            status: deliveryStatus,
            estimateddeliverytime: "A definir", // Default value
            actualdeliverytime: actualDeliveryTime,
            trackinglink: updatedOrder.tracking_link,
          });
        } else {
          // Only update if status or tracking link has changed, or if it's delivered and actual time is not set
          if (existingDelivery.status !== deliveryStatus || existingDelivery.trackinglink !== updatedOrder.tracking_link || (updatedOrder.status === "Entregue" && !existingDelivery.actualdeliverytime)) {
            await updateDelivery({
              ...existingDelivery,
              status: deliveryStatus,
              trackinglink: updatedOrder.tracking_link,
              actualdeliverytime: actualDeliveryTime,
            });
          }
        }
      }
    } catch (error: any) {
      toast.error("Erro ao atualizar pedido: " + (error?.message || String(error)));
      console.error("Erro ao atualizar pedido:", error);
    }
  };

  const openEditDialog = (order: Order) => {
    markOrderAsViewed(order.id);
    setEditingOrder(order);
    setIsEditOrderDialogOpen(true);
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      markOrderAsViewed(orderId);
      toast.info(`Pedido ${orderId} foi cancelado.`);
    } catch (error: any) {
      toast.error("Erro ao cancelar pedido: " + (error?.message || String(error)));
      console.error("Erro ao cancelar pedido:", error);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      markOrderAsViewed(orderId);
      toast.success(`Pedido ${orderId} foi excluído.`);
    } catch (error: any) {
      toast.error("Erro ao excluir pedido: " + (error?.message || String(error)));
      console.error("Erro ao excluir pedido:", error);
    }
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

  const statusOptions = ["Todos", "Pendente", "Confirmado", "Em Preparo", "Em Entrega", "Entregue", "Cancelado", "Problema", "Recusado", "Devolvido"]; // ADICIONADO: Recusado, Devolvido

  if (isLoadingOrders || isLoadingClients || isLoadingSession || isLoadingRestaurants) {
    return <div className="flex min-h-screen items-center justify-center">Carregando pedidos e clientes...</div>;
  }

  if (!Array.isArray(orders)) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Erro ao carregar pedidos</h2>
        <p>O estado de pedidos não é um array. Veja o console para detalhes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {process.env.NODE_ENV !== "production" && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <strong>DEBUG — OrdersPage</strong>
          <div>currentRestaurant: {currentRestaurant ? `${currentRestaurant.name} (${currentRestaurant.id})` : "null"}</div>
          <div>orders count: {orders.length}</div>
          <div>filteredOrders count: {filteredOrders.length}</div>
          <div>isLoadingOrders: {String(isLoadingOrders)}</div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Pedidos</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddOrderDialogOpen(true)}>Adicionar Pedido</Button>
          <Button variant="outline" onClick={fetchOrders}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      <AdminTableFiltersWrapper>
        <Input placeholder="Buscar por ID, cliente ou itens..." className="max-w-sm flex-1" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Status: {filterStatus} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {statusOptions.map((status) => (
              <DropdownMenuItem key={status} onClick={() => setFilterStatus(status as Order["status"] | "Todos")}>
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
            <DropdownMenuItem onClick={() => setSortBy("daily_number-desc")}>Nº Diário (Recente)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("daily_number-asc")}>Nº Diário (Antigo)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("order_date-desc")}>Mais Recentes</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("order_date-asc")}>Mais Antigos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("total-desc")}>Total (Maior)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("total-asc")}>Total (Menor)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("orderId-asc")}>ID (Crescente)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("orderId-desc")}>ID (Decrescente)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </AdminTableFiltersWrapper>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Nº Diário</TableHead>
              <TableHead className="w-[100px]">ID do Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data do Pedido</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order: any) => {
              const isNew = newOrderIds.includes(order.id);
              return (
                <TableRow
                  key={order.id}
                  className={cn(
                    "cursor-pointer",
                    isNew && "bg-yellow-50/50 dark:bg-yellow-900/20 animate-pulse-new-order" // Removido border-l-4 border-orange-500
                  )}
                  onClick={() => handleViewDetails(order)}
                >
                  <TableCell className="font-bold text-lg">{order.daily_order_number || 'N/A'}</TableCell>
                  <TableCell className="font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-default">{(order.id || "").toString().substring(0, 8)}...</TooltipTrigger>
                        <TooltipContent><p>{order.id}</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>{order.client_name}<br /><span className="text-muted-foreground text-xs">{order.client_address}</span></TableCell>
                  <TableCell className="text-muted-foreground">{order.items}</TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell><Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge></TableCell>
                  <TableCell>{formatDate(order.order_date)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="flex items-center">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(order)}>Ver Detalhes</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(order)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCancelOrder(order.id)}>Cancelar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleGenerateInvoice(order)}><FileText className="h-4 w-4 mr-2" /> Gerar Nota Fiscal</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteOrder(order.id)}>Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AddOrderDialog isOpen={isAddOrderDialogOpen} onClose={() => setIsAddOrderDialogOpen(false)} onAddOrder={handleAddOrder} availableClients={availableClients} />
      <ViewOrderDetailsDialog isOpen={isViewDetailsDialogOpen} onClose={() => setIsViewDetailsDialogOpen(false)} order={viewingOrder} markOrderAsViewed={markOrderAsViewed} />
      {editingOrder && <EditOrderDialog isOpen={isEditOrderDialogOpen} onClose={() => setIsEditOrderDialogOpen(false)} order={editingOrder} onEditOrder={handleEditOrder} availableClients={availableClients} availableDeliverymen={availableDeliverymenNames} markOrderAsViewed={markOrderAsViewed} />}
    </div>
  );
};

export default OrdersPage;