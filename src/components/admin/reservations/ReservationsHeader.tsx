import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ReservationsHeaderProps {
  onAddReservationClick: () => void;
  onRefreshClick: () => void;
}

const ReservationsHeader: React.FC<ReservationsHeaderProps> = ({ onAddReservationClick, onRefreshClick }) => {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">Gerenciar Reservas</h1>
      <div className="flex gap-2">
        <Button onClick={onAddReservationClick}>Adicionar Reserva</Button>
        <Button variant="outline" onClick={onRefreshClick}>
          <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
        </Button>
      </div>
    </div>
  );
};

export default ReservationsHeader;