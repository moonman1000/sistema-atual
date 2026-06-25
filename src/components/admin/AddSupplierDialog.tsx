import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Supplier } from "@/context/SupplierContext";

interface AddSupplierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSupplier: (newSupplier: Omit<Supplier, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

const businessTypes = ["Alimentos e Bebidas", "Embalagens", "Limpeza", "Equipamentos", "Serviços", "Outros"];

const AddSupplierDialog: React.FC<AddSupplierDialogProps> = ({ isOpen, onClose, onAddSupplier }) => {
  const [name, setName] = React.useState("");
  const [contactPerson, setContactPerson] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [businessType, setBusinessType] = React.useState(""); // NOVO: Estado para tipo de negócio
  const [isAdding, setIsAdding] = React.useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("O nome do fornecedor é obrigatório.");
      return;
    }
    setIsAdding(true);
    try {
      await onAddSupplier({
        name,
        contact_person: contactPerson || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        business_type: businessType || undefined, // NOVO: Incluir business_type
      });
      onClose();
      // Reset form fields
      setName("");
      setContactPerson("");
      setPhone("");
      setEmail("");
      setAddress("");
      setBusinessType(""); // NOVO: Resetar tipo de negócio
    } catch (error) {
      // Erro já tratado no contexto
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Fornecedor</DialogTitle>
          <DialogDescription>
            Preencha os detalhes para adicionar um novo fornecedor.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contactPerson" className="text-right">
              Pessoa Contato
            </Label>
            <Input id="contactPerson" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="col-span-3" placeholder="Opcional" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Telefone
            </Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" placeholder="Opcional" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              E-mail
            </Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" placeholder="Opcional" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Endereço
            </Label>
            <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="col-span-3" placeholder="Opcional" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4"> {/* NOVO: Campo para tipo de negócio */}
            <Label htmlFor="businessType" className="text-right">
              Tipo de Negócio
            </Label>
            <Select value={businessType} onValueChange={setBusinessType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o tipo de negócio" />
              </SelectTrigger>
              <SelectContent>
                {businessTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAdding}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isAdding}>
            {isAdding ? "Adicionando..." : "Salvar Fornecedor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddSupplierDialog;