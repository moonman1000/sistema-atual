import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from './SessionContext.tsx';
import { useRestaurant } from './RestaurantContext';
import { toast } from 'sonner';

export interface Supplier {
  id: string;
  restaurant_id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  business_type?: string; // NOVO: Adicionado tipo de negócio
  created_at?: string;
  updated_at?: string;
}

interface SupplierContextType {
  suppliers: Supplier[];
  isLoadingSuppliers: boolean;
  addSupplier: (newSupplier: Omit<Supplier, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateSupplier: (updatedSupplier: Supplier) => Promise<void>;
  deleteSupplier: (supplierId: string) => Promise<void>;
  fetchSuppliers: () => Promise<void>;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

export const SupplierProvider = ({ children }: { children: ReactNode }) => {
  const { session, isAdmin, isSuperAdmin, isLoading: isLoadingSession } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);

  const fetchSuppliers = useCallback(async () => {
    setIsLoadingSuppliers(true);
    console.log("SupplierContext: Starting fetchSuppliers...");

    if (!session || (!isAdmin && !isSuperAdmin) || !currentRestaurant?.id) {
      setSuppliers([]);
      setIsLoadingSuppliers(false);
      console.log("SupplierContext: Not authorized or no restaurant selected, clearing suppliers.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .order('name', { ascending: true });

      if (error) {
        console.error("SupplierContext: Erro ao carregar fornecedores:", error);
        toast.error("Erro ao carregar fornecedores.");
        setSuppliers([]);
      } else {
        console.log("SupplierContext: Fornecedores carregados com sucesso.");
        setSuppliers(data as Supplier[]);
      }
    } catch (unexpectedError) {
      console.error("SupplierContext: Erro inesperado durante fetchSuppliers:", unexpectedError);
      toast.error("Erro inesperado ao carregar fornecedores.");
      setSuppliers([]);
    } finally {
      setIsLoadingSuppliers(false);
      console.log("SupplierContext: fetchSuppliers finished. Final isLoadingSuppliers:", false);
    }
  }, [session, isAdmin, isSuperAdmin, currentRestaurant?.id]);

  useEffect(() => {
    let cancelled = false;
    const runFetch = async () => {
      if (isLoadingSession || isLoadingRestaurants) {
        if (!cancelled) {
          setSuppliers([]);
          setIsLoadingSuppliers(true);
        }
        return;
      }

      if (session && (isAdmin || isSuperAdmin) && currentRestaurant?.id) {
        await fetchSuppliers();
      } else {
        if (!cancelled) {
          setSuppliers([]);
          setIsLoadingSuppliers(false);
        }
      }
    };

    runFetch();

    return () => {
      cancelled = true;
    };
  }, [isLoadingSession, isLoadingRestaurants, session, isAdmin, isSuperAdmin, currentRestaurant?.id, fetchSuppliers]);

  const addSupplier = async (newSupplierData: Omit<Supplier, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => {
    if (!session || (!isAdmin && !isSuperAdmin)) {
      toast.error("Apenas administradores ou super administradores podem adicionar fornecedores.");
      throw new Error("Acesso não autorizado.");
    }
    if (!currentRestaurant?.id) {
      toast.error("Nenhum restaurante selecionado para adicionar fornecedor.");
      throw new Error("Restaurant ID not available.");
    }

    setIsLoadingSuppliers(true);
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        ...newSupplierData,
        restaurant_id: currentRestaurant.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar fornecedor:", error);
      toast.error("Erro ao adicionar fornecedor: " + error.message);
      setIsLoadingSuppliers(false);
      throw error;
    }

    setSuppliers(prev => [...prev, data as Supplier]);
    toast.success("Fornecedor adicionado com sucesso!");
    setIsLoadingSuppliers(false);
  };

  const updateSupplier = async (updatedSupplier: Supplier) => {
    if (!session || (!isAdmin && !isSuperAdmin)) {
      toast.error("Apenas administradores ou super administradores podem atualizar fornecedores.");
      throw new Error("Acesso não autorizado.");
    }
    if (!currentRestaurant?.id || updatedSupplier.restaurant_id !== currentRestaurant.id) {
      toast.error("Acesso não autorizado ou restaurante incorreto para atualizar fornecedor.");
      throw new Error("Unauthorized access or invalid restaurant ID.");
    }

    setIsLoadingSuppliers(true);
    const { error } = await supabase
      .from('suppliers')
      .update({
        name: updatedSupplier.name,
        contact_person: updatedSupplier.contact_person,
        phone: updatedSupplier.phone,
        email: updatedSupplier.email,
        address: updatedSupplier.address,
        business_type: updatedSupplier.business_type, // NOVO: Incluir business_type
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatedSupplier.id)
      .eq('restaurant_id', currentRestaurant.id);

    if (error) {
      console.error("Erro ao atualizar fornecedor:", error);
      toast.error("Erro ao atualizar fornecedor: " + error.message);
      setIsLoadingSuppliers(false);
      throw error;
    }

    setSuppliers(prev =>
      prev.map(sup => (sup.id === updatedSupplier.id ? updatedSupplier : sup))
    );
    toast.success("Fornecedor atualizado com sucesso!");
    setIsLoadingSuppliers(false);
  };

  const deleteSupplier = async (supplierId: string) => {
    if (!session || (!isAdmin && !isSuperAdmin)) {
      toast.error("Apenas administradores ou super administradores podem excluir fornecedores.");
      throw new Error("Acesso não autorizado.");
    }
    if (!currentRestaurant?.id) {
      toast.error("Nenhum restaurante selecionado para excluir fornecedor.");
      throw new Error("Restaurant ID not available.");
    }

    setIsLoadingSuppliers(true);
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', supplierId)
      .eq('restaurant_id', currentRestaurant.id);

    if (error) {
      console.error("Erro ao excluir fornecedor:", error);
      toast.error("Erro ao excluir fornecedor: " + error.message);
      setIsLoadingSuppliers(false);
      throw error;
    }

    setSuppliers(prev => prev.filter(sup => sup.id !== supplierId));
    toast.success(`Fornecedor ${supplierId} foi excluído.`);
    setIsLoadingSuppliers(false);
  };

  const contextValue = useMemo(
    () => ({
      suppliers,
      isLoadingSuppliers,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      fetchSuppliers,
    }),
    [suppliers, isLoadingSuppliers, addSupplier, updateSupplier, deleteSupplier, fetchSuppliers, currentRestaurant, isAdmin, isSuperAdmin]
  );

  return <SupplierContext.Provider value={contextValue}>{children}</SupplierContext.Provider>;
};

export const useSuppliers = () => {
  const context = useContext(SupplierContext);
  if (context === undefined) {
    throw new Error('useSuppliers must be used within a SupplierProvider');
  }
  return context;
};
