import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { cn, createLocalDate } from "@/lib/utils";
import { Delivery } from "@/context/DeliveryContext"; // Importar a interface Delivery
import { Order } from "@/context/OrderContext"; // Importar a interface Order
import { Textarea } from "@/components/ui/textarea"; // NOVO: Importar Textarea
import { toast } from "sonner"; // Importar toast

interface EditDeliveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  onEditDelivery: (updatedDelivery: Delivery) => void;
  availableOrders: Order[]; // Receber objetos de pedido completos
  availableDeliverymen: string[];
}

type DeliveryStatus = "Atribuído" | "Em Entrega" | "Entregue" | "Problema" | "Recusado"; // ADICIONADO: Recusado

const EditDeliveryDialog: React.FC<EditDeliveryDialogProps> = ({ isOpen, onClose, delivery, onEditDelivery, availableOrders, availableDeliverymen }) => {
  const [selectedOrderid, setSelectedOrderid] = React.useState(delivery?.orderid || ""); // Renomeado para selectedOrderid
  const [clientname, setClientname] = React.useState(delivery?.clientname || "");
  const [client_address, setClientAddress] = React.useState(delivery?.client_address || "");
  const [deliveryman, setDeliveryman] = React.useState(delivery?.deliveryman || "");
  const [status, setStatus] = React.useState<DeliveryStatus>(delivery?.status || "Atribuído");
  const [estimateddeliverytime, setEstimateddeliverytime] = React.useState(delivery?.estimateddeliverytime || ""); // Renomeado para estimateddeliverytime
  const [actualdeliverytime, setActualdeliverytime] = React.useState(delivery?.actualdeliverytime || ""); // Renomeado para actualdeliverytime
  const [trackinglink, setTrackinglink] = React.useState(delivery?.trackinglink || ""); // Renomeado para trackinglink
  const [problemDescription, setProblemDescription] = React.useState(delivery?.problem_description || ""); // NOVO: Estado para a descrição do problema
  const [problemResolved, setProblemResolved] = React.useState(delivery?.problem_resolved || false); // NOVO: Estado para problem_resolved

  React.useEffect(() => {
    if (delivery) {
      setSelectedOrderid(delivery.orderid); // Usar orderid
      setClientname(delivery.clientname);
      setClientAddress(delivery.client_address);
      setDeliveryman(delivery.deliveryman);
      setStatus(delivery.status);
      setEstimateddeliverytime(delivery.estimateddeliverytime); // Usar estimateddeliverytime
      setActualdeliverytime(delivery.actualdeliverytime || ""); // Usar actualdeliverytime
      setTrackinglink(delivery.trackinglink || ""); // Usar trackinglink
      setProblemDescription(delivery.problem_description || ""); // NOVO: Definir estado inicial da descrição
      setProblemResolved(delivery.problem_resolved || false); // NOVO: Definir estado inicial de problem_resolved
    }
  }, [delivery]);

  // Efeito para preencher dados do cliente quando o orderid muda (seja na inicialização ou por seleção)
  React.useEffect(() => {
    if (selectedOrderid) {
      const order = availableOrders.find(o => o.id === selectedOrderid);
      if (order) {
        setClientname(order.client_name);
        setClientAddress(order.client_address);
        // Só atualiza o trackinglink se o campo atual estiver vazio ou se o link do pedido for diferente
        if (!trackinglink || trackinglink !== order.tracking_link) {
          setTrackinglink(order.tracking_link || "");
        }
      }
    } else {
      setClientname("");
      setClientAddress("");
    }
  }, [selectedOrderid, availableOrders]);


  const handleSubmit = () => {
    if (delivery && selectedOrderid && clientname && client_address && deliveryman && estimateddeliverytime) {
      onEditDelivery({
        ...delivery,
        orderid: selectedOrderid, // Usar orderid
        clientname,
        client_address,
        deliveryman,
        status,
        estimateddeliverytime, // Usar estimateddeliverytime
        actualdeliverytime: actualdeliverytime || undefined, // Usar actualdeliverytime
        trackinglink: trackinglink || undefined, // Usar trackinglink
        problem_description: problemDescription || undefined,
        problem_resolved: problemResolved, // NOVO: Incluir problem_resolved
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Entrega</DialogTitle>
          <DialogDescription>
            Faça alterações nos detalhes da entrega.
          </CardDescription>
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
            <Label htmlFor="actualdeliverytime" className="text-right"> {/* Usar actualdeliverytime */}
              Entrega Real (HH:MM)
            </Label>
            <Input id="actualdeliverytime" type="time" value={actualdeliverytime} onChange={(e) => setActualdeliverytime(e.target.value)} className="col-span-3" />
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
          {(status === "Problema" || status === "Recusado") && ( // NOVO: Campo de descrição do problema
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
          {/* NOVO: Campo para marcar como resolvido */}
          {(delivery?.problem_description && (delivery.status === "Problema" || delivery.status === "Recusado")) && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="problemResolved" className="text-right">Resolvido</Label>
              <input
                type="checkbox"
                id="problemResolved"
                checked={problemResolved}
                onChange={(e) => setProblemResolved(e.target.checked)}
                className="col-span-3 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-foreground"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditDeliveryDialog;