import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Import the Client interface from ClientsPage.tsx
import { Client } from "@/pages/ClientsPage";

interface EditClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onEditClient: (updatedClient: Client) => void;
}

const EditClientDialog: React.FC<EditClientDialogProps> = ({ isOpen, onClose, client, onEditClient }) => {
  const [firstName, setFirstName] = React.useState(client?.first_name || "");
  const [lastName, setLastName] = React.useState(client?.last_name || "");
  const [email, setEmail] = React.useState(client?.email || "");
  const [phone, setPhone] = React.useState(client?.phone || "");

  React.useEffect(() => {
    if (client) {
      setFirstName(client.first_name);
      setLastName(client.last_name);
      setEmail(client.email);
      setPhone(client.phone || "");
    }
  }, [client]);

  const handleSubmit = () => {
    if (client && firstName && lastName && email) {
      onEditClient({
        ...client,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || undefined,
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Atualize os detalhes do cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firstName" className="text-right">
              Nome
            </Label>
            <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastName" className="text-right">
              Sobrenome
            </Label>
            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              E-mail
            </Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Telefone
            </Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditClientDialog;