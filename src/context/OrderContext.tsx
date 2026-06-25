import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEmployees } from "@/context/EmployeeContext"; // ajuste se o hook tiver outro nome

// Tipagens mínimas — ajuste conforme sua schema real
export interface Order {
  id: string;
  status?: string;
  restaurant_id?: string | null;
  clientname?: string;
  // ... outros campos do pedido
}

export interface DeliveryPayload {
  orderid: string;
  deliveryman?: string | null; // nome para exibição
  driver_profile_id?: string | null; // UID (essencial)
  status?: string;
  restaurant_id?: string | null;
  estimateddeliverytime?: string | null;
  trackinglink?: string | null;
  problem_description?: string | null;
  problem_resolved?: boolean | null;
  // ... outros campos
}

interface OrderContextType {
  orders: Order[] | null;
  isLoadingOrders: boolean;
  fetchOrders: (restaurantId?: string | null) => Promise<void>;
  addOrder: (orderPayload: Partial<Order>, assignDelivery?: { deliverymanName?: string; deliverymanId?: string } | null) => Promise<Order | null>;
  updateOrder: (orderPayload: Partial<Order>, assignDelivery?: { deliverymanName?: string; deliverymanId?: string } | null) => Promise<Order | null>;
  deleteOrder: (orderId: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);

  // EmployeeContext deve expor availableDeliverymen: {id, name}[]
  const { availableDeliverymen } = useEmployees();

  const findDriverUidByName = useCallback(
    (name?: string | null) => {
      if (!name) return null;
      const normalized = String(name).trim().toLowerCase();
      const found = (availableDeliverymen || []).find(
        (d: { id: string; name: string }) => String(d.name || "").trim().toLowerCase() === normalized
      );
      return found ? found.id : null;
    },
    [availableDeliverymen]
  );

