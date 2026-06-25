import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, MoreHorizontal, User as UserIcon, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import AddEmployeeDialog from "@/components/admin/AddEmployeeDialog";
import EditEmployeeDialog from "@/components/admin/EditEmployeeDialog";
import ViewEmployeeDetailsDialog from "@/components/admin/ViewEmployeeDetailsDialog";
import { useEmployees, Employee } from "@/context/EmployeeContext";
import { useSession } from '@/context/SessionContext'; // Importar useSession
import { useRestaurant } from '@/context/RestaurantContext'; // Importar useRestaurant
import { formatCurrency } from "@/lib/utils"; // Importar formatCurrency
import AdminTableFiltersWrapper from "@/components/admin/AdminTableFiltersWrapper"; // Importar wrapper
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Importar Tooltip

const EmployeesPage = () => {
  const { session, isAdmin, isLoading: isLoadingSession } = useSession(); // Obter isAdmin
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant(); // Obter currentRestaurant
  const { employees, isLoadingEmployees, addEmployee, updateEmployee, deleteEmployee, fetchEmployees } = useEmployees();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterRole, setFilterRole] = React.useState("Todos");
  const [filterStatus, setFilterStatus] = React.useState("Todos");
  const [sortBy, setSortBy] = React.useState("name-asc");

  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = React.useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = React.useState(false);
  const [viewingEmployee, setViewingEmployee] = React.useState<Employee | null>(null);
  const [isEditEmployeeDialogOpen, setIsEditEmployeeDialogOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);

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

  const filteredEmployees = React.useMemo(() => {
    let currentEmployees = employees;

    if (searchTerm) {
      currentEmployees = currentEmployees.filter(
        (employee) =>
          employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== "Todos") {
      currentEmployees = currentEmployees.filter((employee) => employee.role === filterRole);
    }

    if (filterStatus !== "Todos") {
      currentEmployees = currentEmployees.filter((employee) => employee.status === filterStatus);
    }

    currentEmployees.sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name) * -1;
      }
      if (sortBy === "salary-asc") {
        return a.salary - b.salary;
      }
      if (sortBy === "salary-desc") {
        return b.salary - a.salary;
      }
      if (sortBy === "hireDate-asc") {
        return new Date(a.hire_date).getTime() - new Date(b.hire_date).getTime();
      }
      if (sortBy === "hireDate-desc") {
        return new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime();
      }
      return 0;
    });

    return currentEmployees;
  }, [searchTerm, filterRole, filterStatus, sortBy, employees]);

  const handleAddEmployee = async (newEmployeeData: Omit<Employee, 'id' | 'avatar_url' | 'restaurant_id' | 'created_at' | 'updated_at'>) => {
    try {
      await addEmployee({
        ...newEmployeeData,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${newEmployeeData.name.split(' ').map(n => n[0]).join('')}`,
      });
    } catch (error) {
      console.error("Erro ao adicionar funcionário:", error);
    }
  };

  const handleEditEmployee = async (updatedEmployee: Employee) => {
    try {
      await updateEmployee(updatedEmployee);
    } catch (error) {
      console.error("Erro ao atualizar funcionário:", error);
    }
  };

  const handleViewDetails = (employee: Employee) => {
    setViewingEmployee(employee);
    setIsViewDetailsDialogOpen(true);
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditEmployeeDialogOpen(true);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      await deleteEmployee(employeeId);
    } catch (error) {
      console.error("Erro ao excluir funcionário:", error);
    }
  };

  const roleOptions = ["Todos", "Gerente", "Cozinheiro", "Entregador", "Atendente"];
  const statusOptions = ["Todos", "Ativo", "Inativo", "Férias"];

  if (isLoadingEmployees || isLoadingSession || isLoadingRestaurants) {
    return <div className="flex min-h-screen items-center justify-center">Carregando funcionários...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Funcionários</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddEmployeeDialogOpen(true)}>Adicionar Funcionário</Button>
          <Button variant="outline" onClick={fetchEmployees}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      <AdminTableFiltersWrapper>
        <Input
          placeholder="Buscar por nome, e-mail ou cargo..."
          className="max-w-sm flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Cargo: {filterRole} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {roleOptions.map((role) => (
              <DropdownMenuItem key={role} onClick={() => setFilterRole(role as Employee["role"] | "Todos")}>
                {role}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Status: {filterStatus} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {statusOptions.map((status) => (
              <DropdownMenuItem key={status} onClick={() => setFilterStatus(status as Employee["status"] | "Todos")}>
                {status}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Ordenar por <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy("name-asc")}>Nome (A-Z)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("name-desc")}>Nome (Z-A)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("salary-desc")}>Salário (Maior)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("salary-asc")}>Salário (Menor)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("hireDate-desc")}>Mais Recentes</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("hireDate-asc")}>Mais Antigos</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </AdminTableFiltersWrapper>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Salário</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <Avatar>
                    <AvatarImage src={employee.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${employee.name.split(' ').map(n => n[0]).join('')}`} alt={employee.name} />
                    <AvatarFallback>
                      <UserIcon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="cursor-default">
                        {employee.id.substring(0, 8)}...
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{employee.id}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>
                  {employee.email}
                  <br />
                  <span className="text-muted-foreground text-xs">{employee.phone}</span>
                </TableCell>
                <TableCell>{employee.role}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(employee.status)}>
                    {employee.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(employee.salary)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(employee)}>
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(employee)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteEmployee(employee.id)}>
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AddEmployeeDialog
        isOpen={isAddEmployeeDialogOpen}
        onClose={() => setIsAddEmployeeDialogOpen(false)}
        onAddEmployee={handleAddEmployee}
      />

      <ViewEmployeeDetailsDialog
        isOpen={isViewDetailsDialogOpen}
        onClose={() => setIsViewDetailsDialogOpen(false)}
        employee={viewingEmployee}
      />

      {editingEmployee && (
        <EditEmployeeDialog
          isOpen={isEditEmployeeDialogOpen}
          onClose={() => setIsEditEmployeeDialogOpen(false)}
          employee={editingEmployee}
          onEditEmployee={handleEditEmployee}
        />
      )}
    </div>
  );
};

export default EmployeesPage;