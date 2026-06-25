import React, { useState, useMemo, useEffect } from "react";
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
import { ChevronDown, MoreHorizontal, RefreshCw, DollarSign, FileText } from "lucide-react"; // Importar FileText
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AddExpenseDialog from "@/components/admin/AddExpenseDialog";
import EditExpenseDialog from "@/components/admin/EditExpenseDialog";
import ViewExpenseDetailsDialog from "@/components/admin/ViewExpenseDetailsDialog";
import { useExpenses, Expense } from "@/context/ExpenseContext";
import { useSession } from '@/context/SessionContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { useSuppliers } from '@/context/SupplierContext';
import { useEmployees } from '@/context/EmployeeContext';
import { formatDate, formatCurrency, createLocalDate } from "@/lib/utils"; // Importar createLocalDate
import { generateInvoicePdf } from "@/utils/invoiceGenerator"; // Importar generateInvoicePdf

const expenseTypes: Expense['type'][] = ["Salário", "Fornecedor", "Conta Fixa", "Outros"];
const expenseStatuses: Expense['status'][] = ["Pendente", "Pago"];

const ExpensesPage = () => {
  const { session, isAdmin, isLoading: isLoadingSession, isSuperAdmin } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const { expenses, isLoadingExpenses, addExpense, updateExpense, deleteExpense, fetchExpenses } = useExpenses();
  const { suppliers, isLoadingSuppliers } = useSuppliers();
  const { employees, isLoadingEmployees } = useEmployees();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [sortBy, setSortBy] = useState("date-desc");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const availableSuppliersNames = useMemo(() => suppliers.map(s => s.name), [suppliers]);
  const availableEmployeesNames = useMemo(() => employees.map(e => e.name), [employees]);

  useEffect(() => {
    if (!isLoadingSession && !session) {
      toast.info("Você precisa estar logado para acessar esta página.");
    } else if (!isLoadingSession && session && !isAdmin && !isSuperAdmin) {
      toast.error("Acesso negado. Apenas administradores ou super administradores podem gerenciar despesas.");
    }
  }, [isLoadingSession, session, isAdmin, isSuperAdmin]);

  const getStatusBadgeVariant = (status: Expense["status"]) => {
    return status === "Pago" ? "success" : "destructive";
  };

  const filteredExpenses = useMemo(() => {
    let currentExpenses = expenses;

    if (searchTerm) {
      currentExpenses = currentExpenses.filter(
        (expense) =>
          expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.related_entity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "Todos") {
      currentExpenses = currentExpenses.filter((expense) => expense.type === filterType);
    }

    if (filterStatus !== "Todos") {
      currentExpenses = currentExpenses.filter((expense) => expense.status === filterStatus);
    }

    currentExpenses.sort((a, b) => {
      if (sortBy === "date-asc") {
        return createLocalDate(a.date)!.getTime() - createLocalDate(b.date)!.getTime(); // Usar createLocalDate
      }
      if (sortBy === "date-desc") {
        return createLocalDate(b.date)!.getTime() - createLocalDate(a.date)!.getTime(); // Usar createLocalDate
      }
      if (sortBy === "amount-asc") {
        return a.amount - b.amount;
      }
      if (sortBy === "amount-desc") {
        return b.amount - a.amount;
      }
      return 0;
    });

    return currentExpenses;
  }, [searchTerm, filterType, filterStatus, sortBy, expenses]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  const handleViewDetails = (expense: Expense) => {
    setViewingExpense(expense);
    setIsViewDetailsDialogOpen(true);
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditDialogOpen(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId);
    } catch (error) {
      console.error("Erro ao excluir despesa:", error);
    }
  };

  const handleGenerateReceipt = (expense: Expense) => {
    if (!currentRestaurant) {
      toast.error("Não foi possível gerar o comprovante: dados do restaurante ausentes.");
      return;
    }
    if (expense.type === "Fornecedor") {
      const supplier = suppliers.find(s => s.name === expense.related_entity);
      if (!supplier) {
        toast.error("Fornecedor não encontrado para gerar o comprovante.");
        return;
      }
      try {
        generateInvoicePdf('expense', { expense, restaurant: currentRestaurant, supplier });
        toast.success(`Comprovante para a despesa ${expense.id?.substring(0, 8)} gerado com sucesso!`);
      } catch (error: any) {
        console.error("Erro ao gerar comprovante:", error);
        toast.error(`Erro ao gerar comprovante: ${error.message || "Erro desconhecido."}`);
      }
    } else {
      toast.info("A geração de comprovantes está disponível apenas para despesas de 'Fornecedor'.");
    }
  };

  if (isLoadingExpenses || isLoadingSession || isLoadingRestaurants || isLoadingSuppliers || isLoadingEmployees) {
    return <div className="flex min-h-screen items-center justify-center">Carregando controle de custos...</div>;
  }

  if (!session || (!isAdmin && !isSuperAdmin)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-destructive">Acesso negado. Você não tem permissão para gerenciar despesas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Controle de Custos</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>Adicionar Despesa</Button>
          <Button variant="outline" onClick={fetchExpenses}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg bg-card shadow-sm">
          <p className="text-sm text-muted-foreground">Total de Despesas (Filtrado)</p>
          <p className="text-2xl font-bold text-destructive flex items-center gap-1">
            <DollarSign className="h-5 w-5" /> {formatCurrency(totalExpenses)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Buscar por descrição ou entidade..."
          className="max-w-sm flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Tipo: {filterType} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilterType("Todos")}>Todos</DropdownMenuItem>
            {expenseTypes.map((type) => (
              <DropdownMenuItem key={type} onClick={() => setFilterType(type)}>
                {type}
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
            <DropdownMenuItem onClick={() => setFilterStatus("Todos")}>Todos</DropdownMenuItem>
            {expenseStatuses.map((status) => (
              <DropdownMenuItem key={status} onClick={() => setFilterStatus(status)}>
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
            <DropdownMenuItem onClick={() => setSortBy("date-desc")}>Data (Mais Recente)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("date-asc")}>Data (Mais Antiga)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("amount-desc")}>Valor (Maior)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("amount-asc")}>Valor (Menor)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor (R$)</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{formatDate(expense.date)}</TableCell>
                <TableCell>{expense.type}</TableCell>
                <TableCell>{expense.related_entity || 'N/A'}</TableCell>
                <TableCell className="text-muted-foreground truncate max-w-xs">{expense.description || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(expense.status)}>
                    {expense.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium text-destructive">
                  {formatCurrency(expense.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(expense)}>
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(expense)}>
                        Editar
                      </DropdownMenuItem>
                      {expense.type === "Fornecedor" && (
                        <DropdownMenuItem onClick={() => handleGenerateReceipt(expense)}>
                          <FileText className="h-4 w-4 mr-2" /> Gerar Comprovante
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteExpense(expense.id)}>
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

      <AddExpenseDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddExpense={addExpense}
        availableSuppliers={availableSuppliersNames}
        availableEmployees={availableEmployeesNames}
      />

      <ViewExpenseDetailsDialog
        isOpen={isViewDetailsDialogOpen}
        onClose={() => setIsViewDetailsDialogOpen(false)}
        expense={viewingExpense}
      />

      {editingExpense && (
        <EditExpenseDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          expense={editingExpense}
          onEditExpense={updateExpense}
          availableSuppliers={availableSuppliersNames}
          availableEmployees={availableEmployeesNames}
        />
      )}
    </div>
  );
};

export default ExpensesPage;