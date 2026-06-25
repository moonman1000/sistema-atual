import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Truck, Plus, Minus, Trash2, Edit } from "lucide-react"; // Importar ícone Edit
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useCart, CartItem } from "@/context/CartContext"; // Importar CartItem
import { useOrders } from "@/context/OrderContext";
import { useSession } from "@/context/SessionContext";
import { usePromotions, Promotion } from "@/context/PromotionsContext";
import { useRestaurant } from '@/context/RestaurantContext'; // Importar useRestaurant
import MenuItemConfiguratorDialog from "@/components/sales/MenuItemConfiguratorDialogNew"; // Importar o diálogo
import { formatCurrency } from "@/lib/utils"; // Importar formatCurrency

const CheckoutPage = () => {
  const { cartItems, cartTotal, updateQuantity, removeFromCart, updateCartItemDetails, clearCart, currentCartRestaurantId } = useCart(); // Adicionar updateCartItemDetails e currentCartRestaurantId
  const { addOrder } = useOrders();
  const { session, profile, isLoading: isLoadingSession, isCustomer } = useSession(); // Obter isCustomer
  const { promotions, isLoadingPromotions } = usePromotions();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant(); // Obter currentRestaurant
  const navigate = useNavigate();

  const [fullName, setFullName] = React.useState(profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : "");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [zipCode, setZipCode] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState(profile?.phone || "");
  const [cardNumber, setCardNumber] = React.useState("");
  const [expiry, setExpiry] = React.useState("");
  const [cvv, setCvv] = React.useState("");
  const [isPlacingOrder, setIsPlacingOrder] = React.useState(false);

  const [appliedDiscountAmount, setAppliedDiscountAmount] = React.useState(0);
  const [appliedPromotionName, setAppliedPromotionName] = React.useState<string | null>(null);
  const [isFreeShippingApplied, setIsFreeShippingApplied] = React.useState(false);

  const [isConfiguratorOpen, setIsConfiguratorOpen] = React.useState(false);
  const [editingCartItem, setEditingCartItem] = React.useState<CartItem | null>(null);

  React.useEffect(() => {
    if (profile && !isLoadingSession) {
      setFullName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim());
      setPhoneNumber(profile.phone || '');
    }
  }, [profile, isLoadingSession]);

  React.useEffect(() => {
    if (isLoadingPromotions || cartItems.length === 0 || isLoadingSession || isLoadingRestaurants || !currentCartRestaurantId) { // Alterado currentRestaurant?.id para currentCartRestaurantId
      setAppliedDiscountAmount(0);
      setAppliedPromotionName(null);
      setIsFreeShippingApplied(false);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let subtotalAfterItemDiscounts = 0;
    let totalMonetaryDiscountApplied = 0;
    let finalPromotionName: string | null = null;
    let anyPromotionSuccessfullyApplied = false;

    cartItems.forEach(cartItem => {
      let itemPrice = cartItem.product.base_price;
      const size = cartItem.product.sizes.find(s => s.value === cartItem.selectedSizeValue);
      if (size) {
        itemPrice += size.price_modifier;
      }
      cartItem.selectedToppingValues.forEach(toppingValue => {
        const topping = cartItem.product.toppings.find(t => t.value === toppingValue);
        if (topping) {
          itemPrice += topping.price;
        }
      });

      let itemBestDiscount = 0;
      let itemPromoApplied = false;
      promotions.filter(promo => {
        const startDate = new Date(promo.start_date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(promo.end_date);
        endDate.setHours(23, 59, 59, 999);

        const isPromoActive = promo.is_active && today >= startDate && today <= endDate;
        const meetsMinimumOrder = !promo.minimum_order_value || itemPrice * cartItem.quantity >= promo.minimum_order_value;
        const appliesToThisItem = promo.applicable_items && (promo.applicable_items.includes("Todos") || promo.applicable_items.includes(cartItem.product.name));
        const matchesRestaurant = promo.restaurant_id === currentCartRestaurantId; // Alterado currentRestaurant.id para currentCartRestaurantId

        return isPromoActive && meetsMinimumOrder && appliesToThisItem && matchesRestaurant;
      }).forEach(promo => {
        let currentItemDiscount = 0;
        if (promo.discount_type === "Porcentagem" && promo.discount_value !== undefined) {
          currentItemDiscount = itemPrice * (promo.discount_value / 100);
        } else if (promo.discount_type === "Valor Fixo" && promo.discount_value !== undefined) {
          currentItemDiscount = promo.discount_value;
        }
        if (currentItemDiscount > itemBestDiscount) {
          itemBestDiscount = currentItemDiscount;
          itemPromoApplied = true;
        }
      });
      subtotalAfterItemDiscounts += (itemPrice - itemBestDiscount) * cartItem.quantity;
      if (itemPromoApplied) anyPromotionSuccessfullyApplied = true;
    });

    let bestGlobalMonetaryDiscount = 0;
    let globalMonetaryPromoName: string | null = null;
    let globalFreeShippingPromoName: string | null = null;

    promotions.filter(promo => {
      const startDate = new Date(promo.start_date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(promo.end_date);
      endDate.setHours(23, 59, 59, 999);

      const isPromoActive = promo.is_active && today >= startDate && today <= endDate;
      const meetsMinimumOrder = !promo.minimum_order_value || subtotalAfterItemDiscounts >= promo.minimum_order_value;
      const isGlobal = promo.applicable_items && promo.applicable_items.includes("Todos");
      const matchesRestaurant = promo.restaurant_id === currentCartRestaurantId; // Alterado currentRestaurant.id para currentCartRestaurantId

      return isPromoActive && meetsMinimumOrder && isGlobal && matchesRestaurant;
    }).forEach(promo => {
      if (promo.discount_type === "Frete Grátis") {
        globalFreeShippingPromoName = promo.name;
        anyPromotionSuccessfullyApplied = true;
      } else if (promo.discount_type === "Porcentagem" && promo.discount_value !== undefined) {
        const discount = subtotalAfterItemDiscounts * (promo.discount_value / 100);
        if (discount > bestGlobalMonetaryDiscount) {
          bestGlobalMonetaryDiscount = discount;
          globalMonetaryPromoName = promo.name;
          anyPromotionSuccessfullyApplied = true;
        }
      } else if (promo.discount_type === "Valor Fixo" && promo.discount_value !== undefined) {
        const discount = promo.discount_value;
        if (discount > bestGlobalMonetaryDiscount) {
          bestGlobalMonetaryDiscount = discount;
          globalMonetaryPromoName = promo.name;
          anyPromotionSuccessfullyApplied = true;
        }
      }
    }); // Added missing closing curly brace here

    totalMonetaryDiscountApplied = bestGlobalMonetaryDiscount;

    if (globalFreeShippingPromoName && globalMonetaryPromoName) {
        finalPromotionName = `${globalMonetaryPromoName} + ${globalFreeShippingPromoName}`;
    } else if (globalFreeShippingPromoName) {
        finalPromotionName = globalFreeShippingPromoName;
    } else if (globalMonetaryPromoName) {
        finalPromotionName = globalMonetaryPromoName;
    } else if (anyPromotionSuccessfullyApplied) {
        finalPromotionName = "Desconto Aplicado";
    }

    setAppliedDiscountAmount(totalMonetaryDiscountApplied);
    setAppliedPromotionName(finalPromotionName);
    setIsFreeShippingApplied(anyPromotionSuccessfullyApplied);

    console.log("--- Promotion Calculation Debug ---");
    console.log("Cart Items:", cartItems);
    console.log("Promotions:", promotions);
    console.log("Subtotal after item discounts:", subtotalAfterItemAndGlobalDiscounts.toFixed(2));
    console.log("Total monetary discount applied (global):", totalMonetaryDiscountApplied.toFixed(2));
    console.log("Final Promotion Name:", finalPromotionName);
    console.log("Any promotion successfully applied (isFreeShippingApplied):", anyPromotionSuccessfullyApplied);
    console.log("-----------------------------------");

  }, [cartItems, promotions, isLoadingPromotions, isLoadingSession, isLoadingRestaurants, currentCartRestaurantId]); // Alterado currentRestaurant?.id para currentCartRestaurantId


  const taxRate = 0.085;

  const subtotalBeforeDiscount = cartTotal;
  const subtotalAfterItemAndGlobalDiscounts = Math.max(0, subtotalBeforeDiscount - appliedDiscountAmount);

  let calculatedDeliveryFee = 10.00;
  if (isFreeShippingApplied) {
    calculatedDeliveryFee = 0;
  }

  const tax = subtotalAfterItemAndGlobalDiscounts * taxRate;
  const totalWithFees = subtotalAfterItemAndGlobalDiscounts + calculatedDeliveryFee + tax;

  const MINIMUM_ORDER_FOR_FREE_SHIPPING_MESSAGE = 50;
  const remainingForFreeShippingMessage = Math.max(0, MINIMUM_ORDER_FOR_FREE_SHIPPING_MESSAGE - subtotalAfterItemAndGlobalDiscounts);


  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPlacingOrder(true);

    if (cartItems.length === 0) {
      toast.error("Seu carrinho está vazio. Adicione itens antes de finalizar o pedido.");
      setIsPlacingOrder(false);
      return;
    }

    if (!session || !profile?.id) {
      toast.info("Você precisa estar logado para finalizar o pedido. Redirecionando para login.");
      navigate("/post-checkout-auth");
      setIsPlacingOrder(false);
      return;
    }

    if (!currentCartRestaurantId) { // NOVO: Usar currentCartRestaurantId
      toast.error("Não foi possível determinar o estabelecimento do seu pedido. Por favor, tente novamente.");
      setIsPlacingOrder(false);
      return;
    }

    if (!fullName || !address || !city || !zipCode || !phoneNumber || !cardNumber || !expiry || !cvv) {
      toast.error("Por favor, preencha todos os campos de entrega e pagamento.");
      setIsPlacingOrder(false);
      return;
    }

    const orderItemsDescription = cartItems.map(item => {
      let desc = `${item.quantity}x ${item.product.name}`;
      if (item.selectedSizeValue) {
        const size = item.product.sizes.find(s => s.value === item.selectedSizeValue);
        if (size) desc += ` (${size.name})`;
      }
      if (item.selectedToppingValues.length > 0) {
        const toppings = item.selectedToppingValues.map(tValue => {
          const topping = item.product.toppings.find(pt => pt.value === tValue);
          return topping ? topping.name : '';
        }).filter(Boolean).join(', ');
        if (toppings) desc += ` com ${toppings}`;
      }
      return desc;
    }).join('; ');

    const newOrder = {
      client_name: fullName,
      client_address: `${address}, ${city} - ${zipCode}`,
      items: orderItemsDescription,
      total: totalWithFees,
      status: "Pendente" as const, // ALTERADO: Default para Pendente
      order_date: new Date().toISOString().split('T')[0],
      deliveryman: "Não Atribuído",
    };

    try {
      await addOrder(newOrder, cartItems, currentCartRestaurantId); // NOVO: Passar currentCartRestaurantId
      toast.success("Seu pedido foi realizado com sucesso!");
      clearCart(); // LIMPAR O CARRINHO AQUI
      navigate("/profile/order-history");
    } catch (error: any) {
      console.error("Erro ao finalizar pedido:", error);
      toast.error("Houve um erro ao processar seu pedido: " + (error.message || "Erro desconhecido."));
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const openEditConfigurator = (item: CartItem) => {
    setEditingCartItem(item);
    setIsConfiguratorOpen(true);
  };

  const handleCloseConfigurator = () => {
    setIsConfiguratorOpen(false);
    setEditingCartItem(null); // Reset editingCartItem when closing
  };

  const handleConfirmUpdateCartItem = (
    product: MenuItem,
    newSelectedSizeValue: string,
    newSelectedToppingValues: string[],
    newQuantity: number,
    originalCartItem?: CartItem // Este será o item que estamos editando
  ) => {
    if (!originalCartItem) return; // Deve sempre existir ao editar

    updateCartItemDetails(
      originalCartItem.product.id,
      originalCartItem.selectedSizeValue,
      originalCartItem.selectedToppingValues,
      product,
      newSelectedSizeValue,
      newSelectedToppingValues,
      newQuantity
    );
    toast.success(`Item "${product.name}" atualizado no carrinho!`);
  };

  return (
    <div className="container py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Checkout Form */}
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Finalizar Pedido</h1>
        <p className="text-muted-foreground">Insira seus dados para completar seu pedido.</p>

        <Card>
          <CardHeader>
            <CardTitle>Informações de Entrega</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input id="fullName" placeholder="João da Silva" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" placeholder="Rua Principal, 123" required value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" placeholder="São Paulo" required value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input id="zipCode" placeholder="01000-000" required value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber">Número de Telefone</Label>
              <Input id="phoneNumber" placeholder="(11) 98765-4321" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cardNumber">Número do Cartão</Label>
              <Input id="cardNumber" placeholder="XXXX XXXX XXXX XXXX" required value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="expiry">MM/AA</Label>
                <Input id="expiry" placeholder="12/25" required value={expiry} onChange={(e) => setExpiry(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input id="cvv" placeholder="123" required value={cvv} onChange={(e) => setCvv(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span>Seu pagamento é seguro. Usamos a mais recente tecnologia de criptografia para proteger suas informações.</span>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-6"
          onClick={handlePlaceOrder}
          disabled={isPlacingOrder}
        >
          {isPlacingOrder ? "Processando..." : "Fazer Pedido"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Ao fazer seu pedido, você concorda com nossos{" "}
          <Link to="#" className="underline">
            Termos e Condições
          </Link>
          .
        </p>
      </div>

      {/* Order Summary */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartItems.length === 0 ? (
              <p className="text-muted-foreground text-center">Seu carrinho está vazio.</p>
            ) : (
              cartItems.map((item, index) => (
                <div key={`${item.product.id}-${item.selectedSizeValue}-${item.selectedToppingValues.join('-')}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      width={64}
                      height={64}
                      className="rounded-md object-cover"
                    />
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.selectedSizeValue && `Tamanho: ${item.product.sizes.find(s => s.value === item.selectedSizeValue)?.name}`}
                        {item.selectedToppingValues.length > 0 && `, Coberturas: ${item.selectedToppingValues.map(t => item.product.toppings.find(pt => pt.value === t)?.name).join(', ')}`}
                      </p>
                  </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.product.id, item.selectedSizeValue, item.selectedToppings, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.product.id, item.selectedSizeValue, item.selectedToppings, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEditConfigurator(item)} // Botão de editar
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeFromCart(item.product.id, item.selectedSizeValue, item.selectedToppings)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
            <Separator />
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotalBeforeDiscount)}</span>
              </div>
              {appliedDiscountAmount > 0 && (
                <div className="flex items-center justify-between text-green-600 font-medium">
                  <span>Desconto ({appliedPromotionName})</span>
                  <span>-{formatCurrency(appliedDiscountAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Entrega</span>
                <span>{calculatedDeliveryFee === 0 ? "Grátis" : formatCurrency(calculatedDeliveryFee)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Impostos</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(totalWithFees)}</span>
              </div>
            </div>
            <div className={`flex items-center justify-center gap-2 text-sm p-3 rounded-md ${isFreeShippingApplied ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-muted-foreground bg-muted'}`}>
              <Truck className="h-5 w-5" />
              <span>{isFreeShippingApplied ? "Frete grátis aplicado!" : `Adicione mais ${formatCurrency(remainingForFreeShippingMessage)} para frete grátis`}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Item Configurator Dialog for editing */}
      <MenuItemConfiguratorDialog
        isOpen={isConfiguratorOpen}
        onClose={handleCloseConfigurator}
        menuItem={editingCartItem?.product || null}
        onConfirm={handleConfirmUpdateCartItem}
        initialCartItem={editingCartItem || undefined}
      />
    </div>
  );
};

export default CheckoutPage;