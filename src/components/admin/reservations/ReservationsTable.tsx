import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
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

interface ReservationsTableProps {
  reservations: Reservation[];
  onViewDetails: (reservation: Reservation) => void;
  onOpenEditDialog: (reservation: Reservation) => void;
  onCancelReservation: (id: string) => void;
  onDeleteReservation: (id: string) => void;
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

const ReservationsTable: React.FC<ReservationsTableProps> = ({
  reservations,
  onViewDetails,
  onOpenEditDialog,
  onCancelReservation,
  onDeleteReservation,
}) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Nº Pessoas</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Mesa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((reservation) => (
            <TableRow key={reservation.id}>
              <TableCell className="font-medium">{reservation.id}</TableCell>
              <TableCell>
                {reservation.clientname} {/* Corrigido para snake_case */}
                <br />
                <span className="text-muted-foreground text-xs">{reservation.clientphone}</span> {/* Corrigido para snake_case */}
              </TableCell>
              <TableCell>{reservation.numberofguests}</TableCell> {/* Corrigido para snake_case */}
              <TableCell>{reservation.reservationdate}</TableCell> {/* Corrigido para snake_case */}
              <TableCell>{reservation.reservationtime}</TableCell> {/* Corrigido para snake_case */}
              <TableCell>{reservation.tablenumber || "N/A"}</TableCell> {/* Corrigido para snake_case */}
              <TableCell>
                <Badge variant={getStatusBadgeVariant(reservation.status)}>
                  {reservation.status}
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
                    <DropdownMenuItem onClick={() => onViewDetails(reservation)}>
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onOpenEditDialog(reservation)}>
                      Editar
                    </DropdownMenuItem>
                    {reservation.status !== "Cancelada" && reservation.status !== "Concluída" && (
                      <DropdownMenuItem onClick={() => onCancelReservation(reservation.id)}>
                        Cancelar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-destructive" onClick={() => onDeleteReservation(reservation.id)}>
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
  );
};

export default ReservationsTable;