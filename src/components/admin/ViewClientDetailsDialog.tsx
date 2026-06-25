import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Import the Client interface from ClientsPage.tsx
import { Client } from "@/pages/ClientsPage";

interface ViewClientDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

const ViewClientDetailsDialog: React.FC<ViewClientDetailsDialogProps> = ({ isOpen, onClose, client }) => {
  if (!client) return null;

  const clientFullName = `${client.first_name} ${client.last_name}`;
  const avatarFallback = `${client.first_name[0]}${client.last_name[0]}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Cliente: {clientFullName}</DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre o cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={client.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${avatarFallback}`} alt={clientFullName} />
              <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xl font-bold">{clientFullName}</p>
              <p className="text-muted-foreground">{client.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">ID do Cliente:</span>
            <span className="font-medium">{client.id}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Telefone:</span>
            <span className="font-medium">{client.phone || 'N/A'}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Função:</span>
            <Badge variant={client.role === 'admin' ? 'destructive' : 'secondary'}>
              {client.role === 'admin' ? 'Administrador' : 'Cliente'}
            </Badge>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewClientDetailsDialog;