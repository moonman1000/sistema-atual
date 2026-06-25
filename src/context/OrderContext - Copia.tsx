import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from './SessionContext.tsx 08.02.2026';
import { useRestaurant } from './RestaurantContext'; // Importar useRestaurant
import { CartItem } from './CartContext';
import { toast } from 'sonner';
import { MenuItem } from '@/context/MenuContext';
import { playSound } from '@/utils/audio'; // NOVO: Importar playSound

export interface Order {
  id: string;
  profile_id: string | null;
  client_name: string;
  client_address: string;
  items: string; // Descrição textual dos itens
  total: number;
  status: "Confirmado" | "Em Preparo" | "Em Entrega" | "Entregue" | "Cancelado";
  order_date: string;
  deliveryman: string;
  tracking_link?: string;
  restaurant_id: string; // Adicionado restaurant_id
  created_at?: string;
  updated_at?: string;
  order_items?: OrderItem[]; // Adicionado para facilitar o reordenamento
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  base_price: number;
  selected_size_value?: string;
  selected_size_name?: string;
  selected_size_price_modifier?: number;
  selected_toppings?: { name: string; price: number; value: string }[];
  restaurant_id: string; // Adicionado restaurant_id
  created_at?: string;
}

// Definir uma interface para os itens do pedido no formulário (deve ser a mesma do AddOrderDialog)
interface FormOrderItem {
  tempId: string; // Para gerenciar itens na UI antes de salvar
  menuItemId: string;
  name: string;
  quantity: number;
  basePrice: number;
  selectedSizeValue?: string;
  selectedSizeName?: string;
  selectedSizePriceModifier?: number;
  selectedToppings: { name: string; price: number; value: string }[];
}

interface OrderContextType {
  orders: Order[];
  addOrder: (newOrder: Omit<Order, 'id' | 'profile_id' | 'restaurant_id' | 'created_at' | 'updated_at'>, cartItems: CartItem[] | FormOrderItem[], cartRestaurantId: string) => Promise<void>; // NOVO: Adicionado cartRestaurantId
  updateOrder: (updatedOrder: Order) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  isLoadingOrders: boolean;
}

