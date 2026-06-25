import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Reservation {
  id: string;
  clientname: string; // Corrigido para snake_case
  clientphone: string; // Corrigido para snake_case
  numberofguests: number; // Corrigido para snake_case
  reservationdate: string; // YYYY-MM-DD, Corrigido para snake_case
  reservationtime: string; // HH:MM, Corrigido para snake_case
  status: "Confirmada" | "Pendente" | "Cancelada" | "Concluída";
  notes?: string;
  tablenumber?: string; // Corrigido para snake_case
  restaurant_id: string;
  created_at?: string;
  updated_at?: string;
}

interface ViewReservationDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
}

const getStatusBadgeVariant = (status: Reservation["status"]) => {
  switch (status) {
    case "Confirmada":
      return "default";
    case "Pendente":
      return "secondary";
    case "Concluída":
      return "success";
    case "Cancelada":
      return "destructive";
    default:
      return "outline";
  }
};

const ViewReservationDetailsDialog: React.FC<ViewReservationDetailsDialogProps> = ({ isOpen, onClose, reservation }) => {
  if (!reservation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalhes da Reserva: {reservation.id}</DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre a reserva.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">ID da Reserva:</span>
            <span className="font-medium">{reservation.id}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Cliente:</span>
            <span className="font-medium">{reservation.clientname}</span> {/* Corrigido para snake_case */}
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Telefone:</span>
            <span className="font-medium">{reservation.clientphone}</span> {/* Corrigido para snake_case */}
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Nº Pessoas:</span>
            <span className="font-medium">{reservation.numberofguests}</span> {/* Corrigido para snake_case */}
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Data:</span>
            <span className="font-medium">{reservation.reservationdate}</span> {/* Corrigido para snake_case */}
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Hora:</span>
            <span className="font-medium">{reservation.reservationtime}</span> {/* Corrigido para snake_case */}
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={getStatusBadgeVariant(reservation.status)}>{reservation.status}</Badge>
          </div>
          {reservation.tablenumber && ( // Corrigido para snake_case
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-muted-foreground">Mesa:</span>
              <span className="font-medium">{reservation.tablenumber}</span> {/* Corrigido para snake_case */}
            </div>
          )}
          {reservation.notes && (
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-muted-foreground">Notas:</span>
              <span className="font-medium">{reservation.notes}</span>
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

export default ViewReservationDetailsDialog;