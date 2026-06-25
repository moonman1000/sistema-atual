import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Employee } from "@/context/EmployeeContext"; // Importar Employee do contexto
import { formatCurrency } from "@/lib/utils"; // Importar formatCurrency

interface ViewEmployeeDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

const getStatusBadgeVariant = (status: Employee["status"]) => {
  switch (status) {
    case "Ativo":
      return "default";
    case "Férias":
      return "secondary";
    case "Inativo":
      return "destructive";
    default:
      return "outline";
  }
};

const ViewEmployeeDetailsDialog: React.FC<ViewEmployeeDetailsDialogProps> = ({ isOpen, onClose, employee }) => {
  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Funcionário: {employee.name}</DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre o funcionário.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={employee.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${employee.name.split(' ').map(n => n[0]).join('')}`} alt={employee.name} />
              <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xl font-bold">{employee.name}</p>
              <p className="text-muted-foreground">{employee.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">ID do Funcionário:</span>
            <span className="font-medium">{employee.id}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Telefone:</span>
            <span className="font-medium">{employee.phone}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Cargo:</span>
            <span className="font-medium">{employee.role}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={getStatusBadgeVariant(employee.status)}>{employee.status}</Badge>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Data Contratação:</span>
            <span className="font-medium">{employee.hire_date}</span> {/* Usar hire_date */}
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-muted-foreground">Salário:</span>
            <span className="font-medium">{formatCurrency(employee.salary)}</span>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewEmployeeDetailsDialog;