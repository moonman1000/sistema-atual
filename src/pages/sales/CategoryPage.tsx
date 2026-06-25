import React from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronDown, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { useMenu, MenuItem } from "@/context/MenuContext";
import { useSession } from '@/context/SessionContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { usePromotions } from '@/context/PromotionsContext';
import MenuItemConfiguratorDialog from "@/components/sales/MenuItemConfiguratorDialogNew";
import { formatCurrency, slugify, getRestaurantTypePath } from "@/lib/utils"; // Importar getRestaurantTypePath

const CategoryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { addToCart } = useCart();
  const { menuItems, isLoadingMenuItems } = useMenu();
  const { isLoading: isLoadingSession } = useSession();
  const { isLoadingRestaurants, currentRestaurant } = useRestaurant();
  const { promotions, isLoadingPromotions } = usePromotions();

  const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 200]);
  const [selectedDietary, setSelectedDietary] = React.useState<string[]>([]);
  const [sortBy, setSortBy] = React.useState("popularity");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 50;

  const [isConfiguratorOpen, setIsConfiguratorOpen] = React.useState(false);
  const [selectedMenuItemForConfig, setSelectedMenuItemForConfig] = React.useState<MenuItem | null>(null);

  const queryParams = new URLSearchParams(location.search);
  const categoryParam = queryParams.get("category");
  const promoIdParam = queryParams.get("promoId");
  
  const storeIdentifier = restaurantId; 
  const restaurantTypePrefix = currentRestaurant ? getRestaurantTypePath(currentRestaurant.type) : 'loja'; // Usar getRestaurantTypePath
  const baseRoute = storeIdentifier ? `/${restaurantTypePrefix}/${storeIdentifier}` : '';

  const uniqueCategories = React.useMemo(() => ["Todos", ...Array.from(new Set(menuItems.map(item => item.category)))], [menuItems]);

  const filteredPizzas = React.useMemo(() => {
    let currentPizzas = menuItems;

    if (promoIdParam) {
      const promotion = promotions.find(p => p.id === promoIdParam);
      if (promotion && promotion.applicable_items && promotion.applicable_items[0] !== "Todos") {
        currentPizzas = currentPizzas.filter(item => promotion.applicable_items?.includes(item.name));
      } else if (promotion && promotion.applicable_items && promotion.applicable_items[0] === "Todos") {
      } else {
        toast.error("Promoção não encontrada ou inválida.");
      }
    }

    currentPizzas = currentPizzas.filter(item => {
      const matchesCategory = categoryParam
        ? slugify(item.category) === categoryParam
        : true;
      const matchesPrice = item.base_price >= priceRange[0] && item.base_price <= priceRange[1];
      const matchesDietary = selectedDietary.length === 0 || selectedDietary.every(diet => item.dietary.includes(diet));
      return matchesCategory && matchesPrice && matchesDietary;
    });

    const sortedPizzas = [...currentPizzas];

    sortedPizzas.sort((a, b) => {
      if (sortBy === "price-asc") return a.base_price - b.base_price;
      if (sortBy === "price-desc") return b.base_price - a.base_price;
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      return 0;
    });
    return sortedPizzas;
  }, [menuItems, categoryParam, promoIdParam, promotions, priceRange, selectedDietary, sortBy]);

  const getMenuLabel = () => {
    if (!currentRestaurant) return "Cardápio";
    switch (currentRestaurant.type) {
      case "pharmacy":
      case "market":
      case "service":
        return "Produtos";
      case "petshop":
        return "Animais";
      default:
        return "Cardápio";
    }
  };

  const pageTitle = React.useMemo(() => {
    if (isLoadingMenuItems || !currentRestaurant) return `Carregando ${getMenuLabel()}...`;

    if (promoIdParam) {
      const promotion = promotions.find(p => p.id === promoIdParam);
      if (promotion) {
        if (promotion.applicable_items && promotion.applicable_items[0] === "Todos") {
          return `${getMenuLabel()} em Promoção: ${promotion.name}`;
        }
        return `Itens em Promoção: ${promotion.name}`;
      }
    }
    return categoryParam
      ? menuItems.find(item => slugify(item.category) === categoryParam)?.category || getMenuLabel()
      : `${getMenuLabel()} Completo`;
  }, [promoIdParam, promotions, categoryParam, menuItems, isLoadingMenuItems, currentRestaurant, getMenuLabel]);


  console.log("CategoryPage Render:");
  console.log("  isLoadingSession:", isLoadingSession);
  console.log("  isLoadingRestaurants:", isLoadingRestaurants);
  console.log("  isLoadingMenuItems:", isLoadingMenuItems);
  console.log("  isLoadingPromotions:", isLoadingPromotions);
  console.log("  currentRestaurant:", currentRestaurant ? currentRestaurant.name : "null", "ID:", currentRestaurant?.id);
  console.log("  menuItems.length:", menuItems.length);
  console.log("  promoIdParam:", promoIdParam);


  if (isLoadingMenuItems || isLoadingSession || isLoadingRestaurants || isLoadingPromotions) {
    console.log("CategoryPage: Showing loading state.");
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando {getMenuLabel().toLowerCase()}...</p>
      </div>
    );
  }

  if (!currentRestaurant) {
    console.log("CategoryPage: Loading finished, but currentRestaurant is null. Displaying 'Restaurant Not Found'.");
    return (
      <div className="container py-8 text-center min-h-screen flex flex-col justify-center items-center">
        <h2 className="text-3xl font-bold text-destructive">Estabelecimento Não Encontrado</h2>
        <p className="text-lg text-muted-foreground mt-4">
          Não foi possível carregar os dados do estabelecimento com o identificador "{restaurantId}".
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Voltar para a página inicial</Link>
        </Button>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredPizzas.length / itemsPerPage);
  const currentItems = filteredPizzas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCategoryChange = (categoryName: string) => {
    const newCategoryParam = categoryName === "Todos" ? "" : slugify(categoryName);
    navigate({ search: newCategoryParam ? `?category=${newCategoryParam}` : '' });
    setCurrentPage(1);
  };

  const handleDietaryChange = (diet: string, checked: boolean) => {
    setSelectedDietary(prev =>
      checked ? [...prev, diet] : prev.filter(d => d !== diet)
    );
    setCurrentPage(1);
  };

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
    addToCart(product, selectedSizeValue, selectedToppingValues, quantity);
    toast.success(`${quantity}x ${product.name} adicionado(s) ao carrinho!`);
  };


  const renderPaginationItems = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      pages.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 2) {
        pages.push(<PaginationEllipsis key="ellipsis-start" />);
      }

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage === 1) {
        endPage = Math.min(totalPages - 1, 3);
      } else if (currentPage === totalPages) {
        startPage = Math.max(2, totalPages - 3);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 1) {
        pages.push(<PaginationEllipsis key="ellipsis-end" />);
      }

      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return pages;
  };

  return (
    <div className="container py-8 grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
      <aside className="space-y-6 p-4 rounded-lg border bg-card shadow-sm">
        <h2 className="text-2xl font-bold text-primary">Filtros</h2>

        <div>
          <h3 className="font-semibold mb-2 text-foreground">Categoria</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {categoryParam
                  ? menuItems.find(item => slugify(item.category) === categoryParam)?.category || "Selecionar Categoria"
                  : "Todos"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              {uniqueCategories.map(cat => (
                <DropdownMenuItem key={cat} onClick={() => handleCategoryChange(cat)}>
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-foreground">Ordenar por</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {sortBy === "popularity" && "Popularidade"}
                {sortBy === "price-asc" && "Preço: Menor para Maior"}
                {sortBy === "price-desc" && "Preço: Maior para Menor"}
                {sortBy === "name-asc" && "Nome: A-Z"}
                {sortBy === "name-desc" && "Nome: Z-A"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuItem onClick={() => setSortBy("popularity")}>Popularidade</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("price-asc")}>Preço: Menor para Maior</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("price-desc")}>Preço: Maior para Menor</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name-asc")}>Nome: A-Z</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name-desc")}>Nome: Z-A</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-foreground">Dietas</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="vegetarian"
                checked={selectedDietary.includes("Vegetariana")}
                onCheckedChange={(checked) => handleDietaryChange("Vegetariana", !!checked)}
              />
              <label htmlFor="vegetarian" className="text-sm font-medium leading-none text-muted-foreground">
                Vegetariana
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="vegan"
                checked={selectedDietary.includes("Vegana")}
                onCheckedChange={(checked) => handleDietaryChange("Vegana", !!checked)}
              />
              <label htmlFor="vegan" className="text-sm font-medium leading-none text-muted-foreground">
                Vegana
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="gluten-free"
                checked={selectedDietary.includes("Sem Glúten")}
                onCheckedChange={(checked) => handleDietaryChange("Sem Glúten", !!checked)}
              />
              <label htmlFor="gluten-free" className="text-sm font-medium leading-none text-muted-foreground">
                Sem Glúten
              </label>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-foreground">Faixa de Preço</h3>
          <Slider
            min={0}
            max={200}
            step={1}
            value={priceRange}
            onValueChange={(value: [number, number]) => {
              setPriceRange(value);
              setCurrentPage(1);
            }}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>{formatCurrency(priceRange[0])}</span>
            <span>{formatCurrency(priceRange[1])}</span>
          </div>
        </div>
      </aside>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-primary">{pageTitle}</h2>
          <span className="text-muted-foreground">Mostrando {currentItems.length} de {filteredPizzas.length} itens</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentItems.length > 0 ? (
            currentItems.map((pizza) => (
              <Card key={pizza.id} className="flex flex-col overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                <Link to={`${baseRoute}/product/${pizza.id}`} className="block relative overflow-hidden group">
                  <img
                    src={pizza.image}
                    alt={pizza.name}
                    width={400}
                    height={250}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-white text-lg font-semibold">Ver Detalhes</span>
                  </div>
                </Link>
                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold mb-2 text-foreground">{pizza.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{pizza.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">{formatCurrency(pizza.base_price)}</span>
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
            <div className="col-span-full text-center py-12 border rounded-lg bg-muted/50">
              <h3 className="text-xl font-semibold mb-2">Nenhum item encontrado.</h3>
              <p className="text-muted-foreground">Ajuste seus filtros ou verifique se o cardápio foi cadastrado.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <Pagination className="mt-8">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4 text-foreground" />
                  <span className="sr-only">Anterior</span>
                </PaginationPrevious>
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                  <span className="sr-only">Próxima</span>
                  <ChevronRight className="h-4 w-4" />
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </section>

      <MenuItemConfiguratorDialog
        isOpen={isConfiguratorOpen}
        onClose={handleCloseConfigurator}
        menuItem={selectedMenuItemForConfig}
        onConfirm={handleConfirmAddToCart}
      />
    </div>
  );
};

export default CategoryPage;