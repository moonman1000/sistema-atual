import React, { useState, useMemo, useEffect } from "react";
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
import { ChevronDown, MoreHorizontal, Tag, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import AddCategoryDialog from "@/components/admin/AddCategoryDialog";
import EditCategoryDialog from "@/components/admin/EditCategoryDialog";
import { useCategories, Category } from "@/context/CategoryContext";
import { useSession } from '@/context/SessionContext';
import { useRestaurant } from '@/context/RestaurantContext';
import AdminTableFiltersWrapper from "@/components/admin/AdminTableFiltersWrapper"; // Importar wrapper
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Importar Tooltip

const CategoriesPage = () => {
  const { session, isAdmin, isSuperAdmin, isLoading: isLoadingSession } = useSession(); // Adicionado isSuperAdmin
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const { categories, isLoadingCategories, addCategory, updateCategory, deleteCategory, fetchCategories } = useCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (!isLoadingSession && !session) {
      toast.info("Você precisa estar logado para acessar esta página.");
    } else if (!isLoadingSession && session && !isAdmin && !isSuperAdmin) { // CORRIGIDO: Incluir isSuperAdmin na verificação de acesso
      toast.error("Acesso negado. Apenas administradores ou super administradores podem gerenciar categorias.");
    }
  }, [isLoadingSession, session, isAdmin, isSuperAdmin]); // Adicionado isSuperAdmin como dependência

  const filteredCategories = useMemo(() => {
    let currentCategories = categories;

    if (searchTerm) {
      currentCategories = currentCategories.filter(
        (category) =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    currentCategories.sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name) * -1;
      }
      return 0;
    });

    return currentCategories;
  }, [searchTerm, sortBy, categories]);

  const handleAddCategory = async (newCategoryData: Omit<Category, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => {
    try {
      await addCategory(newCategoryData);
    } catch (error) {
      console.error("Erro ao adicionar categoria:", error);
    }
  };

  const handleUpdateCategory = async (updatedCategory: Category) => {
    try {
      await updateCategory(updatedCategory);
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error);
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
    }
  };

  if (isLoadingCategories || isLoadingSession || isLoadingRestaurants) {
    return <div className="flex min-h-screen items-center justify-center">Carregando categorias...</div>;
  }

  // CORRIGIDO: Renderizar a página apenas se o usuário for admin ou super_admin
  if (!session || (!isAdmin && !isSuperAdmin)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-destructive">Acesso negado. Você não tem permissão para gerenciar categorias.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Categorias</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>Adicionar Categoria</Button>
          <Button variant="outline" onClick={fetchCategories}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      <AdminTableFiltersWrapper>
        <Input
          placeholder="Buscar categorias..."
          className="max-w-sm flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Ordenar por <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy("name-asc")}>Nome (A-Z)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("name-desc")}>Nome (Z-A)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </AdminTableFiltersWrapper>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="cursor-default">
                        {category.id.substring(0, 8)}...
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{category.id}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(category)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCategory(category.id)}>
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

      <AddCategoryDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddCategory={handleAddCategory}
      />

      {editingCategory && (
        <EditCategoryDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          category={editingCategory}
          onUpdateCategory={handleUpdateCategory}
        />
      )}
    </div>
  );
};

export default CategoriesPage;