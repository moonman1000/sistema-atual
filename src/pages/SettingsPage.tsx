"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Import modular components
import GeneralSettingsCard from "@/components/admin/settings/GeneralSettingsCard";
import HeroSectionSettingsCard from "@/components/admin/settings/HeroSectionSettingsCard";
import FeaturedPizzasTitleSettingsCard from "@/components/admin/settings/FeaturedPizzasTitleSettingsCard";
import FeatureTextsSettingsCard from "@/components/admin/settings/FeatureTextsSettingsCard";
import ExploreSectionSettingsCard from "@/components/admin/settings/ExploreSectionSettingsCard";
import StoreImageSettingsCard from "@/components/admin/settings/StoreImageSettingsCard";
import OperationalHoursSettingsCard from "@/components/admin/settings/OperationalHoursSettingsCard";
import NotificationSettingsCard from "@/components/admin/settings/NotificationSettingsCard";
import RegionalSettingsCard from "@/components/admin/settings/RegionalSettingsCard";
import StoreBrandingSettingsCard from "@/components/admin/settings/StoreBrandingSettingsCard";
import SidebarSettingsCard from "@/components/admin/settings/SidebarSettingsCard";
import AppNameSettingsCard from "@/components/admin/settings/AppNameSettingsCard";

// Import the new custom hook
import { useRestaurantSettingsForm } from "@/hooks/useRestaurantSettingsForm";
import { useRestaurant } from "@/context/RestaurantContext"; // To check isLoadingRestaurants

// Definição dos campos do Sidebar para iteração (moved here from SettingsPage)
const SIDEBAR_SETTINGS_FIELDS = [
  { key: 'sidebar_menu_label', label: 'Cardápio/Produtos', iconKey: 'sidebar_menu_icon' },
  { key: 'sidebar_categories_label', label: 'Categorias', iconKey: 'sidebar_categories_icon' },
  { key: 'sidebar_orders_label', label: 'Pedidos', iconKey: 'sidebar_orders_icon' },
  { key: 'sidebar_clients_label', label: 'Clientes', iconKey: 'sidebar_clients_icon' },
  { key: 'sidebar_deliveries_label', label: 'Entregas', iconKey: 'sidebar_deliveries_icon' },
  { key: 'sidebar_employees_label', label: 'Funcionários', iconKey: 'sidebar_employees_icon' },
  { key: 'sidebar_payroll_label', label: 'Folha de Pagamentos', iconKey: 'sidebar_payroll_icon' },
  { key: 'sidebar_inventory_label', label: 'Inventário', iconKey: 'sidebar_inventory_icon' },
  { key: 'sidebar_suppliers_label', label: 'Fornecedores', iconKey: 'sidebar_suppliers_icon' },
  { key: 'sidebar_expenses_label', label: 'Custos', iconKey: 'sidebar_expenses_icon' },
  { key: 'sidebar_promotions_label', label: 'Promoções', iconKey: 'sidebar_promotions_icon' },
  { key: 'sidebar_reservations_label', label: 'Reservas', iconKey: 'sidebar_reservations_icon' },
  { key: 'sidebar_reports_label', label: 'Relatórios', iconKey: 'sidebar_reports_icon' },
  { key: 'sidebar_settings_label', label: 'Configurações', iconKey: 'sidebar_settings_icon' },
];

const SettingsPage = () => {
  const { isLoadingRestaurants, currentRestaurant } = useRestaurant();
  const {
    formState,
    setters,
    localPreviews,
    isSaving,
    isUploading,
    handleSaveChanges,
  } = useRestaurantSettingsForm();

  if (isLoadingRestaurants || !currentRestaurant) {
    return <div className="flex min-h-screen items-center justify-center">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configurações</h1>

      <AppNameSettingsCard
        appName={formState.appName}
        setAppName={setters.setAppName}
        adminHeaderTitle={formState.adminHeaderTitle}
        setAdminHeaderTitle={setters.setAdminHeaderTitle}
        appIcon={formState.appIcon}
        setAppIcon={setters.setAppIcon}
      />

      <GeneralSettingsCard
        restaurantName={formState.restaurantName}
        setRestaurantName={setters.setRestaurantName}
        address={formState.address}
        setAddress={setters.setAddress}
        phone={formState.phone}
        setPhone={setters.setPhone}
        email={formState.email}
        setEmail={setters.setEmail}
        description={formState.description}
        setDescription={setters.setDescription}
        slug={formState.slug}
        setSlug={setters.setSlug}
        restaurantType={formState.restaurantType}
        setRestaurantType={setters.setRestaurantType}
      />

      <StoreBrandingSettingsCard
        displayName={formState.displayName}
        setDisplayName={setters.setDisplayName}
        logoUrl={formState.logoUrl}
        setLogoUrl={setters.setLogoUrl}
        logoFile={formState.logoFile}
        setLogoFile={setters.setLogoFile}
        finalLogoPreview={localPreviews.finalLogoPreview}
        logoFileInputKey={formState.logoFileInputKey}
      />

      <SidebarSettingsCard
        settings={SIDEBAR_SETTINGS_FIELDS as any}
        values={formState.sidebarCustomizations}
        onValueChange={setters.handleSidebarCustomizationChange}
      />

      <HeroSectionSettingsCard
        heroTitle={formState.heroTitle}
        setHeroTitle={setters.setHeroTitle}
        heroDescription={formState.heroDescription}
        setHeroDescription={setters.setHeroDescription}
      />

      <FeaturedPizzasTitleSettingsCard
        featuredPizzasTitle={formState.featuredPizzasTitle}
        setFeaturedPizzasTitle={setters.setFeaturedPizzasTitle}
      />

      <FeatureTextsSettingsCard
        feature1Title={formState.feature1Title}
        setFeature1Title={setters.setFeature1Title}
        feature1Description={formState.feature1Description}
        setFeature1Description={setters.setFeature1Description}
        feature2Title={formState.feature2Title}
        setFeature2Title={setters.setFeature2Title}
        feature2Description={formState.feature2Description}
        setFeature2Description={setters.setFeature2Description}
        feature3Title={formState.feature3Title}
        setFeature3Title={setters.setFeature3Title} // This setter is a no-op in the hook
        feature3Description={formState.feature3Description}
        setFeature3Description={setters.setFeature3Description} // This setter is a no-op in the hook
      />

      <ExploreSectionSettingsCard
        exploreTitle={formState.exploreTitle}
        setExploreTitle={setters.setExploreTitle}
        exploreDescription={formState.exploreDescription}
        setExploreDescription={setters.setExploreDescription}
      />

      <StoreImageSettingsCard
        imageUrl={formState.bannerImageUrl}
        setImageUrl={setters.setBannerImageUrl}
        imageFile={formState.bannerImageFile}
        setImageFile={setters.setBannerImageFile}
        finalImagePreview={localPreviews.finalBannerImagePreview}
      />

      <OperationalHoursSettingsCard
        openingHoursMonFri={formState.openingHoursMonFri}
        setOpeningHoursMonFri={setters.setOpeningHoursMonFri}
        openingHoursSatSun={formState.openingHoursSatSun}
        setOpeningHoursSatSun={setters.setOpeningHoursSatSun}
        isClosedOnHolidays={formState.isClosedOnHolidays}
        setIsClosedOnHolidays={setters.setIsClosedOnHolidays}
      />

      <NotificationSettingsCard
        receiveOrderNotifications={formState.receiveOrderNotifications}
        setReceiveOrderNotifications={setters.setReceiveOrderNotifications}
        receiveDeliveryNotifications={formState.receiveDeliveryNotifications}
        setReceiveDeliveryNotifications={setters.setReceiveDeliveryNotifications}
        notificationEmail={formState.notificationEmail}
        setNotificationEmail={setters.setNotificationEmail}
      />

      <RegionalSettingsCard
        language={formState.language}
        setLanguage={setters.setLanguage}
        timezone={formState.timezone}
        setTimezone={setters.setTimezone}
      />

      <div className="flex justify-end">
        <Button onClick={handleSaveChanges} disabled={isSaving || isUploading}>
          {isSaving || isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Todas as Configurações"
          )}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;