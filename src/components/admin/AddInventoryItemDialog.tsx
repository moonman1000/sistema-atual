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

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_stock: number; // snake_case
  min_stock_level: number; // snake_case
  unit: string;
  last_restock_date: string; // YYYY-MM-DD, snake_case
  supplier: string;
  restaurant_id: string; // Adicionado restaurant_id
}

interface AddInventoryItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddInventoryItem: (newItem: Omit<InventoryItem, 'id' | 'restaurant_id'>) => void;
  availableCategories: string[];
  availableUnits: string[];
  availableSuppliers: string[]; // NOVO: Receber lista de fornecedores via props
}

const AddInventoryItemDialog: React.FC<AddInventoryItemDialogProps> = ({
  isOpen,
  onClose,
  onAddInventoryItem,
  availableCategories,
  availableUnits,
  availableSuppliers, // NOVO: Desestruturar availableSuppliers
}) => {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [currentStock, setCurrentStock] = React.useState("");
  const [minStockLevel, setMinStockLevel] = React.useState("");
  const [unit, setUnit] = React.useState("");
  const [lastRestockDate, setLastRestockDate] = React.useState<Date | undefined>(createLocalDate(new Date().toISOString().split('T')[0])); // Usar createLocalDate
  const [supplier, setSupplier] = React.useState("");

  const handleSubmit = () => {
    if (!name) {
      toast.error("O nome é obrigatório.");
      return;
    }
    if (!category) {
      toast.error("A categoria é obrigatória.");
      return;
    }
    if (!currentStock || isNaN(parseFloat(currentStock))) {
      toast.error("O estoque atual é obrigatório e deve ser um número.");
      return;
    }
    if (!minStockLevel || isNaN(parseFloat(minStockLevel))) {
      toast.error("O estoque mínimo é obrigatório e deve ser um número.");
      return;
    }
    if (!unit) {
      toast.error("A unidade é obrigatória.");
      return;
    }
    if (!lastRestockDate) {
      toast.error("A data do último reabastecimento é obrigatória.");
      return;
    }
    if (!supplier) {
      toast.error("O fornecedor é obrigatório.");
      return;
    }

    onAddInventoryItem({
      name,
      category,
      current_stock: parseFloat(currentStock),
      min_stock_level: parseFloat(minStockLevel),
      unit,
      last_restock_date: format(lastRestockDate, "yyyy-MM-dd"),
      supplier,
    });
    onClose();
    setName("");
    setCategory("");
    setCurrentStock("");
    setMinStockLevel("");
    setUnit("");
    setLastRestockDate(createLocalDate(new Date().toISOString().split('T')[0])); // Usar createLocalDate
    setSupplier("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Item de Inventário</DialogTitle>
          <DialogDescription>
            Preencha os detalhes para adicionar um novo item ao estoque.
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
            <Label htmlFor="category" className="text-right">
              Categoria
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="currentStock" className="text-right">
              Estoque Atual
            </Label>
            <Input id="currentStock" type="number" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="minStockLevel" className="text-right">
              Estoque Mínimo
            </Label>
            <Input id="minStockLevel" type="number" value={minStockLevel} onChange={(e) => setMinStockLevel(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit" className="text-right">
              Unidade
            </Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {availableUnits.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastRestockDate" className="text-right">
              Último Reabastecimento
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !lastRestockDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {lastRestockDate ? format(lastRestockDate, "PPP") : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={lastRestockDate}
                  onSelect={setLastRestockDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="supplier" className="text-right">
              Fornecedor
            </Label>
            <Select value={supplier} onValueChange={setSupplier}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {availableSuppliers.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Salvar Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddInventoryItemDialog;