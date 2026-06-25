import React from 'react';
import { Outlet } from 'react-router-dom';
import { PromotionsProvider } from "@/context/PromotionsContext";
import { OrderProvider } from "@/context/OrderContext";
import { CartProvider } from "@/context/CartContext";
import { DeliveryProvider } from "@/context/DeliveryContext";
import { PaymentMethodProvider } from "@/context/PaymentMethodContext";
import { AddressProvider } from "@/context/AddressContext";
import { MenuProvider } from "@/context/MenuContext";
import { SupplierProvider } from "@/context/SupplierContext";
import { ExpenseProvider } from "@/context/ExpenseContext";
import { CategoryProvider } from "@/context/CategoryContext";
import Layout from './Layout';

const AdminProvidersAndLayoutWrapper: React.FC = () => {
  return (
    <PromotionsProvider>
      <OrderProvider>
        <CartProvider>
          <DeliveryProvider>
            <PaymentMethodProvider>
              <AddressProvider>
                <CategoryProvider>
                  <MenuProvider>
                    <SupplierProvider>
                      <ExpenseProvider>
                        <Layout>
                          <Outlet />
                        </Layout>
                      </ExpenseProvider>
                    </SupplierProvider>
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

export default AdminProvidersAndLayoutWrapper;
