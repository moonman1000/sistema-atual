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
import { Employee } from "@/context/EmployeeContext";
import { useRestaurant } from "@/context/RestaurantContext"; // Importante para pegar o restaurant_id
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type NewEmployee = Omit<Employee, 'id' | 'avatar_url' | 'created_at' | 'updated_at'> & { id?: string };

interface AddEmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployee: (newEmployee: NewEmployee) => Promise<void> | void;
}

const AddEmployeeDialog: React.FC<AddEmployeeDialogProps> = ({ isOpen, onClose, onAddEmployee }) => {
  const { currentRestaurant } = useRestaurant();
  
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState<Employee['role']>("Atendente");
  const [status, setStatus] = React.useState<Employee['status']>("Ativo");
  const [hire_date, setHireDate] = React.useState<Date | undefined>(createLocalDate(new Date().toISOString().split('T')[0]));
  const [salary, setSalary] = React.useState("");
  const [createAuthUser, setCreateAuthUser] = React.useState<boolean>(true);
  const [password, setPassword] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setRole("Atendente");
    setStatus("Ativo");
    setHireDate(createLocalDate(new Date().toISOString().split('T')[0]));
    setSalary("");
    setPassword("");
    setCreateAuthUser(true);
  };

  const callCreateUserEdgeFunction = async () => {
    if (!currentRestaurant?.id) {
      throw new Error("Restaurante não identificado. Verifique se você está logado corretamente.");
    }

    // Chama a Edge Function do Supabase
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: { 
        email, 
        password, 
        name, 
        role, 
        phone, 
        salary, 
        hire_date: hire_date ? format(hire_date, "yyyy-MM-dd") : null,
        restaurant_id: currentRestaurant.id 
      },
    });

    if (error) {
      console.error("Erro na Edge Function:", error);
      throw new Error(error.message || "Erro ao criar usuário no servidor.");
    }

    return data.uid as string;
  };

  const handleSubmit = async () => {
    if (!name || !email || !phone || !role || !status || !hire_date || !salary) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (createAuthUser && !password) {
      toast.error("Defina uma senha para o novo usuário.");
      return;
    }

    setIsSaving(true);
    try {
      let uid: string | undefined;

      if (createAuthUser) {
        uid = await callCreateUserEdgeFunction();
        toast.success("Usuário e perfil criados com sucesso!");
      } else {
        // Se não for criar usuário Auth, apenas chama o onAddEmployee padrão
        const newEmployee: NewEmployee = {
          name,
          email,
          phone,
          role,
          status,
          hire_date: format(hire_date!, "yyyy-MM-dd"),
          salary: parseFloat(salary),
        };
        await onAddEmployee(newEmployee);
        toast.success("Funcionário adicionado localmente.");
      }

      resetForm();
      onClose();
    } catch (error: any) {
      console.error("Erro ao adicionar funcionário:", error);
      toast.error(error?.message || "Erro ao processar solicitação.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Funcionário</DialogTitle>
          <DialogDescription>
            O funcionário será criado no sistema e poderá logar com e-mail e senha.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">Telefone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">Cargo</Label>
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
            <Label htmlFor="salary" className="text-right">Salário (R$)</Label>
            <Input id="salary" type="number" value={salary} onChange={(e) => setSalary(e.target.value)} className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Acesso</Label>
            <div className="col-span-3 flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="createAuth"
                checked={createAuthUser} 
                onChange={(e) => setCreateAuthUser(e.target.checked)} 
              />
              <label htmlFor="createAuth" className="text-sm font-medium">Criar login (E-mail/Senha)</label>
            </div>
          </div>

          {createAuthUser && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="col-span-3" 
                placeholder="Senha para o primeiro acesso"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Processando..." : "Salvar Funcionário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeDialog;
