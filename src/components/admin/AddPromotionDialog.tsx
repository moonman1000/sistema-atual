import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn, formatCurrency, createLocalDate } from "@/lib/utils"; // Importar createLocalDate
import { toast } from "sonner"; // Importar toast

interface Promotion {
  id: string;
  name: string;
  description: string;
  discount_type: "Porcentagem" | "Valor Fixo" | "Frete Grátis"; // snake_case
  discount_value?: number; // snake_case
  start_date: string; // YYYY-MM-DD, snake_case
  end_date: string; // YYYY-MM-DD, snake_case
  is_active: boolean; // snake_case
  minimum_order_value?: number; // snake_case
  applicable_items?: string[]; // snake_case
}

interface AddPromotionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPromotion: (newPromotion: Omit<Promotion, 'id' | 'created_at' | 'updated_at'>) => void;
  availableItems: string[]; // List of available menu item names/IDs
}

const AddPromotionDialog: React.FC<AddPromotionDialogProps> = ({ isOpen, onClose, onAddPromotion, availableItems }) => {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [discountType, setDiscountType] = React.useState<Promotion['discount_type']>("Porcentagem"); // Usar discount_type
  const [discountValue, setDiscountValue] = React.useState("");
  const [startDate, setStartDate] = React.useState<Date | undefined>(createLocalDate(new Date().toISOString().split('T')[0])); // Usar createLocalDate
  const [endDate, setEndDate] = React.useState<Date | undefined>(createLocalDate(new Date().toISOString().split('T')[0])); // Usar createLocalDate
  const [isActive, setIsActive] = React.useState(true);
  const [minimumOrderValue, setMinimumOrderValue] = React.useState("");
  const [applicableItems, setApplicableItems] = React.useState<string[]>(["Todos"]);

  const handleSubmit = () => {
    if (!name) {
      toast.error("O nome da promoção é obrigatório.");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("As datas de início e fim são obrigatórias.");
      return;
    }
    if (discountType !== "Frete Grátis" && (!discountValue || isNaN(parseFloat(discountValue)) || parseFloat(discountValue) <= 0)) {
      toast.error("O valor do desconto é obrigatório e deve ser um número positivo.");
      return;
    }

    onAddPromotion({
      name,
      description,
      discount_type: discountType, // Mapeado para snake_case
      discount_value: discountType !== "Frete Grátis" ? parseFloat(discountValue) : undefined, // Mapeado para snake_case
      start_date: format(startDate, "yyyy-MM-dd"), // Mapeado para snake_case
      end_date: format(endDate, "yyyy-MM-DD"), // Mapeado para snake_case
      is_active: isActive, // Mapeado para snake_case
      minimum_order_value: minimumOrderValue ? parseFloat(minimumOrderValue) : undefined, // Mapeado para snake_case
      applicable_items: applicableItems.includes("Todos") ? ["Todos"] : applicableItems, // Mapeado para snake_case
    });
    onClose();
    // Reset form fields
    setName("");
    setDescription("");
    setDiscountType("Porcentagem");
    setDiscountValue("");
    setStartDate(createLocalDate(new Date().toISOString().split('T')[0])); // Usar createLocalDate
    setEndDate(createLocalDate(new Date().toISOString().split('T')[0])); // Usar createLocalDate
    setIsActive(true);
    setMinimumOrderValue("");
    setApplicableItems(["Todos"]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Promoção</DialogTitle>
          <DialogDescription>
            Preencha os detalhes para adicionar uma nova promoção.
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
            <Label htmlFor="description" className="text-right">
              Descrição
            </Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="discountType" className="text-right">
              Tipo Desconto
            </Label>
            <Select value={discountType} onValueChange={(value: Promotion['discount_type']) => setDiscountType(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Porcentagem">Porcentagem</SelectItem>
                <SelectItem value="Valor Fixo">Valor Fixo</SelectItem>
                <SelectItem value="Frete Grátis">Frete Grátis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {discountType !== "Frete Grátis" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="discountValue" className="text-right">
                Valor Desconto
              </Label>
              <Input id="discountValue" type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="col-span-3" placeholder={discountType === "Porcentagem" ? "Ex: 15" : "Ex: 10.00"} />
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">
              Data Início
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">
              Data Fim
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isActive" className="text-right">
              Ativa
            </Label>
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(!!checked)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="minimumOrderValue" className="text-right">
              Valor Mínimo Pedido
            </Label>
            <Input id="minimumOrderValue" type="number" value={minimumOrderValue} onChange={(e) => setMinimumOrderValue(e.target.value)} className="col-span-3" placeholder={`Opcional (Ex: ${formatCurrency(50)})`} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="applicableItems" className="text-right">
              Itens Aplicáveis
            </Label>
            <Select
              value={applicableItems[0]} // Only show first selected item or "Todos"
              onValueChange={(value) => setApplicableItems(value === "Todos" ? ["Todos"] : [value])}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione os itens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Itens</SelectItem>
                {availableItems.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Salvar Promoção</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPromotionDialog;