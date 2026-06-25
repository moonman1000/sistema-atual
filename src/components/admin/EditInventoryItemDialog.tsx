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
  current_stock: number; // Corrigido para snake_case
  min_stock_level: number; // Corrigido para snake_case
  unit: string;
  last_restock_date: string; // YYYY-MM-DD, Corrigido para snake_case
  supplier: string;
  restaurant_id?: string; // Adicionado para consistência, embora não usado diretamente no dialog
}

interface EditInventoryItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onEditInventoryItem: (updatedItem: InventoryItem) => void;
  availableCategories: string[];
  availableUnits: string[];
  availableSuppliers: string[]; // NOVO: Receber lista de fornecedores via props
}

const EditInventoryItemDialog: React.FC<EditInventoryItemDialogProps> = ({
  isOpen,
  onClose,
  item,
  onEditInventoryItem,
  availableCategories,
  availableUnits,
  availableSuppliers, // NOVO: Desestruturar availableSuppliers
}) => {
  const [name, setName] = React.useState(item?.name || "");
  const [category, setCategory] = React.useState(item?.category || "");
  const [current_stock, setCurrentStock] = React.useState(item?.current_stock.toString() || "");
  const [min_stock_level, setMinStockLevel] = React.useState(item?.min_stock_level.toString() || "");
  const [unit, setUnit] = React.useState(item?.unit || "");
  const [last_restock_date, setLastRestockDate] = React.useState<Date | undefined>(item?.last_restock_date ? createLocalDate(item.last_restock_date) : undefined); // Usar createLocalDate
  const [supplier, setSupplier] = React.useState(item?.supplier || "");

  React.useEffect(() => {
    if (item) {
      setName(item.name);
      setCategory(item.category);
      setCurrentStock(item.current_stock.toString());
      setMinStockLevel(item.min_stock_level.toString());
      setUnit(item.unit);
      setLastRestockDate(createLocalDate(item.last_restock_date)); // Usar createLocalDate
      setSupplier(item.supplier);
    }
  }, [item]);

  const handleSubmit = () => {
    if (!item) {
      toast.error("Nenhum item selecionado para edição.");
      return;
    }
    if (!name) {
      toast.error("O nome é obrigatório.");
      return;
    }
    if (!category) {
      toast.error("A categoria é obrigatória.");
      return;
    }
    if (!current_stock || isNaN(parseFloat(current_stock))) {
      toast.error("O estoque atual é obrigatório e deve ser um número.");
      return;
    }
    if (!min_stock_level || isNaN(parseFloat(min_stock_level))) {
      toast.error("O estoque mínimo é obrigatório e deve ser um número.");
      return;
    }
    if (!unit) {
      toast.error("A unidade é obrigatória.");
      return;
    }
    if (!last_restock_date) {
      toast.error("A data do último reabastecimento é obrigatória.");
      return;
    }
    if (!supplier) {
      toast.error("O fornecedor é obrigatório.");
      return;
    }

    onEditInventoryItem({
      ...item,
      name,
      category,
      current_stock: parseFloat(current_stock),
      min_stock_level: parseFloat(min_stock_level),
      unit,
      last_restock_date: format(last_restock_date, "yyyy-MM-dd"),
      supplier,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Item de Inventário</DialogTitle>
          <DialogDescription>
            Atualize os detalhes do item de inventário.
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
            <Label htmlFor="current_stock" className="text-right">
              Estoque Atual
            </Label>
            <Input id="current_stock" type="number" value={current_stock} onChange={(e) => setCurrentStock(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="min_stock_level" className="text-right">
              Estoque Mínimo
            </Label>
            <Input id="min_stock_level" type="number" value={min_stock_level} onChange={(e) => setMinStockLevel(e.target.value)} className="col-span-3" />
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
            <Label htmlFor="last_restock_date" className="text-right">
              Último Reabastecimento
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !last_restock_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {last_restock_date ? format(last_restock_date, "PPP") : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={last_restock_date}
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
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditInventoryItemDialog;