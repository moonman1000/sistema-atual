import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn, createLocalDate } from "@/lib/utils";
import { toast } from "sonner"; // Importar toast
import { Restaurant } from "@/context/RestaurantContext"; // Importar a interface Restaurant

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
  restaurant_id: string; // Adicionado restaurant_id
}

interface AddReservationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReservation: (newReservation: Omit<Reservation, 'id'>) => void;
  currentRestaurantId?: string; // NOVO: ID do restaurante atual (para admin)
  availableRestaurants: Restaurant[]; // NOVO: Lista de todos os restaurantes (para super_admin)
  isSuperAdmin: boolean; // NOVO: Flag para indicar se é super_admin
}

const AddReservationDialog: React.FC<AddReservationDialogProps> = ({ isOpen, onClose, onAddReservation, currentRestaurantId, availableRestaurants, isSuperAdmin }) => {
  const [clientname, setClientname] = React.useState(""); // Corrigido para snake_case
  const [clientphone, setClientphone] = React.useState(""); // Corrigido para snake_case
  const [numberofguests, setNumberofguests] = React.useState(""); // Corrigido para snake_case
  const [reservationdate, setReservationdate] = React.useState<Date | undefined>(createLocalDate(new Date().toISOString().split('T')[0])); // Usar createLocalDate
  const [reservationtime, setReservationtime] = React.useState(""); // Corrigido para snake_case
  const [status, setStatus] = React.useState<Reservation['status']>("Pendente");
  const [notes, setNotes] = React.useState("");
  const [tablenumber, setTablenumber] = React.useState(""); // Corrigido para snake_case
  const [selectedRestaurantId, setSelectedRestaurantId] = React.useState<string | undefined>(currentRestaurantId);

  React.useEffect(() => {
    if (isOpen && isSuperAdmin && !selectedRestaurantId && availableRestaurants.length > 0) {
      setSelectedRestaurantId(availableRestaurants[0].id);
    } else if (isOpen && !isSuperAdmin && currentRestaurantId) {
      setSelectedRestaurantId(currentRestaurantId);
    }
  }, [isOpen, isSuperAdmin, currentRestaurantId, availableRestaurants, selectedRestaurantId]);

  const handleSubmit = () => {
    if (!clientname || !clientphone || !numberofguests || !reservationdate || !reservationtime) { // Corrigido para snake_case
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    if (!selectedRestaurantId) {
      toast.error("Por favor, selecione um restaurante para a reserva.");
      return;
    }

    onAddReservation({
      clientname, // Corrigido para snake_case
      clientphone, // Corrigido para snake_case
      numberofguests: parseInt(numberofguests), // Corrigido para snake_case
      reservationdate: format(reservationdate, "yyyy-MM-dd"), // Corrigido para snake_case
      reservationtime, // Corrigido para snake_case
      status,
      notes: notes || undefined,
      tablenumber: tablenumber || undefined, // Corrigido para snake_case
      restaurant_id: selectedRestaurantId,
    });
    onClose();
    // Reset form fields
    setClientname("");
    setClientphone("");
    setNumberofguests("");
    setReservationdate(createLocalDate(new Date().toISOString().split('T')[0])); // Usar createLocalDate
    setReservationtime("");
    setStatus("Pendente");
    setNotes("");
    setTablenumber("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Reserva</DialogTitle>
          <DialogDescription>
            Preencha os detalhes para adicionar uma nova reserva.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isSuperAdmin && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="restaurant" className="text-right">
                Restaurante
              </Label>
              <Select value={selectedRestaurantId || ""} onValueChange={setSelectedRestaurantId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um restaurante" />
                </SelectTrigger>
                <SelectContent>
                  {availableRestaurants.map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clientname" className="text-right"> {/* Corrigido para snake_case */}
              Cliente
            </Label>
            <Input id="clientname" value={clientname} onChange={(e) => setClientname(e.target.value)} className="col-span-3" /> {/* Corrigido para snake_case */}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clientphone" className="text-right"> {/* Corrigido para snake_case */}
              Telefone
            </Label>
            <Input id="clientphone" value={clientphone} onChange={(e) => setClientphone(e.target.value)} className="col-span-3" /> {/* Corrigido para snake_case */}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="numberofguests" className="text-right"> {/* Corrigido para snake_case */}
              Nº Pessoas
            </Label>
            <Input id="numberofguests" type="number" value={numberofguests} onChange={(e) => setNumberofguests(e.target.value)} className="col-span-3" /> {/* Corrigido para snake_case */}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reservationdate" className="text-right"> {/* Corrigido para snake_case */}
              Data
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !reservationdate && "text-muted-foreground" // Corrigido para snake_case
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {reservationdate ? format(reservationdate, "PPP") : <span>Selecione uma data</span>} {/* Corrigido para snake_case */}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={reservationdate} // Corrigido para snake_case
                  onSelect={setReservationdate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reservationtime" className="text-right"> {/* Corrigido para snake_case */}
              Hora
            </Label>
            <Input id="reservationtime" type="time" value={reservationtime} onChange={(e) => setReservationtime(e.target.value)} className="col-span-3" /> {/* Corrigido para snake_case */}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={(value: Reservation['status']) => setStatus(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Confirmada">Confirmada</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tablenumber" className="text-right"> {/* Corrigido para snake_case */}
              Mesa
            </Label>
            <Input id="tablenumber" value={tablenumber} onChange={(e) => setTablenumber(e.target.value)} className="col-span-3" placeholder="Opcional" /> {/* Corrigido para snake_case */}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notas
            </Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" placeholder="Opcional" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Salvar Reserva</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddReservationDialog;