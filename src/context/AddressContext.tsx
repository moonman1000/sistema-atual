import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from './SessionContext.tsx';
import { useRestaurant } from './RestaurantContext'; // Importar useRestaurant
import { toast } from 'sonner';

export interface Address {
  id: string;
  profile_id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  is_default: boolean;
  restaurant_id?: string; // Adicionado restaurant_id
  created_at?: string;
  updated_at?: string;
}

interface AddressContextType {
  addresses: Address[];
  isLoadingAddresses: boolean;
  addAddress: (newAddress: Omit<Address, 'id' | 'profile_id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateAddress: (updatedAddress: Address) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const AddressProvider = ({ children }: { children: ReactNode }) => {
  const { profile, isLoading: isLoadingSession, session, isCustomer, isAdmin } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant(); // Obter currentRestaurant
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  const fetchAddresses = useCallback(async (currentProfileId: string, currentRestaurantId: string) => {
    setIsLoadingAddresses(true);
    console.log("AddressContext: Starting fetchAddresses for profile:", currentProfileId, "and restaurant:", currentRestaurantId);
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('profile_id', currentProfileId)
      .eq('restaurant_id', currentRestaurantId) // Filtrar por restaurant_id
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error("AddressContext: Erro ao carregar endereços:", error);
      toast.error("Erro ao carregar endereços.");
      setAddresses([]);
    } else {
      console.log("AddressContext: Endereços carregados com sucesso.");
      setAddresses(data as Address[]);
    }
    setIsLoadingAddresses(false);
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    const runFetch = async () => {
      if (isLoadingSession || isLoadingRestaurants) {
        if (!cancelled) {
          setAddresses([]);
          setIsLoadingAddresses(true);
        }
        return;
      }

      if (session && profile?.id) {
        const targetRestaurantId = isAdmin ? currentRestaurant?.id : profile.restaurant_id;
        if (targetRestaurantId) {
          await fetchAddresses(profile.id, targetRestaurantId);
        } else {
          if (!cancelled) {
            setAddresses([]);
            setIsLoadingAddresses(false);
          }
          console.log("AddressContext: No restaurant ID available for profile, clearing addresses.");
        }
      } else {
        if (!cancelled) {
          setAddresses([]);
          setIsLoadingAddresses(false);
        }
        console.log("AddressContext: Session finished loading, no user logged in, clearing addresses.");
      }
    };

    runFetch();

    return () => {
      cancelled = true;
    };
  }, [isLoadingSession, isLoadingRestaurants, session, profile?.id, profile?.restaurant_id, isAdmin, currentRestaurant?.id, fetchAddresses]);

  const addAddress = async (newAddressData: Omit<Address, 'id' | 'profile_id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => {
    if (!profile?.id) {
      toast.error("Você precisa estar logado para adicionar um endereço.");
      throw new Error("Usuário não autenticado.");
    }
    if (!profile?.restaurant_id) {
      toast.error("Seu perfil não está associado a um restaurante.");
      throw new Error("Restaurant ID not available for profile.");
    }

    setIsLoadingAddresses(true);
    if (newAddressData.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq('profile_id', profile.id)
        .eq('restaurant_id', profile.restaurant_id); // Filtrar por restaurant_id
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        ...newAddressData,
        profile_id: profile.id,
        restaurant_id: profile.restaurant_id, // Adicionar restaurant_id
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar endereço:", error);
      toast.error("Erro ao adicionar endereço.");
      setIsLoadingAddresses(false);
      throw error;
    }

    setAddresses(prev => {
      const updated = prev.map(addr => ({ ...addr, is_default: false }));
      return [data as Address, ...updated].sort((a, b) => (b.is_default ? 1 : -1));
    });
    toast.success("Endereço adicionado com sucesso!");
    setIsLoadingAddresses(false);
  };

  const updateAddress = async (updatedAddress: Address) => {
    if (!profile?.id) {
      toast.error("Você precisa estar logado para atualizar um endereço.");
      throw new Error("Usuário não autenticado.");
    }
    if (!updatedAddress.restaurant_id || updatedAddress.restaurant_id !== profile.restaurant_id) {
      toast.error("Acesso não autorizado para atualizar este endereço.");
      throw new Error("Unauthorized access or invalid restaurant ID.");
    }

    setIsLoadingAddresses(true);
    const { error } = await supabase
      .from('addresses')
      .update({
        street: updatedAddress.street,
        number: updatedAddress.number,
        complement: updatedAddress.complement,
        neighborhood: updatedAddress.neighborhood,
        city: updatedAddress.city,
        state: updatedAddress.state,
        zip_code: updatedAddress.zip_code,
        is_default: updatedAddress.is_default,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatedAddress.id)
      .eq('profile_id', profile.id)
      .eq('restaurant_id', profile.restaurant_id); // Filtrar por restaurant_id

    if (error) {
      console.error("Erro ao atualizar endereço:", error);
      toast.error("Erro ao atualizar endereço.");
      setIsLoadingAddresses(false);
      throw error;
    }

    setAddresses(prev =>
      prev.map(addr => (addr.id === updatedAddress.id ? updatedAddress : addr))
    );
    toast.success("Endereço atualizado com sucesso!");
    setIsLoadingAddresses(false);
  };

  const deleteAddress = async (addressId: string) => {
    if (!profile?.id) {
      toast.error("Você precisa estar logado para excluir um endereço.");
      return;
    }
    if (!profile?.restaurant_id) {
      toast.error("Seu perfil não está associado a um restaurante.");
      throw new Error("Restaurant ID not available for profile.");
    }

    setIsLoadingAddresses(true);
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('profile_id', profile.id)
      .eq('restaurant_id', profile.restaurant_id); // Filtrar por restaurant_id

    if (error) {
      console.error("Erro ao excluir endereço:", error);
      toast.error("Erro ao excluir endereço.");
      setIsLoadingAddresses(false);
      throw error;
    }

    setAddresses(prev => {
      const updated = prev.filter(addr => addr.id !== addressId);
      if (prev.find(addr => addr.id === addressId)?.is_default && updated.length > 0) {
        updated[0] = { ...updated[0], is_default: true, updated_at: new Date().toISOString() };
        supabase
          .from('addresses')
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
    toast.success("Endereço excluído.");
    setIsLoadingAddresses(false);
  };

  const setDefaultAddress = async (addressId: string) => {
    if (!profile?.id) {
      toast.error("Você precisa estar logado para definir um endereço padrão.");
      return;
    }
    if (!profile?.restaurant_id) {
      toast.error("Seu perfil não está associado a um restaurante.");
      throw new Error("Restaurant ID not available for profile.");
    }

    setIsLoadingAddresses(true);
    await supabase
      .from('addresses')
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq('profile_id', profile.id)
      .eq('restaurant_id', profile.restaurant_id) // Filtrar por restaurant_id
      .eq('is_default', true);

    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', addressId)
      .eq('profile_id', profile.id)
      .eq('restaurant_id', profile.restaurant_id); // Filtrar por restaurant_id

    if (error) {
      console.error("Erro ao definir endereço padrão:", error);
      toast.error("Erro ao definir endereço padrão.");
      setIsLoadingAddresses(false);
      throw error;
    }

    setAddresses(prev =>
      prev.map(addr => ({
        ...addr,
        is_default: addr.id === addressId,
        updated_at: addr.id === addressId ? new Date().toISOString() : addr.updated_at,
      })).sort((a, b) => (b.is_default ? 1 : -1))
    );
    toast.success("Endereço padrão atualizado!");
    setIsLoadingAddresses(false);
  };

  const contextValue = useMemo(
    () => ({
      addresses,
      isLoadingAddresses,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,
    }),
    [addresses, isLoadingAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, profile]
  );

  return <AddressContext.Provider value={contextValue}>{children}</AddressContext.Provider>;
};

export const useAddresses = () => {
  const context = useContext(AddressContext);
  if (context === undefined) {
    throw new Error('useAddresses must be used within an AddressProvider');
  }
  return context;
};
