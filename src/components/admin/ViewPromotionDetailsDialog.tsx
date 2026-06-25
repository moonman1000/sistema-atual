import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils"; // Importar formatCurrency

interface Promotion {
  id: string;
  name: string;
  description: string;
  discount_type: "Porcentagem" | "Valor Fixo" | "Frete Grátis";
  discount_value?: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isActive: boolean;
  minimum_order_value?: number;
  applicable_items?: string[]; // e.g., IDs of menu items, or "Todos"
}

interface ViewPromotionDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  promotion: Promotion | null;
}

const ViewPromotionDetailsDialog: React.FC<ViewPromotionDetailsDialogProps> = ({ isOpen, onClose, promotion }) => {
  if (!promotion) return null;

  const getDiscountDisplay = () => {
    if (promotion.discount_type === "Porcentagem") {
      return `${promotion.discount_value}% OFF`;
    } else if (promotion.discount_type === "Valor Fixo") {
      return `${formatCurrency(promotion.discount_value || 0)} OFF`;
    } else if (promotion.discount_type === "Frete Grátis") {
      return "Frete Grátis";
    }
    return "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalhes da Promoção: {promotion.name}</DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre a promoção.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">ID da Promoção:</span>
            <span className="font-medium">{promotion.id}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Nome:</span>
            <span className="font-medium">{promotion.name}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Descrição:</span>
            <span className="font-medium">{promotion.description}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Desconto:</span>
            <span className="font-medium">{getDiscountDisplay()}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Período:</span>
            <span className="font-medium">{promotion.startDate} a {promotion.endDate}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={promotion.isActive ? "default" : "outline"}>
              {promotion.isActive ? "Ativa" : "Inativa"}
            </Badge>
          </div>
          {promotion.minimum_order_value && (
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-muted-foreground">Valor Mínimo:</span>
              <span className="font-medium">{formatCurrency(promotion.minimum_order_value)}</span>
            </div>
          )}
          {promotion.applicable_items && promotion.applicable_items.length > 0 && (
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-muted-foreground">Itens Aplicáveis:</span>
              <span className="font-medium">{promotion.applicable_items.join(", ")}</span>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewPromotionDetailsDialog;