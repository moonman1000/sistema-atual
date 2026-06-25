import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/context/SessionContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { toast } from 'sonner';
import { Delivery } from '@/context/DeliveryContext';
import { Order } from '@/context/OrderContext';

// Este hook encapsula a lógica de mutação de entregas.
export const useDeliveryMutations = (
  setNewDeliveryIds: React.Dispatch<React.SetStateAction<string[]>>,
  updateOrderInOrderContext: (updatedOrder: Order) => Promise<void>,
  orders: Order[]
) => {
  const { profile, isAdmin, isSuperAdmin, isCustomer } = useSession();
  const { currentRestaurant, allRestaurants, resolveRestaurantIdentifier } = useRestaurant();

  // Helper: resolve restaurant_id com múltiplos fallbacks
  const resolveRestaurantIdForDelivery = useCallback(async (maybeDeliveryData?: Partial<Delivery>) : Promise<string | null> => {
    if (maybeDeliveryData?.orderid) {
      const referencedOrder = orders?.find(o => o.id === maybeDeliveryData.orderid);
      if (referencedOrder?.restaurant_id) {
        console.log('[useDeliveryMutations] Resolved restaurant_id from order:', referencedOrder.restaurant_id);
        return referencedOrder.restaurant_id;
      }
    }

    if (currentRestaurant?.id) {
      console.log('[useDeliveryMutations] Resolved restaurant_id from currentRestaurant:', currentRestaurant.id);
      return currentRestaurant.id;
    }

    const stored = typeof window !== 'undefined' ? localStorage.getItem('deliveryDriverRestaurantId') : null;
    if (stored) {
      if (stored.length === 36 && stored.includes('-')) {
        console.log('[useDeliveryMutations] Resolved restaurant_id from localStorage (uuid):', stored);
        return stored;
      }
      if (resolveRestaurantIdentifier) {
        try {
          const resolved = await resolveRestaurantIdentifier(stored);
          if (resolved?.id) {
            console.log('[useDeliveryMutations] Resolved restaurant_id from localStorage via resolveRestaurantIdentifier:', resolved.id);
            return resolved.id;
          }
        } catch (err) {
          console.warn('[useDeliveryMutations] resolveRestaurantIdentifier failed for', stored, err);
        }
      }
    }

    if (Array.isArray(allRestaurants) && allRestaurants.length > 0) {
      console.warn('[useDeliveryMutations] Falling back to first restaurant in allRestaurants:', allRestaurants[0].id);
      return allRestaurants[0].id;
    }

    console.warn('[useDeliveryMutations] Could not resolve restaurant_id for delivery');
    return null;
  }, [orders, currentRestaurant?.id, allRestaurants, resolveRestaurantIdentifier]);

  const getTargetRestaurantId = useCallback(async (maybeDeliveryData?: Partial<Delivery>) => {
    return await resolveRestaurantIdForDelivery(maybeDeliveryData);
  }, [resolveRestaurantIdForDelivery]);

  const addDelivery = useCallback(async (newDeliveryData: Omit<Delivery, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => {
    const targetRestaurantId = await getTargetRestaurantId(newDeliveryData);
    if (!targetRestaurantId) {
      toast.error("Não foi possível determinar o restaurante para adicionar a entrega.");
      console.error("useDeliveryMutations.addDelivery: failed to resolve restaurant_id", { newDeliveryData });
      throw new Error("Restaurant ID not available.");
    }

    const safePayload = {
      ...newDeliveryData,
      restaurant_id: targetRestaurantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      problem_resolved: newDeliveryData.problem_resolved ?? false,
      driver_profile_id: newDeliveryData.driver_profile_id ?? null, // INCLUSÃO DO driver_profile_id
    };

    console.log('[useDeliveryMutations] Inserting delivery payload:', safePayload);

    const { data, error } = await supabase
      .from('deliveries')
      .insert(safePayload)
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar entrega:", error, safePayload);
      toast.error("Erro ao adicionar entrega.");
      throw error;
    }

    const addedDelivery = data as Delivery;
    
    const orderToUpdate = orders.find(order => order.id === addedDelivery.orderid);
    if (orderToUpdate) {
      try {
        await updateOrderInOrderContext({ ...orderToUpdate, tracking_link: addedDelivery.trackinglink, status: addedDelivery.status });
      } catch (err) {
        console.warn('useDeliveryMutations.addDelivery: failed to update order context', err);
      }
    }

    return addedDelivery;
  }, [getTargetRestaurantId, updateOrderInOrderContext, orders]);

  const updateDelivery = useCallback(async (updatedDelivery: Delivery) => {
    const resolvedRestaurantId = await getTargetRestaurantId(updatedDelivery);
    if (!resolvedRestaurantId) {
      toast.error("Não foi possível determinar o restaurante para atualizar a entrega.");
      console.error("useDeliveryMutations.updateDelivery: failed to resolve restaurant_id", { updatedDelivery });
      throw new Error("Restaurant ID not available.");
    }

    if (updatedDelivery.restaurant_id && updatedDelivery.restaurant_id !== resolvedRestaurantId && !(isAdmin || isSuperAdmin)) {
      toast.error("Acesso não autorizado para atualizar esta entrega.");
      console.error("useDeliveryMutations.updateDelivery: unauthorized update attempt", { updatedDelivery, resolvedRestaurantId });
      throw new Error("Unauthorized access or invalid restaurant ID.");
    }

    const updatePayload = {
      orderid: updatedDelivery.orderid,
      clientname: updatedDelivery.clientname,
      client_address: updatedDelivery.client_address,
      deliveryman: updatedDelivery.deliveryman,
      status: updatedDelivery.status,
      estimateddeliverytime: updatedDelivery.estimateddeliverytime,
      actualdeliverytime: updatedDelivery.actualdeliverytime,
      trackinglink: updatedDelivery.trackinglink,
      problem_description: updatedDelivery.problem_description,
      problem_resolved: updatedDelivery.problem_resolved,
      updated_at: new Date().toISOString(),
      driver_profile_id: updatedDelivery.driver_profile_id ?? null, // INCLUSÃO DO driver_profile_id
    };

    console.log('[useDeliveryMutations] Updating delivery id=', updatedDelivery.id, 'payload=', updatePayload);

    const { data, error } = await supabase
      .from('deliveries')
      .update(updatePayload)
      .eq('id', updatedDelivery.id)
      .eq('restaurant_id', resolvedRestaurantId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar entrega:", error, updatePayload);
      toast.error("Erro ao atualizar entrega.");
      throw error;
    }

    const updatedDeliveryData = data as Delivery;

    const orderToUpdate = orders.find(order => order.id === updatedDeliveryData.orderid);
    if (orderToUpdate) {
      try {
        await updateOrderInOrderContext({ ...orderToUpdate, tracking_link: updatedDeliveryData.trackinglink, status: updatedDeliveryData.status });
      } catch (err) {
        console.warn('useDeliveryMutations.updateDelivery: failed to update order context', err);
      }
    }

    if (['Entregue', 'Recusado', 'Problema', 'Devolvido'].includes(updatedDeliveryData.status)) {
      setNewDeliveryIds(prev => [...prev, updatedDeliveryData.id]);
    }

    return updatedDeliveryData;
  }, [getTargetRestaurantId, updateOrderInOrderContext, orders, isAdmin, isSuperAdmin]);

  const deleteDelivery = useCallback(async (deliveryId: string) => {
    const resolvedRestaurantId = await getTargetRestaurantId();
    if (!resolvedRestaurantId) {
      toast.error("Não foi possível determinar o restaurante para excluir a entrega.");
      console.error("useDeliveryMutations.deleteDelivery: failed to resolve restaurant_id", { deliveryId });
      throw new Error("Restaurant ID not available.");
    }

    console.log('[useDeliveryMutations] Deleting delivery id=', deliveryId, 'restaurant_id=', resolvedRestaurantId);

    const { error } = await supabase
      .from('deliveries')
      .delete()
      .eq('id', deliveryId)
      .eq('restaurant_id', resolvedRestaurantId);

    if (error) {
      console.error("Erro ao excluir entrega:", error, { deliveryId, resolvedRestaurantId });
      toast.error("Erro ao excluir entrega.");
      throw error;
    }

    return deliveryId;
  }, [getTargetRestaurantId]);

  return {
    addDelivery,
    updateDelivery,
    deleteDelivery,
  };
};
