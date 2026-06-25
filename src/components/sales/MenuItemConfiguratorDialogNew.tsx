import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Minus, ShoppingCart, Loader2 } from "lucide-react";
import { MenuItem } from "@/context/MenuContext";
import { CartItem } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";

interface MenuItemConfiguratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem | null;
  onConfirm: (
    product: MenuItem,
    selectedSizeValue: string,
    selectedToppingValues: string[],
    quantity: number,
    originalCartItem?: CartItem
  ) => void;
  initialCartItem?: CartItem;
}

function MenuItemConfiguratorDialog({
  isOpen,
  onClose,
  menuItem,
  onConfirm,
  initialCartItem,
}: MenuItemConfiguratorDialogProps) {
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

  useEffect(() => {
    if (menuItem && isOpen) {
      const hasSizes = menuItem.sizes.length > 0;
      
      if (initialCartItem) {
        setSelectedSize(initialCartItem.selectedSizeValue);
        setQuantity(initialCartItem.quantity);
        setSelectedToppings(initialCartItem.selectedToppingValues || []);
      } else {
        // Se houver tamanhos, selecione o primeiro por padrão. Caso contrário, limpe.
        if (hasSizes) {
          setSelectedSize(menuItem.sizes[0]?.value || "");
        } else {
          setSelectedSize("");
        }
        setQuantity(1);
        setSelectedToppings([]);
      }
    } else if (!isOpen) {
      setSelectedSize("");
      setQuantity(1);
      setSelectedToppings([]);
    }
  }, [menuItem, isOpen, initialCartItem]);

  const calculateCurrentPrice = () => {
    if (!menuItem) return 0;
    let total = menuItem.base_price;
    
    // Apenas aplica o modificador de tamanho se o item tiver tamanhos configurados
    if (menuItem.sizes.length > 0) {
      const size = menuItem.sizes.find(s => s.value === selectedSize);
      if (size) {
        total += size.price_modifier;
      }
    }
    
    selectedToppings.forEach(toppingValue => {
      const topping = menuItem.toppings.find(t => t.value === toppingValue);
      if (topping) {
        total += topping.price;
      }
    });
    return total;
  };

  const handleToppingChange = (toppingValue: string, checked: boolean) => {
    setSelectedToppings(prev =>
      checked ? [...prev, toppingValue] : prev.filter(t => t !== toppingValue)
    );
  };

  const handleConfirmClick = () => {
    if (!menuItem) {
      alert("Por favor, selecione um item.");
      return;
    }
    
    // Validação de tamanho: só é necessária se o produto tiver tamanhos configurados
    if (menuItem.sizes.length > 0 && !selectedSize) {
        alert("Por favor, selecione um tamanho.");
        return;
    }

    onConfirm(menuItem, selectedSize, selectedToppings, quantity, initialCartItem);
    onClose();
  };

  const currentTotalPrice = calculateCurrentPrice() * quantity;
  const hasSizes = menuItem?.sizes.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialCartItem ? "Editar Item do Carrinho" : "Configurar Item"}</DialogTitle>
          <DialogDescription>
            {menuItem ? `${menuItem.name} - ${formatCurrency(menuItem.base_price)}` : "Carregando..."}
          </DialogDescription>
        </DialogHeader>
        {menuItem ? (
          <div className="grid gap-4 py-4">
            {/* Conditionally render size selection: only show if sizes exist */}
            {hasSizes && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">Escolha seu tamanho</Label>
                <RadioGroup
                  value={selectedSize}
                  onValueChange={setSelectedSize}
                  className="flex flex-wrap gap-2"
                >
                  {menuItem.sizes.map(size => (
                    <div key={size.value}>
                      <RadioGroupItem value={size.value} id={`size-${size.value}`} className="sr-only" />
                      <Label
                        htmlFor={`size-${size.value}`}
                        className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground data-[state=checked]:border-primary text-sm"
                      >
                        {size.name} ({formatCurrency(menuItem.base_price + size.price_modifier)})
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {menuItem.toppings.length > 0 && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">Adicionar Coberturas</Label>
                <div className="grid grid-cols-2 gap-2">
                  {menuItem.toppings.map(topping => (
                    <div key={topping.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`topping-${topping.value}`}
                        checked={selectedToppings.includes(topping.value)}
                        onCheckedChange={(checked) => handleToppingChange(topping.value, !!checked)}
                      />
                      <Label htmlFor={`topping-${topping.value}`} className="text-sm">
                        {topping.name} (+ {formatCurrency(topping.price)})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <Label className="text-base font-semibold">Quantidade</Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(prev => prev + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Carregando detalhes do item...</p>
          </div>
        )}
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-4">
          <div className="text-xl font-bold">Total: {formatCurrency(currentTotalPrice)}</div>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handleConfirmClick} disabled={!menuItem}>
            <ShoppingCart className="h-4 w-4 mr-2" /> {initialCartItem ? "Atualizar Carrinho" : "Adicionar ao Carrinho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MenuItemConfiguratorDialog;