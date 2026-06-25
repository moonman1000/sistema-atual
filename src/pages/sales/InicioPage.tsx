import React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Clock, Utensils, ShoppingCart, Loader2, MapPin, Search as SearchIcon } from "lucide-react"; // Adicionado MapPin e SearchIcon
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardDescription, CardHeader } from "@/components/ui/card"; // Adicionado CardDescription e CardHeader
import { Input } from "@/components/ui/input"; // Adicionado Input
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useMenu, MenuItem } from "@/context/MenuContext";
import { useSession } from '@/context/SessionContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { useCategories, Category } from "@/context/CategoryContext";
import { usePromotions } from "@/context/PromotionsContext"; // Importar usePromotions
import MenuItemConfiguratorDialog from "@/components/sales/MenuItemConfiguratorDialogNew";
import PromotionsCarousel from "@/components/sales/PromotionsCarousel"; // Importar PromotionsCarousel
import RestaurantCard from "@/components/sales/RestaurantCard"; // Importar RestaurantCard
import PharmacyCard from "@/components/sales/PharmacyCard"; // Importar PharmacyCard
import MarketCard from "@/components/sales/MarketCard"; // Importar MarketCard
import PetshopCard from "@/components/sales/PetshopCard"; // Importar PetshopCard
import ServiceCard from "@/components/sales/ServiceCard"; // Importar ServiceCard
import { formatCurrency, slugify, getRestaurantTypePath } from "@/lib/utils";