  const fetchOrders = useCallback(async (restaurantId?: string | null) => {
    setIsLoadingOrders(true);
    try {
      let query = supabase.from<Order>("orders").select("*");
      if (restaurantId) {
        query = query.eq("restaurant_id", restaurantId);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) {
        console.error("fetchOrders error:", error);
        toast.error("Erro ao buscar pedidos.");
        setOrders([]);
      } else {
        setOrders(data || []);
      }
    } catch (err) {
      console.error("fetchOrders exception:", err);
      toast.error("Erro inesperado ao buscar pedidos.");
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  // Helper: garante que exista uma delivery para um order (insere ou atualiza)
  const upsertDeliveryForOrder = useCallback(
    async (orderId: string, restaurantId: string | null, assignment?: { deliverymanName?: string; deliverymanId?: string }, deliveryFields?: Partial<DeliveryPayload>) => {
      // resolve driver_profile_id: prefer explicit id, else try map by name
      let resolvedDriverId: string | null = null;
      if (assignment?.deliverymanId) resolvedDriverId = assignment.deliverymanId;
      else if (assignment?.deliverymanName) {
        resolvedDriverId = findDriverUidByName(assignment.deliverymanName);
      } else if (deliveryFields?.driver_profile_id) resolvedDriverId = deliveryFields.driver_profile_id || null;

      const displayName =
        assignment?.deliverymanName || deliveryFields?.deliveryman || null;

      // check if a delivery row for this order already exists
      const { data: existing, error: selectErr } = await supabase
        .from<DeliveryPayload>("deliveries")
        .select("*")
        .eq("orderid", orderId)
        .limit(1)
        .maybeSingle();

      if (selectErr) {
        console.error("upsertDeliveryForOrder: error selecting existing delivery", selectErr);
        // don't block order flow — bubble up if desired
      }

      if (existing) {
        // update existing delivery with new assignment info
        const updatePayload: Partial<DeliveryPayload> = {
          deliveryman: displayName ?? existing.deliveryman,
          driver_profile_id: resolvedDriverId ?? existing.driver_profile_id ?? null,
          restaurant_id: restaurantId ?? existing.restaurant_id ?? null,
          ...deliveryFields,
        };

        const { error: updErr } = await supabase
          .from("deliveries")
          .update(updatePayload)
          .eq("id", (existing as any).id);

        if (updErr) {
          console.error("upsertDeliveryForOrder: error updating delivery", updErr);
          throw new Error("Falha ao atualizar entrega.");
        }

        return (existing as any);
      } else {
        // insert new delivery row
        const insertPayload: any = {
          orderid,
          deliveryman: displayName ?? null,
          driver_profile_id: resolvedDriverId ?? null,
          restaurant_id: restaurantId ?? null,
          status: (deliveryFields && deliveryFields.status) || "Atribuído",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...deliveryFields,
        };

        const { data: insData, error: insErr } = await supabase
          .from("deliveries")
          .insert(insertPayload)
          .select("*")
          .single();

        if (insErr) {
          console.error("upsertDeliveryForOrder: error inserting delivery", insErr);
          throw new Error("Falha ao criar entrega.");
        }

        return insData as any;
      }
    },
    [findDriverUidByName]
  );

  const addOrder = useCallback(
    async (orderPayload: Partial<Order>, assignDelivery?: { deliverymanName?: string; deliverymanId?: string } | null) => {
      try {
        // Ensure restaurant_id present if provided in payload
        const payloadToInsert: any = {
          ...orderPayload,
        };

        const { data: createdOrder, error: insertErr } = await supabase
          .from<Order>("orders")
          .insert(payloadToInsert)
          .select("*")
          .single();

        if (insertErr || !createdOrder) {
          console.error("addOrder insert error:", insertErr);
          toast.error("Falha ao criar pedido.");
          return null;
        }

        // If assignment requested, create delivery row
        if (assignDelivery) {
          try {
            await upsertDeliveryForOrder(
              createdOrder.id,
              createdOrder.restaurant_id ?? null,
              assignDelivery,
              {
                status: "Atribuído",
              }
            );
          } catch (delErr) {
            console.error("addOrder: delivery upsert failed:", delErr);
            // We choose to notify but not rollback the order creation automatically
            toast.error("Pedido criado, mas falha ao criar entrega.");
          }
        }

        // refresh local list (simple approach)
        await fetchOrders(createdOrder.restaurant_id ?? null);
        toast.success("Pedido criado com sucesso.");
        return createdOrder;
      } catch (err) {
        console.error("addOrder exception:", err);
        toast.error("Erro ao criar pedido.");
        return null;
      }
    },
    [fetchOrders, upsertDeliveryForOrder]
  );

  const updateOrder = useCallback(
    async (orderPayload: Partial<Order> & { id: string }, assignDelivery?: { deliverymanName?: string; deliverymanId?: string } | null) => {
      try {
        const { id, ...rest } = orderPayload;
        const { data: updatedOrder, error: updErr } = await supabase
          .from<Order>("orders")
          .update(rest)
          .eq("id", id)
          .select("*")
          .single();

        if (updErr || !updatedOrder) {
          console.error("updateOrder error:", updErr);
          toast.error("Falha ao atualizar pedido.");
          return null;
        }

        // If assignment was passed, upsert delivery accordingly
        if (assignDelivery) {
          try {
            await upsertDeliveryForOrder(updatedOrder.id, updatedOrder.restaurant_id ?? null, assignDelivery);
          } catch (delErr) {
            console.error("updateOrder: delivery upsert failed:", delErr);
            toast.error("Pedido atualizado, mas falha ao atribuir entregador.");
          }
        }

        // optionally: if order status changed to a final state and you want to update delivery status too,
        // you can also update deliveries here (omitted for brevity).

        await fetchOrders(updatedOrder.restaurant_id ?? null);
        toast.success("Pedido atualizado com sucesso.");
        return updatedOrder;
      } catch (err) {
        console.error("updateOrder exception:", err);
        toast.error("Erro ao atualizar pedido.");
        return null;
      }
    },
    [fetchOrders, upsertDeliveryForOrder]
  );

  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      const { error } = await supabase.from("orders").delete().eq("id", orderId);
      if (error) {
        console.error("deleteOrder error:", error);
        toast.error("Falha ao excluir pedido.");
        return;
      }
      // Optionally delete related deliveries
      await supabase.from("deliveries").delete().eq("orderid", orderId);
      await fetchOrders(null);
      toast.success("Pedido excluído.");
    } catch (err) {
      console.error("deleteOrder exception:", err);
      toast.error("Erro ao excluir pedido.");
    }
  }, [fetchOrders]);

  // initial fetch optional — you may want to drive fetch from components with restaurant context
  useEffect(() => {
    // no automatic fetch here to avoid guessing restaurant; components call fetchOrders explicitly
  }, []);

  const value: OrderContextType = {
    orders,
    isLoadingOrders,
    fetchOrders,
    addOrder,
    updateOrder,
    deleteOrder,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

export const useOrders = (): OrderContextType => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within OrderProvider");
  return ctx;
};
