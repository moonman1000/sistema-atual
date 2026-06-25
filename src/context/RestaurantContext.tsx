import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocation, matchPath } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from './SessionContext.tsx';
import { getRestaurantTypePath, slugify } from '@/lib/utils';

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  slug?: string;
  image?: string;
  logo_url?: string;
  display_name?: string;
  hero_title?: string;
  hero_description?: string;
  feature_1_title?: string;
  feature_1_description?: string;
  feature_2_title?: string;
  feature_2_description?: string;
  feature_3_title?: string;
  feature_3_description?: string;
  explore_title?: string;
  explore_description?: string;
  featured_pizzas_title?: string;
  type: "restaurant" | "cafe" | "bar" | "other" | "pharmacy" | "market" | "petshop" | "service";
  receive_order_notifications?: boolean;
  receive_delivery_notifications?: boolean;
  notification_email?: string;
  created_at?: string;
  updated_at?: string;
  sidebar_menu_label?: string;
  sidebar_menu_icon?: string;
  sidebar_categories_label?: string;
  sidebar_categories_icon?: string;
  sidebar_orders_label?: string;
  sidebar_orders_icon?: string;
  sidebar_clients_label?: string;
  sidebar_clients_icon?: string;
  sidebar_deliveries_label?: string;
  sidebar_deliveries_icon?: string;
  sidebar_employees_label?: string;
  sidebar_employees_icon?: string;
  sidebar_payroll_label?: string;
  sidebar_payroll_icon?: string;
  sidebar_inventory_label?: string;
  sidebar_inventory_icon?: string;
  sidebar_suppliers_label?: string;
  sidebar_suppliers_icon?: string;
  sidebar_expenses_label?: string;
  sidebar_expenses_icon?: string;
  sidebar_promotions_label?: string;
  sidebar_promotions_icon?: string;
  sidebar_reservations_label?: string;
  sidebar_reservations_icon?: string;
  sidebar_reports_label?: string;
  sidebar_reports_icon?: string;
  sidebar_settings_label?: string;
  sidebar_settings_icon?: string;
  app_name?: string;
  admin_header_title?: string;
  app_icon?: string; // NOVO: Ícone principal do aplicativo
}

export interface NewRestaurantData {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  slug: string;
  image?: string;
  logo_url?: string;
  display_name?: string;
  hero_title?: string;
  hero_description?: string;
  feature_1_title?: string;
  feature_1_description?: string;
  feature_2_title?: string;
  feature_2_description?: string;
  feature_3_title?: string;
  feature_3_description?: string;
  explore_title?: string;
  explore_description?: string;
  featured_pizzas_title?: string;
  type?: "restaurant" | "cafe" | "bar" | "other" | "pharmacy" | "market" | "petshop" | "service";
  receive_order_notifications?: boolean;
  receive_delivery_notifications?: boolean;
  notification_email?: string;
  sidebar_menu_label?: string;
  sidebar_menu_icon?: string;
  sidebar_categories_label?: string;
  sidebar_categories_icon?: string;
  sidebar_orders_label?: string;
  sidebar_orders_icon?: string;
  sidebar_clients_label?: string;
  sidebar_clients_icon?: string;
  sidebar_deliveries_label?: string;
  sidebar_deliveries_icon?: string;
  sidebar_employees_label?: string;
  sidebar_employees_icon?: string;
  sidebar_payroll_label?: string;
  sidebar_payroll_icon?: string;
  sidebar_inventory_label?: string;
  sidebar_inventory_icon?: string;
  sidebar_suppliers_label?: string;
  sidebar_suppliers_icon?: string;
  sidebar_expenses_label?: string;
  sidebar_expenses_icon?: string;
  sidebar_promotions_label?: string;
  sidebar_promotions_icon?: string;
  sidebar_reservations_label?: string;
  sidebar_reservations_icon?: string;
  sidebar_reports_label?: string;
  sidebar_reports_icon?: string;
  sidebar_settings_label?: string;
  sidebar_settings_icon?: string;
  app_name?: string;
  admin_header_title?: string;
  app_icon?: string; // NOVO: Ícone principal do aplicativo
}

