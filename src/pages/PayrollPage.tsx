"use client";

import React, { useMemo } from "react";
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
import { ChevronDown, MoreHorizontal, RefreshCw, DollarSign, FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useEmployees, Employee } from "@/context/EmployeeContext";
import { useSession } from '@/context/SessionContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { formatCurrency, formatDate, createLocalDate } from "@/lib/utils"; // Importar createLocalDate
import { generateAllPayrollsPdf, generateSinglePayrollPdf } from "@/utils/payrollGenerator"; // Importar a nova função
import "jspdf-autotable"; // NOVO: Adicionar esta importação para garantir que a extensão seja carregada

const PayrollPage = () => {
  const { session, isAdmin, isSuperAdmin, isLoading: isLoadingSession } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const { employees, isLoadingEmployees, fetchEmployees } = useEmployees();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterRole, setFilterRole] = React.useState("Todos");
  const [sortBy, setSortBy] = React.useState("name-asc");
  const [isGeneratingAllPdf, setIsGeneratingAllPdf] = React.useState(false); // Estado para todas as folhas
  const [isGeneratingSinglePdf, setIsGeneratingSinglePdf] = React.useState(false); // Estado para folha individual

  const getRoleBadgeVariant = (role: Employee["role"]) => {
    switch (role) {
      case "Gerente":
        return "default";
      case "Cozinheiro":
        return "secondary";
      case "Entregador":
        return "outline";
      case "Atendente":
        return "info";
      default:
        return "default";
    }
  };

  const filteredEmployees = useMemo(() => {
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
      return 0;
    });

    return currentEmployees;
  }, [searchTerm, filterRole, sortBy, employees]);

  const handleGenerateAllPayrolls = async () => {
    if (!currentRestaurant) {
      toast.error("Nenhum restaurante selecionado para gerar a folha de pagamentos.");
      return;
    }
    setIsGeneratingAllPdf(true);
    try {
      generateAllPayrollsPdf(filteredEmployees, currentRestaurant.name);
      toast.success("Folha de pagamentos gerada com sucesso!");
    } catch (error: any) { // Capturar o erro como 'any' para acessar 'message'
      console.error("Erro ao gerar PDF da folha de pagamentos (todos):", error);
      toast.error(`Erro ao gerar PDF da folha de pagamentos: ${error.message || "Erro desconhecido."}`);
    } finally {
      setIsGeneratingAllPdf(false);
    }
  };

  const handleGenerateSinglePayroll = async (employee: Employee) => {
    if (!currentRestaurant) {
      toast.error("Nenhum restaurante selecionado para gerar a folha de pagamento.");
      return;
    }
    setIsGeneratingSinglePdf(true);
    try {
      generateSinglePayrollPdf(employee, currentRestaurant.name);
      toast.success(`Folha de pagamento para ${employee.name} gerada com sucesso!`);
    } catch (error: any) { // Capturar o erro como 'any' para acessar 'message'
      console.error(`Erro ao gerar PDF da folha de pagamento para ${employee.name}:`, error);
      toast.error(`Erro ao gerar PDF da folha de pagamento para ${employee.name}: ${error.message || "Erro desconhecido."}`);
    } finally {
      setIsGeneratingSinglePdf(false);
    }
  };

  const roleOptions = ["Todos", "Gerente", "Cozinheiro", "Entregador", "Atendente"];

  if (isLoadingEmployees || isLoadingSession || isLoadingRestaurants) {
    return <div className="flex min-h-screen items-center justify-center">Carregando folha de pagamentos...</div>;
  }

  if (!session || (!isAdmin && !isSuperAdmin)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-destructive">Acesso negado. Você não tem permissão para gerenciar a folha de pagamentos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Folha de Pagamentos</h1>
        <div className="flex gap-2">
          <Button onClick={handleGenerateAllPayrolls} disabled={isGeneratingAllPdf || filteredEmployees.length === 0}>
            {isGeneratingAllPdf ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" /> Gerar Todas as Folhas
              </>
            )}
          </Button>
          <Button variant="outline" onClick={fetchEmployees}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
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
              Ordenar por <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy("name-asc")}>Nome (A-Z)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("name-desc")}>Nome (Z-A)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("salary-desc")}>Salário (Maior)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("salary-asc")}>Salário (Menor)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Salário</TableHead>
              <TableHead>Data Contratação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.id}</TableCell>
                <TableCell>{employee.name}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(employee.role)}>
                    {employee.role}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(employee.salary)}</TableCell>
                <TableCell>{formatDate(employee.hire_date)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={isGeneratingSinglePdf}>
                        <span className="sr-only">Abrir menu</span>
                        {isGeneratingSinglePdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleGenerateSinglePayroll(employee)} disabled={isGeneratingSinglePdf}>
                        Gerar Folha de Pagamento
                      </DropdownMenuItem>
                      {/* Outras ações relacionadas à folha de pagamento podem ser adicionadas aqui */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PayrollPage;