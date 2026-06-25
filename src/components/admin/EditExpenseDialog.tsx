"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn, createLocalDate } from "@/lib/utils";
import { toast } from "sonner";
import { Expense } from "@/context/ExpenseContext";

interface EditExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  onEditExpense: (updatedExpense: Expense) => Promise<void>;
  availableSuppliers: string[];
  availableEmployees: string[];
}

const expenseTypes: Expense['type'][] = ["Salário", "Fornecedor", "Conta Fixa", "Outros"];
const expenseStatuses: Expense['status'][] = ["Pendente", "Pago"];

const EditExpenseDialog: React.FC<EditExpenseDialogProps> = ({ isOpen, onClose, expense, onEditExpense, availableSuppliers, availableEmployees }) => {
  const [type, setType] = React.useState<Expense['type']>(expense?.type || "Conta Fixa");
  const [description, setDescription] = React.useState(expense?.description || "");
  const [amount, setAmount] = React.useState(expense?.amount.toString() || "");
  const [date, setDate] = React.useState<Date | undefined>(expense?.date ? createLocalDate(expense.date) : createLocalDate(new Date().toISOString().split('T')[0])); // Usar createLocalDate
  const [status, setStatus] = React.useState<Expense['status']>(expense?.status || "Pendente");
  const [relatedEntity, setRelatedEntity] = React.useState(expense?.related_entity || "");
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    if (expense) {
      setType(expense.type);
      setDescription(expense.description || "");
      setAmount(expense.amount.toFixed(2));
      setDate(createLocalDate(expense.date)); // Usar createLocalDate
      setStatus(expense.status);
      setRelatedEntity(expense.related_entity || "");
    }
  }, [expense]);

  const handleSubmit = async () => {
    if (!expense) {
      toast.error("Nenhuma despesa selecionada para edição.");
      return;
    }
    if (!type || !amount || !date || !status) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error("O valor deve ser um número positivo.");
      return;
    }

    setIsUpdating(true);
    try {
      await onEditExpense({
        ...expense,
        type,
        description: description || undefined,
        amount: parseFloat(amount),
        date: format(date!, "yyyy-MM-dd"),
        status,
        related_entity: relatedEntity || undefined,
      });
      onClose();
    } catch (error) {
      // Error handled in context
    } finally {
      setIsUpdating(false);
    }
  };

  const getRelatedEntityOptions = () => {
    if (type === "Fornecedor") {
      return availableSuppliers;
    }
    if (type === "Salário") {
      return availableEmployees;
    }
    return [];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Despesa</DialogTitle>
          <DialogDescription>
            Atualize os detalhes da despesa.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Tipo
            </Label>
            <Select value={type} onValueChange={(value: Expense['type']) => { setType(value); setRelatedEntity(""); }}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {expenseTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Valor (R$)
            </Label>
            <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Data
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={(value: Expense['status']) => setStatus(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {expenseStatuses.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Related Entity Field */}
          {type === "Fornecedor" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="relatedEntity" className="text-right">
                Fornecedor
              </Label>
              <Select value={relatedEntity} onValueChange={setRelatedEntity}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {availableSuppliers.map((entity) => (
                    <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "Salário" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="relatedEntity" className="text-right">
                Funcionário
              </Label>
              <Select value={relatedEntity} onValueChange={setRelatedEntity}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees.map((entity) => (
                    <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(type === "Conta Fixa" || type === "Outros") && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="relatedEntity" className="text-right">
                Entidade
              </Label>
              <Input id="relatedEntity" value={relatedEntity} onChange={(e) => setRelatedEntity(e.target.value)} className="col-span-3" placeholder="Ex: Aluguel, Conta de Luz" />
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descrição
            </Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder="Detalhes da despesa (Opcional)" />
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

export default EditExpenseDialog;