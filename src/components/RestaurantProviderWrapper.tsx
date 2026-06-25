import React from 'react';
import { useSession } from '@/context/SessionContext';
import { RestaurantProvider } from '@/context/RestaurantContext';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '@/context/SessionContext'; // Importar Profile

interface RestaurantProviderWrapperProps {
  children: React.ReactNode;
}

const RestaurantProviderWrapper: React.FC<RestaurantProviderWrapperProps> = ({ children }) => {
  const sessionContext = useSession(); // Safely use useSession here

  return (
    <RestaurantProvider
      session={sessionContext.session}
      user={sessionContext.user}
      profile={sessionContext.profile}
      isLoadingSession={sessionContext.isLoading}
      isAdmin={sessionContext.isAdmin}
      isCustomer={sessionContext.isCustomer}
      isSuperAdmin={sessionContext.isSuperAdmin}
      softRevalidateSession={sessionContext.softRevalidateSession}
    >
      {children}
    </RestaurantProvider>
  );
};

export default RestaurantProviderWrapper;