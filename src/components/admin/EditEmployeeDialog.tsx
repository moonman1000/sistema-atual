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
import { Employee } from "@/context/EmployeeContext"; // Importar Employee do contexto

interface EditEmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onEditEmployee: (updatedEmployee: Employee) => void;
}

const EditEmployeeDialog: React.FC<EditEmployeeDialogProps> = ({ isOpen, onClose, employee, onEditEmployee }) => {
  const [name, setName] = React.useState(employee?.name || "");
  const [email, setEmail] = React.useState(employee?.email || "");
  const [phone, setPhone] = React.useState(employee?.phone || "");
  const [role, setRole] = React.useState<Employee['role']>(employee?.role || "Atendente");
  const [status, setStatus] = React.useState<Employee['status']>(employee?.status || "Ativo");
  const [hire_date, setHireDate] = React.useState<Date | undefined>(employee?.hire_date ? createLocalDate(employee.hire_date) : undefined); // Usar createLocalDate
  const [salary, setSalary] = React.useState(employee?.salary.toString() || "");

  React.useEffect(() => {
    if (employee) {
      setName(employee.name);
      setEmail(employee.email);
      setPhone(employee.phone);
      setRole(employee.role);
      setStatus(employee.status);
      setHireDate(createLocalDate(employee.hire_date)); // Usar createLocalDate
      setSalary(employee.salary.toFixed(2));
    }
  }, [employee]);

  const handleSubmit = () => {
    if (employee && name && email && phone && role && status && hire_date && salary) {
      onEditEmployee({
        ...employee,
        name,
        email,
        phone,
        role,
        status,
        hire_date: format(hire_date, "yyyy-MM-dd"), // Usar hire_date
        salary: parseFloat(salary),
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Funcionário</DialogTitle>
          <DialogDescription>
            Atualize os detalhes do funcionário.
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
            <Label htmlFor="email" className="text-right">
              E-mail
            </Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Telefone
            </Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Cargo
            </Label>
            <Select value={role} onValueChange={(value: Employee['role']) => setRole(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gerente">Gerente</SelectItem>
                <SelectItem value="Cozinheiro">Cozinheiro</SelectItem>
                <SelectItem value="Entregador">Entregador</SelectItem>
                <SelectItem value="Atendente">Atendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={(value: Employee['status']) => setStatus(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
                <SelectItem value="Férias">Férias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hire_date" className="text-right"> {/* Usar hire_date */}
              Data Contratação
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !hire_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {hire_date ? format(hire_date, "PPP") : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={hire_date}
                  onSelect={setHireDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="salary" className="text-right">
              Salário (R$)
            </Label>
            <Input id="salary" type="number" value={salary} onChange={(e) => setSalary(e.target.value)} className="col-span-3" />
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

export default EditEmployeeDialog;