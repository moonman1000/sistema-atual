import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/context/OrderContext";
import { formatDate, formatCurrency } from "@/lib/utils"; // Importar formatCurrency

interface ViewOrderDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  markOrderAsViewed?: (orderId: string) => void; // NOVO: Callback opcional
}

const getStatusBadgeVariant = (status: Order["status"]) => {
  switch (status) {
    case "Pendente":
      return "info";
    case "Confirmado":
      return "default";
    case "Em Preparo":
      return "secondary";
    case "Em Entrega":
      return "outline";
    case "Entregue":
      return "success";
    case "Cancelado":
    case "Problema":
    case "Recusado": // ADICIONADO: Recusado
    case "Devolvido": // NOVO: Adicionado Devolvido
      return "destructive";
    default:
      return "default";
  }
};

const ViewOrderDetailsDialog: React.FC<ViewOrderDetailsDialogProps> = ({ isOpen, onClose, order, markOrderAsViewed }) => {
  if (!order) return null;

  React.useEffect(() => {
    if (isOpen && order && markOrderAsViewed) {
      markOrderAsViewed(order.id);
    }
  }, [isOpen, order, markOrderAsViewed]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Pedido {order.id}</DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre o pedido.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {order.daily_order_number && (
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-muted-foreground">Nº Diário:</span>
              <span className="font-medium text-xl font-bold">{order.daily_order_number}</span>
            </div>
          )}
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Cliente:</span>
            <span className="font-medium">{order.client_name}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Entregador:</span>
            <span className="font-medium">{order.deliveryman}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Endereço de Entrega:</span>
            <span className="font-medium">{order.client_address}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Data:</span>
            <span className="font-medium">{formatDate(order.order_date)}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-medium">{formatCurrency(order.total)}</span>
          </div>
          {order.tracking_link && (
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-muted-foreground">Link Rastreamento:</span>
              <a href={order.tracking_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate">
                {order.tracking_link}
              </a>
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

export default ViewOrderDetailsDialog;