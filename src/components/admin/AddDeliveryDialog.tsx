import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, MapPin } from "lucide-react";
import { cn, createLocalDate } from "@/lib/utils";
import { Delivery } from "@/context/DeliveryContext"; // Importar a interface Delivery
import { Order } from "@/context/OrderContext"; // Importar a interface Order
import { Textarea } from "@/components/ui/textarea"; // NOVO: Importar Textarea

interface AddDeliveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  // Ajustado: o DeliveryContext espera Omit<Delivery, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>
  onAddDelivery: (newDelivery: Omit<Delivery, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => void;
  availableOrders: Order[]; // Receber objetos de pedido completos
  availableDeliverymen: string[];
}

type DeliveryStatus = "Atribuído" | "Em Entrega" | "Entregue" | "Problema" | "Recusado" | "Devolvido"; // ADICIONADO: Recusado, Devolvido

const AddDeliveryDialog: React.FC<AddDeliveryDialogProps> = ({ isOpen, onClose, onAddDelivery, availableOrders, availableDeliverymen }) => {
  const [selectedOrderid, setSelectedOrderid] = React.useState(""); // Renomeado para selectedOrderid
  const [clientname, setClientname] = React.useState("");
  const [client_address, setClientAddress] = React.useState("");
  const [deliveryman, setDeliveryman] = React.useState("");
  const [status, setStatus] = React.useState<DeliveryStatus>("Atribuído");
  const [estimateddeliverytime, setEstimateddeliverytime] = React.useState(""); // Renomeado para estimateddeliverytime
  const [trackinglink, setTrackinglink] = React.useState(""); // Renomeado para trackinglink
  const [problemDescription, setProblemDescription] = React.useState(""); // NOVO: Estado para a descrição do problema

  // Efeito para preencher dados do cliente quando um pedido é selecionado
  React.useEffect(() => {
    if (selectedOrderid) {
      const order = availableOrders.find(o => o.id === selectedOrderid);
      if (order) {
        setClientname(order.client_name);
        setClientAddress(order.client_address);
        setTrackinglink(order.tracking_link || ""); // Preencher tracking link se já existir no pedido
      }
    } else {
      setClientname("");
      setClientAddress("");
      setTrackinglink("");
    }
  }, [selectedOrderid, availableOrders]);

  const handleSubmit = () => {
    if (selectedOrderid && clientname && client_address && deliveryman && estimateddeliverytime) {
      onAddDelivery({
        orderid: selectedOrderid, // Usar orderid
        clientname,
        client_address,
        deliveryman,
        status,
        estimateddeliverytime,
        actualdeliverytime: undefined, // Não definido ao adicionar
        trackinglink: trackinglink || undefined,
        problem_description: problemDescription || undefined,
        problem_resolved: false, // NOVO: Definir como false por padrão ao adicionar
      });
      onClose();
      // Reset form fields
      setSelectedOrderid("");
      setClientname("");
      setClientAddress("");
      setDeliveryman("");
      setStatus("Atribuído");
      setEstimateddeliverytime("");
      setTrackinglink("");
      setProblemDescription(""); // NOVO: Resetar descrição do problema
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Entrega</DialogTitle>
          <DialogDescription>
            Preencha os detalhes para adicionar uma nova entrega.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="orderid" className="text-right"> {/* Usar orderid */}
              ID do Pedido
            </Label>
            <Select value={selectedOrderid} onValueChange={setSelectedOrderid}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o pedido" />
              </SelectTrigger>
              <SelectContent>
                {availableOrders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>{order.id} - {order.client_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clientname" className="text-right">
              Cliente
            </Label>
            <Input id="clientname" value={clientname} className="col-span-3" disabled />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="client_address" className="text-right">
              Endereço
            </Label>
            <Input id="client_address" value={client_address} className="col-span-3" disabled />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deliveryman" className="text-right">
              Entregador
            </Label>
            <Select value={deliveryman} onValueChange={setDeliveryman}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o entregador" />
              </SelectTrigger>
              <SelectContent>
                {availableDeliverymen.map((dm) => (
                  <SelectItem key={dm} value={dm}>{dm}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={(value: DeliveryStatus) => setStatus(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Atribuído">Atribuído</SelectItem>
                <SelectItem value="Em Entrega">Em Entrega</SelectItem>
                <SelectItem value="Entregue">Entregue</SelectItem>
                <SelectItem value="Problema">Problema</SelectItem>
                <SelectItem value="Recusado">Recusado</SelectItem> {/* ADICIONADO: Recusado */}
                <SelectItem value="Devolvido">Devolvido</SelectItem> {/* NOVO: Adicionado Devolvido */}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="estimateddeliverytime" className="text-right"> {/* Usar estimateddeliverytime */}
              Estimativa (HH:MM)
            </Label>
            <Input id="estimateddeliverytime" type="time" value={estimateddeliverytime} onChange={(e) => setEstimateddeliverytime(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="trackinglink" className="text-right"> {/* Usar trackinglink */}
              Link Rastreamento
            </Label>
            <div className="relative col-span-3">
              <Input id="trackinglink" value={trackinglink} onChange={(e) => setTrackinglink(e.target.value)} placeholder="Ex: https://maps.app.goo.gl/..." className="pl-10" />
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          {(status === "Problema" || status === "Recusado" || status === "Devolvido") && ( // NOVO: Campo de descrição do problema
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="problemDescription" className="text-right mt-2">Motivo</Label>
              <Textarea
                id="problemDescription"
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Descreva o motivo do problema ou recusa..."
                rows={3}
                className="col-span-3"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Salvar Entrega</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddDeliveryDialog;