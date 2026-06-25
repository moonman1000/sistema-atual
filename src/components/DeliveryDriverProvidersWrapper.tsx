import React from 'react';
import { Outlet } from 'react-router-dom';
import { DeliveryProvider } from "@/context/DeliveryContext";
import { OrderProvider } from "@/context/OrderContext";
import { EmployeeProvider } from "@/context/EmployeeContext";

const DeliveryDriverProvidersWrapper: React.FC = () => {
  return (
    <EmployeeProvider>
      <OrderProvider>
        <DeliveryProvider>
          <Outlet />
        </DeliveryProvider>
      </OrderProvider>
    </EmployeeProvider>
  );
};

export default DeliveryDriverProvidersWrapper;