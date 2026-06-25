import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from './SessionContext.tsx';
import { useRestaurant } from './RestaurantContext';
import { toast } from 'sonner';

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

interface CategoryContextType {
  categories: Category[];
  isLoadingCategories: boolean;
  addCategory: (newCategory: Omit<Category, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCategory: (updatedCategory: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider = ({ children }: { children: ReactNode }) => {
  const { session, isAdmin, isSuperAdmin, isCustomer, profile, isLoading: isLoadingSession } = useSession(); // Adicionado isCustomer e profile
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const getTargetRestaurantId = useCallback(() => {
    if (isAdmin && currentRestaurant?.id) {
      return currentRestaurant.id;
    }
    if ((isSuperAdmin || isCustomer) && profile?.restaurant_id) {
      return profile.restaurant_id;
    }
    return undefined;
  }, [isAdmin, isSuperAdmin, isCustomer, currentRestaurant?.id, profile?.restaurant_id]);

  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    console.log("CategoryContext: Starting fetchCategories...");

    const targetRestaurantId = getTargetRestaurantId();

    if (!session || (!isAdmin && !isSuperAdmin) || !targetRestaurantId) { // Permitir admin ou super_admin
      setCategories([]);
      setIsLoadingCategories(false);
      console.log("CategoryContext: Not authorized or no restaurant selected, clearing categories.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', targetRestaurantId)
        .order('name', { ascending: true });

      if (error) {
        console.error("CategoryContext: Erro ao carregar categorias:", error);
        toast.error("Erro ao carregar categorias.");
        setCategories([]);
      } else {
        console.log("CategoryContext: Categorias carregadas com sucesso.");
        setCategories(data as Category[]);
      }
    } catch (unexpectedError) {
      console.error("CategoryContext: Erro inesperado durante fetchCategories:", unexpectedError);
      toast.error("Erro inesperado ao carregar categorias.");
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
      console.log("CategoryContext: fetchCategories finished. Final isLoadingCategories:", false);
    }
  }, [session, isAdmin, isSuperAdmin, getTargetRestaurantId]); // Removido currentRestaurant?.id e profile?.restaurant_id, usando getTargetRestaurantId

  useEffect(() => {
    let cancelled = false;
    const runFetch = async () => {
      if (isLoadingSession || isLoadingRestaurants) {
        if (!cancelled) {
          setCategories([]);
          setIsLoadingCategories(true);
        }
        return;
      }

      const targetRestaurantId = getTargetRestaurantId();
      if (session && (isAdmin || isSuperAdmin) && targetRestaurantId) { // Permitir admin ou super_admin
        await fetchCategories();
      } else {
        if (!cancelled) {
          setCategories([]);
          setIsLoadingCategories(false);
        }
      }
    };

    runFetch();

    return () => {
      cancelled = true;
    };
  }, [isLoadingSession, isLoadingRestaurants, session, isAdmin, isSuperAdmin, getTargetRestaurantId, fetchCategories]); // Removido currentRestaurant?.id e profile?.restaurant_id, usando getTargetRestaurantId

  const addCategory = async (newCategoryData: Omit<Category, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => {
    const targetRestaurantId = getTargetRestaurantId();

    if (!session || (!isAdmin && !isSuperAdmin)) { // Permitir admin ou super_admin
      toast.error("Apenas administradores ou super administradores podem adicionar categorias.");
      throw new Error("Acesso não autorizado.");
    }
    if (!targetRestaurantId) {
      toast.error("Nenhum restaurante selecionado para adicionar categoria.");
      throw new Error("Restaurant ID not available.");
    }

    setIsLoadingCategories(true);
    const { data, error } = await supabase
      .from('categories')
      .insert({
        ...newCategoryData,
        restaurant_id: targetRestaurantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar categoria:", error);
      toast.error("Erro ao adicionar categoria: " + error.message);
      setIsLoadingCategories(false);
      throw error;
    }

    setCategories(prev => [...prev, data as Category]);
    toast.success("Categoria adicionada com sucesso!");
    setIsLoadingCategories(false);
  };

  const updateCategory = async (updatedCategory: Category) => {
    const targetRestaurantId = getTargetRestaurantId();

    if (!session || (!isAdmin && !isSuperAdmin)) { // Permitir admin ou super_admin
      toast.error("Apenas administradores ou super administradores podem atualizar categorias.");
      throw new Error("Acesso não autorizado.");
    }
    if (!targetRestaurantId || updatedCategory.restaurant_id !== targetRestaurantId) {
      toast.error("Acesso não autorizado ou restaurante incorreto para atualizar categoria.");
      throw new Error("Unauthorized access or invalid restaurant ID.");
    }

    setIsLoadingCategories(true);
    const { error } = await supabase
      .from('categories')
      .update({
        name: updatedCategory.name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatedCategory.id)
      .eq('restaurant_id', targetRestaurantId);

    if (error) {
      console.error("Erro ao atualizar categoria:", error);
      toast.error("Erro ao atualizar categoria: " + error.message);
      setIsLoadingCategories(false);
      throw error;
    }

    setCategories(prev =>
      prev.map(cat => (cat.id === updatedCategory.id ? updatedCategory : cat))
    );
    toast.success("Categoria atualizada com sucesso!");
    setIsLoadingCategories(false);
  };

  const deleteCategory = async (categoryId: string) => {
    const targetRestaurantId = getTargetRestaurantId();

    if (!session || (!isAdmin && !isSuperAdmin)) { // Permitir admin ou super_admin
      toast.error("Apenas administradores ou super administradores podem excluir categorias.");
      throw new Error("Acesso não autorizado.");
    }
    if (!targetRestaurantId) {
      toast.error("Nenhum restaurante selecionado para excluir categoria.");
      throw new Error("Restaurant ID not available.");
    }

    setIsLoadingCategories(true);
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)
      .eq('restaurant_id', targetRestaurantId);

    if (error) {
      console.error("Erro ao excluir categoria:", error);
      toast.error("Erro ao excluir categoria: " + error.message);
      setIsLoadingCategories(false);
      throw error;
    }

    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    toast.success(`Categoria ${categoryId} foi excluída.`);
    setIsLoadingCategories(false);
  };

  const contextValue = useMemo(
    () => ({
      categories,
      isLoadingCategories,
      addCategory,
      updateCategory,
      deleteCategory,
      fetchCategories,
    }),
    [categories, isLoadingCategories, addCategory, updateCategory, deleteCategory, fetchCategories, getTargetRestaurantId]
  );

  return <CategoryContext.Provider value={contextValue}>{children}</CategoryContext.Provider>;
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};
