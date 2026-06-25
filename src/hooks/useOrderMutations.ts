import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/context/SessionContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { toast } from 'sonner';
import { soundManager } from '@/lib/soundManager';
import { Order, FormOrderItem } from '@/context/OrderContext';

// 👉 Função de geocoding usando Nominatim (OpenStreetMap)
async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}&countrycodes=br&limit=1`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    
    console.warn('Nenhum resultado de geocoding para:', address);
    return null;
  } catch (error) {
    console.error('Erro ao geocodificar endereço:', error);
    return null;
  }
}

// Hook que encapsula a lógica de criar, atualizar, cancelar e deletar pedidos.
export const useOrderMutations = () => {
  const { profile, isAdmin, isCustomer, isSuperAdmin, softRevalidateSession } = useSession();
  const { currentRestaurant } = useRestaurant();

  const addOrder = useCallback(
    async (
      newOrderData: Omit<
        Order,
        'id' | 'profile_id' | 'restaurant_id' | 'created_at' | 'updated_at' | 'daily_order_number'
      >,
      itemsToAdd: FormOrderItem[],
      cartRestaurantId: string
    ) => {
      if (!profile?.id) {
        toast.error('Você precisa estar logado para fazer um pedido.');
        throw new Error('Usuário não autenticado.');
      }

      let customerProfileRestaurantId = profile.restaurant_id;

      if (!customerProfileRestaurantId) {
        if (cartRestaurantId) {
          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({ restaurant_id: cartRestaurantId, updated_at: new Date().toISOString() })
            .eq('id', profile.id);

          if (!profileUpdateError) {
            await softRevalidateSession();
            customerProfileRestaurantId = cartRestaurantId;
          }
        }
      }

      const finalRestaurantId = customerProfileRestaurantId || cartRestaurantId;

      if (!finalRestaurantId) {
        toast.error('Não foi possível determinar o estabelecimento para o pedido.');
        throw new Error('Restaurant ID not available for order.');
      }

      // 1. Geocodificar endereço do cliente (ATIVADO)
      let clientLat: number | null = null;
      let clientLng: number | null = null;
      
      if (newOrderData.client_address) {
        try {
          console.log('🌍 Geocodificando endereço:', newOrderData.client_address);
          const geo = await geocodeAddress(newOrderData.client_address);
          if (geo) {
            clientLat = geo.lat;
            clientLng = geo.lng;
            console.log('✅ Coordenadas obtidas:', { lat: clientLat, lng: clientLng });
          } else {
            console.warn('⚠️ Não foi possível geocodificar o endereço');
            toast.warning('Endereço salvo, mas não foi possível obter coordenadas para rastreamento.');
          }
        } catch (e) {
          console.error('❌ Erro ao geocodificar endereço do cliente:', e);
          toast.warning('Pedido será criado, mas o rastreamento em tempo real pode não funcionar.');
        }
      }

      // 2. Insert Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...newOrderData,
          profile_id: profile.id,
          restaurant_id: finalRestaurantId,
          order_date: newOrderData.order_date,
          client_lat: clientLat,
          client_lng: clientLng,
          driver_profile_id: (newOrderData as any).driver_profile_id ?? null, // INCLUSÃO DO driver_profile_id
        })
        .select()
        .single();

      if (orderError) {
        console.error('Erro ao adicionar pedido:', orderError);
        toast.error('Erro ao adicionar pedido', {
          description: orderError.message,
          duration: 4000,
        });
        throw orderError;
      }

      const newOrder = orderData as Order;

      // 3. Insert Order Items
      const orderItemsToInsert = itemsToAdd.map((item: any) => {
        const isCartItem = item.product !== undefined;
        const product = isCartItem ? item.product : undefined;
        const selectedToppings = isCartItem ? item.selectedToppingValues : item.selectedToppings;
        const selectedSizeValue = isCartItem ? item.selectedSizeValue : item.selectedSizeValue;

        const size =
          product?.sizes.find((s: any) => s.value === selectedSizeValue) ||
          (item.selectedSizeName
            ? {
                name: item.selectedSizeName,
                value: item.selectedSizeValue,
                price_modifier: item.selectedSizePriceModifier,
              }
            : undefined);

        const selectedToppingsDetails = selectedToppings
          ?.map((tValue: any) => {
            const topping =
              product?.toppings.find((pt: any) => pt.value === tValue) ||
              item.selectedToppings.find((t: any) => t.value === tValue);
            return topping
              ? { name: topping.name, price: topping.price, value: topping.value }
              : null;
          })
          .filter(Boolean);

        return {
          order_id: newOrder.id,
          menu_item_id: isCartItem ? product!.id : item.menuItemId,
          name: isCartItem ? product!.name : item.name,
          quantity: item.quantity,
          base_price: isCartItem ? product!.base_price : item.basePrice,
          selected_size_value: size?.value,
          selected_size_name: size?.name,
          selected_size_price_modifier: size?.price_modifier,
          selected_toppings:
            selectedToppingsDetails && selectedToppingsDetails.length > 0
              ? selectedToppingsDetails
              : null,
          restaurant_id: finalRestaurantId,
        };
      });

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);

      if (itemsError) {
        console.error('Erro ao adicionar itens do pedido:', itemsError);
        toast.error('Pedido criado, mas houve um erro ao salvar os itens.');
      }

      return newOrder;
    },
    [profile, softRevalidateSession, isAdmin, isSuperAdmin, currentRestaurant]
  );

  const updateOrder = useCallback(
    async (updatedOrder: Order) => {
      if (!profile?.id) {
        toast.error('Você precisa estar logado para atualizar um pedido.');
        throw new Error('Usuário não autenticado.');
      }

      const isAuthorized =
        isSuperAdmin ||
        (isAdmin && updatedOrder.restaurant_id === currentRestaurant?.id) ||
        (isCustomer &&
          updatedOrder.profile_id === profile.id &&
          updatedOrder.restaurant_id === profile.restaurant_id);

      if (!updatedOrder.restaurant_id || !isAuthorized) {
        toast.error('Acesso não autorizado para atualizar este pedido.');
        throw new Error('Unauthorized access or invalid restaurant ID.');
      }

      const { data, error } = await supabase
        .from('orders')
        .update({
          client_name: updatedOrder.client_name,
          client_address: updatedOrder.client_address,
          // permitir atualizar coordenadas se vierem do formulário/admin
          client_lat: updatedOrder.client_lat ?? null,
          client_lng: updatedOrder.client_lng ?? null,
          items: updatedOrder.items,
          total: updatedOrder.total,
          status: updatedOrder.status,
          order_date: updatedOrder.order_date,
          deliveryman: updatedOrder.deliveryman,
          tracking_link: updatedOrder.tracking_link,
          driver_profile_id: updatedOrder.driver_profile_id ?? null, // INCLUSÃO DO driver_profile_id
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedOrder.id)
        .eq('restaurant_id', updatedOrder.restaurant_id)
        .select()
        .single();

      if (error) {
        console.error('OrderContext: Erro ao atualizar pedido:', error);
        toast.error('Erro ao atualizar pedido: ' + error.message);
        throw error;
      }

      toast.success('Pedido atualizado com sucesso!');
      return data as Order;
    },
    [profile, isAdmin, isSuperAdmin, isCustomer, currentRestaurant]
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      if (!profile?.id) {
        toast.error('Você precisa estar logado para cancelar um pedido.');
        throw new Error('Usuário não autenticado.');
      }

      const { data: orderToCancel, error: fetchError } = await supabase
        .from('orders')
        .select('id, profile_id, restaurant_id')
        .eq('id', orderId)
        .single();

      if (fetchError || !orderToCancel) {
        toast.error('Pedido não encontrado.');
        throw new Error('Order not found.');
      }

      const isAuthorized =
        isSuperAdmin ||
        (isAdmin && orderToCancel.restaurant_id === currentRestaurant?.id) ||
        (isCustomer &&
          orderToCancel.profile_id === profile.id &&
          orderToCancel.restaurant_id === profile.restaurant_id);

      if (!isAuthorized) {
        toast.error('Acesso não autorizado para cancelar este pedido.');
        throw new Error('Unauthorized access.');
      }

      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'Cancelado', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('restaurant_id', orderToCancel.restaurant_id)
        .select()
        .single();

      if (error) {
        console.error('OrderContext: Erro ao cancelar pedido:', error);
        toast.error('Erro ao cancelar pedido.');
        throw error;
      }

      toast.info(`Pedido ${orderId} foi cancelado.`);
      return data as Order;
    },
    [profile, isAdmin, isSuperAdmin, isCustomer, currentRestaurant]
  );

  const deleteOrder = useCallback(
    async (orderId: string) => {
      if (!profile?.id) {
        toast.error('Você precisa estar logado para excluir um pedido.');
        throw new Error('Usuário não autenticado.');
      }

      const { data: orderToDelete, error: fetchError } = await supabase
        .from('orders')
        .select('id, profile_id, restaurant_id')
        .eq('id', orderId)
        .single();

      if (fetchError || !orderToDelete) {
        toast.error('Pedido não encontrado.');
        throw new Error('Order not found.');
      }

      const isAuthorized =
        isSuperAdmin ||
        (isAdmin && orderToDelete.restaurant_id === currentRestaurant?.id) ||
        (isCustomer &&
          orderToDelete.profile_id === profile.id &&
          orderToDelete.restaurant_id === profile.restaurant_id);

      if (!isAuthorized) {
        toast.error('Acesso não autorizado para excluir este pedido.');
        throw new Error('Unauthorized access.');
      }

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .eq('restaurant_id', orderToDelete.restaurant_id);

      if (error) {
        console.error('OrderContext: Erro ao excluir pedido:', error);
        toast.error('Erro ao excluir pedido.');
        throw error;
      }

      toast.success(`Pedido ${orderId} foi excluído.`);
      return orderToDelete.id;
    },
    [profile, isAdmin, isSuperAdmin, isCustomer, currentRestaurant]
  );

  return {
    addOrder,
    updateOrder,
    cancelOrder,
    deleteOrder,
  };
};
