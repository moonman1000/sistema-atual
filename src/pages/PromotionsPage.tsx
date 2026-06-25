import React from "react";
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
import { ChevronDown, MoreHorizontal, Percent, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AddPromotionDialog from "@/components/admin/AddPromotionDialog";
import EditPromotionDialog from "@/components/admin/EditPromotionDialog";
import ViewPromotionDetailsDialog from "@/components/admin/ViewPromotionDetailsDialog";
import { useMenu } from "@/context/MenuContext";
import { usePromotions, Promotion } from "@/context/PromotionsContext";
import { useSession } from '@/context/SessionContext'; // Importar useSession
import { useRestaurant } from '@/context/RestaurantContext'; // Importar useRestaurant
import { createLocalDate } from "@/lib/utils"; // Importar createLocalDate

const PromotionsPage = () => {
  const { session, isAdmin, isLoading: isLoadingSession } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const { promotions, isLoadingPromotions, addPromotion, updatePromotion, deletePromotion, fetchPromotions } = usePromotions();
  const { menuItems, isLoadingMenuItems } = useMenu();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("Todos");
  const [sortBy, setSortBy] = React.useState("endDate-asc");

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = React.useState(false);
  const [viewingPromotion, setViewingPromotion] = React.useState<Promotion | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingPromotion, setEditingPromotion] = React.useState<Promotion | null>(null);

  const availableMenuItems = React.useMemo(() => menuItems.map(item => item.name), [menuItems]);

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? "default" : "outline";
  };

  const getDiscountDisplay = (promotion: Promotion) => {
    if (promotion.discount_type === "Porcentagem") {
      return `${promotion.discount_value}% OFF`;
    } else if (promotion.discount_type === "Valor Fixo") {
      return `R$ ${promotion.discount_value?.toFixed(2)} OFF`;
    } else if (promotion.discount_type === "Frete Grátis") {
      return "Frete Grátis";
    }
    return "";
  };

  const filteredPromotions = React.useMemo(() => {
    let currentPromotions = promotions;

    if (searchTerm) {
      currentPromotions = currentPromotions.filter(
        (promo) =>
          promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          promo.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus === "Ativa") {
      currentPromotions = currentPromotions.filter((promo) => promo.is_active);
    } else if (filterStatus === "Inativa") {
      currentPromotions = currentPromotions.filter((promo) => !promo.is_active);
    }

    currentPromotions.sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name) * -1;
      }
      if (sortBy === "startDate-asc") {
        return createLocalDate(a.start_date)!.getTime() - createLocalDate(b.start_date)!.getTime(); // Usar createLocalDate
      }
      if (sortBy === "startDate-desc") {
        return createLocalDate(b.start_date)!.getTime() - createLocalDate(a.start_date)!.getTime(); // Usar createLocalDate
      }
      if (sortBy === "endDate-asc") {
        return createLocalDate(a.end_date)!.getTime() - createLocalDate(b.end_date)!.getTime(); // Usar createLocalDate
      }
      if (sortBy === "endDate-desc") {
        return createLocalDate(b.end_date)!.getTime() - createLocalDate(a.end_date)!.getTime(); // Usar createLocalDate
      }
      return 0;
    });

    return currentPromotions;
  }, [searchTerm, filterStatus, sortBy, promotions]);

  const handleAddPromotion = async (newPromotionData: Omit<Promotion, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => {
    try {
      await addPromotion(newPromotionData);
    } catch (error) {
      console.error("Erro ao adicionar promoção:", error);
    }
  };

  const handleEditPromotion = async (updatedPromotion: Promotion) => {
    try {
      await updatePromotion(updatedPromotion);
    } catch (error) {
      console.error("Erro ao atualizar promoção:", error);
    }
  };

  const handleViewDetails = (promotion: Promotion) => {
    setViewingPromotion(promotion);
    setIsViewDetailsDialogOpen(true);
  };

  const openEditDialog = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setIsEditDialogOpen(true);
  };

  const handleDeletePromotion = async (promotionId: string) => {
    try {
      await deletePromotion(promotionId);
    } catch (error) {
      console.error("Erro ao excluir promoção:", error);
    }
  };

  const statusOptions = ["Todos", "Ativa", "Inativa"];

  if (isLoadingPromotions || isLoadingMenuItems || isLoadingSession || isLoadingRestaurants) {
    return <div className="flex min-h-screen items-center justify-center">Carregando promoções...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Promoções</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>Adicionar Promoção</Button>
          <Button variant="outline" onClick={fetchPromotions}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Buscar por nome ou descrição..."
          className="max-w-sm flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Status: {filterStatus} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {statusOptions.map((status) => (
              <DropdownMenuItem key={status} onClick={() => setFilterStatus(status)}>
                {status}
              </DropdownMenuItem>
            ))}
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
            <DropdownMenuItem onClick={() => setSortBy("startDate-asc")}>Data Início (Crescente)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("startDate-desc")}>Data Início (Decrescente)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("endDate-asc")}>Data Fim (Crescente)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("endDate-desc")}>Data Fim (Decrescente)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Desconto</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPromotions.map((promotion) => (
              <TableRow key={promotion.id}>
                <TableCell className="font-medium">{promotion.id}</TableCell>
                <TableCell>{promotion.name}</TableCell>
                <TableCell>{getDiscountDisplay(promotion)}</TableCell>
                <TableCell>{promotion.start_date} a {promotion.end_date}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(promotion.is_active)}>
                    {promotion.is_active ? "Ativa" : "Inativa"}
                  </Badge>
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
                      <DropdownMenuItem onClick={() => handleViewDetails(promotion)}>
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(promotion)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePromotion(promotion.id)}>
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

      <AddPromotionDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddPromotion={handleAddPromotion}
        availableItems={availableMenuItems}
      />

      <ViewPromotionDetailsDialog
        isOpen={isViewDetailsDialogOpen}
        onClose={() => setIsViewDetailsDialogOpen(false)}
        promotion={viewingPromotion}
      />

      {editingPromotion && (
        <EditPromotionDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          promotion={editingPromotion}
          onEditPromotion={handleEditPromotion}
          availableItems={availableMenuItems}
        />
      )}
    </div>
  );
};

export default PromotionsPage;