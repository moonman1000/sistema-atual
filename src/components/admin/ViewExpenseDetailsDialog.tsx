"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Expense } from "@/context/ExpenseContext";
import { formatDate, formatCurrency } from "@/lib/utils"; // Importar formatCurrency

interface ViewExpenseDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
}

const getStatusBadgeVariant = (status: Expense["status"]) => {
  switch (status) {
    case "Pago":
      return "success";
    case "Pendente":
      return "destructive";
    default:
      return "outline";
  }
};

const ViewExpenseDetailsDialog: React.FC<ViewExpenseDetailsDialogProps> = ({ isOpen, onClose, expense }) => {
  if (!expense) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalhes da Despesa: {expense.id}</DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre o custo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">ID da Despesa:</span>
            <span className="font-medium">{expense.id}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Tipo:</span>
            <span className="font-medium">{expense.type}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Valor:</span>
            <span className="font-medium text-destructive">{formatCurrency(expense.amount)}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Data:</span>
            <span className="font-medium">{formatDate(expense.date)}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={getStatusBadgeVariant(expense.status)}>{expense.status}</Badge>
          </div>
          {expense.related_entity && (
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-muted-foreground">Entidade Relacionada:</span>
              <span className="font-medium">{expense.related_entity}</span>
            </div>
          )}
          {expense.description && (
            <div className="grid grid-cols-2 items-start gap-4">
              <span className="text-muted-foreground">Descrição:</span>
              <span className="font-medium break-words">{expense.description}</span>
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

export default ViewExpenseDetailsDialog;