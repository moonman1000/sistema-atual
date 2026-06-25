import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from './SessionContext.tsx';
import { useRestaurant } from './RestaurantContext';
import { toast } from 'sonner';

export interface Expense {
  id: string;
  restaurant_id: string;
  type: "Salário" | "Fornecedor" | "Conta Fixa" | "Outros";
  description?: string;
  amount: number;
  date: string; // YYYY-MM-DD
  status: "Pago" | "Pendente";
  related_entity?: string;
  created_at?: string;
  updated_at?: string;
}

interface ExpenseContextType {
  expenses: Expense[];
  isLoadingExpenses: boolean;
  addExpense: (newExpense: Omit<Expense, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateExpense: (updatedExpense: Expense) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  fetchExpenses: () => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider = ({ children }: { children: ReactNode }) => {
  const { session, isAdmin, isSuperAdmin, isLoading: isLoadingSession } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);

  const fetchExpenses = useCallback(async () => {
    setIsLoadingExpenses(true);
    console.log("ExpenseContext: Starting fetchExpenses...");

    if (!session || (!isAdmin && !isSuperAdmin) || !currentRestaurant?.id) {
      setExpenses([]);
      setIsLoadingExpenses(false);
      console.log("ExpenseContext: Not authorized or no restaurant selected, clearing expenses.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .order('date', { ascending: false });

      if (error) {
        console.error("ExpenseContext: Erro ao carregar despesas:", error);
        toast.error("Erro ao carregar despesas.");
        setExpenses([]);
      } else {
        console.log("ExpenseContext: Despesas carregadas com sucesso.");
        setExpenses(data as Expense[]);
      }
    } catch (unexpectedError) {
      console.error("ExpenseContext: Erro inesperado durante fetchExpenses:", unexpectedError);
      toast.error("Erro inesperado ao carregar despesas.");
      setExpenses([]);
    } finally {
      setIsLoadingExpenses(false);
    }
  }, [session, isAdmin, isSuperAdmin, currentRestaurant?.id]);

  useEffect(() => {
    let cancelled = false;
    const runFetch = async () => {
      if (isLoadingSession || isLoadingRestaurants) {
        if (!cancelled) {
          setExpenses([]);
          setIsLoadingExpenses(true);
        }
        return;
      }

      if (session && (isAdmin || isSuperAdmin) && currentRestaurant?.id) {
        await fetchExpenses();
      } else {
        if (!cancelled) {
          setExpenses([]);
          setIsLoadingExpenses(false);
        }
      }
    };

    runFetch();

    return () => {
      cancelled = true;
    };
  }, [isLoadingSession, isLoadingRestaurants, session, isAdmin, isSuperAdmin, currentRestaurant?.id, fetchExpenses]);

  const addExpense = async (newExpenseData: Omit<Expense, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => {
    if (!session || (!isAdmin && !isSuperAdmin)) {
      toast.error("Apenas administradores ou super administradores podem adicionar despesas.");
      throw new Error("Acesso não autorizado.");
    }
    if (!currentRestaurant?.id) {
      toast.error("Nenhum restaurante selecionado para adicionar despesa.");
      throw new Error("Restaurant ID not available.");
    }

    setIsLoadingExpenses(true);
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        ...newExpenseData,
        restaurant_id: currentRestaurant.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar despesa:", error);
      toast.error("Erro ao adicionar despesa: " + error.message);
      setIsLoadingExpenses(false);
      throw error;
    }

    setExpenses(prev => [data as Expense, ...prev]);
    toast.success("Despesa adicionada com sucesso!");
    setIsLoadingExpenses(false);
  };

  const updateExpense = async (updatedExpense: Expense) => {
    if (!session || (!isAdmin && !isSuperAdmin)) {
      toast.error("Apenas administradores ou super administradores podem atualizar despesas.");
      throw new Error("Acesso não autorizado.");
    }
    if (!currentRestaurant?.id || updatedExpense.restaurant_id !== currentRestaurant.id) {
      toast.error("Acesso não autorizado ou restaurante incorreto para atualizar despesa.");
      throw new Error("Unauthorized access or invalid restaurant ID.");
    }

    setIsLoadingExpenses(true);
    const { error } = await supabase
      .from('expenses')
      .update({
        type: updatedExpense.type,
        description: updatedExpense.description,
        amount: updatedExpense.amount,
        date: updatedExpense.date,
        status: updatedExpense.status,
        related_entity: updatedExpense.related_entity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatedExpense.id)
      .eq('restaurant_id', currentRestaurant.id);

    if (error) {
      console.error("Erro ao atualizar despesa:", error);
      toast.error("Erro ao atualizar despesa: " + error.message);
      setIsLoadingExpenses(false);
      throw error;
    }

    setExpenses(prev =>
      prev.map(exp => (exp.id === updatedExpense.id ? updatedExpense : exp))
    );
    toast.success("Despesa atualizada com sucesso!");
    setIsLoadingExpenses(false);
  };

  const deleteExpense = async (expenseId: string) => {
    if (!session || (!isAdmin && !isSuperAdmin)) {
      toast.error("Apenas administradores ou super administradores podem excluir despesas.");
      throw new Error("Acesso não autorizado.");
    }
    if (!currentRestaurant?.id) {
      toast.error("Nenhum restaurante selecionado para excluir despesa.");
      throw new Error("Restaurant ID not available.");
    }

    setIsLoadingExpenses(true);
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('restaurant_id', currentRestaurant.id);

    if (error) {
      console.error("Erro ao excluir despesa:", error);
      toast.error("Erro ao excluir despesa: " + error.message);
      setIsLoadingExpenses(false);
      throw error;
    }

    setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
    toast.success(`Despesa ${expenseId} foi excluída.`);
    setIsLoadingExpenses(false);
  };

  const contextValue = useMemo(
    () => ({
      expenses,
      isLoadingExpenses,
      addExpense,
      updateExpense,
      deleteExpense,
      fetchExpenses,
    }),
    [expenses, isLoadingExpenses, addExpense, updateExpense, deleteExpense, fetchExpenses, currentRestaurant, isAdmin, isSuperAdmin]
  );

  return <ExpenseContext.Provider value={contextValue}>{children}</ExpenseContext.Provider>;
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};
