import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from './SessionContext.tsx';
import { useRestaurant } from './RestaurantContext'; // Importar useRestaurant
import { toast } from 'sonner';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  base_price: number;
  image: string;
  category: string;
  dietary: string[];
  is_featured: boolean;
  restaurant_id: string; // Adicionado restaurant_id
  created_at?: string;
  updated_at?: string;
  sizes: MenuItemSize[];
  toppings: MenuItemTopping[];
  reviews: MenuItemReview[];
}

export interface MenuItemSize {
  id: string;
  menu_item_id: string;
  name: string;
  value: string;
  price_modifier: number;
  restaurant_id: string; // Adicionado restaurant_id
  created_at?: string;
  updated_at?: string;
}

export interface MenuItemTopping {
  id: string;
  menu_item_id: string;
  name: string;
  value: string;
  price: number;
  restaurant_id: string; // Adicionado restaurant_id
  created_at?: string;
  updated_at?: string;
}

export interface MenuItemReview {
  id: string;
  menu_item_id: string;
  profile_id: string;
  author: string;
  rating: number;
  comment: string;
  restaurant_id: string; // Adicionado restaurant_id
  created_at?: string;
  updated_at?: string;
  avatar?: string;
}

interface MenuContextType {
  menuItems: MenuItem[]; // Menu items for the current restaurant
  allGlobalMenuItems: MenuItem[]; // All menu items across all restaurants
  isLoadingMenuItems: boolean;
  isLoadingGlobalMenuItems: boolean; // New loading state for global menu items
  addMenuItem: (newItem: Omit<MenuItem, 'id' | 'restaurant_id' | 'created_at' | 'updated_at' | 'sizes' | 'toppings' | 'reviews'>, sizes: Omit<MenuItemSize, 'id' | 'menu_item_id' | 'restaurant_id' | 'created_at' | 'updated_at'>[], toppings: Omit<MenuItemTopping, 'id' | 'menu_item_id' | 'restaurant_id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
  updateMenuItem: (updatedItem: MenuItem, sizes: Omit<MenuItemSize, 'id' | 'menu_item_id' | 'restaurant_id' | 'created_at' | 'updated_at'>[], toppings: Omit<MenuItemTopping, 'id' | 'menu_item_id' | 'restaurant_id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
  addReview: (newReview: Omit<MenuItemReview, 'id' | 'restaurant_id' | 'created_at' | 'updated_at' | 'profile_id' | 'author' | 'avatar'>) => Promise<void>;
  fetchMenuItems: () => Promise<void>; // Fetches for current restaurant
  fetchAllGlobalMenuItems: () => Promise<void>; // Fetches all menu items
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const { session, profile, isLoading: isLoadingSession, isAdmin, isCustomer, isSuperAdmin } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [allGlobalMenuItems, setAllGlobalMenuItems] = useState<MenuItem[]>([]); // New state
  const [isLoadingMenuItems, setIsLoadingMenuItems] = useState(true);
  const [isLoadingGlobalMenuItems, setIsLoadingGlobalMenuItems] = useState(true); // New loading state

  // Existing fetchMenuItems (for current restaurant)
  const fetchMenuItems = useCallback(async () => {
    setIsLoadingMenuItems(true);
    console.log("MenuContext: Starting fetchMenuItems...");

    const targetRestaurantId = currentRestaurant?.id; // Sempre confiar no currentRestaurant do contexto pai

    console.log("MenuContext: Debugging targetRestaurantId determination:");
    console.log("  currentRestaurant?.id (from RestaurantContext):", currentRestaurant?.id);
    console.log("  Calculated targetRestaurantId for query:", targetRestaurantId);


    if (!targetRestaurantId) {
      setMenuItems([]);
      setIsLoadingMenuItems(false);
      console.log("MenuContext: No restaurant ID available for query, clearing menu items.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          sizes:menu_item_sizes(*),
          toppings:menu_item_toppings(*),
          reviews:menu_item_reviews(*)
        `)
        .eq('restaurant_id', targetRestaurantId) // Filtrar por restaurant_id
        .order('name', { ascending: true });

      if (error) {
        console.error("MenuContext: Erro ao carregar itens do cardápio:", error);
        toast.error("Erro ao carregar itens do cardápio.");
        setMenuItems([]);
      } else {
        console.log("MenuContext: Itens do cardápio carregados com sucesso.");
        setMenuItems(data as MenuItem[]);
      }
    } catch (unexpectedError) {
      console.error("MenuContext: Erro inesperado durante fetchMenuItems:", unexpectedError);
      toast.error("Erro inesperado ao carregar itens do cardápio.");
      setMenuItems([]);
    } finally {
      setIsLoadingMenuItems(false);
      console.log("MenuContext: fetchMenuItems finished. Final isLoadingMenuItems:", false);
    }
  }, [currentRestaurant?.id]); // Apenas dependa do ID do restaurante atual

  // NEW: fetchAllGlobalMenuItems (for all restaurants)
  const fetchAllGlobalMenuItems = useCallback(async () => {
    setIsLoadingGlobalMenuItems(true);
    console.log("MenuContext: Starting fetchAllGlobalMenuItems...");

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          sizes:menu_item_sizes(*),
          toppings:menu_item_toppings(*),
          reviews:menu_item_reviews(*)
        `)
        .order('name', { ascending: true });

      if (error) {
        console.error("MenuContext: Erro ao carregar todos os itens do cardápio globais:", error);
        toast.error("Erro ao carregar itens do cardápio globais.");
        setAllGlobalMenuItems([]);
      } else {
        console.log("MenuContext: Itens do cardápio globais carregados com sucesso.");
        setAllGlobalMenuItems(data as MenuItem[]);
      }
    } catch (unexpectedError) {
      console.error("MenuContext: Erro inesperado durante fetchAllGlobalMenuItems:", unexpectedError);
      toast.error("Erro inesperado ao carregar itens do cardápio globais.");
      setAllGlobalMenuItems([]);
    } finally {
      setIsLoadingGlobalMenuItems(false);
      console.log("MenuContext: fetchAllGlobalMenuItems finished. Final isLoadingGlobalMenuItems:", false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const runFetch = async () => {
      if (isLoadingSession || isLoadingRestaurants) { // Incluir isLoadingRestaurants
        if (!cancelled) {
          setMenuItems([]);
          setAllGlobalMenuItems([]); // Clear global menu items too
          setIsLoadingMenuItems(true);
          setIsLoadingGlobalMenuItems(true); // Set global loading
        }
        console.log("MenuContext: Session or Restaurant is loading, setting menu to loading state.");
        return;
      }

      // Fetch menu items for the current restaurant (if applicable)
      if (currentRestaurant?.id) { // Verificar explicitamente por currentRestaurant.id
        console.log("MenuContext: Session and Restaurant finished loading, currentRestaurant.id is available, initiating fetchMenuItems.");
        await fetchMenuItems();
      } else {
        if (!cancelled) {
          setMenuItems([]);
          setIsLoadingMenuItems(false);
        }
        console.log("MenuContext: Session and Restaurant finished loading, but no currentRestaurant.id, clearing menu items.");
      }

      // Always fetch all global menu items
      await fetchAllGlobalMenuItems();
    };

    runFetch();

    return () => {
      cancelled = true;
    };
  }, [isLoadingSession, isLoadingRestaurants, currentRestaurant?.id, fetchMenuItems, fetchAllGlobalMenuItems]); // Add fetchAllGlobalMenuItems dependency

  const addMenuItem = async (newItemData: Omit<MenuItem, 'id' | 'restaurant_id' | 'created_at' | 'updated_at' | 'sizes' | 'toppings' | 'reviews'>, sizes: Omit<MenuItemSize, 'id' | 'menu_item_id' | 'restaurant_id' | 'created_at' | 'updated_at'>[], toppings: Omit<MenuItemTopping, 'id' | 'menu_item_id' | 'restaurant_id' | 'created_at' | 'updated_at'>[]) => {
    if (!session || (!isAdmin && !isSuperAdmin)) { // Permitir admin ou super_admin
      toast.error("Apenas administradores podem adicionar itens ao cardápio.");
      throw new Error("Acesso não autorizado.");
    }
    if (!currentRestaurant?.id) {
      toast.error("Nenhum restaurante selecionado para adicionar item ao cardápio.");
      throw new Error("Restaurant ID not available.");
    }

    setIsLoadingMenuItems(true);
    const { data: menuItemData, error: menuItemError } = await supabase
      .from('menu_items')
      .insert({
        ...newItemData,
        restaurant_id: currentRestaurant.id, // Adicionar restaurant_id
        base_price: newItemData.base_price,
        is_featured: newItemData.is_featured,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (menuItemError) {
      console.error("Erro ao adicionar item do cardápio:", menuItemError);
      toast.error("Erro ao adicionar item do cardápio.");
      setIsLoadingMenuItems(false);
      throw menuItemError;
    }

    const newMenuItem = menuItemData as MenuItem;

    if (sizes.length > 0) {
      const sizesToInsert = sizes.map(s => ({ ...s, menu_item_id: newMenuItem.id, restaurant_id: currentRestaurant.id })); // Adicionar restaurant_id
      const { error: sizesError } = await supabase.from('menu_item_sizes').insert(sizesToInsert);
      if (sizesError) console.error("Erro ao adicionar tamanhos:", sizesError);
    }

    if (toppings.length > 0) {
      const toppingsToInsert = toppings.map(t => ({ ...t, menu_item_id: newMenuItem.id, restaurant_id: currentRestaurant.id })); // Adicionar restaurant_id
      const { error: toppingsError } = await supabase.from('menu_item_toppings').insert(toppingsToInsert);
      if (toppingsError) console.error("Erro ao adicionar coberturas:", toppingsError);
    }

    await fetchMenuItems();
    toast.success("Item do cardápio adicionado com sucesso!");
  };

  const updateMenuItem = async (updatedItem: MenuItem, sizes: Omit<MenuItemSize, 'id' | 'menu_item_id' | 'restaurant_id' | 'created_at' | 'updated_at'>[], toppings: Omit<MenuItemTopping, 'id' | 'menu_item_id' | 'restaurant_id' | 'created_at' | 'updated_at'>[]) => {
    if (!session || (!isAdmin && !isSuperAdmin)) { // Permitir admin ou super_admin
      toast.error("Apenas administradores podem atualizar itens do cardápio.");
      throw new Error("Acesso não autorizado.");
    }
    if (!currentRestaurant?.id || updatedItem.restaurant_id !== currentRestaurant.id) {
      toast.error("Acesso não autorizado ou restaurante incorreto para atualizar item do cardápio.");
      throw new Error("Unauthorized access or invalid restaurant ID.");
    }

    setIsLoadingMenuItems(true);
    const { error: menuItemError } = await supabase
      .from('menu_items')
      .update({
        name: updatedItem.name,
        description: updatedItem.description,
        base_price: updatedItem.base_price,
        image: updatedItem.image,
        category: updatedItem.category,
        dietary: updatedItem.dietary,
        is_featured: updatedItem.is_featured,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatedItem.id)
      .eq('restaurant_id', currentRestaurant.id); // Filtrar por restaurant_id

    if (menuItemError) {
      console.error("Erro ao atualizar item do cardápio:", menuItemError);
      toast.error("Erro ao atualizar item do cardápio.");
      setIsLoadingMenuItems(false);
      throw menuItemError;
    }

    await supabase.from('menu_item_sizes').delete().eq('menu_item_id', updatedItem.id).eq('restaurant_id', currentRestaurant.id); // Filtrar por restaurant_id
    if (sizes.length > 0) {
      const sizesToInsert = sizes.map(s => ({ ...s, menu_item_id: updatedItem.id, restaurant_id: currentRestaurant.id })); // Adicionar restaurant_id
      const { error: sizesError } = await supabase.from('menu_item_sizes').insert(sizesToInsert);
      if (sizesError) console.error("Erro ao atualizar tamanhos:", sizesError);
    }

    await supabase.from('menu_item_toppings').delete().eq('menu_item_id', updatedItem.id).eq('restaurant_id', currentRestaurant.id); // Filtrar por restaurant_id
    if (toppings.length > 0) {
      const toppingsToInsert = toppings.map(t => ({ ...t, menu_item_id: updatedItem.id, restaurant_id: currentRestaurant.id })); // Adicionar restaurant_id
      const { error: toppingsError } = await supabase.from('menu_item_toppings').insert(toppingsToInsert);
      if (toppingsError) console.error("Erro ao atualizar coberturas:", toppingsError);
    }

    await fetchMenuItems();
    toast.success("Item do cardápio atualizado com sucesso!");
  };

  const deleteMenuItem = async (itemId: string) => {
    if (!session || (!isAdmin && !isSuperAdmin)) { // Permitir admin ou super_admin
      toast.error("Apenas administradores podem excluir itens do cardápio.");
      throw new Error("Acesso não autorizado.");
    }
    if (!currentRestaurant?.id) {
      toast.error("Nenhum restaurante selecionado para excluir item do cardápio.");
      throw new Error("Restaurant ID not available.");
    }

    setIsLoadingMenuItems(true);
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId)
      .eq('restaurant_id', currentRestaurant.id); // Filtrar por restaurant_id

    if (error) {
      console.error("Erro ao excluir item do cardápio:", error);
      toast.error("Erro ao excluir item do cardápio.");
      setIsLoadingMenuItems(false);
      throw error;
    }

    await fetchMenuItems();
    toast.success(`Item ${itemId} foi excluído.`);
  };

  const addReview = async (newReviewData: Omit<MenuItemReview, 'id' | 'restaurant_id' | 'created_at' | 'updated_at' | 'profile_id' | 'author' | 'avatar'>) => {
    if (!profile?.id || !session?.user) {
      toast.error("Você precisa estar logado para adicionar uma avaliação.");
      throw new Error("Usuário não autenticado.");
    }
    if (!profile?.restaurant_id) {
      toast.error("Seu perfil não está associado a um restaurante.");
      throw new Error("Restaurant ID not available for profile.");
    }

    setIsLoadingMenuItems(true); // Pode ser um estado de loading mais granular para reviews
    const { data, error } = await supabase
      .from('menu_item_reviews')
      .insert({
        ...newReviewData,
        profile_id: profile.id,
        author: profile.first_name + ' ' + profile.last_name,
        restaurant_id: profile.restaurant_id, // Adicionar restaurant_id
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        avatar: profile.avatar_url, // Adicionar avatar do perfil
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar avaliação:", error);
      toast.error("Erro ao adicionar avaliação.");
      setIsLoadingMenuItems(false);
      throw error;
    }

    await fetchMenuItems(); // Re-fetch para atualizar as avaliações na UI
    toast.success("Avaliação adicionada com sucesso!");
    setIsLoadingMenuItems(false);
  };

  const contextValue = useMemo(
    () => ({
      menuItems,
      allGlobalMenuItems, // Expose new state
      isLoadingMenuItems,
      isLoadingGlobalMenuItems, // Expose new loading state
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      addReview,
      fetchMenuItems,
      fetchAllGlobalMenuItems, // Expose new function
    }),
    [menuItems, allGlobalMenuItems, isLoadingMenuItems, isLoadingGlobalMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, addReview, fetchMenuItems, fetchAllGlobalMenuItems, currentRestaurant, profile]
  );

  return <MenuContext.Provider value={contextValue}>{children}</MenuContext.Provider>;
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};
