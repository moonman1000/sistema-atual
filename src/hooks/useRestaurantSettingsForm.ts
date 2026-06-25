import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from '@/context/SessionContext';
import { useRestaurant, Restaurant, NewRestaurantData } from '@/context/RestaurantContext';
import { supabase } from '@/integrations/supabase/client';
import { uploadImageToSupabase, deleteImageFromSupabase } from "@/integrations/supabase/storage";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";

// Define the shape of the form state
interface RestaurantSettingsFormState {
  // App Name / Header Title
  appName: string;
  adminHeaderTitle: string;
  appIcon: string;

  // General Info
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  slug: string;
  restaurantType: Restaurant['type'];

  // Store Branding
  displayName: string;
  logoUrl: string;
  logoFile: File | null;
  logoFileInputKey: number; // To force re-render of file input

  // Hero Section
  heroTitle: string;
  heroDescription: string;

  // Featured Pizzas Section Title
  featuredPizzasTitle: string;

  // Feature Texts (simplified for now, can be an array of objects if more dynamic)
  feature1Title: string;
  feature1Description: string;
  feature2Title: string;
  feature2Description: string;
  feature3Title: string;
  feature3Description: string;

  // Explore Section
  exploreTitle: string;
  exploreDescription: string;

  // Store Image (main banner)
  bannerImageUrl: string;
  bannerImageFile: File | null;

  // Operational Hours (mocked for now)
  openingHoursMonFri: string;
  openingHoursSatSun: string;
  isClosedOnHolidays: boolean;

  // Notification Settings
  receiveOrderNotifications: boolean;
  receiveDeliveryNotifications: boolean;
  notificationEmail: string;

  // Regional Settings (mocked for now)
  language: string;
  timezone: string;

  // Sidebar Customizations
  sidebarCustomizations: Record<string, string | undefined>;
}

// Define the shape of the hook's return value
interface UseRestaurantSettingsForm {
  formState: RestaurantSettingsFormState;
  setters: {
    setAppName: (name: string) => void;
    setAdminHeaderTitle: (title: string) => void;
    setAppIcon: (icon: string) => void;
    setRestaurantName: (name: string) => void;
    setAddress: (address: string) => void;
    setPhone: (phone: string) => void;
    setEmail: (email: string) => void;
    setDescription: (description: string) => void;
    setSlug: (slug: string) => void;
    setRestaurantType: (type: Restaurant['type']) => void;
    setDisplayName: (name: string) => void;
    setLogoUrl: (url: string) => void;
    setLogoFile: (file: File | null) => void;
    setHeroTitle: (title: string) => void;
    setHeroDescription: (description: string) => void;
    setFeaturedPizzasTitle: (title: string) => void;
    setFeature1Title: (title: string) => void;
    setFeature1Description: (description: string) => void;
    setFeature2Title: (title: string) => void;
    setFeature2Description: (description: string) => void;
    setFeature3Title: (title: string) => void;
    setFeature3Description: (description: string) => void;
    setExploreTitle: (title: string) => void;
    setExploreDescription: (description: string) => void;
    setBannerImageUrl: (url: string) => void;
    setBannerImageFile: (file: File | null) => void;
    setOpeningHoursMonFri: (hours: string) => void;
    setOpeningHoursSatSun: (hours: string) => void;
    setIsClosedOnHolidays: (closed: boolean) => void;
    setReceiveOrderNotifications: (receive: boolean) => void;
    setReceiveDeliveryNotifications: (receive: boolean) => void;
    setNotificationEmail: (email: string) => void;
    setLanguage: (lang: string) => void;
    setTimezone: (zone: string) => void;
    setSidebarCustomizations: (customizations: Record<string, string | undefined>) => void;
    handleSidebarCustomizationChange: (key: string, value: string) => void;
  };
  localPreviews: {
    finalLogoPreview: string | null;
    finalBannerImagePreview: string | null;
  };
  isSaving: boolean;
  isUploading: boolean;
  handleSaveChanges: () => Promise<void>;
}

// Define the sidebar fields for initialization and updates
const SIDEBAR_SETTINGS_FIELDS = [
  { key: 'sidebar_menu_label', iconKey: 'sidebar_menu_icon', defaultLabel: 'Cardápio', defaultIcon: 'Pizza' },
  { key: 'sidebar_categories_label', iconKey: 'sidebar_categories_icon', defaultLabel: 'Categorias', defaultIcon: 'ListFilter' },
  { key: 'sidebar_orders_label', iconKey: 'sidebar_orders_icon', defaultLabel: 'Pedidos', defaultIcon: 'ClipboardList' },
  { key: 'sidebar_clients_label', iconKey: 'sidebar_clients_icon', defaultLabel: 'Clientes', defaultIcon: 'Users' },
  { key: 'sidebar_deliveries_label', iconKey: 'sidebar_deliveries_icon', defaultLabel: 'Entregas', defaultIcon: 'Truck' },
  { key: 'sidebar_employees_label', iconKey: 'sidebar_employees_icon', defaultLabel: 'Funcionários', defaultIcon: 'Users' },
  { key: 'sidebar_payroll_label', iconKey: 'sidebar_payroll_icon', defaultLabel: 'Folha de Pagamentos', defaultIcon: 'FileText' },
  { key: 'sidebar_inventory_label', iconKey: 'sidebar_inventory_icon', defaultLabel: 'Inventário', defaultIcon: 'UtensilsCrossed' },
  { key: 'sidebar_suppliers_label', iconKey: 'sidebar_suppliers_icon', defaultLabel: 'Fornecedores', defaultIcon: 'Package' },
  { key: 'sidebar_expenses_label', iconKey: 'sidebar_expenses_icon', defaultLabel: 'Custos', defaultIcon: 'DollarSign' },
  { key: 'sidebar_promotions_label', iconKey: 'sidebar_promotions_icon', defaultLabel: 'Promoções', defaultIcon: 'Percent' },
  { key: 'sidebar_reservations_label', iconKey: 'sidebar_reservations_icon', defaultLabel: 'Reservas', defaultIcon: 'Calendar' },
  { key: 'sidebar_reports_label', iconKey: 'sidebar_reports_icon', defaultLabel: 'Relatórios', defaultIcon: 'BarChart' },
  { key: 'sidebar_settings_label', iconKey: 'sidebar_settings_icon', defaultLabel: 'Configurações', defaultIcon: 'Settings' },
];