const HomePage = () => {
  const { addToCart } = useCart();
  const { menuItems, isLoadingMenuItems, allGlobalMenuItems } = useMenu(); // Adicionado allGlobalMenuItems
  const { isLoading: isLoadingSession, isCustomer, profile } = useSession();
  const { isLoadingRestaurants, currentRestaurant, allRestaurants } = useRestaurant();
  const { categories, isLoadingCategories } = useCategories();
  const { allGlobalPromotions, isLoadingGlobalPromotions } = usePromotions(); // Usar allGlobalPromotions
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();

  const [isConfiguratorOpen, setIsConfiguratorOpen] = React.useState(false);
  const [selectedMenuItemForConfig, setSelectedMenuItemForConfig] = React.useState<MenuItem | null>(null);
  const [selectedCategoryTab, setSelectedCategoryTab] = React.useState("Todos");
  const [searchTerm, setSearchTerm] = React.useState(""); // Estado para busca
  const [addressSearchTerm, setAddressSearchTerm] = React.useState(""); // Estado para busca de endereço

  const categoriesWithItems = React.useMemo(() => {
    const categoryMap = new Map<string, { category: Category, representativeImage: string | null }>();
    
    // Adiciona todas as categorias do contexto, garantindo que mesmo categorias sem itens apareçam
    categories.forEach(cat => {
      categoryMap.set(cat.name, { category: cat, representativeImage: null });
    });

    // Preenche com imagens representativas dos itens do menu
    menuItems.forEach(item => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, { category: { id: '', name: item.category, restaurant_id: item.restaurant_id }, representativeImage: null });
      }
      if (!categoryMap.get(item.category)?.representativeImage) {
        categoryMap.set(item.category, { ...categoryMap.get(item.category)!, representativeImage: item.image });
      }
    });

    return Array.from(categoryMap.values());
  }, [menuItems, categories]);

  // Filtrar restaurantes para a listagem geral
  const filteredRestaurants = React.useMemo(() => {
    let current = allRestaurants;

    if (searchTerm) {
      current = current.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (addressSearchTerm) {
      current = current.filter(r => 
        r.address?.toLowerCase().includes(addressSearchTerm.toLowerCase())
      );
    }
    return current;
  }, [allRestaurants, searchTerm, addressSearchTerm]);


  if (isLoadingMenuItems || isLoadingSession || isLoadingRestaurants || isLoadingCategories || isLoadingGlobalPromotions) {
    return (
      <div className="flex min-h-screen items-center justify-center">Carregando conteúdo...</div>
    );
  }

  // Lógica para determinar o conteúdo da página
  if (!currentRestaurant) {
    // Renderizar a página de listagem geral
    const restaurantTypePromotions = allGlobalPromotions.filter(promo => {
      const restaurant = allRestaurants.find(r => r.id === promo.restaurant_id);
      return restaurant && restaurant.type === 'restaurant';
    });

    const pharmacyTypePromotions = allGlobalPromotions.filter(promo => {
      const restaurant = allRestaurants.find(r => r.id === promo.restaurant_id);
      return restaurant && restaurant.type === 'pharmacy';
    });

    const marketTypePromotions = allGlobalPromotions.filter(promo => {
      const restaurant = allRestaurants.find(r => r.id === promo.restaurant_id);
      return restaurant && restaurant.type === 'market';
    });

    const petshopTypePromotions = allGlobalPromotions.filter(promo => {
      const restaurant = allRestaurants.find(r => r.id === promo.restaurant_id);
      return restaurant && restaurant.type === 'petshop';
    });

    const serviceTypePromotions = allGlobalPromotions.filter(promo => {
      const restaurant = allRestaurants.find(r => r.id === promo.restaurant_id);
      return restaurant && restaurant.type === 'service';
    });

    return (
      <div className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-display font-extrabold mb-4 text-primary">Bem-vindo ao PedeJá!</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Descubra uma variedade de estabelecimentos e encontre o que você precisa.
          </p>
        </div>

        {/* Search and Filter Section for general listing */}
        <Card className="mb-12 p-6 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold">Encontre seu Estabelecimento</CardTitle>
            <CardDescription>Busque por nome, descrição ou endereço.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative flex-1 w-full">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por endereço..."
                className="pl-10 w-full"
                value={addressSearchTerm}
                onChange={(e) => setAddressSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Global Promotions Carousel */}
        <PromotionsCarousel promotions={allGlobalPromotions} menuItems={allGlobalMenuItems} />

        {/* All Restaurants Listing */}
        <section className="mt-12">
          <h2 className="text-3xl font-bold text-primary mb-8 text-center">Todos os Estabelecimentos</h2>
          {filteredRestaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRestaurants.map((restaurant) => {
                switch (restaurant.type) {
                  case 'restaurant':
                    return <RestaurantCard key={restaurant.id} restaurant={restaurant} />;
                  case 'pharmacy':
                    return <PharmacyCard key={restaurant.id} pharmacy={restaurant} />;
                  case 'market':
                    return <MarketCard key={restaurant.id} market={restaurant} />;
                  case 'petshop':
                    return <PetshopCard key={restaurant.id} petshop={restaurant} />;
                  case 'service':
                    return <ServiceCard key={restaurant.id} service={restaurant} />;
                  default:
                    return <RestaurantCard key={restaurant.id} restaurant={restaurant} />; // Fallback
                }
              })}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <h3 className="text-2xl font-semibold mb-2 text-primary">Nenhum estabelecimento encontrado.</h3>
              <p className="text-lg text-muted-foreground">
                Ajuste sua busca ou verifique se há estabelecimentos cadastrados.
              </p>
            </div>
          )}
        </section>
      </div>
    );
  }

  // --- Se currentRestaurant NÃO for null, renderiza a página de loja específica ---
  const storeIdentifier = currentRestaurant?.slug || currentRestaurant?.id || restaurantId;
  const baseRoute = storeIdentifier ? `/${getRestaurantTypePath(currentRestaurant.type)}/${storeIdentifier}` : '';

  const featuredPizzas = menuItems.filter(item => item.is_featured);

  const heroBannerImage = currentRestaurant?.image || "/images/home_hero_pizza_new.png";
  
  const heroTitle = currentRestaurant?.hero_title || "Pizza Deliciosa, Entrega Rápida.";
  const heroDescription = currentRestaurant?.hero_description || "Pizzas artesanais feitas com os ingredientes mais frescos, direto na sua porta.";

  const feature1Title = currentRestaurant?.feature_1_title || "Entrega em 30 Minutos";
  const feature1Description = currentRestaurant?.feature_1_description || "Receba sua pizza quente e fresca, exatamente quando quiser.";
  const feature2Title = currentRestaurant?.feature_2_title || "Ingredientes Frescos";
  const feature2Description = currentRestaurant?.feature_2_description || "Usamos apenas os melhores ingredientes, de origem local.";
  const feature3Title = currentRestaurant?.feature_3_title || "Peça Online";
  const feature3Description = currentRestaurant?.feature_3_description || "Pedido fácil e rápido através do nosso site moderno.";
  const exploreTitle = currentRestaurant?.explore_title || "Explore Nosso Cardápio Completo";
  const exploreDescription = currentRestaurant?.explore_description || "Descubra todas as nossas deliciosas opções de pizzas, bebidas e sobremesas.";
  const featuredPizzasTitle = currentRestaurant?.featured_pizzas_title || "Pizzas em Destaque";

  const openConfigurator = (pizza: MenuItem) => {
    setSelectedMenuItemForConfig(pizza);
    setIsConfiguratorOpen(true);
  };

  const handleCloseConfigurator = () => {
    setIsConfiguratorOpen(false);
    setSelectedMenuItemForConfig(null);
  };

  const handleConfirmAddToCart = (
    product: MenuItem,
    selectedSizeValue: string,
    selectedToppingValues: string[],
    quantity: number
  ) => {
    addToCart(product, selectedSizeValue, selectedToppings, quantity);
    toast.success(`${quantity}x ${product.name} adicionado(s) ao carrinho!`);
  };

  const handleCategoryTabClick = (categoryName: string) => {
    setSelectedCategoryTab(categoryName);
    const categorySlug = categoryName === "Todos" ? "" : slugify(categoryName);
    navigate(`${baseRoute}/menu${categorySlug ? `?category=${categorySlug}` : ''}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section
        className="relative h-[500px] bg-cover bg-center flex items-center justify-center text-center text-white"
        style={{ backgroundImage: `url(${heroBannerImage})` }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 space-y-4 pt-12">
          <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
            {heroTitle.split(',').map((line, index) => (
              <React.Fragment key={index}>
                {line.trim()}
                {index === 0 && <br />}
              </React.Fragment>
            ))}
          </h1>
          <p className="mt-4 max-w-lg text-lg text-gray-200 mx-auto">
            {heroDescription}
          </p>
          <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white" asChild>
            <Link to={`${baseRoute}/menu`}>Peça Agora</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div className="flex flex-col items-center space-y-2">
          <Clock className="h-8 w-8 text-primary" />
          <h3 className="text-xl font-semibold">{feature1Title}</h3>
          <p className="text-muted-foreground">{feature1Description}</p>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <Utensils className="h-8 w-8 text-primary" />
          <h3 className="text-xl font-semibold">{feature2Title}</h3>
          <p className="text-muted-foreground">{feature2Description}</p>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <ShoppingCart className="h-8 w-8 text-primary" />
          <h3 className="text-xl font-semibold">{feature3Title}</h3>
          <p className="text-muted-foreground">{feature3Description}</p>
        </div>
      </section>

      {/* Featured Pizzas Section */}
      <section className="container py-12 bg-muted/40">
        <h2 className="text-3xl font-bold text-center mb-8">{featuredPizzasTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredPizzas.length > 0 ? (
            featuredPizzas.map((pizza) => (
              <Card key={pizza.id} className="flex flex-col">
                <Link to={`${baseRoute}/product/${pizza.id}`}>
                  <img
                    src={pizza.image || "/public/images/pizza_logo.png"}
                    alt={pizza.name}
                    width={400}
                    height={250}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                </Link>
                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold mb-2">{pizza.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{pizza.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{formatCurrency(pizza.base_price)}</span>
                    <Button
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={() => openConfigurator(pizza)}
                    >
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8 border rounded-lg bg-background">
              <h3 className="text-xl font-semibold mb-2">Nenhum item em destaque encontrado.</h3>
              <p className="text-muted-foreground">Adicione itens em destaque no painel administrativo.</p>
            </div>
          )}
        </div>
      </section>

      {/* Explore Categories Section */}
      <section className="container py-12 text-center">
        <h2 className="text-3xl font-bold mb-8">{exploreTitle}</h2>
        <p className="text-lg text-muted-foreground mb-6">
          {exploreDescription}
        </p>
        
        {/* Category Tabs */}
        <div className="mt-10 flex justify-center">
          <div className="flex space-x-1 rounded-lg bg-primary/10 p-1">
            <Button
              className={`px-4 py-2 text-sm font-medium rounded-md ${selectedCategoryTab === "Todos" ? "bg-white text-primary shadow" : "text-primary/80 hover:bg-primary/5"}`}
              onClick={() => handleCategoryTabClick("Todos")}
            >
              Todos
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                className={`px-4 py-2 text-sm font-medium rounded-md ${selectedCategoryTab === cat.name ? "bg-white text-primary shadow" : "text-primary/80 hover:bg-primary/5"}`}
                onClick={() => handleCategoryTabClick(cat.name)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Category Cards */}
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:gap-x-8">
          {categoriesWithItems
            .filter(catItem => selectedCategoryTab === "Todos" || catItem.category.name === selectedCategoryTab)
            .map((catItem) => (
              <Link key={catItem.category.id || catItem.category.name} to={`${baseRoute}/menu?category=${slugify(catItem.category.name)}`} className="group">
                <div className="w-full aspect-square overflow-hidden rounded-lg">
                  <img
                    alt={catItem.category.name}
                    className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    src={catItem.representativeImage || "/public/images/pizza_logo.png"}
                  />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{catItem.category.name}</h3>
              </Link>
            ))}
        </div>
      </section>

      {/* Item Configurator Dialog */}
      <MenuItemConfiguratorDialog
        isOpen={isConfiguratorOpen}
        onClose={handleCloseConfigurator}
        menuItem={selectedMenuItemForConfig}
        onConfirm={handleConfirmAddToCart}
      />
    </div>
  );
};

export default HomePage;