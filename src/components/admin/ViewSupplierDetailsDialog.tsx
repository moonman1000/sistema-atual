import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Supplier } from "@/context/SupplierContext";
import { Mail, Phone, MapPin, User, Briefcase } from "lucide-react"; // NOVO: Importar Briefcase

interface ViewSupplierDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

const ViewSupplierDetailsDialog: React.FC<ViewSupplierDetailsDialogProps> = ({ isOpen, onClose, supplier }) => {
  if (!supplier) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Fornecedor: {supplier.name}</DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre o fornecedor.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">ID do Fornecedor:</span>
            <span className="font-medium">{supplier.id}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Nome:</span>
            <span className="font-medium">{supplier.name}</span>
          </div>
          {supplier.contact_person && (
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" /> Pessoa de Contato:</span>
              <span className="font-medium">{supplier.contact_person}</span>
            </div>
          )}
          {supplier.phone && (
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4" /> Telefone:</span>
              <span className="font-medium">{supplier.phone}</span>
            </div>
          )}
          {supplier.email && (
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4" /> E-mail:</span>
              <span className="font-medium">{supplier.email}</span>
            </div>
          )}
          {supplier.address && (
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Endereço:</span>
              <span className="font-medium">{supplier.address}</span>
            </div>
          )}
          {supplier.business_type && ( // NOVO: Exibir tipo de negócio
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-muted-foreground flex items-center gap-2"><Briefcase className="h-4 w-4" /> Tipo de Negócio:</span>
              <span className="font-medium">{supplier.business_type}</span>
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

export default ViewSupplierDetailsDialog;