interface RestaurantContextType {
  currentRestaurant: Restaurant | null;
  allRestaurants: Restaurant[];
  isLoadingRestaurants: boolean;
  createRestaurant: (newRestaurant: NewRestaurantData) => Promise<void>;
  fetchRestaurantsForOwner: (ownerId: string) => Promise<Restaurant[]>;
  fetchAllRestaurants: () => Promise<Restaurant[]>;
  setCurrentRestaurant: (restaurant: Restaurant | null) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

interface RestaurantProviderProps {
  children: ReactNode;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoadingSession: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  isSuperAdmin: boolean;
  softRevalidateSession: () => Promise<void>;
}

export const RestaurantProvider: React.FC<RestaurantProviderProps> = ({
  children,
  session,
  user,
  profile,
  isLoadingSession,
  isAdmin,
  isCustomer,
  isSuperAdmin,
  softRevalidateSession,
}) => {
  
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);

  const location = useLocation();

  // Helper para identificar rotas de listagem geral
  const isGeneralListingPath = useCallback((pathname: string) => {
    return [
      '/',
      '/inicio',
      '/restaurants',
      '/farmacias',
      '/mercados',
      '/petshops',
      '/servicos'
    ].includes(pathname);
  }, []);

  // --- Funções de Fetch de Restaurantes ---
  const fetchRestaurantsForOwner = useCallback(async (ownerId: string): Promise<Restaurant[]> => {
    console.log("RestaurantContext: fetchRestaurantsForOwner - Fetching restaurants for owner ID:", ownerId);
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', ownerId);

    if (error) {
      console.error("RestaurantContext: Erro ao carregar restaurantes para o proprietário:", error);
      toast.error("Erro ao carregar restaurantes.");
      return [];
    }
    console.log("RestaurantContext: fetchRestaurantsForOwner - Found restaurants:", data);
    return data as Restaurant[];
  }, []);

  const fetchRestaurantById = useCallback(async (restaurantId: string): Promise<Restaurant | null> => {
    console.log("RestaurantContext: fetchRestaurantById - Attempting to fetch establishment by ID:", restaurantId);
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn("RestaurantContext: fetchRestaurantById - Nenhum estabelecimento encontrado para o ID:", restaurantId);
        return null;
      }
      console.error("RestaurantContext: fetchRestaurantById - Erro ao carregar estabelecimento por ID:", error);
      return null;
    }
    console.log("RestaurantContext: fetchRestaurantById - Found establishment by ID:", data);
    return data as Restaurant;
  }, []);

  const fetchRestaurantBySlug = useCallback(async (slug: string): Promise<Restaurant | null> => {
    console.log("RestaurantContext: fetchRestaurantBySlug - Attempting to fetch establishment by slug:", slug);
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn("RestaurantContext: fetchRestaurantBySlug - Nenhum estabelecimento encontrado para o slug:", slug);
        return null;
      }
      console.error("RestaurantContext: fetchRestaurantBySlug - Erro ao carregar estabelecimento por slug:", error);
      return null;
    }
    console.log("RestaurantContext: fetchRestaurantBySlug - Found establishment by slug:", data);
    return data as Restaurant;
  }, []);

  const fetchAllRestaurants = useCallback(async (): Promise<Restaurant[]> => {
    console.log("RestaurantContext: fetchAllRestaurants - Fetching all establishments.");
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error("RestaurantContext: Erro ao carregar todos os estabelecimentos:", error);
      toast.error("Erro ao carregar todos os estabelecimentos.");
      return [];
    }
    console.log("RestaurantContext: fetchAllRestaurants - Found all establishments:", data);
    return data as Restaurant[];
  }, []);

  // --- Funções Auxiliares para Lógica de Carregamento ---

  const getRestaurantIdFromUrl = useCallback((pathname: string): string | undefined => {
    const types = ["loja", "farmacia", "mercado", "petshop", "servico"];
    for (const type of types) {
      const match = matchPath(
        { path: `/${type}/:restaurantId/*` },
        pathname
      );
      if (match?.params.restaurantId) {
        return match.params.restaurantId;
      }
    }
    return undefined;
  }, []);

  const loadRestaurantFromIdentifier = useCallback(async (identifier: string): Promise<Restaurant | null> => {
    let restaurant: Restaurant | null = null;
    
    // 1. Tentar por slug exato
    restaurant = await fetchRestaurantBySlug(identifier);

    // 2. Se não encontrado, tentar por slug normalizado
    if (!restaurant) {
      const normalizedIdentifier = slugify(identifier);
      if (normalizedIdentifier !== identifier) {
        restaurant = await fetchRestaurantBySlug(normalizedIdentifier);
      }
    }

    // 3. Se ainda não encontrado e parece um UUID, tentar por ID
    if (!restaurant && identifier.length === 36 && identifier.includes('-')) {
      restaurant = await fetchRestaurantById(identifier);
    }
    return restaurant;
  }, [fetchRestaurantBySlug, fetchRestaurantById]);

  // --- Lógica Principal de Carregamento de Dados ---
  const determineAndSetCurrentRestaurant = useCallback(async () => {
    console.log("RestaurantContext: determineAndSetCurrentRestaurant - START.");
    setIsLoadingRestaurants(true);
    setCurrentRestaurant(null);
    setAllRestaurants([]);

    if (isLoadingSession) {
      console.log("RestaurantContext: determineAndSetCurrentRestaurant - Session still loading, returning early.");
      return;
    }

    let tempCurrentRestaurant: Restaurant | null = null;
    const allFetchedRestaurants = await fetchAllRestaurants();
    setAllRestaurants(allFetchedRestaurants);
    console.log("RestaurantContext: determineAndSetCurrentRestaurant - All restaurants fetched:", allFetchedRestaurants.length);

    const urlRestaurantIdentifier = getRestaurantIdFromUrl(location.pathname);
    console.log("RestaurantContext: determineAndSetCurrentRestaurant - URL identifier:", urlRestaurantIdentifier);

    // Prioridade 1: Identificador na URL (para páginas de vendas específicas)
    if (urlRestaurantIdentifier) {
      tempCurrentRestaurant = await loadRestaurantFromIdentifier(urlRestaurantIdentifier);
      console.log("RestaurantContext: determineAndSetCurrentRestaurant - Loaded from URL:", tempCurrentRestaurant?.name);
    }
    // Prioridade 2: Página do entregador com identificador no localStorage
    else if (location.pathname === "/delivery-driver") {
      const storedRestaurantIdentifier = localStorage.getItem('deliveryDriverRestaurantId');
      if (storedRestaurantIdentifier) {
        tempCurrentRestaurant = await loadRestaurantFromIdentifier(storedRestaurantIdentifier);
        if (!tempCurrentRestaurant) {
          console.warn("RestaurantContext: determineAndSetCurrentRestaurant - Stored deliveryDriverRestaurantId not found in DB. Clearing localStorage.");
          localStorage.removeItem('deliveryDriverRestaurantId');
          localStorage.removeItem('deliveryDriverName');
        }
        console.log("RestaurantContext: determineAndSetCurrentRestaurant - Loaded for delivery driver:", tempCurrentRestaurant?.name);
      }
    }
    // Prioridade 3: Usuário admin/super_admin em rota admin (sem ID na URL)
    else if (!isGeneralListingPath(location.pathname) && session && (isAdmin || isSuperAdmin) && user?.id && location.pathname.startsWith("/admin")) {
      const ownerRestaurants = await fetchRestaurantsForOwner(user.id);
      if (ownerRestaurants.length > 0) {
        tempCurrentRestaurant = ownerRestaurants[0];
      }
      console.log("RestaurantContext: determineAndSetCurrentRestaurant - Loaded for admin/super_admin:", tempCurrentRestaurant?.name);
    }
    // Prioridade 4: Usuário cliente com restaurante vinculado em rota de perfil
    else if (!isGeneralListingPath(location.pathname) && session && isCustomer && profile?.restaurant_id && location.pathname.startsWith("/profile")) {
      tempCurrentRestaurant = await fetchRestaurantById(profile.restaurant_id);
      console.log("RestaurantContext: determineAndSetCurrentRestaurant - Loaded for customer profile:", tempCurrentRestaurant?.name);
    }
    // Prioridade 5: Super admin em rota super-admin (sem ID na URL), pega o primeiro disponível
    else if (!isGeneralListingPath(location.pathname) && isSuperAdmin && !tempCurrentRestaurant && allFetchedRestaurants.length > 0 && location.pathname.startsWith("/super-admin")) {
      tempCurrentRestaurant = allFetchedRestaurants[0];
      console.log("RestaurantContext: determineAndSetCurrentRestaurant - Loaded for super-admin (first available):", tempCurrentRestaurant?.name);
    }
    
    setCurrentRestaurant(tempCurrentRestaurant);
    setIsLoadingRestaurants(false);
    console.log("RestaurantContext: determineAndSetCurrentRestaurant - END. Final currentRestaurant:", tempCurrentRestaurant?.name);
  }, [
    isLoadingSession, session, user, profile, isAdmin, isCustomer, isSuperAdmin,
    location.pathname, isGeneralListingPath,
    fetchAllRestaurants, getRestaurantIdFromUrl, loadRestaurantFromIdentifier,
    fetchRestaurantsForOwner, fetchRestaurantById
  ]);

  // --- Efeito Principal para Carregar Dados ---
  useEffect(() => {
    let cancelled = false;
    const runDataLoad = async () => {
      if (!cancelled) {
        await determineAndSetCurrentRestaurant();
      }
    };
    runDataLoad();
    return () => { cancelled = true; };
  }, [isLoadingSession, location.pathname, determineAndSetCurrentRestaurant]); // Depende de isLoadingSession e location.pathname para re-executar

  const createRestaurant = async (newRestaurantData: NewRestaurantData) => {
    if (!user?.id) {
      toast.error("Você precisa estar logado para criar um estabelecimento.");
      throw new Error("Usuário não autenticado.");
    }
    if (!isAdmin && !isSuperAdmin) {
      toast.error("Apenas administradores ou super administradores podem criar estabelecimentos.");
      throw new Error("Acesso não autorizado.");
    }

    setIsLoadingRestaurants(true);
    console.log("RestaurantContext: createRestaurant - Attempting to create establishment:", newRestaurantData);
    const { data, error } = await supabase
      .from('restaurants')
      .insert({
        ...newRestaurantData,
        owner_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        featured_pizzas_title: newRestaurantData.featured_pizzas_title || "Pizzas em Destaque",
        type: newRestaurantData.type || "restaurant",
        logo_url: newRestaurantData.logo_url || null,
        display_name: newRestaurantData.display_name || newRestaurantData.name,
        receive_order_notifications: newRestaurantData.receive_order_notifications ?? true,
        receive_delivery_notifications: newRestaurantData.receive_delivery_notifications ?? true,
        notification_email: newRestaurantData.notification_email || user.email || null,
        sidebar_menu_label: newRestaurantData.sidebar_menu_label || 'Cardápio',
        sidebar_menu_icon: newRestaurantData.sidebar_menu_icon || 'Pizza',
        sidebar_categories_label: newRestaurantData.sidebar_categories_label || 'Categorias',
        sidebar_categories_icon: newRestaurantData.sidebar_categories_icon || 'ListFilter',
        sidebar_orders_label: newRestaurantData.sidebar_orders_label || 'Pedidos',
        sidebar_orders_icon: newRestaurantData.sidebar_orders_icon || 'ClipboardList',
        sidebar_clients_label: newRestaurantData.sidebar_clients_label || 'Clientes',
        sidebar_clients_icon: newRestaurantData.sidebar_clients_icon || 'Users',
        sidebar_deliveries_label: newRestaurantData.sidebar_deliveries_label || 'Entregas',
        sidebar_deliveries_icon: newRestaurantData.sidebar_deliveries_icon || 'Truck',
        sidebar_employees_label: newRestaurantData.sidebar_employees_label || 'Funcionários',
        sidebar_employees_icon: newRestaurantData.sidebar_employees_icon || 'Users',
        sidebar_payroll_label: newRestaurantData.sidebar_payroll_label || 'Folha de Pagamentos',
        sidebar_payroll_icon: newRestaurantData.sidebar_payroll_icon || 'FileText',
        sidebar_inventory_label: newRestaurantData.sidebar_inventory_label || 'Inventário',
        sidebar_inventory_icon: newRestaurantData.sidebar_inventory_icon || 'UtensilsCrossed',
        sidebar_suppliers_label: newRestaurantData.sidebar_suppliers_label || 'Fornecedores',
        sidebar_suppliers_icon: newRestaurantData.sidebar_suppliers_icon || 'Package',
        sidebar_expenses_label: newRestaurantData.sidebar_expenses_label || 'Custos',
        sidebar_expenses_icon: newRestaurantData.sidebar_expenses_icon || 'DollarSign',
        sidebar_promotions_label: newRestaurantData.sidebar_promotions_label || 'Promoções',
        sidebar_promotions_icon: newRestaurantData.sidebar_promotions_icon || 'Percent',
        sidebar_reservations_label: newRestaurantData.sidebar_reservations_label || 'Reservas',
        sidebar_reservations_icon: newRestaurantData.sidebar_reservations_icon || 'Calendar',
        sidebar_reports_label: newRestaurantData.sidebar_reports_label || 'Relatórios',
        sidebar_reports_icon: newRestaurantData.sidebar_reports_icon || 'BarChart',
        sidebar_settings_label: newRestaurantData.sidebar_settings_label || 'Configurações',
        sidebar_settings_icon: newRestaurantData.sidebar_settings_icon || 'Settings',
        app_name: newRestaurantData.app_name || 'Pizza Manager',
        admin_header_title: newRestaurantData.admin_header_title || 'PizzaApp Admin',
        app_icon: newRestaurantData.app_icon || 'Pizza', // NOVO: Definir ícone padrão
      })
      .select()
      .single();

    if (error) {
      console.error("RestaurantContext: Erro ao criar estabelecimento:", error);
      toast.error("Erro ao criar estabelecimento: " + error.message);
      setIsLoadingRestaurants(false);
      throw error;
    }

    const createdRestaurant = data as Restaurant;
    setCurrentRestaurant(createdRestaurant);
    toast.success("Estabelecimento criado com sucesso!");
    console.log("RestaurantContext: createRestaurant - Establishment created:", createdRestaurant);

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ restaurant_id: createdRestaurant.id, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (profileUpdateError) {
      console.error("RestaurantContext: Erro ao vincular estabelecimento ao perfil do admin:", profileUpdateError);
      toast.error("Erro ao vincular estabelecimento ao seu perfil.");
    } else {
      console.log("RestaurantContext: Perfil do admin atualizado com restaurant_id.");
      await softRevalidateSession();
    }

    setIsLoadingRestaurants(false);
  };

  const contextValue = useMemo(
    () => ({
      currentRestaurant,
      allRestaurants,
      isLoadingRestaurants,
      createRestaurant,
      fetchRestaurantsForOwner,
      fetchAllRestaurants,
      setCurrentRestaurant,
    }),
    [currentRestaurant, allRestaurants, isLoadingRestaurants, createRestaurant, fetchRestaurantsForOwner, fetchAllRestaurants, setCurrentRestaurant]
  );

  return <RestaurantContext.Provider value={contextValue}>{children}</RestaurantContext.Provider>;
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
