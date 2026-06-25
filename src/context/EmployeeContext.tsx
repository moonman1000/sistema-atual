import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from './SessionContext.tsx';
import { useRestaurant } from './RestaurantContext';
import { toast } from 'sonner';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "Gerente" | "Cozinheiro" | "Entregador" | "Atendente";
  status: "Ativo" | "Inativo" | "Férias";
  hire_date: string;
  salary: number;
  avatar_url?: string;
  restaurant_id: string;
  created_at?: string;
  updated_at?: string;
}

interface DeliverymanObj {
  id: string;
  name: string;
}

interface EmployeeContextType {
  employees: Employee[];
  isLoadingEmployees: boolean;
  addEmployee: (newEmployee: Omit<Employee, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>, optionalId?: string) => Promise<Employee>;
  updateEmployee: (updatedEmployee: Employee) => Promise<void>;
  deleteEmployee: (employeeId: string) => Promise<void>;
  fetchEmployees: () => Promise<void>;
  availableDeliverymenNames: string[];
  availableDeliverymen: DeliverymanObj[]; // novo: lista com ids
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const { session, isAdmin, isSuperAdmin, isLoading: isLoadingSession } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

  const fetchEmployees = useCallback(async () => {
    setIsLoadingEmployees(true);
    if (!session || (!isAdmin && !isSuperAdmin) || !currentRestaurant?.id) {
      setEmployees([]);
      setIsLoadingEmployees(false);
      return;
    }

    try {
      // selecione explicitamente colunas se preferir
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, email, phone, role, status, hire_date, salary, avatar_url, restaurant_id, created_at, updated_at')
        .eq('restaurant_id', currentRestaurant.id)
        .order('name', { ascending: true });

      if (error) {
        console.error("EmployeeContext: Erro ao carregar funcionários:", error);
        toast.error("Erro ao carregar funcionários.");
        setEmployees([]);
      } else {
        setEmployees(data as Employee[]);
      }
    } catch (unexpectedError) {
      console.error("EmployeeContext: Erro inesperado durante fetchEmployees:", unexpectedError);
      toast.error("Erro inesperado ao carregar funcionários.");
      setEmployees([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  }, [session, isAdmin, isSuperAdmin, currentRestaurant?.id]);

  useEffect(() => {
    let cancelled = false;
    const runFetch = async () => {
      if (isLoadingSession || isLoadingRestaurants) {
        if (!cancelled) {
          setEmployees([]);
          setIsLoadingEmployees(true);
        }
        return;
      }

      if (session && (isAdmin || isSuperAdmin) && currentRestaurant?.id) {
        await fetchEmployees();
      } else {
        if (!cancelled) {
          setEmployees([]);
          setIsLoadingEmployees(false);
        }
      }
    };

    runFetch();
    return () => { cancelled = true; };
  }, [isLoadingSession, isLoadingRestaurants, session, isAdmin, isSuperAdmin, currentRestaurant?.id, fetchEmployees]);

  const addEmployee = useCallback(async (newEmployeeData: Omit<Employee, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>, optionalId?: string) => {
    if (!session || (!isAdmin && !isSuperAdmin)) {
      toast.error("Apenas administradores ou super administradores podem adicionar funcionários.");
      throw new Error("Acesso não autorizado.");
    }
    if (!currentRestaurant?.id) {
      toast.error("Nenhum restaurante selecionado para adicionar funcionário.");
      throw new Error("Restaurant ID not available.");
    }

    setIsLoadingEmployees(true);

    // Se você estiver executando esse insert do cliente, RLS deve permitir essa operação.
    // Para garantir que o 'id' seja o UID do Auth, crie o usuário via serviço (service_role) e insira com esse id no backend.
    const payload: any = {
      ...newEmployeeData,
      restaurant_id: currentRestaurant.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (optionalId) payload.id = optionalId;

    const { data, error } = await supabase
      .from('employees')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("EmployeeContext: Erro ao adicionar funcionário:", error);
      toast.error("Erro ao adicionar funcionário: " + error.message);
      setIsLoadingEmployees(false);
      throw error;
    }

    const inserted = data as Employee;
    setEmployees(prev => [...prev, inserted]);
    toast.success("Funcionário adicionado com sucesso!");
    setIsLoadingEmployees(false);
    return inserted;
  }, [session, isAdmin, isSuperAdmin, currentRestaurant?.id]);

  const updateEmployee = useCallback(async (updatedEmployee: Employee) => {
    if (!session || (!isAdmin && !isSuperAdmin)) {
      toast.error("Apenas administradores ou super administradores podem atualizar funcionários.");
      throw new Error("Acesso não autorizado.");
    }
    if (!currentRestaurant?.id || updatedEmployee.restaurant_id !== currentRestaurant.id) {
      toast.error("Acesso não autorizado ou restaurante incorreto para atualizar funcionário.");
      throw new Error("Unauthorized access or invalid restaurant ID.");
    }

    setIsLoadingEmployees(true);

    const { error } = await supabase
      .from('employees')
      .update({
        name: updatedEmployee.name,
        email: updatedEmployee.email,
        phone: updatedEmployee.phone,
        role: updatedEmployee.role,
        status: updatedEmployee.status,
        hire_date: updatedEmployee.hire_date,
        salary: updatedEmployee.salary,
        avatar_url: updatedEmployee.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatedEmployee.id)
      .eq('restaurant_id', currentRestaurant.id);

    if (error) {
      console.error("EmployeeContext: Erro ao atualizar funcionário:", error);
      toast.error("Erro ao atualizar funcionário: " + error.message);
      setIsLoadingEmployees(false);
      throw error;
    }

    setEmployees(prev => prev.map(emp => (emp.id === updatedEmployee.id ? updatedEmployee : emp)));
    toast.success("Funcionário atualizado com sucesso!");
    setIsLoadingEmployees(false);
  }, [session, isAdmin, isSuperAdmin, currentRestaurant?.id]);

  const deleteEmployee = useCallback(async (employeeId: string) => {
    if (!session || (!isAdmin && !isSuperAdmin)) {
      toast.error("Apenas administradores ou super administradores podem excluir funcionários.");
      throw new Error("Acesso não autorizado.");
    }
    if (!currentRestaurant?.id) {
      toast.error("Nenhum restaurante selecionado para excluir funcionário.");
      throw new Error("Restaurant ID not available.");
    }

    setIsLoadingEmployees(true);
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId)
      .eq('restaurant_id', currentRestaurant.id);

    if (error) {
      console.error("EmployeeContext: Erro ao excluir funcionário:", error);
      toast.error("Erro ao excluir funcionário: " + error.message);
      setIsLoadingEmployees(false);
      throw error;
    }

    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
    toast.success(`Funcionário ${employeeId} foi excluído.`);
    setIsLoadingEmployees(false);
  }, [session, isAdmin, isSuperAdmin, currentRestaurant?.id]);

  const availableDeliverymen = useMemo<DeliverymanObj[]>(() => {
    return employees.filter(emp => emp.role === "Entregador" && emp.status === "Ativo")
      .map(emp => ({ id: emp.id, name: emp.name }));
  }, [employees]);

  const availableDeliverymenNames = useMemo(() => {
    return ["Não Atribuído", ...availableDeliverymen.map(d => d.name)];
  }, [availableDeliverymen]);

  const contextValue = useMemo(() => ({
    employees,
    isLoadingEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    fetchEmployees,
    availableDeliverymenNames,
    availableDeliverymen,
  }), [employees, isLoadingEmployees, addEmployee, updateEmployee, deleteEmployee, fetchEmployees, availableDeliverymen, availableDeliverymenNames]);

  return <EmployeeContext.Provider value={contextValue}>{children}</EmployeeContext.Provider>;
};

export const useEmployees = () => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployees must be used within an EmployeeProvider');
  }
  return context;
};