export const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const { session, profile, isLoading: isLoadingSession, isAdmin, isCustomer, isSuperAdmin, softRevalidateSession } = useSession(); // Adicionado isSuperAdmin
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant(); // Obter currentRestaurant
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  const fetchOrders = useCallback(async (currentProfileId: string | null, isAdminUser: boolean, isSuperAdminUser: boolean, targetRestaurantId: string) => {
    setIsLoadingOrders(true);
    console.log("OrderContext: Fetching orders. Profile ID:", currentProfileId, "Is Admin:", isAdminUser, "Is Super Admin:", isSuperAdminUser, "Restaurant ID:", targetRestaurantId);
    let query = supabase.from('orders').select(`
      *,
      order_items(*)
    `); // Incluir order_items para reordenamento

    if (isSuperAdminUser) {
      // Super Admin pode ver todos os pedidos de qualquer restaurante selecionado no contexto
      query = query.eq('restaurant_id', targetRestaurantId);
    } else if (isAdminUser) {
      query = query.eq('restaurant_id', targetRestaurantId); // Admin vê todos os pedidos do seu restaurante
    } else if (currentProfileId) {
      query = query.eq('profile_id', currentProfileId).eq('restaurant_id', targetRestaurantId); // Cliente vê seus pedidos no seu restaurante
    } else {
      setOrders([]);
      setIsLoadingOrders(false);
      console.log("OrderContext: No valid user context for fetching orders.");
      return;
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error("OrderContext: Erro ao carregar pedidos:", error);
      toast.error("Erro ao carregar pedidos.");
      setOrders([]);
    } else {
      console.log("OrderContext: Fetched orders data:", data);
      setOrders(data as Order[]);
    }
    setIsLoadingOrders(false);
  }, [supabase]);

  useEffect(() => {
    console.log("OrderContext: Realtime useEffect triggered."); // NOVO LOG
    let cancelled = false;
    const runFetch = async () => {
      if (isLoadingSession || isLoadingRestaurants) {
        if (!cancelled) {
          setOrders([]);
          setIsLoadingOrders(true);
        }
        return;
      }

      if (session) {
        const targetRestaurantId = isSuperAdmin || isAdmin ? currentRestaurant?.id : profile?.restaurant_id;
        
        console.log("OrderContext: Determined targetRestaurantId for fetch:", targetRestaurantId);
        console.log("OrderContext: currentRestaurant object before realtime subscription setup:", currentRestaurant); // NOVO LOG

        if (targetRestaurantId) {
          // Initial fetch
          await fetchOrders(profile?.id || null, isAdmin, isSuperAdmin, targetRestaurantId);

          // Setup Realtime Subscription for new orders and updates
          const subscription = supabase
            .channel(`orders_channel_${targetRestaurantId}`)
            .on(
              'postgres_changes',
              {
                event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
                schema: 'public',
                table: 'orders',
                filter: `restaurant_id=eq.${targetRestaurantId}`,
              },
              async (payload) => { // Make this async
                console.log("OrderContext: Realtime event received!", payload);
                const newOrder = payload.new as Order;
                const oldOrder = payload.old as Order;

                // Instead of directly manipulating state with payload.new,
                // re-fetch all orders to ensure consistency and nested data.
                // This is simpler than trying to merge partial realtime payloads.
                await fetchOrders(profile?.id || null, isAdmin, isSuperAdmin, targetRestaurantId);

                // Now, handle specific notifications based on the event type and new data
                if (payload.eventType === 'INSERT') {
                  console.log("OrderContext: Checking user role for notification. isAdmin:", isAdmin, "isSuperAdmin:", isSuperAdmin);
                  console.log("OrderContext: currentRestaurant object for notification check:", currentRestaurant);
                  console.log("OrderContext: currentRestaurant?.receive_order_notifications:", currentRestaurant?.receive_order_notifications);

                  // NOVO: Verificar configurações de notificação do restaurante
                  if ((isAdmin || isSuperAdmin) && currentRestaurant?.receive_order_notifications) {
                    console.log("OrderContext: User is admin/super_admin and receive_order_notifications is true. Triggering toast and sound for new order:", newOrder.id);
                    toast.info(`Novo Pedido Recebido! #${newOrder.id} de ${newOrder.client_name}`, {
                      description: newOrder.items,
                      duration: 8000,
                    });
                    playSound('/sounds/sale-success.mp3', `new-order-${newOrder.id}`);
                  } else {
                    console.log("OrderContext: User is not admin/super_admin or receive_order_notifications is false. Skipping notification.");
                  }
                } else if (payload.eventType === 'UPDATE') {
                  // Check for "sale completed" notification
                  console.log("OrderContext: currentRestaurant object for notification check (UPDATE):", currentRestaurant);
                  console.log("OrderContext: currentRestaurant?.receive_delivery_notifications (UPDATE):", currentRestaurant?.receive_delivery_notifications);

                  // NOVO: Verificar configurações de notificação do restaurante
                  if ((isAdmin || isSuperAdmin) && currentRestaurant?.receive_delivery_notifications && newOrder.status === "Entregue" && oldOrder.status !== "Entregue") {
                    console.log("OrderContext: User is admin/super_admin and receive_delivery_notifications is true. Triggering toast and sound for completed sale:", newOrder.id);
                    toast.success(`Venda concluída! Pedido #${newOrder.id} entregue.`, {
                      duration: 8000,
                    });
                    playSound('/sounds/sale-success.mp3', `sale-completed-${newOrder.id}`);
                  }
                }
                // DELETE events will also trigger a re-fetch, which will naturally remove the item.
              }
            )
            .subscribe();

          return () => {
            console.log(`OrderContext: Unsubscribing from orders_channel_${targetRestaurantId}`); // NOVO LOG
            supabase.removeChannel(subscription);
          };

        } else {
          if (!cancelled) {
            setOrders([]);
            setIsLoadingOrders(false);
          }
          console.log("OrderContext: No valid targetRestaurantId, skipping fetch and realtime setup.");
        }
      } else {
        if (!cancelled) {
          setOrders([]);
          setIsLoadingOrders(false);
        }
        console.log("OrderContext: Session finished loading, no user logged in, clearing orders.");
      }
    };

    runFetch();

    return () => {
      cancelled = true;
    };
  }, [isLoadingSession, isLoadingRestaurants, session, profile?.id, profile?.restaurant_id, isAdmin, isSuperAdmin, currentRestaurant?.id, currentRestaurant?.receive_order_notifications, currentRestaurant?.receive_delivery_notifications, fetchOrders, playSound]); // NOVO: Adicionar dependências de notificação do restaurante

  const addOrder = async (newOrderData: Omit<Order, 'id' | 'profile_id' | 'restaurant_id' | 'created_at' | 'updated_at'>, itemsToAdd: CartItem[] | FormOrderItem[], cartRestaurantId: string) => { // NOVO: Adicionado cartRestaurantId
    if (!profile?.id) {
      toast.error("Você precisa estar logado para fazer um pedido.");
      throw new Error("Usuário não autenticado.");
    }
    
    let customerProfileRestaurantId = profile.restaurant_id;

    // Se o perfil do cliente não tem restaurant_id, tenta vincular ao restaurant_id do carrinho
    if (!customerProfileRestaurantId) {
      if (cartRestaurantId) {
        console.log("OrderContext: Perfil do cliente sem restaurant_id. Tentando vincular ao cartRestaurantId:", cartRestaurantId);
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ restaurant_id: cartRestaurantId, updated_at: new Date().toISOString() })
          .eq('id', profile.id);

        if (profileUpdateError) {
          console.error("OrderContext: Erro ao vincular restaurante ao perfil do cliente:", profileUpdateError);
          toast.error("Erro ao vincular estabelecimento ao seu perfil. O pedido será feito, mas o perfil pode precisar de atualização manual.");
          // ⚠️ NÃO lançar erro fatal aqui - permite que o pedido continue
        } else {
          // Atualiza o profile no SessionContext para refletir a mudança
          await softRevalidateSession();
          customerProfileRestaurantId = cartRestaurantId; // Usa o ID recém-vinculado
          toast.info("Seu perfil foi vinculado ao estabelecimento atual.");
        }
      } else {
        toast.error("Seu perfil não está associado a um estabelecimento e não foi possível determinar um estabelecimento atual.");
        throw new Error("Restaurant ID not available for profile.");
      }
    }


    // Usar cartRestaurantId como fallback se customerProfileRestaurantId ainda for null
    const finalRestaurantId = customerProfileRestaurantId || cartRestaurantId;

    if (!finalRestaurantId) {
      toast.error("Não foi possível determinar o estabelecimento para o pedido.");
      throw new Error("Restaurant ID not available for order.");
    }

    setIsLoadingOrders(true);
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        ...newOrderData,
        profile_id: profile.id,
        restaurant_id: finalRestaurantId, // ✅ Usar finalRestaurantId (com fallback)
        order_date: newOrderData.order_date,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Erro ao adicionar pedido:", orderError);
      toast.error("Erro ao adicionar pedido.");
      setIsLoadingOrders(false);
      throw orderError;
    }

    const newOrder = orderData as Order;

    const orderItemsToInsert = itemsToAdd.map(item => {
      // Verifica se é um CartItem ou FormOrderItem e mapeia para OrderItem
      const isCartItem = (item as CartItem).product !== undefined;
      const product = isCartItem ? (item as CartItem).product : undefined;
      const selectedToppings = isCartItem ? (item as CartItem).selectedToppingValues : (item as FormOrderItem).selectedToppings;
      const selectedSizeValue = isCartItem ? (item as CartItem).selectedSizeValue : (item as FormOrderItem).selectedSizeValue;

      const size = product?.sizes.find(s => s.value === selectedSizeValue) || (item as FormOrderItem).selectedSizeName ? {
        name: (item as FormOrderItem).selectedSizeName,
        value: (item as FormOrderItem).selectedSizeValue,
        price_modifier: (item as FormOrderItem).selectedSizePriceModifier,
      } : undefined;

      const selectedToppingsDetails = selectedToppings?.map(tValue => {
        const topping = product?.toppings.find(pt => pt.value === tValue) || (item as FormOrderItem).selectedToppings.find(t => t.value === tValue);
        return topping ? { name: topping.name, price: topping.price, value: topping.value } : null;
      }).filter(Boolean);

      return {
        order_id: newOrder.id,
        menu_item_id: isCartItem ? product!.id : (item as FormOrderItem).menuItemId,
        name: isCartItem ? product!.name : (item as FormOrderItem).name,
        quantity: item.quantity,
        base_price: isCartItem ? product!.base_price : (item as FormOrderItem).basePrice,
        selected_size_value: size?.value,
        selected_size_name: size?.name,
        selected_size_price_modifier: size?.price_modifier,
        selected_toppings: selectedToppingsDetails && selectedToppingsDetails.length > 0 ? selectedToppingsDetails : null,
        restaurant_id: finalRestaurantId, // ✅ Usar finalRestaurantId (com fallback)
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) {
      console.error("Erro ao adicionar itens do pedido:", itemsError);
      toast.error("Pedido criado, mas houve um erro ao salvar os itens.");
    }

    // A atualização do estado `orders` será feita pelo Realtime Subscription
    // await fetchOrders(profile.id, isAdmin, isSuperAdmin, customerRestaurantId); // Passar o restaurant_id correto
    toast.success("Pedido adicionado com sucesso!");
    console.log("OrderContext: currentRestaurant?.receive_order_notifications (addOrder):", currentRestaurant?.receive_order_notifications);
    // NOVO: Disparar som de sucesso apenas se as notificações de pedido estiverem ativadas para o restaurante
    if (currentRestaurant?.receive_order_notifications) {
      playSound('/sounds/sale-success.mp3', newOrder.id);
    }
    setIsLoadingOrders(false);
  };

  const updateOrder = async (updatedOrder: Order) => {
    if (!profile?.id) {
      toast.error("Você precisa estar logado para atualizar um pedido.");
      throw new Error("Usuário não autenticado.");
    }
    // Acesso para Super Admin ou Admin do restaurante ou Cliente do pedido
    const isAuthorized = isSuperAdmin || (isAdmin && updatedOrder.restaurant_id === currentRestaurant?.id) || (isCustomer && updatedOrder.profile_id === profile.id && updatedOrder.restaurant_id === profile.restaurant_id);

    if (!isAuthorized) {
      toast.error("Acesso não autorizado para atualizar este pedido.");
      throw new Error("Unauthorized access or invalid restaurant ID.");
    }

    setIsLoadingOrders(true);
    console.log("OrderContext: Attempting to update order:", updatedOrder);
    const { error } = await supabase
      .from('orders')
      .update({
        client_name: updatedOrder.client_name,
        client_address: updatedOrder.client_address,
        items: updatedOrder.items,
        total: updatedOrder.total,
        status: updatedOrder.status,
        order_date: updatedOrder.order_date,
        deliveryman: updatedOrder.deliveryman,
        tracking_link: updatedOrder.tracking_link,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatedOrder.id)
      .eq('restaurant_id', updatedOrder.restaurant_id); // Filtrar por restaurant_id

    if (error) {
      console.error("OrderContext: Erro ao atualizar pedido:", error);
      toast.error("Erro ao atualizar pedido: " + error.message);
      setIsLoadingOrders(false);
      throw error;
    }

    // A atualização do estado local e a notificação de "Venda concluída!"
    // agora são tratadas pelo Realtime Subscription.
    toast.success("Pedido atualizado com sucesso!");
    setIsLoadingOrders(false);
  };

  const cancelOrder = async (orderId: string) => {
    if (!profile?.id) {
      toast.error("Você precisa estar logado para cancelar um pedido.");
      throw new Error("Usuário não autenticado.");
    }
    const orderToCancel = orders.find(o => o.id === orderId);
    // Acesso para Super Admin ou Admin do restaurante ou Cliente do pedido
    const isAuthorized = isSuperAdmin || (isAdmin && orderToCancel?.restaurant_id === currentRestaurant?.id) || (isCustomer && orderToCancel?.profile_id === profile.id && orderToCancel?.restaurant_id === profile.restaurant_id);

    if (!orderToCancel || !isAuthorized) {
      toast.error("Acesso não autorizado para cancelar este pedido.");
      throw new Error("Unauthorized access.");
    }

    setIsLoadingOrders(true);
    const { error } = await supabase
      .from('orders')
      .update({ status: "Cancelado", updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('restaurant_id', orderToCancel.restaurant_id); // Filtrar por restaurant_id

    if (error) {
      console.error("OrderContext: Erro ao cancelar pedido:", error);
      toast.error("Erro ao cancelar pedido.");
      setIsLoadingOrders(false);
      throw error;
    }

    const targetRestaurantId = isSuperAdmin || isAdmin ? currentRestaurant?.id : profile?.restaurant_id;
    if (targetRestaurantId) {
      await fetchOrders(profile.id, isAdmin, isSuperAdmin, targetRestaurantId);
    }
    toast.info(`Pedido ${orderId} foi cancelado.`);
    setIsLoadingOrders(false);
  };

  const deleteOrder = async (orderId: string) => {
    if (!profile?.id) {
      toast.error("Você precisa estar logado para excluir um pedido.");
      throw new Error("Usuário não autenticado.");
    }
    const orderToDelete = orders.find(o => o.id === orderId);
    // Acesso para Super Admin ou Admin do restaurante ou Cliente do pedido
    const isAuthorized = isSuperAdmin || (isAdmin && orderToDelete?.restaurant_id === currentRestaurant?.id) || (isCustomer && orderToDelete?.profile_id === profile.id && orderToDelete?.restaurant_id === profile.restaurant_id);

    if (!orderToDelete || !isAuthorized) {
      toast.error("Acesso não autorizado para excluir este pedido.");
      throw new Error("Unauthorized access.");
    }

    setIsLoadingOrders(true);
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)
      .eq('restaurant_id', orderToDelete.restaurant_id); // Filtrar por restaurant_id

    if (error) {
      console.error("OrderContext: Erro ao excluir pedido:", error);
      toast.error("Erro ao excluir pedido.");
      setIsLoadingOrders(false);
      throw error;
    }

    const targetRestaurantId = isSuperAdmin || isAdmin ? currentRestaurant?.id : profile?.restaurant_id;
    if (targetRestaurantId) {
      await fetchOrders(profile.id, isAdmin, isSuperAdmin, targetRestaurantId);
    }
    toast.success(`Pedido ${orderId} foi excluído.`);
    setIsLoadingOrders(false);
  };

  const contextValue = useMemo(
    () => ({
      orders,
      addOrder,
      updateOrder,
      cancelOrder,
      deleteOrder,
      isLoadingOrders,
    }),
    [orders, addOrder, updateOrder, cancelOrder, deleteOrder, isLoadingOrders, currentRestaurant, profile, isAdmin, isSuperAdmin, softRevalidateSession]
  );

  return <OrderContext.Provider value={contextValue}>{children}</OrderContext.Provider>;
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};