import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  unit: string;
  lastRestockDate: string; // YYYY-MM-DD
  supplier: string;
}

interface ViewInventoryItemDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

const ViewInventoryItemDetailsDialog: React.FC<ViewInventoryItemDetailsDialogProps> = ({ isOpen, onClose, item }) => {
  if (!item) return null;

  const isLowStock = item.currentStock < item.minStockLevel;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Item: {item.name}</DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre o item de inventário.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">ID do Item:</span>
            <span className="font-medium">{item.id}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Nome:</span>
            <span className="font-medium">{item.name}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Categoria:</span>
            <span className="font-medium">{item.category}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Estoque Atual:</span>
            <span className="font-medium">{item.currentStock} {item.unit}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Estoque Mínimo:</span>
            <span className="font-medium">{item.minStockLevel} {item.unit}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Status do Estoque:</span>
            <Badge variant={isLowStock ? "destructive" : "default"}>
              {isLowStock ? "Baixo" : "Suficiente"}
            </Badge>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Último Reabastecimento:</span>
            <span className="font-medium">{item.lastRestockDate}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Fornecedor:</span>
            <span className="font-medium">{item.supplier}</span>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewInventoryItemDetailsDialog;