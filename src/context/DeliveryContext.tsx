import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
  useCallback,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrders } from "./OrderContext"; // ✅ Alterado para usar o hook correto
import { useSession } from "./SessionContext";
import { useRestaurant } from "./RestaurantContext";
import { useDeliveryMutations } from "@/hooks/useDeliveryMutations";
import { soundManager } from "@/lib/soundManager";

export interface Delivery {
  id: string;
  orderid: string;
  clientname: string;
  client_address: string;
  deliveryman: string;
  driver_profile_id?: string | null;
  status:
    | "Atribuído"
    | "Em Entrega"
    | "Entregue"
    | "Problema"
    | "Recusado"
    | "Devolvido";
  estimateddeliverytime: string;
  actualdeliverytime?: string;
  trackinglink?: string;
  restaurant_id: string | null;
  created_at?: string;
  updated_at?: string;
  problem_description?: string | null;
  problem_resolved?: boolean | null;
}

interface DeliveryContextType {
  deliveries: Delivery[];
  addDelivery: (
    newDelivery: Omit<
      Delivery,
      "id" | "restaurant_id" | "created_at" | "updated_at"
    >
  ) => Promise<void>;
  updateDelivery: (updatedDelivery: Delivery) => Promise<void>;
  deleteDelivery: (deliveryId: string) => Promise<void>;
  isLoadingDeliveries: boolean;
  fetchDeliveries: (restaurantId?: string | null) => Promise<void>;
  fetchDeliveriesByDriver: (driverId?: string | null) => Promise<void>;
  newDeliveryIds: string[];
  markDeliveryAsViewed: (deliveryId: string) => void;
  markDeliveryAsResolved: (deliveryId: string) => Promise<void>;
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

export const DeliveryProvider = ({ children }: { children: ReactNode }) => {
  const { session, profile, isLoading: isLoadingSession, isAdmin, isCustomer, isSuperAdmin } =
    useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();

  // ✅ CORREÇÃO: Acessando o contexto de pedidos através do hook useOrders
  const {
    orders,
    isLoadingOrders,
    updateOrder: updateOrderInOrderContext,
  } = useOrders();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(true);
  const [newDeliveryIds, setNewDeliveryIds] = useState<string[]>([]);

  const markDeliveryAsViewed = useCallback((deliveryId: string) => {
    setNewDeliveryIds((prev) => prev.filter((id) => id !== deliveryId));
  }, []);

  const {
    addDelivery: addDeliveryMutation,
    updateDelivery: updateDeliveryMutation,
    deleteDelivery: deleteDeliveryMutation,
  } = useDeliveryMutations(setNewDeliveryIds, updateOrderInOrderContext, orders);

  // Util: detecta se é papel de entregador
  const isDriverRole = (role?: string | null) => {
    if (!role) return false;
    const r = role.toLowerCase();
    return r.includes("entreg") || r.includes("driver");
  };

  // Helper: tenta mapear nome do entregador -> driver_profile_id consultando tabela employees
  const findDriverUidByName = useCallback(async (name?: string | null) => {
    if (!name) return null;
    try {
      const normalized = String(name).trim();
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, name, email")
        .or(`first_name.ilike.%${normalized}%,last_name.ilike.%${normalized}%,name.ilike.%${normalized}%`)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn("findDriverUidByName: supabase error", error);
        return null;
      }
      return (data as any)?.id ?? null;
    } catch (err) {
      console.error("findDriverUidByName exception:", err);
      return null;
    }
  }, []);

