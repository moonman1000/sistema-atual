"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Delivery } from "@/context/DeliveryContext";

interface ViewDeliveryDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  markDeliveryAsViewed?: (deliveryId: string) => void;
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
    case "Recusado":
    case "Devolvido":
      return "destructive";
    default:
      return "outline";
  }
};

const ViewDeliveryDetailsDialog: React.FC<ViewDeliveryDetailsDialogProps> = ({
  isOpen,
  onClose,
  delivery,
  markDeliveryAsViewed,
}) => {
  React.useEffect(() => {
    if (isOpen && delivery && markDeliveryAsViewed) {
      markDeliveryAsViewed(delivery.id);
    }
  }, [isOpen, delivery, markDeliveryAsViewed]);

  if (!delivery) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalhes da Entrega: {delivery.id}</DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre a entrega.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">ID da Entrega:</span>
            <span className="font-medium">{delivery.id}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">ID do Pedido:</span>
            <span className="font-medium">{delivery.orderid}</span>
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
            <Badge variant={getStatusBadgeVariant(delivery.status)}>
              {delivery.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Estimativa:</span>
            <span className="font-medium">{delivery.estimateddeliverytime}</span>
          </div>
          {delivery.actualdeliverytime && (
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-muted-foreground">Entrega Real:</span>
              <span className="font-medium">{delivery.actualdeliverytime}</span>
            </div>
          )}
          {delivery.trackinglink && (
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-muted-foreground">Link Rastreamento:</span>
              <a
                href={delivery.trackinglink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline truncate"
              >
                {delivery.trackinglink}
              </a>
            </div>
          )}
          {delivery.problem_description && (
            <div className="grid grid-cols-2 items-start gap-4">
              <span className="text-muted-foreground">Motivo do Problema:</span>
              <span className="font-medium break-words">
                {delivery.problem_description}
              </span>
            </div>
          )}
          {typeof delivery.problem_resolved === "boolean" && (
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