export const useRestaurantSettingsForm = (): UseRestaurantSettingsForm => {
  const { session, isLoading: isLoadingSession } = useSession();
  const { currentRestaurant, setCurrentRestaurant } = useRestaurant();

  // --- Form State ---
  const [formState, setFormState] = useState<RestaurantSettingsFormState>({
    appName: "Pizza Manager",
    adminHeaderTitle: "PizzaApp Admin",
    appIcon: "Pizza",
    restaurantName: "PedeJá",
    address: "",
    phone: "",
    email: "",
    description: "",
    slug: "",
    restaurantType: "restaurant",
    displayName: "PedeJá",
    logoUrl: "https://media.istockphoto.com/id/971654072/vector/red-call-icon.jpg?s=612x612&w=0&k=20&c=bwlNm0pnNs98evZv4x8N3Cq3XQAWIKLEzJPmQpbMgWY=",
    logoFile: null,
    logoFileInputKey: Date.now(),
    heroTitle: "Pizza Deliciosa, Entrega Rápida.",
    heroDescription: "Pizzas artesanais feitas com os ingredientes mais frescos, direto na sua porta.",
    featuredPizzasTitle: "Pizzas em Destaque",
    feature1Title: "Entrega em 30 Minutos",
    feature1Description: "Receba sua pizza quente e fresca, exatamente quando quiser.",
    feature2Title: "Ingredientes Frescos",
    feature2Description: "Usamos apenas os melhores ingredientes, de origem local.",
    feature3Title: "Peça Online",
    feature3Description: "Pedido fácil e rápido através do nosso site moderno.",
    exploreTitle: "Explore Nosso Cardápio Completo",
    exploreDescription: "Descubra todas as nossas deliciosas opções de pizzas, bebidas e sobremesas.",
    bannerImageUrl: "",
    bannerImageFile: null,
    openingHoursMonFri: "11:00 - 23:00",
    openingHoursSatSun: "12:00 - 00:00",
    isClosedOnHolidays: true,
    receiveOrderNotifications: true,
    receiveDeliveryNotifications: true,
    notificationEmail: "",
    language: "pt-BR",
    timezone: "America/Sao_Paulo",
    sidebarCustomizations: {},
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localLogoObjectUrl, setLocalLogoObjectUrl] = useState<string | null>(null);
  const [localBannerObjectUrl, setLocalBannerObjectUrl] = useState<string | null>(null);

  // --- Setters for formState ---
  const setters = useMemo(() => {
    const createSetter = <K extends keyof RestaurantSettingsFormState>(key: K) => (value: RestaurantSettingsFormState[K]) => {
      setFormState(prev => ({ ...prev, [key]: value }));
    };

    return {
      setAppName: createSetter('appName'),
      setAdminHeaderTitle: createSetter('adminHeaderTitle'),
      setAppIcon: createSetter('appIcon'),
      setRestaurantName: createSetter('restaurantName'),
      setAddress: createSetter('address'),
      setPhone: createSetter('phone'),
      setEmail: createSetter('email'),
      setDescription: createSetter('description'),
      setSlug: createSetter('slug'),
      setRestaurantType: createSetter('restaurantType'),
      setDisplayName: createSetter('displayName'),
      setLogoUrl: createSetter('logoUrl'),
      setLogoFile: createSetter('logoFile'),
      setHeroTitle: createSetter('heroTitle'),
      setHeroDescription: createSetter('heroDescription'),
      setFeaturedPizzasTitle: createSetter('featuredPizzasTitle'),
      setFeature1Title: createSetter('feature1Title'),
      setFeature1Description: createSetter('feature1Description'),
      setFeature2Title: createSetter('feature2Title'),
      setFeature2Description: createSetter('feature2Description'),
      setFeature3Title: createSetter('feature3Title'),
      setFeature3Description: createSetter('feature3Description'),
      setExploreTitle: createSetter('exploreTitle'),
      setExploreDescription: createSetter('exploreDescription'),
      setBannerImageUrl: createSetter('bannerImageUrl'),
      setBannerImageFile: createSetter('bannerImageFile'),
      setOpeningHoursMonFri: createSetter('openingHoursMonFri'),
      setOpeningHoursSatSun: createSetter('openingHoursSatSun'),
      setIsClosedOnHolidays: createSetter('isClosedOnHolidays'),
      setReceiveOrderNotifications: createSetter('receiveOrderNotifications'),
      setReceiveDeliveryNotifications: createSetter('receiveDeliveryNotifications'),
      setNotificationEmail: createSetter('notificationEmail'),
      setLanguage: createSetter('language'),
      setTimezone: createSetter('timezone'),
      setSidebarCustomizations: createSetter('sidebarCustomizations'),
      handleSidebarCustomizationChange: (key: string, value: string) => {
        setFormState(prev => ({
          ...prev,
          sidebarCustomizations: {
            ...prev.sidebarCustomizations,
            [key]: value,
          },
        }));
      },
    };
  }, []);

  // --- Effect to initialize form state from currentRestaurant ---
  useEffect(() => {
    if (currentRestaurant) {
      setFormState(prev => ({
        ...prev,
        appName: currentRestaurant.app_name || "Pizza Manager",
        adminHeaderTitle: currentRestaurant.admin_header_title || "PizzaApp Admin",
        appIcon: currentRestaurant.app_icon || "Pizza",
        restaurantName: currentRestaurant.name || "PedeJá",
        address: currentRestaurant.address || "",
        phone: currentRestaurant.phone || "",
        email: currentRestaurant.email || (session?.user?.email || ""),
        description: currentRestaurant.description || "",
        slug: currentRestaurant.slug || "",
        restaurantType: currentRestaurant.type || "restaurant",
        displayName: currentRestaurant.display_name || currentRestaurant.name || "PedeJá",
        logoUrl: currentRestaurant.logo_url || "https://media.istockphoto.com/id/971654072/vector/red-call-icon.jpg?s=612x612&w=0&k=20&c=bwlNm0pnNs98evZv4x8N3Cq3XQAWIKLEzJPmQpbMgWY=",
        heroTitle: currentRestaurant.hero_title || "Pizza Deliciosa, Entrega Rápida.",
        heroDescription: currentRestaurant.hero_description || "Pizzas artesanais feitas com os ingredientes mais frescos, direto na sua porta.",
        featuredPizzasTitle: currentRestaurant.featured_pizzas_title || "Pizzas em Destaque",
        feature1Title: currentRestaurant.feature_1_title || "Entrega em 30 Minutos",
        feature1Description: currentRestaurant.feature_1_description || "Receba sua pizza quente e fresca, exatamente quando quiser.",
        feature2Title: currentRestaurant.feature_2_title || "Ingredientes Frescos",
        feature2Description: currentRestaurant.feature_2_description || "Usamos apenas os melhores ingredientes, de origem local.",
        feature3Title: currentRestaurant.feature_3_title || "Peça Online",
        feature3Description: currentRestaurant.feature_3_description || "Pedido fácil e rápido através do nosso site moderno.",
        exploreTitle: currentRestaurant.explore_title || "Explore Nosso Cardápio Completo",
        exploreDescription: currentRestaurant.explore_description || "Descubra todas as nossas deliciosas opções de pizzas, bebidas e sobremesas.",
        bannerImageUrl: currentRestaurant.image || "",
        receiveOrderNotifications: currentRestaurant.receive_order_notifications ?? true,
        receiveDeliveryNotifications: currentRestaurant.receive_delivery_notifications ?? true,
        notificationEmail: currentRestaurant.notification_email || (session?.user?.email || ""),
        // Initialize Sidebar Customizations
        sidebarCustomizations: SIDEBAR_SETTINGS_FIELDS.reduce((acc, field) => {
          acc[field.key] = (currentRestaurant[field.key as keyof Restaurant] as string) || field.defaultLabel;
          acc[field.iconKey] = (currentRestaurant[field.iconKey as keyof Restaurant] as string) || field.defaultIcon;
          return acc;
        }, {} as Record<string, string | undefined>),
        // Reset file inputs and local URLs
        logoFile: null,
        bannerImageFile: null,
        logoFileInputKey: Date.now(), // Force re-render of file input
      }));
      setLocalLogoObjectUrl(null);
      setLocalBannerObjectUrl(null);
    }
  }, [currentRestaurant, session?.user?.email]);

  // --- Effects for local image previews ---
  useEffect(() => {
    if (formState.bannerImageFile) {
      const newUrl = URL.createObjectURL(formState.bannerImageFile);
      setLocalBannerObjectUrl(newUrl);
      return () => URL.revokeObjectURL(newUrl);
    } else {
      setLocalBannerObjectUrl(null);
    }
  }, [formState.bannerImageFile]);

  useEffect(() => {
    if (formState.logoFile) {
      const newUrl = URL.createObjectURL(formState.logoFile);
      setLocalLogoObjectUrl(newUrl);
      return () => URL.revokeObjectURL(newUrl);
    } else {
      setLocalLogoObjectUrl(null);
    }
  }, [formState.logoFile]);

  // --- Derived preview URLs ---
  const finalBannerImagePreview = localBannerObjectUrl || formState.bannerImageUrl || currentRestaurant?.image || null;
  const finalLogoPreview = localLogoObjectUrl || formState.logoUrl || currentRestaurant?.logo_url || null;

  // --- Handle Save Changes ---
  const handleSaveChanges = useCallback(async () => {
    if (!currentRestaurant?.id) {
      toast.error("Nenhum restaurante selecionado para salvar as configurações.");
      return;
    }
    if (!formState.slug) {
      toast.error("O slug da loja é obrigatório.");
      return;
    }

    const normalizedSlug = slugify(formState.slug);
    if (normalizedSlug !== formState.slug) {
      toast.info("O slug foi ajustado para ser URL-friendly.");
      setFormState(prev => ({ ...prev, slug: normalizedSlug })); // Update state immediately
      // If we update state here, the effect will re-run, and this function will be called again.
      // To avoid this, we can either:
      // 1. Use a ref for slug and update it directly before DB call.
      // 2. Re-run the save logic with the new slug.
      // For simplicity and to avoid complex re-runs, let's proceed with the normalized slug directly for the DB call.
    }

    setIsSaving(true);
    setIsUploading(true);
    let finalBannerImageUrl = formState.bannerImageUrl;
    let finalLogoUrl = formState.logoUrl;

    try {
      // 1. Handle Banner Image Upload/Deletion
      if (formState.bannerImageFile) {
        if (currentRestaurant.image && currentRestaurant.image.includes('supabase.co/storage/v1/object/public/restaurant-images')) {
          await deleteImageFromSupabase(currentRestaurant.image, 'restaurant-images');
        }
        const uploadedUrl = await uploadImageToSupabase(formState.bannerImageFile, 'restaurant-images', currentRestaurant.id);
        if (uploadedUrl) {
          finalBannerImageUrl = uploadedUrl;
        } else {
          throw new Error("Falha ao obter URL da imagem do banner após o upload.");
        }
      } else if (!formState.bannerImageUrl && currentRestaurant.image && currentRestaurant.image.includes('supabase.co/storage/v1/object/public/restaurant-images')) {
        await deleteImageFromSupabase(currentRestaurant.image, 'restaurant-images');
        finalBannerImageUrl = "";
      } else if (formState.bannerImageFile === null && formState.bannerImageUrl === "") {
        finalBannerImageUrl = "";
      }

      // 2. Handle Logo Image Upload/Deletion
      if (formState.logoFile) {
        if (currentRestaurant.logo_url && currentRestaurant.logo_url.includes('supabase.co/storage/v1/object/public/restaurant-logos')) {
          await deleteImageFromSupabase(currentRestaurant.logo_url, 'restaurant-logos');
        }
        const uploadedUrl = await uploadImageToSupabase(formState.logoFile, 'restaurant-logos', currentRestaurant.id);
        if (uploadedUrl) {
          finalLogoUrl = uploadedUrl;
        } else {
          throw new Error("Falha ao obter URL do logo após o upload.");
        }
      } else if (!formState.logoUrl && currentRestaurant.logo_url && currentRestaurant.logo_url.includes('supabase.co/storage/v1/object/public/restaurant-logos')) {
        await deleteImageFromSupabase(currentRestaurant.logo_url, 'restaurant-logos');
        finalLogoUrl = "";
      } else if (formState.logoFile === null && formState.logoUrl === "") {
        finalLogoUrl = "";
      }

      // 3. Prepare update payload
      const updatePayload: Partial<Restaurant> = {
        app_name: formState.appName,
        admin_header_title: formState.adminHeaderTitle,
        app_icon: formState.appIcon,
        name: formState.restaurantName,
        address: formState.address,
        phone: formState.phone,
        email: formState.email,
        description: formState.description,
        slug: normalizedSlug, // Use the normalized slug here
        type: formState.restaurantType,
        image: finalBannerImageUrl,
        logo_url: finalLogoUrl,
        display_name: formState.displayName,
        hero_title: formState.heroTitle,
        hero_description: formState.heroDescription,
        featured_pizzas_title: formState.featuredPizzasTitle,
        feature_1_title: formState.feature1Title,
        feature_1_description: formState.feature1Description,
        feature_2_title: formState.feature2Title, // CORRIGIDO: snake_case
        feature_2_description: formState.feature2Description, // CORRIGIDO: snake_case
        feature_3_title: formState.feature3Title, // CORRIGIDO: snake_case
        feature_3_description: formState.feature3Description, // CORRIGIDO: snake_case
        explore_title: formState.exploreTitle,
        explore_description: formState.exploreDescription,
        receive_order_notifications: formState.receiveOrderNotifications,
        receive_delivery_notifications: formState.receiveDeliveryNotifications,
        notification_email: formState.notificationEmail,
        // Sidebar Customizations
        ...formState.sidebarCustomizations,
        updated_at: new Date().toISOString(),
      };

      // 4. Update Restaurant Data
      const { data, error } = await supabase
        .from('restaurants')
        .update(updatePayload)
        .eq('id', currentRestaurant.id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error("Este nome de loja (slug) já está em uso. Por favor, escolha outro.");
        }
        throw error;
      }

      // Update local state and context
      setCurrentRestaurant(data);
      setFormState(prev => ({
        ...prev,
        logoUrl: finalLogoUrl,
        logoFile: null,
        bannerImageUrl: finalBannerImageUrl,
        bannerImageFile: null,
        logoFileInputKey: Date.now(), // Reset file input key
      }));
      toast.success("Configurações do restaurante salvas com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar configurações do restaurante:", error);
      toast.error("Erro ao salvar configurações: " + error.message);
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  }, [formState, currentRestaurant, session?.user?.email, setCurrentRestaurant]);

  return {
    formState,
    setters: {
      ...setters,
      setLogoFileInputKey: (key: number) => setFormState(prev => ({ ...prev, logoFileInputKey: key })),
    },
    localPreviews: {
      finalLogoPreview,
      finalBannerImagePreview,
    },
    isSaving,
    isUploading,
    handleSaveChanges,
  };
};