  // Fetch deliveries by restaurant
  const fetchDeliveries = useCallback(async (restaurantId?: string | null) => {
    if (!restaurantId) {
      setDeliveries([]);
      setIsLoadingDeliveries(false);
      return;
    }

    setIsLoadingDeliveries(true);
    try {
      const { data, error } = await supabase
        .from<Delivery>("deliveries")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar entregas por restaurante:", error);
        toast.error("Erro ao carregar entregas.");
        setDeliveries([]);
      } else {
        setDeliveries((data as Delivery[]) || []);
      }
    } catch (err) {
      console.error("fetchDeliveries exception:", err);
      toast.error("Erro inesperado ao carregar entregas.");
      setDeliveries([]);
    } finally {
      setIsLoadingDeliveries(false);
    }
  }, []);

  // Fetch deliveries by driver_profile_id
  const fetchDeliveriesByDriver = useCallback(async (driverId?: string | null) => {
    if (!driverId) {
      setDeliveries([]);
      setIsLoadingDeliveries(false);
      return;
    }

    setIsLoadingDeliveries(true);
    try {
      const { data, error } = await supabase
        .from<Delivery>("deliveries")
        .select("*")
        .eq("driver_profile_id", driverId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar entregas por driver:", error);
        toast.error("Erro ao carregar entregas do entregador.");
        setDeliveries([]);
      } else {
        setDeliveries((data as Delivery[]) || []);
      }
    } catch (err) {
      console.error("fetchDeliveriesByDriver exception:", err);
      toast.error("Erro inesperado ao carregar entregas do entregador.");
      setDeliveries([]);
    } finally {
      setIsLoadingDeliveries(false);
    }
  }, []);

  // Wrapper para determinar fetch inicial/subscriptions
  useEffect(() => {
    let cancelled = false;
    let channel: any = null;

    const run = async () => {
      const isDriver = isDriverRole(profile?.role);
      const targetRestaurantId = isAdmin || isSuperAdmin ? currentRestaurant?.id : profile?.restaurant_id;

      // If not authenticated or no relevant role -> clear and stop
      if (!session || (!isAdmin && !isSuperAdmin && !isCustomer && !isDriver)) {
        setIsLoadingDeliveries(false);
        return;
      }

      if (isLoadingSession || isLoadingRestaurants) {
        setIsLoadingDeliveries(true);
        return;
      }

      // Admin/SuperAdmin/Customer path (restaurant-scoped)
      if (session && (targetRestaurantId || isSuperAdmin) && !isDriver) {
        if (targetRestaurantId) {
          await fetchDeliveries(targetRestaurantId);
        } else {
          setDeliveries([]);
        }

        // cleanup previous channel
        if (channel) {
          supabase.removeChannel(channel);
          channel = null;
        }

        if (targetRestaurantId) {
          channel = supabase
            .channel(`deliveries_channel_${targetRestaurantId}`)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "deliveries",
                filter: `restaurant_id=eq.${targetRestaurantId}`,
              },
              async (payload) => {
                const newDelivery = payload.new as Delivery;
                const oldDelivery = payload.old as Delivery;

                // refetch to keep ordering and full sync
                await fetchDeliveries(targetRestaurantId);

                if (payload.eventType === "INSERT") {
                  setNewDeliveryIds((prev) => [...prev, newDelivery.id]);
                  if ((isAdmin || isSuperAdmin) && currentRestaurant?.receive_delivery_notifications) {
                    soundManager.playSaleSound();
                  }
                } else if (payload.eventType === "UPDATE") {
                  // if status transitioned into noteworthy state -> notify
                  if (newDelivery.status === "Entregue" && oldDelivery.status !== "Entregue") {
                    setNewDeliveryIds((prev) => [...prev, newDelivery.id]);
                    if ((isAdmin || isSuperAdmin) && currentRestaurant?.receive_delivery_notifications) {
                      soundManager.playSaleSound();
                    }
                  } else if (
                    (newDelivery.status === "Problema" ||
                      newDelivery.status === "Recusado" ||
                      newDelivery.status === "Devolvido") &&
                    (oldDelivery.status !== "Problema" &&
                      oldDelivery.status !== "Recusado" &&
                      oldDelivery.status !== "Devolvido")
                  ) {
                    setNewDeliveryIds((prev) => [...prev, newDelivery.id]);
                    if ((isAdmin || isSuperAdmin) && currentRestaurant?.receive_delivery_notifications) {
                      soundManager.playSaleSound();
                    }
                  }
                } else if (payload.eventType === "DELETE") {
                  setNewDeliveryIds((prev) => prev.filter((id) => id !== (oldDelivery?.id ?? "")));
                }
              }
            )
            .subscribe();
        }
        return;
      }

      // Driver-specific path
      if (session && isDriver) {
        const driverId = profile?.id;
        if (!driverId) {
          setDeliveries([]);
          setIsLoadingDeliveries(false);
          return;
        }

        await fetchDeliveriesByDriver(driverId);

        if (channel) {
          supabase.removeChannel(channel);
          channel = null;
        }

        channel = supabase
          .channel(`deliveries_channel_driver_${driverId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "deliveries",
              filter: `driver_profile_id=eq.${driverId}`,
            },
            async (payload) => {
              const newDelivery = payload.new as Delivery;
              const oldDelivery = payload.old as Delivery;

              await fetchDeliveriesByDriver(driverId);

              if (payload.eventType === "INSERT") {
                setNewDeliveryIds((prev) => [...prev, newDelivery.id]);
              } else if (payload.eventType === "UPDATE") {
                if (newDelivery.status === "Entregue" && oldDelivery.status !== "Entregue") {
                  setNewDeliveryIds((prev) => [...prev, newDelivery.id]);
                } else if (
                  (newDelivery.status === "Problema" ||
                    newDelivery.status === "Recusado" ||
                    newDelivery.status === "Devolvido") &&
                  (oldDelivery.status !== "Problema" &&
                    oldDelivery.status !== "Recusado" &&
                    oldDelivery.status !== "Devolvido")
                ) {
                  setNewDeliveryIds((prev) => [...prev, newDelivery.id]);
                }
              } else if (payload.eventType === "DELETE") {
                setNewDeliveryIds((prev) => prev.filter((id) => id !== (oldDelivery?.id ?? "")));
              }
            }
          )
          .subscribe();

        return;
      }

      // fallback
      setIsLoadingDeliveries(false);
    };

    run();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoadingSession,
    isLoadingOrders,
    isLoadingRestaurants,
    session,
    profile?.restaurant_id,
    profile?.role,
    profile?.id,
    currentRestaurant?.id,
    isAdmin,
    isCustomer,
    isSuperAdmin,
    currentRestaurant?.receive_delivery_notifications,
    fetchDeliveries,
    fetchDeliveriesByDriver,
  ]);

  // addDelivery: garante driver_profile_id e restaurant_id antes de chamar mutation
  const handleAddDelivery = useCallback(
    async (
      newDeliveryData: Omit<
        Delivery,
        "id" | "restaurant_id" | "created_at" | "updated_at"
      >
    ) => {
      setIsLoadingDeliveries(true);
      try {
        // Determine restaurant_id (prefer explicit, else currentRestaurant or profile)
        const restaurantId =
          (newDeliveryData as any).restaurant_id ??
          currentRestaurant?.id ??
          profile?.restaurant_id ??
          null;

        let driverId = newDeliveryData.driver_profile_id ?? null;

        // If driver_profile_id not provided but deliveryman name is present, try map
        if (!driverId && newDeliveryData.deliveryman) {
          driverId = await findDriverUidByName(newDeliveryData.deliveryman);
        }

        const payload = {
          ...newDeliveryData,
          driver_profile_id: driverId,
          restaurant_id: restaurantId,
        };

        const added = await addDeliveryMutation(payload as any);

        // Expect added to be the inserted delivery object
        if (!added) throw new Error("addDeliveryMutation retornou vazio.");

        setDeliveries((prev) => [added, ...prev.filter((d) => d.id !== added.id)]);
        setNewDeliveryIds((prev) => [...prev, added.id]);

        toast.success("Entrega adicionada com sucesso!");
      } catch (err: any) {
        console.error("DeliveryContext.handleAddDelivery error:", err);
        toast.error("Falha ao adicionar entrega: " + (err?.message ?? String(err)));
      } finally {
        setIsLoadingDeliveries(false);
      }
    },
    [addDeliveryMutation, currentRestaurant?.id, profile?.restaurant_id, findDriverUidByName]
  );

  // updateDelivery: garante driver_profile_id quando possível
  const handleUpdateDelivery = useCallback(
    async (updatedDelivery: Delivery) => {
      setIsLoadingDeliveries(true);
      try {
        let driverId = updatedDelivery.driver_profile_id ?? null;

        if (!driverId && updatedDelivery.deliveryman) {
          driverId = await findDriverUidByName(updatedDelivery.deliveryman);
        }

        const payload = {
          ...updatedDelivery,
          driver_profile_id: driverId ?? null,
        };

        const updated = await updateDeliveryMutation(payload as any);

        if (!updated) throw new Error("updateDeliveryMutation retornou vazio.");

        setDeliveries((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        toast.success("Entrega atualizada com sucesso!");
      } catch (err: any) {
        console.error("DeliveryContext.handleUpdateDelivery error:", err);
        toast.error("Falha ao atualizar entrega: " + (err?.message ?? String(err)));
      } finally {
        setIsLoadingDeliveries(false);
      }
    },
    [updateDeliveryMutation, findDriverUidByName]
  );

  const handleDeleteDelivery = useCallback(
    async (deliveryId: string) => {
      setIsLoadingDeliveries(true);
      try {
        const deletedId = await deleteDeliveryMutation(deliveryId);

        setDeliveries((prev) => prev.filter((d) => d.id !== deletedId));
        setNewDeliveryIds((prev) => prev.filter((id) => id !== deletedId));
        toast.success("Entrega excluída com sucesso.");
      } catch (err: any) {
        console.error("DeliveryContext.handleDeleteDelivery error:", err);
        toast.error("Falha ao excluir entrega: " + (err?.message ?? String(err)));
      } finally {
        setIsLoadingDeliveries(false);
      }
    },
    [deleteDeliveryMutation]
  );

  const markDeliveryAsResolved = useCallback(
    async (deliveryId: string) => {
      const d = deliveries.find((x) => x.id === deliveryId);
      if (!d) {
        toast.error("Entrega não encontrada.");
        return;
      }
      try {
        await updateDeliveryMutation({ ...d, problem_resolved: true } as any);
        setDeliveries((prev) => prev.map((x) => (x.id === deliveryId ? { ...x, problem_resolved: true } : x)));
        toast.success("Problema marcado como resolvido.");
      } catch (err: any) {
        console.error("markDeliveryAsResolved error:", err);
        toast.error("Falha ao marcar como resolvido.");
      }
    },
    [deliveries, updateDeliveryMutation]
  );

  const contextValue = useMemo(
    () => ({
      deliveries,
      addDelivery: handleAddDelivery,
      updateDelivery: handleUpdateDelivery,
      deleteDelivery: handleDeleteDelivery,
      isLoadingDeliveries,
      fetchDeliveries,
      fetchDeliveriesByDriver,
      newDeliveryIds,
      markDeliveryAsViewed,
      markDeliveryAsResolved,
    }),
    [
      deliveries,
      handleAddDelivery,
      handleUpdateDelivery,
      handleDeleteDelivery,
      isLoadingDeliveries,
      fetchDeliveries,
      fetchDeliveriesByDriver,
      newDeliveryIds,
      markDeliveryAsViewed,
      markDeliveryAsResolved,
    ]
  );

  return <DeliveryContext.Provider value={contextValue}>{children}</DeliveryContext.Provider>;
};

export const useDeliveries = (): DeliveryContextType => {
  const ctx = useContext(DeliveryContext);
  if (!ctx) throw new Error("useDeliveries must be used within DeliveryProvider");
  return ctx;
};
