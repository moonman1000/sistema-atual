import React, { useState, useMemo, useEffect, useCallback } from "react";
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
import AddInventoryItemDialog from "@/components/admin/AddInventoryItemDialog";
import EditInventoryItemDialog from "@/components/admin/EditInventoryItemDialog"; // CORRIGIDO: Caminho de importação
import ViewInventoryItemDetailsDialog from "@/components/admin/ViewInventoryItemDetailsDialog";
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/context/SessionContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { useSuppliers } from '@/context/SupplierContext';
import AdminTableFiltersWrapper from "@/components/admin/AdminTableFiltersWrapper"; // Importar wrapper
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Importar Tooltip

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  min_stock_level: number;
  unit: string;
  last_restock_date: string; // YYYY-MM-DD
  supplier: string;
  restaurant_id: string;
  created_at?: string;
  updated_at?: string;
}

const availableCategories = ["Ingredientes", "Embalagens", "Bebidas", "Limpeza", "Outros"];
const availableUnits = ["kg", "litros", "unidades", "pacotes", "gramas", "ml"];

const InventoryPage = () => {
  const { session, isAdmin, isLoading: isLoadingSession, isSuperAdmin } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const { suppliers, isLoadingSuppliers } = useSuppliers();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("Todos");
  const [filterStockStatus, setFilterStockStatus] = useState("Todos");
  const [sortBy, setSortBy] = useState("name-asc");
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const fetchInventoryItems = useCallback(async () => {
    setIsLoadingInventory(true);
    const targetRestaurantId = currentRestaurant?.id;

    if (!session || (!isAdmin && !isSuperAdmin) || !targetRestaurantId) {
      setInventoryItems([]);
      setIsLoadingInventory(false);
      return;
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('restaurant_id', targetRestaurantId)
      .order('name', { ascending: true });

    if (error) {
      console.error("Erro ao carregar itens do inventário:", error);
      toast.error("Erro ao carregar itens do inventário.");
      setInventoryItems([]);
    } else {
      setInventoryItems(data as InventoryItem[]);
    }
    setIsLoadingInventory(false);
  }, [session, isAdmin, isSuperAdmin, currentRestaurant?.id]);

  useEffect(() => {
    let cancelled = false;
    const runFetch = async () => {
      if (isLoadingSession || isLoadingRestaurants || isLoadingSuppliers) {
        if (!cancelled) {
          setInventoryItems([]);
          setIsLoadingInventory(true);
        }
        return;
      }
      if (session && (isAdmin || isSuperAdmin) && currentRestaurant?.id) {
        await fetchInventoryItems();
      } else {
        if (!cancelled) {
          setInventoryItems([]);
          setIsLoadingInventory(false);
        }
      }
    };
    runFetch();
    return () => { cancelled = true; };
  }, [isLoadingSession, isLoadingRestaurants, isLoadingSuppliers, session, isAdmin, isSuperAdmin, currentRestaurant?.id, fetchInventoryItems]);

  const filteredItems = useMemo(() => {
    let currentItems = inventoryItems;

    if (searchTerm) {
      currentItems = currentItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory !== "Todos") {
      currentItems = currentItems.filter((item) => item.category === filterCategory);
    }

    if (filterStockStatus === "Baixo") {
      currentItems = currentItems.filter((item) => item.current_stock < item.min_stock_level);
    } else if (filterStockStatus === "Suficiente") {
      currentItems = currentItems.filter((item) => item.current_stock >= item.min_stock_level);
    }

    currentItems.sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name) * -1;
      }
      if (sortBy === "stock-asc") {
        return a.current_stock - b.current_stock;
      }
      if (sortBy === "stock-desc") {
        return b.current_stock - a.current_stock;
      }
      if (sortBy === "lastRestockDate-asc") {
        return new Date(a.last_restock_date).getTime() - new Date(b.last_restock_date).getTime();
      }
      if (sortBy === "lastRestockDate-desc") {
        return new Date(b.last_restock_date).getTime() - new Date(a.last_restock_date).getTime();
      }
      return 0;
    });

    return currentItems;
  }, [searchTerm, filterCategory, filterStockStatus, sortBy, inventoryItems]);

  const handleAddInventoryItem = async (newItemData: Omit<InventoryItem, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => {
    if (!currentRestaurant?.id) {
      toast.error("Nenhum restaurante selecionado para adicionar item ao inventário.");
      return;
    }
    setIsLoadingInventory(true);
    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        ...newItemData,
        restaurant_id: currentRestaurant.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar item de inventário:", error);
      toast.error("Erro ao adicionar item de inventário: " + error.message);
    } else {
      setInventoryItems(prev => [...prev, data as InventoryItem]);
      toast.success("Item de inventário adicionado com sucesso!");
    }
    setIsLoadingInventory(false);
  };

  const handleEditInventoryItem = async (updatedItem: InventoryItem) => {
    if (!currentRestaurant?.id || updatedItem.restaurant_id !== currentRestaurant.id) {
      toast.error("Acesso não autorizado para atualizar este item.");
      return;
    }
    setIsLoadingInventory(true);
    const { error } = await supabase
      .from('inventory_items')
      .update({
        name: updatedItem.name,
        category: updatedItem.category,
        current_stock: updatedItem.current_stock,
        min_stock_level: updatedItem.min_stock_level,
        unit: updatedItem.unit,
        last_restock_date: updatedItem.last_restock_date,
        supplier: updatedItem.supplier,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatedItem.id)
      .eq('restaurant_id', currentRestaurant.id);

    if (error) {
      console.error("Erro ao atualizar item de inventário:", error);
      toast.error("Erro ao atualizar item de inventário.");
    } else {
      setInventoryItems(prev => prev.map(item => (item.id === updatedItem.id ? updatedItem : item)));
      toast.success("Item de inventário atualizado com sucesso!");
    }
    setIsLoadingInventory(false);
  };

  const handleViewDetails = (item: InventoryItem) => {
    setViewingItem(item);
    setIsViewDetailsDialogOpen(true);
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!currentRestaurant?.id) {
      toast.error("Nenhum restaurante selecionado para excluir item.");
      return;
    }
    setIsLoadingInventory(true);
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', itemId)
      .eq('restaurant_id', currentRestaurant.id);

    if (error) {
      console.error("Erro ao excluir item de inventário:", error);
      toast.error("Erro ao excluir item de inventário.");
    } else {
      setInventoryItems(prev => prev.filter(item => item.id !== itemId));
      toast.success(`Item ${itemId} foi excluído.`);
    }
    setIsLoadingInventory(false);
  };

  if (isLoadingInventory || isLoadingSession || isLoadingRestaurants || isLoadingSuppliers) {
    return <div className="flex min-h-screen items-center justify-center">Carregando inventário...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Inventário</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>Adicionar Item</Button>
          <Button variant="outline" onClick={fetchInventoryItems}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      <AdminTableFiltersWrapper>
        <Input
          placeholder="Buscar por nome, categoria ou fornecedor..."
          className="max-w-sm flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Categoria: {filterCategory} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilterCategory("Todos")}>Todos</DropdownMenuItem>
            {availableCategories.map((cat) => (
              <DropdownMenuItem key={cat} onClick={() => setFilterCategory(cat)}>
                {cat}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Status Estoque: {filterStockStatus} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilterStockStatus("Todos")}>Todos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStockStatus("Baixo")}>Baixo</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("Suficiente")}>Suficiente</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Ordenar por <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy("name-asc")}>Nome (A-Z)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("name-desc")}>Nome (Z-A)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("stock-asc")}>Estoque (Crescente)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("stock-desc")}>Estoque (Decrescente)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("lastRestockDate-desc")}>Último Reabastecimento (Recente)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("lastRestockDate-asc")}>Último Reabastecimento (Antigo)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </AdminTableFiltersWrapper>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Estoque Atual</TableHead>
              <TableHead>Estoque Mínimo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="cursor-default">
                        {item.id.substring(0, 8)}...
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.id}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.current_stock} {item.unit}</TableCell>
                <TableCell>{item.min_stock_level} {item.unit}</TableCell>
                <TableCell>
                  <Badge variant={item.current_stock < item.min_stock_level ? "destructive" : "default"}>
                    {item.current_stock < item.min_stock_level ? "Baixo" : "Suficiente"}
                  </Badge>
                </TableCell>
                <TableCell>{item.supplier}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(item)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteItem(item.id)}>
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

      <AddInventoryItemDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddInventoryItem={handleAddInventoryItem}
        availableCategories={availableCategories}
        availableUnits={availableUnits}
        availableSuppliers={suppliers.map(s => s.name)}
      />

      <ViewInventoryItemDetailsDialog
        isOpen={isViewDetailsDialogOpen}
        onClose={() => setIsViewDetailsDialogOpen(false)}
        item={viewingItem}
      />

      {editingItem && (
        <EditInventoryItemDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          item={editingItem}
          onEditInventoryItem={handleEditInventoryItem}
          availableCategories={availableCategories}
          availableUnits={availableUnits}
          availableSuppliers={suppliers.map(s => s.name)}
        />
      )}
    </div>
  );
};

export default InventoryPage;