"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Delivery } from "@/context/DeliveryContext"; // Importar a interface Delivery

interface ViewDeliveryDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  markDeliveryAsViewed?: (deliveryId: string) => void; // NOVO: Callback opcional
}

const getStatusBadgeVariant = (status: Delivery["status"]) => {
  switch (status) {
    case "Atribuído":
      return "default";
    case "Em Entrega":
      return "secondary";
    case "Entregue":
      return "success";
    case "Problema":
      return "destructive";
    case "Recusado": // ADICIONADO: Recusado
      return "destructive";
    default:
      return "outline";
  }
};

const ViewDeliveryDetailsDialog: React.FC<ViewDeliveryDetailsDialogProps> = ({ isOpen, onClose, delivery, markDeliveryAsViewed }) => {
  if (!delivery) return null;

  React.useEffect(() => {
    if (isOpen && delivery && markDeliveryAsViewed) {
      markDeliveryAsViewed(delivery.id);
    }
  }, [isOpen, delivery, markDeliveryAsViewed]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalhes da Entrega: {delivery.id}</DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre a entrega.
          </CardDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">ID da Entrega:</span>
            <span className="font-medium">{delivery.id}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">ID do Pedido:</span>
            <span className="font-medium">{delivery.orderid}</span> {/* Usar orderid */}
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Cliente:</span>
            <span className="font-medium">{delivery.clientname}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Endereço:</span>
            <span className="font-medium">{delivery.client_address}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Entregador:</span>
            <span className="font-medium">{delivery.deliveryman}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={getStatusBadgeVariant(delivery.status)}>{delivery.status}</Badge>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Estimativa:</span>
            <span className="font-medium">{delivery.estimateddeliverytime}</span> {/* Usar estimateddeliverytime */}
          </div>
          {delivery.actualdeliverytime && ( // Usar actualdeliverytime
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-muted-foreground">Entrega Real:</span>
              <span className="font-medium">{delivery.actualdeliverytime}</span> {/* Usar actualdeliverytime */}
            </div>
          )}
          {delivery.trackinglink && ( // Usar trackinglink
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-muted-foreground">Link Rastreamento:</span>
              <a href={delivery.trackinglink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate"> {/* Usar trackinglink */}
                {delivery.trackinglink}
              </a>
            </div>
          )}
          {delivery.problem_description && ( // NOVO: Exibir descrição do problema
            <div className="grid grid-cols-2 items-start gap-4">
              <span className="text-muted-foreground">Motivo do Problema:</span>
              <span className="font-medium break-words">{delivery.problem_description}</span>
            </div>
          )}
          {typeof delivery.problem_resolved === 'boolean' && ( // NOVO: Exibir status de resolução
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-muted-foreground">Problema Resolvido:</span>
              <Badge variant={delivery.problem_resolved ? "success" : "destructive"}>
                {delivery.problem_resolved ? "Sim" : "Não"}
              </Badge>
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

export default ViewDeliveryDetailsDialog;