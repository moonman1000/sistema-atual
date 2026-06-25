import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from './SessionContext.tsx';
import { useRestaurant } from './RestaurantContext';
import { toast } from 'sonner';

export interface Promotion {
  id: string;
  name: string;
  description: string;
  discount_type: "Porcentagem" | "Valor Fixo" | "Frete Grátis";
  discount_value?: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  minimum_order_value?: number;
  applicable_items?: string[];
  restaurant_id: string;
  created_at?: string;
  updated_at?: string;
}

interface PromotionsContextType {
  promotions: Promotion[]; // Promotions for the current restaurant
  allGlobalPromotions: Promotion[]; // All active promotions across all restaurants
  isLoadingPromotions: boolean;
  isLoadingGlobalPromotions: boolean; // New loading state for global promotions
  addPromotion: (newPromotion: Omit<Promotion, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updatePromotion: (updatedPromotion: Promotion) => Promise<void>;
  deletePromotion: (promotionId: string) => Promise<void>;
  fetchPromotions: () => Promise<void>; // Fetches for current restaurant
  fetchAllGlobalPromotions: () => Promise<void>; // Fetches all active promotions
}

const PromotionsContext = createContext<PromotionsContextType | undefined>(undefined);

export const PromotionsProvider = ({ children }: { children: ReactNode }) => {
  const { session, isAdmin, isCustomer, isLoading: isLoadingSession, profile, isSuperAdmin } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [allGlobalPromotions, setAllGlobalPromotions] = useState<Promotion[]>([]); // New state
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(true);
  const [isLoadingGlobalPromotions, setIsLoadingGlobalPromotions] = useState(true); // New loading state

  // Existing fetchPromotions (for current restaurant)
  const fetchPromotions = useCallback(async () => {
    setIsLoadingPromotions(true);
    console.log("PromotionsContext: Starting fetchPromotions...");

    const targetRestaurantId = currentRestaurant?.id; // Sempre confiar no currentRestaurant do contexto pai

    if (!targetRestaurantId) {
      setPromotions([]);
      setIsLoadingPromotions(false);
      console.log("PromotionsContext: No restaurant ID available for query, clearing promotions.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('restaurant_id', targetRestaurantId) // Filtrar por restaurant_id
        .order('end_date', { ascending: true });

      if (error) {
        console.error("PromotionsContext: Erro ao carregar promoções:", error);
        toast.error("Erro ao carregar promoções.");
        setPromotions([]);
      } else {
        console.log("PromotionsContext: Promoções carregadas com sucesso.");
        setPromotions(data as Promotion[]);
      }
    } catch (unexpectedError) {
      console.error("PromotionsContext: Erro inesperado durante fetchPromotions:", unexpectedError);
      toast.error("Erro inesperado ao carregar promoções.");
      setPromotions([]);
    } finally {
      setIsLoadingPromotions(false);
      console.log("PromotionsContext: fetchPromotions finished. Final isLoadingPromotions:", false);
    }
  }, [currentRestaurant?.id]); // Apenas dependa do ID do restaurante atual

  // NEW: fetchAllGlobalPromotions (for all restaurants)
  const fetchAllGlobalPromotions = useCallback(async () => {
    setIsLoadingGlobalPromotions(true);
    console.log("PromotionsContext: Starting fetchAllGlobalPromotions...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', today.toISOString().split('T')[0]) // Promotion started or starts today
        .gte('end_date', today.toISOString().split('T')[0])   // Promotion ends today or later
        .order('end_date', { ascending: true });

      if (error) {
        console.error("PromotionsContext: Erro ao carregar todas as promoções globais:", error);
        toast.error("Erro ao carregar promoções globais.");
        setAllGlobalPromotions([]);
      } else {
        console.log("PromotionsContext: Promoções globais carregadas com sucesso.");
        setAllGlobalPromotions(data as Promotion[]);
      }
    } catch (unexpectedError) {
      console.error("PromotionsContext: Erro inesperado durante fetchAllGlobalPromotions:", unexpectedError);
      toast.error("Erro inesperado ao carregar promoções globais.");
      setAllGlobalPromotions([]);
    } finally {
      setIsLoadingGlobalPromotions(false);
      console.log("PromotionsContext: fetchAllGlobalPromotions finished. Final isLoadingGlobalPromotions:", false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const runFetch = async () => {
      if (isLoadingRestaurants) { // Apenas dependa do carregamento do restaurante
        if (!cancelled) {
          setPromotions([]);
          setAllGlobalPromotions([]);
          setIsLoadingPromotions(true);
          setIsLoadingGlobalPromotions(true);
        }
        console.log("PromotionsContext: Restaurant is loading, setting promotions to loading state.");
        return;
      }

      // Always fetch all global promotions
      await fetchAllGlobalPromotions();

      // Fetch promotions for the current restaurant (if applicable)
      if (currentRestaurant?.id) {
        console.log("PromotionsContext: Restaurant finished loading, currentRestaurant.id is available, initiating fetchPromotions.");
        await fetchPromotions();
      } else {
        if (!cancelled) {
          setPromotions([]);
          setIsLoadingPromotions(false);
        }
        console.log("PromotionsContext: Restaurant finished loading, but no currentRestaurant.id, clearing promotions.");
      }
    };

    runFetch();

    return () => {
      cancelled = true;
    };
  }, [isLoadingRestaurants, currentRestaurant?.id, fetchPromotions, fetchAllGlobalPromotions]);

  const addPromotion = async (newPromotionData: Omit<Promotion, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => {
    if (!session || (!isAdmin && !isSuperAdmin)) { // Permitir admin ou super_admin
      toast.error("Apenas administradores ou super administradores podem adicionar promoções.");
      throw new Error("Acesso não autorizado.");
    }
    if (!currentRestaurant?.id) {
      toast.error("Nenhum restaurante selecionado para adicionar promoção.");
      throw new Error("Restaurant ID not available.");
    }

    setIsLoadingPromotions(true);
    const { data, error } = await supabase
      .from('promotions')
      .insert({
        ...newPromotionData,
        restaurant_id: currentRestaurant.id, // Adicionar restaurant_id
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar promoção:", error);
      toast.error("Erro ao adicionar promoção: " + error.message);
      setIsLoadingPromotions(false);
      throw error;
    }

    setPromotions(prev => [...prev, data as Promotion]);
    toast.success("Promoção adicionada com sucesso!");
    setIsLoadingPromotions(false);
  };

  const updatePromotion = async (updatedPromotion: Promotion) => {
    if (!session || (!isAdmin && !isSuperAdmin)) { // Permitir admin ou super_admin
      toast.error("Apenas administradores ou super administradores podem atualizar promoções.");
      throw new Error("Acesso não autorizado.");
    }
    if (!currentRestaurant?.id || updatedPromotion.restaurant_id !== currentRestaurant.id) {
      toast.error("Acesso não autorizado ou restaurante incorreto para atualizar promoção.");
      throw new Error("Unauthorized access or invalid restaurant ID.");
    }

    setIsLoadingPromotions(true);
    const { error } = await supabase
      .from('promotions')
      .update({
        name: updatedPromotion.name,
        description: updatedPromotion.description,
        discount_type: updatedPromotion.discount_type,
        discount_value: updatedPromotion.discount_value,
        start_date: updatedPromotion.start_date,
        end_date: updatedPromotion.end_date,
        is_active: updatedPromotion.is_active,
        minimum_order_value: updatedPromotion.minimum_order_value,
        applicable_items: updatedPromotion.applicable_items,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatedPromotion.id)
      .eq('restaurant_id', currentRestaurant.id); // Filtrar por restaurant_id

    if (error) {
      console.error("Erro ao atualizar promoção:", error);
      toast.error("Erro ao atualizar promoção: " + error.message);
      setIsLoadingPromotions(false);
      throw error;
    }

    setPromotions(prev =>
      prev.map(promo => (promo.id === updatedPromotion.id ? updatedPromotion : promo))
    );
    toast.success("Promoção atualizada com sucesso!");
    setIsLoadingPromotions(false);
  };

  const deletePromotion = async (promotionId: string) => {
    if (!session || (!isAdmin && !isSuperAdmin)) { // Permitir admin ou super_admin
      toast.error("Apenas administradores ou super administradores podem excluir promoções.");
      throw new Error("Acesso não autorizado.");
    }
    if (!currentRestaurant?.id) {
      toast.error("Nenhum restaurante selecionado para excluir promoção.");
      throw new Error("Restaurant ID not available.");
    }

    setIsLoadingPromotions(true);
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', promotionId)
      .eq('restaurant_id', currentRestaurant.id); // Filtrar por restaurant_id

    if (error) {
      console.error("Erro ao excluir promoção:", error);
      toast.error("Erro ao excluir promoção: " + error.message);
      setIsLoadingPromotions(false);
      throw error;
    }

    setPromotions(prev => prev.filter(promo => promo.id !== promotionId));
    toast.success(`Promoção ${promotionId} foi excluída.`);
    setIsLoadingPromotions(false);
  };

  const contextValue = useMemo(
    () => ({
      promotions,
      allGlobalPromotions, // Expose new state
      isLoadingPromotions,
      isLoadingGlobalPromotions, // Expose new loading state
      addPromotion,
      updatePromotion,
      deletePromotion,
      fetchPromotions,
      fetchAllGlobalPromotions, // Expose new function
    }),
    [promotions, allGlobalPromotions, isLoadingPromotions, isLoadingGlobalPromotions, addPromotion, updatePromotion, deletePromotion, fetchPromotions, fetchAllGlobalPromotions, currentRestaurant, profile]
  );

  return <PromotionsContext.Provider value={contextValue}>{children}</PromotionsContext.Provider>;
};

export const usePromotions = () => {
  const context = useContext(PromotionsContext);
  if (context === undefined) {
    throw new Error('usePromotions must be used within a PromotionsProvider');
  }
  return context;
};
