import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../integrations/supabase/client";
import { useSession } from "./SessionContext.tsx 08.02.2026";
import { useRestaurant } from "./RestaurantContext";
import { toast } from "sonner";

// Criando o contexto e exportando para uso externo se necessário
const OrderContext = createContext();

export { OrderContext };
export const useOrders = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
  const { session, profile } = useSession();
  const { currentRestaurant } = useRestaurant();

  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // 🔔 Listener estável para novas vendas
  useEffect(() => {
    // Evita rodar até o restaurante realmente estar carregado e com id válido
    if (!currentRestaurant || !currentRestaurant.id) {
      console.log("⏳ OrderContext: aguardando restaurante ser carregado...");
      return;
    }

    console.log("🔔 OrderContext: Listener iniciado para:", currentRestaurant.name);

    const channel = supabase
      .channel(`orders-${currentRestaurant.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${currentRestaurant.id}`,
        },
        async (payload) => {
          console.log("🛒 Nova venda detectada:", payload.new);
          setOrders((prev) => [payload.new, ...prev]);
          toast.success(`💰 Nova venda concluída em ${currentRestaurant.name}!`);

          // 🔉 Tocar som somente se o usuário tiver habilitado
          try {
            const soundEnabled = localStorage.getItem("soundEnabled") === "true";

            if (soundEnabled) {
              const audio = new Audio("/sounds/sale-success.mp3");
              audio.volume = 0.7;
              await audio.play();
              console.log("🔊 Som de nova venda tocado!");
            } else {
              console.log("🔇 Som desativado ou não permitido — sem reprodução.");
            }
          } catch (error) {
            console.error("Erro ao tocar som de venda:", error);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Listener de pedidos ativo para:", currentRestaurant.name);
          console.log("🔍 Monitorando restaurant_id:", currentRestaurant.id);
        }
      });

    return () => {
      console.log("🧹 OrderContext: Removendo listener de vendas...");
      supabase.removeChannel(channel);
    };
  }, [currentRestaurant?.id]);

  // 🚚 Buscar pedidos — apenas quando o restaurante existir
  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentRestaurant?.id || !profile?.id) {
        console.log("⏳ OrderContext: esperando dados antes de buscar pedidos...");
        return;
      }

      setIsLoadingOrders(true);
      console.log(
        "OrderContext: Buscando pedidos para restaurante:",
        currentRestaurant.name,
        "— ID:",
        currentRestaurant.id
      );

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", currentRestaurant.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar pedidos:", error);
      } else {
        setOrders(data || []);
        console.log("OrderContext: Pedidos carregados com sucesso:", data || []);
      }

      setIsLoadingOrders(false);
    };

    fetchOrders();
  }, [currentRestaurant?.id, profile?.id]);

  // ✅ Função para adicionar um novo pedido
  const addOrder = async (orderData) => {
    try {
      console.log("OrderContext: Iniciando criação de pedido...", orderData);

      // 🔒 Garantir que o restaurant_id está presente
      let finalRestaurantId = orderData.restaurant_id || currentRestaurant?.id;

      if (!finalRestaurantId) {
        throw new Error("restaurant_id não está disponível para criar o pedido.");
      }

      // 🔒 Se o perfil não tem restaurant_id, atualizar agora (fallback)
      if (profile && !profile.restaurant_id && finalRestaurantId) {
        console.log(
          "OrderContext: Perfil sem restaurant_id. Atualizando para:",
          finalRestaurantId
        );

        const { error: profileError } = await supabase
          .from("profiles")
          .update({ restaurant_id: finalRestaurantId })
          .eq("id", profile.id);

        if (profileError) {
          console.error("OrderContext: Erro ao atualizar perfil:", profileError);
          // ⚠️ Não bloqueia o pedido — continua mesmo se falhar
        } else {
          console.log("OrderContext: Perfil atualizado com sucesso!");
        }
      }

      // 📦 Criar o pedido no banco
      const { data, error } = await supabase
        .from("orders")
        .insert([
          {
            ...orderData,
            restaurant_id: finalRestaurantId,
            profile_id: profile?.id || orderData.profile_id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("OrderContext: Erro ao criar pedido:", error);
        throw error;
      }

      console.log("OrderContext: Pedido criado com sucesso:", data);

      // Adiciona localmente (o listener também vai adicionar, mas isso garante UI instantânea)
      setOrders((prev) => [data, ...prev]);

      return data;
    } catch (error) {
      console.error("OrderContext: Erro em addOrder:", error);
      throw error;
    }
  };

  return (
    <OrderContext.Provider value={{ orders, isLoadingOrders, addOrder }}>
      {children}
    </OrderContext.Provider>
  );
};