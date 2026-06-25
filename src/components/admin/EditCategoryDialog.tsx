import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Category } from "@/context/CategoryContext";
import { toast } from "sonner";

interface EditCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onUpdateCategory: (updatedCategory: Category) => Promise<void>;
}

const EditCategoryDialog: React.FC<EditCategoryDialogProps> = ({ isOpen, onClose, category, onUpdateCategory }) => {
  const [name, setName] = React.useState(category?.name || "");
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    if (category) {
      setName(category.name);
    }
  }, [category]);

  const handleSubmit = async () => {
    if (!category) {
      toast.error("Nenhuma categoria selecionada para edição.");
      return;
    }
    if (!name.trim()) {
      toast.error("O nome da categoria é obrigatório.");
      return;
    }
    setIsUpdating(true);
    try {
      await onUpdateCategory({ ...category, name });
      onClose();
    } catch (error) {
      // Erro já tratado no contexto
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Categoria</DialogTitle>
          <DialogDescription>
            Atualize o nome da categoria.
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
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryDialog;