import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from './SessionContext.tsx';
import { useRestaurant } from './RestaurantContext'; // Importar useRestaurant
import { toast } from 'sonner';

export interface PaymentMethod {
  id: string;
  profile_id: string;
  type: string;
  brand: string;
  last_four: string;
  expiry: string;
  is_default: boolean;
  restaurant_id?: string; // Adicionado restaurant_id
  created_at?: string;
  updated_at?: string;
}

interface PaymentMethodContextType {
  paymentMethods: PaymentMethod[];
  isLoadingPaymentMethods: boolean;
  addPaymentMethod: (newMethod: Omit<PaymentMethod, 'id' | 'profile_id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updatePaymentMethod: (updatedMethod: PaymentMethod) => Promise<void>;
  deletePaymentMethod: (methodId: string) => Promise<void>;
  setDefaultPaymentMethod: (methodId: string) => Promise<void>;
}

const PaymentMethodContext = createContext<PaymentMethodContextType | undefined>(undefined);

export const PaymentMethodProvider = ({ children }: { children: ReactNode }) => {
  const { profile, isLoading: isLoadingSession, session, isCustomer, isAdmin } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant(); // Obter currentRestaurant
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true);

  const fetchPaymentMethods = useCallback(async (currentProfileId: string, currentRestaurantId: string) => {
    setIsLoadingPaymentMethods(true);
    console.log("PaymentMethodContext: Starting fetchPaymentMethods for profile:", currentProfileId, "and restaurant:", currentRestaurantId);
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('profile_id', currentProfileId)
      .eq('restaurant_id', currentRestaurantId) // Filtrar por restaurant_id
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error("PaymentMethodContext: Erro ao carregar métodos de pagamento:", error);
      toast.error("Erro ao carregar métodos de pagamento.");
      setPaymentMethods([]);
    } else {
      console.log("PaymentMethodContext: Métodos de pagamento carregados com sucesso.");
      setPaymentMethods(data as PaymentMethod[]);
    }
    setIsLoadingPaymentMethods(false);
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    const runFetch = async () => {
      if (isLoadingSession || isLoadingRestaurants) {
        if (!cancelled) {
          setPaymentMethods([]);
          setIsLoadingPaymentMethods(true);
        }
        return;
      }

      if (session && profile?.id) {
        const targetRestaurantId = isAdmin ? currentRestaurant?.id : profile.restaurant_id;
        if (targetRestaurantId) {
          await fetchPaymentMethods(profile.id, targetRestaurantId);
        } else {
          if (!cancelled) {
            setPaymentMethods([]);
            setIsLoadingPaymentMethods(false);
          }
          console.log("PaymentMethodContext: No restaurant ID available for profile, clearing payment methods.");
        }
      } else {
        if (!cancelled) {
          setPaymentMethods([]);
          setIsLoadingPaymentMethods(false);
        }
        console.log("PaymentMethodContext: Session finished loading, no user logged in, clearing payment methods.");
      }
    };

    runFetch();

    return () => {
      cancelled = true;
    };
  }, [isLoadingSession, isLoadingRestaurants, session, profile?.id, profile?.restaurant_id, isAdmin, currentRestaurant?.id, fetchPaymentMethods]);

  const addPaymentMethod = async (newMethodData: Omit<PaymentMethod, 'id' | 'profile_id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => {
    if (!profile?.id) {
      toast.error("Você precisa estar logado para adicionar um método de pagamento.");
      throw new Error("Usuário não autenticado.");
    }
    if (!profile?.restaurant_id) {
      toast.error("Seu perfil não está associado a um restaurante.");
      throw new Error("Restaurant ID not available for profile.");
    }

    setIsLoadingPaymentMethods(true);
    if (newMethodData.is_default) {
      await supabase
        .from('payment_methods')
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq('profile_id', profile.id)
        .eq('restaurant_id', profile.restaurant_id); // Filtrar por restaurant_id
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .insert({
        ...newMethodData,
        profile_id: profile.id,
        restaurant_id: profile.restaurant_id, // Adicionar restaurant_id
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar método de pagamento:", error);
      toast.error("Erro ao adicionar método de pagamento.");
      setIsLoadingPaymentMethods(false);
      throw error;
    }

    setPaymentMethods(prev => {
      const updated = prev.map(pm => ({ ...pm, is_default: false }));
      return [data as PaymentMethod, ...updated].sort((a, b) => (b.is_default ? 1 : -1));
    });
    toast.success("Método de pagamento adicionado com sucesso!");
    setIsLoadingPaymentMethods(false);
  };

  const updatePaymentMethod = async (updatedMethod: PaymentMethod) => {
    if (!profile?.id) {
      toast.error("Você precisa estar logado para atualizar um método de pagamento.");
      throw new Error("Usuário não autenticado.");
    }
    if (!updatedMethod.restaurant_id || updatedMethod.restaurant_id !== profile.restaurant_id) {
      toast.error("Acesso não autorizado para atualizar este método de pagamento.");
      throw new Error("Unauthorized access or invalid restaurant ID.");
    }

    setIsLoadingPaymentMethods(true);
    const { error } = await supabase
      .from('payment_methods')
      .update({
        type: updatedMethod.type,
        brand: updatedMethod.brand,
        last_four: updatedMethod.last_four,
        expiry: updatedMethod.expiry,
        is_default: updatedMethod.is_default,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatedMethod.id)
      .eq('profile_id', profile.id)
      .eq('restaurant_id', profile.restaurant_id); // Filtrar por restaurant_id

    if (error) {
      console.error("Erro ao atualizar método de pagamento:", error);
      toast.error("Erro ao atualizar método de pagamento.");
      setIsLoadingPaymentMethods(false);
      throw error;
    }

    setPaymentMethods(prev =>
      prev.map(pm => (pm.id === updatedMethod.id ? updatedMethod : pm))
    );
    toast.success("Método de pagamento atualizado com sucesso!");
    setIsLoadingPaymentMethods(false);
  };

  const deletePaymentMethod = async (methodId: string) => {
    if (!profile?.id) {
      toast.error("Você precisa estar logado para excluir um método de pagamento.");
      return;
    }
    if (!profile?.restaurant_id) {
      toast.error("Seu perfil não está associado a um restaurante.");
      throw new Error("Restaurant ID not available for profile.");
    }

    setIsLoadingPaymentMethods(true);
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', methodId)
      .eq('profile_id', profile.id)
      .eq('restaurant_id', profile.restaurant_id); // Filtrar por restaurant_id

    if (error) {
      console.error("Erro ao excluir método de pagamento:", error);
      toast.error("Erro ao excluir método de pagamento.");
      setIsLoadingPaymentMethods(false);
      throw error;
    }

    setPaymentMethods(prev => {
      const updated = prev.filter(pm => pm.id !== methodId);
      if (prev.find(pm => pm.id === methodId)?.is_default && updated.length > 0) {
        updated[0] = { ...updated[0], is_default: true, updated_at: new Date().toISOString() };
        supabase
          .from('payment_methods')
          .update({ is_default: true, updated_at: new Date().toISOString() })
          .eq('id', updated[0].id)
          .eq('profile_id', profile.id)
          .eq('restaurant_id', profile.restaurant_id) // Filtrar por restaurant_id
          .then(({ error: updateError }) => {
            if (updateError) console.error("Erro ao definir novo padrão após exclusão:", updateError);
          });
      }
      return updated;
    });
    toast.success("Método de pagamento excluído.");
    setIsLoadingPaymentMethods(false);
  };

  const setDefaultPaymentMethod = async (methodId: string) => {
    if (!profile?.id) {
      toast.error("Você precisa estar logado para definir um método de pagamento padrão.");
      return;
    }
    if (!profile?.restaurant_id) {
      toast.error("Seu perfil não está associado a um restaurante.");
      throw new Error("Restaurant ID not available for profile.");
    }

    setIsLoadingPaymentMethods(true);
    await supabase
      .from('payment_methods')
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq('profile_id', profile.id)
      .eq('restaurant_id', profile.restaurant_id) // Filtrar por restaurant_id
      .eq('is_default', true);

    const { error } = await supabase
      .from('payment_methods')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', methodId)
      .eq('profile_id', profile.id)
      .eq('restaurant_id', profile.restaurant_id); // Filtrar por restaurant_id

    if (error) {
      console.error("Erro ao definir método de pagamento padrão:", error);
      toast.error("Erro ao definir método de pagamento padrão.");
      setIsLoadingPaymentMethods(false);
      throw error;
    }

    setPaymentMethods(prev =>
      prev.map(pm => ({
        ...pm,
        is_default: pm.id === methodId,
        updated_at: pm.id === methodId ? new Date().toISOString() : pm.updated_at,
      })).sort((a, b) => (b.is_default ? 1 : -1))
    );
    toast.success("Método de pagamento padrão atualizado!");
    setIsLoadingPaymentMethods(false);
  };

  const contextValue = useMemo(
    () => ({
      paymentMethods,
      isLoadingPaymentMethods,
      addPaymentMethod,
      updatePaymentMethod,
      deletePaymentMethod,
      setDefaultPaymentMethod,
    }),
    [paymentMethods, isLoadingPaymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod, setDefaultPaymentMethod, profile]
  );

  return <PaymentMethodContext.Provider value={contextValue}>{children}</PaymentMethodContext.Provider>;
};

export const usePaymentMethods = () => {
  const context = useContext(PaymentMethodContext);
  if (context === undefined) {
    throw new Error('usePaymentMethods must be used within an PaymentMethodProvider');
  }
  return context;
};
