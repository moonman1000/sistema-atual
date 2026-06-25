import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, MoreHorizontal, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AddProductDialog from "@/components/admin/AddProductDialog";
import EditProductDialog from "@/components/admin/EditProductDialog";
import { useMenu, MenuItem, MenuItemSize, MenuItemTopping } from "@/context/MenuContext";
import { useCategories } from "@/context/CategoryContext";
import { useSession } from '@/context/SessionContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { formatCurrency } from "@/lib/utils";

const MenuManagementPage = () => {
  const { session, isAdmin, isLoading: isLoadingSession } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const { menuItems, isLoadingMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } = useMenu();
  const { categories, isLoadingCategories } = useCategories();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("Todos");
  const [sortBy, setSortBy] = React.useState("name-asc");

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<MenuItem | null>(null);

  const availableCategories = useMemo(() => ["Todos", ...categories.map(cat => cat.name)], [categories]);

  const filteredProducts = useMemo(() => {
    let currentProducts = menuItems;

    if (searchTerm) {
      currentProducts = currentProducts.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "Todos") {
      currentProducts = currentProducts.filter(
        (item) => item.category === selectedCategory
      );
    }

    const sortedProducts = [...currentProducts];

    sortedProducts.sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name) * -1;
      }
      if (sortBy === "price-asc") {
        return a.base_price - b.base_price;
      }
      if (sortBy === "price-desc") {
        return b.base_price - a.base_price;
      }
      return 0;
    });

    return currentProducts;
  }, [searchTerm, selectedCategory, sortBy, menuItems]);

  const handleAddProduct = async (
    newProductData: Omit<MenuItem, 'id' | 'created_at' | 'updated_at' | 'sizes' | 'toppings' | 'reviews' | 'restaurant_id'>,
    sizes: Omit<MenuItemSize, 'id' | 'menu_item_id' | 'created_at' | 'updated_at' | 'restaurant_id'>[],
    toppings: Omit<MenuItemTopping, 'id' | 'menu_item_id' | 'created_at' | 'updated_at' | 'restaurant_id'>[]
  ) => {
    try {
      await addMenuItem(newProductData, sizes, toppings);
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
    }
  };

  const handleEditProduct = async (
    updatedProduct: MenuItem,
    sizes: Omit<MenuItemSize, 'id' | 'menu_item_id' | 'created_at' | 'updated_at' | 'restaurant_id'>[],
    toppings: Omit<MenuItemTopping, 'id' | 'menu_item_id' | 'created_at' | 'updated_at' | 'restaurant_id'>[]
  ) => {
    try {
      await updateMenuItem(updatedProduct, sizes, toppings);
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
    }
  };

  const openEditDialog = (product: MenuItem) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteMenuItem(productId);
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
    }
  };

  if (isLoadingMenuItems || isLoadingSession || isLoadingRestaurants || isLoadingCategories) {
    return <div className="flex min-h-screen items-center justify-center">Carregando cardápio...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Gerenciar Cardápio</h1>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddDialogOpen(true)}>Adicionar Produto</Button>
            <Button variant="outline" onClick={useMenu().fetchMenuItems}>
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Input
            placeholder="Buscar produtos..."
            className="max-w-sm flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                Categoria: {selectedCategory} <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {availableCategories.map(category => (
                <DropdownMenuItem key={category} onClick={() => setSelectedCategory(category)}>
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                Preço <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("price-asc")}>Crescente</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("price-desc")}>Decrescente</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                Nome <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy("name-asc")}>A-Z</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name-desc")}>Z-A</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <img
                      alt={product.name}
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={product.image}
                      width="64"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.description}</TableCell>
                  <TableCell>{formatCurrency(product.base_price)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(product)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteProduct(product.id)}>
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <AddProductDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAddProduct={handleAddProduct}
          categories={categories.map(cat => cat.name)}
          restaurantType={currentRestaurant?.type || "restaurant"} 
        />

        {editingProduct && (
          <EditProductDialog
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            product={editingProduct}
            onEditProduct={handleEditProduct}
            categories={categories.map(cat => cat.name)}
            restaurantType={currentRestaurant?.type || "restaurant"} 
          />
        )}
      </div>
    </>
  );
};

export default MenuManagementPage;