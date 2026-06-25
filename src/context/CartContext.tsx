import React, { createContext, useState, useContext, useMemo, ReactNode, useEffect } from 'react';
import { MenuItem } from '@/context/MenuContext';
import { toast } from 'sonner'; // Importar toast para feedback

interface CartItem {
  product: MenuItem;
  quantity: number;
  selectedSizeValue: string;
  selectedToppingValues: string[];
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: MenuItem, selectedSizeValue: string, selectedToppingValues: string[], quantity: number) => void;
  updateQuantity: (productId: string, selectedSizeValue: string, selectedToppingValues: string[], newQuantity: number) => void;
  removeFromCart: (productId: string, selectedSizeValue: string, selectedToppingValues: string[]) => void;
  updateCartItemDetails: (
    originalProductId: string,
    originalSizeValue: string,
    originalToppingValues: string[],
    newProduct: MenuItem,
    newSelectedSizeValue: string,
    newSelectedToppingValues: string[],
    newQuantity: number
  ) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;
  currentCartRestaurantId: string | null; // NOVO: ID do restaurante do carrinho
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'pizza_palace_cart';
const LOCAL_STORAGE_RESTAURANT_ID_KEY = 'pizza_palace_cart_restaurant_id'; // NOVO: Chave para o ID do restaurante

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    // Load cart from local storage on initial render
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem(LOCAL_STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });

  const [currentCartRestaurantId, setCurrentCartRestaurantId] = useState<string | null>(() => {
    // Load restaurant ID from local storage on initial render
    if (typeof window !== 'undefined') {
      const savedRestaurantId = localStorage.getItem(LOCAL_STORAGE_RESTAURANT_ID_KEY);
      return savedRestaurantId || null;
    }
    return null;
  });

  // Save cart to local storage whenever cartItems changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cartItems));
      // If cart becomes empty, clear the restaurant ID
      if (cartItems.length === 0) {
        localStorage.removeItem(LOCAL_STORAGE_RESTAURANT_ID_KEY);
        setCurrentCartRestaurantId(null);
      }
    }
  }, [cartItems]);

  // Save restaurant ID to local storage whenever currentCartRestaurantId changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentCartRestaurantId) {
        localStorage.setItem(LOCAL_STORAGE_RESTAURANT_ID_KEY, currentCartRestaurantId);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_RESTAURANT_ID_KEY);
      }
    }
  }, [currentCartRestaurantId]);


  const findCartItemIndex = (
    productId: string,
    selectedSizeValue: string,
    selectedToppingValues: string[]
  ) => {
    return cartItems.findIndex(
      item =>
        item.product.id === productId &&
        item.selectedSizeValue === selectedSizeValue &&
        JSON.stringify((item.selectedToppingValues || []).sort()) === JSON.stringify((selectedToppingValues || []).sort())
    );
  };

  const addToCart = (
    product: MenuItem,
    selectedSizeValue: string,
    selectedToppingValues: string[],
    quantity: number
  ) => {
    // NOVO: Verificar se o item pertence ao mesmo restaurante do carrinho
    if (currentCartRestaurantId && product.restaurant_id !== currentCartRestaurantId) {
      toast.error(
        `Seu carrinho já contém itens de outro estabelecimento. Por favor, finalize o pedido atual ou limpe o carrinho para adicionar itens de ${product.name}.`,
        {
          action: {
            label: "Limpar Carrinho",
            onClick: () => clearCart(),
          },
          duration: 8000,
        }
      );
      return;
    }

    setCartItems(prevItems => {
      // Se o carrinho estava vazio, defina o ID do restaurante
      if (prevItems.length === 0) {
        setCurrentCartRestaurantId(product.restaurant_id);
      }

      const existingItemIndex = findCartItemIndex(product.id, selectedSizeValue, selectedToppingValues);

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        toast.success(`${quantity}x ${product.name} adicionado(s) ao carrinho!`);
        return updatedItems;
      } else {
        toast.success(`${quantity}x ${product.name} adicionado(s) ao carrinho!`);
        return [
          ...prevItems,
          { product, quantity, selectedSizeValue, selectedToppingValues },
        ];
      }
    });
  };

  const updateQuantity = (
    productId: string,
    selectedSizeValue: string,
    selectedToppingValues: string[],
    newQuantity: number
  ) => {
    setCartItems(prevItems => {
      if (newQuantity <= 0) {
        toast.info(`Item removido do carrinho.`);
        const updatedItems = prevItems.filter(
          item =>
            !(item.product.id === productId &&
              item.selectedSizeValue === selectedSizeValue &&
              JSON.stringify((item.selectedToppingValues || []).sort()) === JSON.stringify((selectedToppingValues || []).sort()))
        );
        // Se o carrinho ficar vazio, limpe o ID do restaurante
        if (updatedItems.length === 0) {
          setCurrentCartRestaurantId(null);
        }
        return updatedItems;
      }
      toast.info(`Quantidade atualizada para ${newQuantity}.`);
      return prevItems.map(item =>
        item.product.id === productId &&
        item.selectedSizeValue === selectedSizeValue &&
        JSON.stringify((item.selectedToppingValues || []).sort()) === JSON.stringify((selectedToppingValues || []).sort())
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
  };

  const removeFromCart = (
    productId: string,
    selectedSizeValue: string,
    selectedToppingValues: string[]
  ) => {
    setCartItems(prevItems => {
      toast.info(`Item removido do carrinho.`);
      const updatedItems = prevItems.filter(
        item =>
          !(item.product.id === productId &&
            item.selectedSizeValue === selectedSizeValue &&
            JSON.stringify((item.selectedToppingValues || []).sort()) === JSON.stringify((selectedToppingValues || []).sort()))
      );
      // Se o carrinho ficar vazio, limpe o ID do restaurante
      if (updatedItems.length === 0) {
        setCurrentCartRestaurantId(null);
      }
      return updatedItems;
    });
  };

  const updateCartItemDetails = (
    originalProductId: string,
    originalSizeValue: string,
    originalToppingValues: string[],
    newProduct: MenuItem,
    newSelectedSizeValue: string,
    newSelectedToppingValues: string[],
    newQuantity: number
  ) => {
    // NOVO: Verificar se o novo produto pertence ao mesmo restaurante do carrinho
    if (currentCartRestaurantId && newProduct.restaurant_id !== currentCartRestaurantId) {
      toast.error(
        `O item atual pertence a outro estabelecimento. Por favor, finalize o pedido atual ou limpe o carrinho para adicionar itens de ${newProduct.name}.`,
        {
          action: {
            label: "Limpar Carrinho",
            onClick: () => clearCart(),
          },
          duration: 8000,
        }
      );
      return;
    }

    setCartItems(prevItems => {
      // 1. Remover o item original
      const filteredItems = prevItems.filter(
        item =>
          !(item.product.id === originalProductId &&
            item.selectedSizeValue === originalSizeValue &&
            JSON.stringify((item.selectedToppingValues || []).sort()) === JSON.stringify((originalToppingValues || []).sort()))
      );

      // 2. Verificar se o novo item já existe (com as novas configurações)
      const existingNewItemIndex = filteredItems.findIndex(
        item =>
          item.product.id === newProduct.id &&
          item.selectedSizeValue === newSelectedSizeValue &&
          JSON.stringify((item.selectedToppingValues || []).sort()) === JSON.stringify((newSelectedToppingValues || []).sort())
      );

      if (existingNewItemIndex > -1) {
        // Se o novo item já existe, apenas atualiza a quantidade
        const updatedItems = [...filteredItems];
        updatedItems[existingNewItemIndex].quantity += newQuantity;
        toast.success(`Item atualizado no carrinho!`);
        return updatedItems;
      } else {
        // Caso contrário, adiciona o novo item
        toast.success(`Item atualizado no carrinho!`);
        return [
          ...filteredItems,
          { product: newProduct, quantity: newQuantity, selectedSizeValue: newSelectedSizeValue, selectedToppingValues: newSelectedToppingValues },
        ];
      }
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setCurrentCartRestaurantId(null); // NOVO: Limpar o ID do restaurante
    toast.info("Carrinho limpo.");
  };

  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      let itemPrice = item.product.base_price;
      const size = item.product.sizes.find(s => s.value === item.selectedSizeValue);
      if (size) {
        itemPrice += size.price_modifier;
      }
      item.selectedToppingValues.forEach(toppingValue => {
        const topping = item.product.toppings.find(t => t.value === toppingValue);
        if (topping) {
          itemPrice += topping.price;
        }
      });
      return total + itemPrice * item.quantity;
    }, 0);
  }, [cartItems]);

  const cartItemCount = useMemo(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  const contextValue = useMemo(
    () => ({
      cartItems,
      addToCart,
      updateQuantity,
      removeFromCart,
      updateCartItemDetails,
      clearCart,
      cartTotal,
      cartItemCount,
      currentCartRestaurantId, // NOVO: Expor o ID do restaurante do carrinho
    }),
    [cartItems, addToCart, updateQuantity, removeFromCart, updateCartItemDetails, clearCart, cartTotal, cartItemCount, currentCartRestaurantId]
  );

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};