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
import { ChevronDown, MoreHorizontal, RefreshCw, Package } from "lucide-react";
import { toast } from "sonner";
import AddSupplierDialog from "@/components/admin/AddSupplierDialog";
import EditSupplierDialog from "@/components/admin/EditSupplierDialog";
import ViewSupplierDetailsDialog from "@/components/admin/ViewSupplierDetailsDialog";
import { useSuppliers, Supplier } from "@/context/SupplierContext";
import { useSession } from '@/context/SessionContext';
import { useRestaurant } from '@/context/RestaurantContext';
import AdminTableFiltersWrapper from "@/components/admin/AdminTableFiltersWrapper"; // Importar wrapper
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Importar Tooltip

const SuppliersPage = () => {
  const { session, isAdmin, isLoading: isLoadingSession, isSuperAdmin } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const { suppliers, isLoadingSuppliers, addSupplier, updateSupplier, deleteSupplier, fetchSuppliers } = useSuppliers();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    if (!isLoadingSession && !session) {
      toast.info("Você precisa estar logado para acessar esta página.");
    } else if (!isLoadingSession && session && !isAdmin && !isSuperAdmin) {
      toast.error("Acesso negado. Apenas administradores ou super administradores podem gerenciar fornecedores.");
    }
  }, [isLoadingSession, session, isAdmin, isSuperAdmin]);

  const filteredSuppliers = useMemo(() => {
    let currentSuppliers = suppliers;

    if (searchTerm) {
      currentSuppliers = currentSuppliers.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    currentSuppliers.sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name) * -1;
      }
      return 0;
    });

    return currentSuppliers;
  }, [searchTerm, sortBy, suppliers]);

  const handleAddSupplier = async (newSupplierData: Omit<Supplier, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => {
    try {
      await addSupplier(newSupplierData);
    } catch (error) {
      console.error("Erro ao adicionar fornecedor:", error);
    }
  };

  const handleEditSupplier = async (updatedSupplier: Supplier) => {
    try {
      await updateSupplier(updatedSupplier);
    } catch (error) {
      console.error("Erro ao atualizar fornecedor:", error);
    }
  };

  const handleViewDetails = (supplier: Supplier) => {
    setViewingSupplier(supplier);
    setIsViewDetailsDialogOpen(true);
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsEditDialogOpen(true);
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    try {
      await deleteSupplier(supplierId);
    } catch (error) {
      console.error("Erro ao excluir fornecedor:", error);
    }
  };

  if (isLoadingSuppliers || isLoadingSession || isLoadingRestaurants) {
    return <div className="flex min-h-screen items-center justify-center">Carregando fornecedores...</div>;
  }

  if (!session || (!isAdmin && !isSuperAdmin)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-destructive">Acesso negado. Você não tem permissão para gerenciar fornecedores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Fornecedores</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>Adicionar Fornecedor</Button>
          <Button variant="outline" onClick={fetchSuppliers}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      <AdminTableFiltersWrapper>
        <Input
          placeholder="Buscar por nome, contato ou e-mail..."
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
              <TableHead>Pessoa de Contato</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="cursor-default">
                        {supplier.id.substring(0, 8)}...
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{supplier.id}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>{supplier.name}</TableCell>
                <TableCell>{supplier.contact_person || 'N/A'}</TableCell>
                <TableCell>
                  {supplier.email || 'N/A'}
                  <br />
                  <span className="text-muted-foreground text-xs">{supplier.phone || 'N/A'}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">{supplier.address || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(supplier)}>
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(supplier)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteSupplier(supplier.id)}>
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

      <AddSupplierDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddSupplier={handleAddSupplier}
      />

      <ViewSupplierDetailsDialog
        isOpen={isViewDetailsDialogOpen}
        onClose={() => setIsViewDetailsDialogOpen(false)}
        supplier={viewingSupplier}
      />

      {editingSupplier && (
        <EditSupplierDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          supplier={editingSupplier}
          onEditSupplier={handleEditSupplier}
        />
      )}
    </div>
  );
};

export default SuppliersPage;