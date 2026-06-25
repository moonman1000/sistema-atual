import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Category } from "@/context/CategoryContext";
import { toast } from "sonner";

interface AddCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (newCategory: Omit<Category, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

const AddCategoryDialog: React.FC<AddCategoryDialogProps> = ({ isOpen, onClose, onAddCategory }) => {
  const [name, setName] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("O nome da categoria é obrigatório.");
      return;
    }
    setIsAdding(true);
    try {
      await onAddCategory({ name });
      onClose();
      setName("");
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
          <DialogTitle>Adicionar Nova Categoria</DialogTitle>
          <DialogDescription>
            Preencha o nome para adicionar uma nova categoria de produto.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAdding}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isAdding}>
            {isAdding ? "Adicionando..." : "Salvar Categoria"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryDialog;