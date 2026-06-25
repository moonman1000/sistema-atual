import React from 'react';
import { Outlet } from 'react-router-dom';
import { PromotionsProvider } from "@/context/PromotionsContext";
import { OrderProvider } from "@/context/OrderContext";
import { CartProvider } from "@/context/CartContext";
import { DeliveryProvider } from "@/context/DeliveryContext";
import { PaymentMethodProvider } from "@/context/PaymentMethodContext";
import { AddressProvider } from "@/context/AddressContext";
import { MenuProvider } from "@/context/MenuContext";
import { CategoryProvider } from "@/context/CategoryContext";
import SalesLayout from './SalesLayout';

const SalesProvidersWrapper: React.FC = () => {
  return (
    <PromotionsProvider>
      <OrderProvider>
        <CartProvider>
          <DeliveryProvider>
            <PaymentMethodProvider>
              <AddressProvider>
                <CategoryProvider>
                  <MenuProvider>
                    <SalesLayout />
                  </MenuProvider>
                </CategoryProvider>
              </AddressProvider>
            </PaymentMethodProvider>
          </DeliveryProvider>
        </CartProvider>
      </OrderProvider>
    </PromotionsProvider>
  );
};

export default SalesProvidersWrapper;