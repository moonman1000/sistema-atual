"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { cn, createLocalDate } from "@/lib/utils";
import { Delivery } from "@/context/DeliveryContext";
import { Order } from "@/context/OrderContext";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface EditDeliveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  onEditDelivery: (updatedDelivery: Delivery) => void;
  availableOrders: Order[];
  // aceita strings (antigo) ou objetos { id, name } (recomendado)
  availableDeliverymen: Array<string | { id: string; name: string }>;
}

type DeliveryStatus = "Atribuído" | "Em Entrega" | "Entregue" | "Problema" | "Recusado" | "Devolvido";

const EditDeliveryDialog: React.FC<EditDeliveryDialogProps> = ({ isOpen, onClose, delivery, onEditDelivery, availableOrders, availableDeliverymen }) => {
  const [selectedOrderid, setSelectedOrderid] = React.useState<string>(delivery?.orderid || "");
  const [clientname, setClientname] = React.useState<string>(delivery?.clientname || "");
  const [client_address, setClientAddress] = React.useState<string>(delivery?.client_address || "");
  const [deliveryman, setDeliveryman] = React.useState<string>(delivery?.deliveryman || "Não Atribuído");
  const [selectedDeliverymanId, setSelectedDeliverymanId] = React.useState<string>(delivery?.driver_profile_id || "");
  const [status, setStatus] = React.useState<DeliveryStatus>(delivery?.status || "Atribuído");
  const [estimateddeliverytime, setEstimateddeliverytime] = React.useState<string>(delivery?.estimateddeliverytime || "");
  const [actualdeliverytime, setActualdeliverytime] = React.useState<string | undefined>(delivery?.actualdeliverytime || "");
  const [trackinglink, setTrackinglink] = React.useState<string>(delivery?.trackinglink || "");
  const [problemDescription, setProblemDescription] = React.useState<string | undefined>(delivery?.problem_description || "");
  const [problemResolved, setProblemResolved] = React.useState<boolean>(!!delivery?.problem_resolved);

  React.useEffect(() => {
    if (delivery) {
      setSelectedOrderid(delivery.orderid);
      setClientname(delivery.clientname);
      setClientAddress(delivery.client_address);
      setDeliveryman(delivery.deliveryman || "Não Atribuído");
      setSelectedDeliverymanId(delivery.driver_profile_id || "");
      setStatus(delivery.status);
      setEstimateddeliverytime(delivery.estimateddeliverytime || "");
      setActualdeliverytime(delivery.actualdeliverytime || "");
      setTrackinglink(delivery.trackinglink || "");
      setProblemDescription(delivery.problem_description || "");
      setProblemResolved(!!delivery.problem_resolved);
    }
  }, [delivery]);

  React.useEffect(() => {
    if (selectedOrderid) {
      const order = availableOrders.find(o => o.id === selectedOrderid);
      if (order) {
        setClientname(order.client_name);
        setClientAddress(order.client_address);
        if (!trackinglink || trackinglink !== order.tracking_link) {
          setTrackinglink(order.tracking_link || "");
        }
      }
    } else {
      setClientname("");
      setClientAddress("");
    }
  }, [selectedOrderid, availableOrders]);

  const handleDeliverymanChange = (value: string) => {
    if (value === "__UNASSIGNED__") {
      setSelectedDeliverymanId("");
      setDeliveryman("Não Atribuído");
      return;
    }

    const found = (availableDeliverymen as any[]).find(d => {
      if (typeof d === "string") return d === value;
      return d.id === value || d.name === value;
    });

    if (found) {
      if (typeof found === "string") {
        setSelectedDeliverymanId("");
        setDeliveryman(found);
      } else {
        setSelectedDeliverymanId(found.id);
        setDeliveryman(found.name);
      }
    } else {
      // fallback: treat as name
      setSelectedDeliverymanId("");
      setDeliveryman(value);
    }
  };

  const handleSubmit = () => {
    // agora entregador não é obrigatório (pode ser "Não Atribuído")
    if (delivery && selectedOrderid && clientname && client_address && estimateddeliverytime) {
      onEditDelivery({
        ...delivery,
        orderid: selectedOrderid,
        clientname,
        client_address,
        deliveryman,
        driver_profile_id: selectedDeliverymanId || null, // envia UID quando disponível
        status,
        estimateddeliverytime,
        actualdeliverytime: actualdeliverytime || undefined,
        trackinglink: trackinglink || undefined,
        problem_description: problemDescription || undefined,
        problem_resolved: problemResolved,
      });
      onClose();
    } else {
      toast.error("Preencha os campos obrigatórios (pedido, cliente, endereço e estimativa).");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Entrega</DialogTitle>
          <DialogDescription>
            Faça alterações nos detalhes da entrega.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="orderid" className="text-right">ID do Pedido</Label>
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
            <Label htmlFor="clientname" className="text-right">Cliente</Label>
            <Input id="clientname" value={clientname} className="col-span-3" disabled />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="client_address" className="text-right">Endereço</Label>
            <Input id="client_address" value={client_address} className="col-span-3" disabled />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deliveryman" className="text-right">Entregador</Label>
            <Select
              value={selectedDeliverymanId || (deliveryman === "Não Atribuído" ? "__UNASSIGNED__" : deliveryman)}
              onValueChange={handleDeliverymanChange}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o entregador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__UNASSIGNED__">Não Atribuído</SelectItem>
                {availableDeliverymen.map((dm) => {
                  if (typeof dm === "string") {
                    return <SelectItem key={dm} value={dm}>{dm}</SelectItem>;
                  } else {
                    return <SelectItem key={dm.id} value={dm.id}>{dm.name}</SelectItem>;
                  }
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
            <Select value={status} onValueChange={(value: DeliveryStatus) => setStatus(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Atribuído">Atribuído</SelectItem>
                <SelectItem value="Em Entrega">Em Entrega</SelectItem>
                <SelectItem value="Entregue">Entregue</SelectItem>
                <SelectItem value="Problema">Problema</SelectItem>
                <SelectItem value="Recusado">Recusado</SelectItem>
                <SelectItem value="Devolvido">Devolvido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="estimateddeliverytime" className="text-right">Estimativa (HH:MM)</Label>
            <Input id="estimateddeliverytime" type="time" value={estimateddeliverytime} onChange={(e) => setEstimateddeliverytime(e.target.value)} className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="actualdeliverytime" className="text-right">Entrega Real (HH:MM)</Label>
            <Input id="actualdeliverytime" type="time" value={actualdeliverytime || ""} onChange={(e) => setActualdeliverytime(e.target.value)} className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="trackinglink" className="text-right">Link Rastreamento</Label>
            <div className="relative col-span-3">
              <Input id="trackinglink" value={trackinglink} onChange={(e) => setTrackinglink(e.target.value)} placeholder="Ex: https://maps.app.goo.gl/..." className="pl-10" />
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {(status === "Problema" || status === "Recusado" || status === "Devolvido") && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="problemDescription" className="text-right mt-2">Motivo</Label>
              <Textarea
                id="problemDescription"
                value={problemDescription || ""}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Descreva o motivo do problema ou recusa..."
                rows={3}
                className="col-span-3"
              />
            </div>
          )}

          {(delivery?.problem_description && (delivery.status === "Problema" || delivery.status === "Recusado" || delivery.status === "Devolvido")) && (
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
