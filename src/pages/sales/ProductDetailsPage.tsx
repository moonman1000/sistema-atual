import React from "react";
import { Star, ShoppingCart, Plus, Minus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { useMenu, MenuItem } from "@/context/MenuContext";
import { useSession } from '@/context/SessionContext';
import { useRestaurant } from '@/context/RestaurantContext';
import MenuItemConfiguratorDialog from "@/components/sales/MenuItemConfiguratorDialogNew";
import ReviewFormDialog from "@/components/sales/ReviewFormDialog";
import { formatCurrency, getRestaurantTypePath } from "@/lib/utils"; // Importar getRestaurantTypePath

const ProductDetailsPage = () => {
  // --- HOOKS INCONDICIONAIS (DEVE ESTAR NO TOPO) ---
  // CORRIGIDO: Desestruturar id e restaurantId em uma única chamada a useParams
  const { id, restaurantId } = useParams<{ id: string; restaurantId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { menuItems, isLoadingMenuItems, addReview } = useMenu();
  const { isLoading: isLoadingSession, isCustomer, profile } = useSession();
  const { isLoadingRestaurants, currentRestaurant } = useRestaurant();

  // Estados
  const [selectedSize, setSelectedSize] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [selectedToppings, setSelectedToppings] = React.useState<string[]>([]);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = React.useState(false);
  // --- FIM DOS HOOKS INCONDICIONAIS ---

  console.log(`[ProductDetailsPage] Received ID from useParams: ${id}`);
  console.log(`[ProductDetailsPage] Received restaurantId from useParams: ${restaurantId}`); // NOVO LOG
  console.log(`[ProductDetailsPage] Current menuItems array:`, menuItems);
  
  // Ajustado: Encontrar a pizza apenas quando currentRestaurant e menuItems estiverem carregados
  const pizza = React.useMemo(() => {
    if (!currentRestaurant || isLoadingMenuItems) return null;
    return menuItems.find(item => item.id === id);
  }, [id, menuItems, currentRestaurant, isLoadingMenuItems]);

  console.log(`[ProductDetailsPage] Found pizza based on ID: ${pizza ? pizza.name : 'null'}`);

  // Derivar baseRoute para links de navegação
  const storeIdentifier = currentRestaurant?.slug || currentRestaurant?.id || restaurantId;
  const restaurantTypePrefix = currentRestaurant ? getRestaurantTypePath(currentRestaurant.type) : 'loja'; // Usar getRestaurantTypePath
  const baseRoute = storeIdentifier ? `/${restaurantTypePrefix}/${storeIdentifier}` : '';


  // Efeito para inicializar selectedSize quando a pizza é carregada
  React.useEffect(() => {
    if (pizza && pizza.sizes.length > 0 && !selectedSize) {
      // Se houver tamanhos disponíveis, selecione o primeiro por padrão.
      // A lógica de desativação de tamanhos agora é controlada pelo admin no cadastro.
      setSelectedSize(pizza.sizes[0].value);
    }
  }, [pizza, selectedSize]);


  if (isLoadingMenuItems || isLoadingSession || isLoadingRestaurants) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando detalhes do produto...</p>
      </div>
    );
  }

  // NOVO: Se o carregamento terminou e currentRestaurant ainda é null, ou pizza é null, renderiza a mensagem de não encontrado
  if (!currentRestaurant || !pizza) {
    console.log(`[ProductDetailsPage] Loading finished, but currentRestaurant (${currentRestaurant ? 'found' : 'null'}) or pizza (${pizza ? 'found' : 'null'}) is null. Displaying 'Product Not Found'.`);
    return (
      <div className="container py-8 text-center min-h-screen flex flex-col justify-center items-center">
        <h2 className="text-3xl font-bold text-destructive">Produto Não Encontrado</h2>
        <p className="text-lg text-muted-foreground mt-4">
          Não foi possível carregar os detalhes do produto com o identificador "{id}" para o restaurante atual.
        </p>
        <Button asChild className="mt-6">
          <Link to={`${baseRoute}/menu`}>Voltar para o Cardápio</Link>
        </Button>
      </div>
    );
  }

  // A partir daqui, currentRestaurant e pizza são garantidos como não-nulos.
  const calculateTotalPrice = () => {
    let total = pizza.base_price;
    
    // Apenas aplica o modificador de tamanho se o item tiver tamanhos configurados
    if (pizza.sizes.length > 0) {
      const selectedSizeObj = pizza.sizes.find(s => s.value === selectedSize);
      if (selectedSizeObj) {
        total += selectedSizeObj.price_modifier;
      }
    }
    
    selectedToppings.forEach(toppingValue => {
      const topping = pizza.toppings.find(t => t.value === toppingValue);
      if (topping) {
        total += topping.price;
      }
    });
    return (total * quantity);
  };

  const handleToppingChange = (toppingValue: string, checked: boolean) => {
    setSelectedToppings(prev =>
      checked ? [...prev, toppingValue] : prev.filter(t => t !== toppingValue)
    );
  };

  const handleAddToCart = () => {
    // Validação de tamanho: só é necessária se o produto tiver tamanhos configurados
    if (pizza.sizes.length > 0 && !selectedSize) {
      toast.error("Por favor, selecione um tamanho para o produto.");
      return;
    }
    addToCart(pizza, selectedSize, selectedToppings, quantity);
    toast.success(`${quantity}x ${pizza.name} adicionado(s) ao carrinho!`);
  };

  // NOVO: Calcular avaliação média
  const averageRating = pizza.reviews.length > 0
    ? (pizza.reviews.reduce((sum, review) => sum + review.rating, 0) / pizza.reviews.length)
    : 0;

  // NOVO: Função para submeter avaliação
  const handleSubmitReview = async (menuItemId: string, rating: number, comment: string) => {
    if (!profile?.id) {
      toast.error("Você precisa estar logado para enviar uma avaliação.");
      throw new Error("Usuário não autenticado.");
    }
    await addReview({
      menu_item_id: menuItemId,
      rating,
      comment,
    });
  };

  return (
    <React.Fragment>
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="relative rounded-xl overflow-hidden shadow-lg">
            <img
              src={pizza.image}
              alt={pizza.name}
              width={800}
              height={600}
              className="w-full h-auto object-cover"
            />
            {pizza.is_featured && (
              <Badge variant="destructive" className="absolute top-4 left-4 px-3 py-1 text-sm font-semibold">
                Urgente! Poucas unidades em estoque!
              </Badge>
            )}
          </div>

          {/* Product Details and Options */}
          <div className="space-y-6 p-4 md:p-0">
            <div>
              <h1 className="text-4xl font-bold text-primary">{pizza.name}</h1>
              <p className="text-lg text-muted-foreground mt-2">{pizza.description}</p>
              {pizza.reviews.length > 0 && (
                <div className="flex items-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < Math.round(averageRating) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({pizza.reviews.length} avaliações)
                  </span>
                </div>
              )}
            </div>

            {/* Choose Size - Conditionally rendered based on data existence */}
            {pizza.sizes.length > 0 && (
              <Card className="p-4 shadow-sm">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-xl font-semibold text-foreground">Escolha seu tamanho</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <RadioGroup
                    value={selectedSize}
                    onValueChange={setSelectedSize}
                    className="flex flex-wrap gap-3"
                  >
                    {menuItem.sizes.map(size => (
                      <div key={size.value}>
                        <RadioGroupItem value={size.value} id={`size-${size.value}`} className="sr-only" />
                        <Label
                          htmlFor={`size-${size.value}`}
                          className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground data-[state=checked]:border-primary text-sm cursor-pointer min-w-[100px]"
                        >
                          <span className="font-medium">{size.name}</span>
                          <span className="text-xs text-muted-foreground">{formatCurrency(pizza.base_price + size.price_modifier)}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            {/* Add Toppings */}
            {pizza.toppings.length > 0 && (
              <Card className="p-4 shadow-sm">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-xl font-semibold text-foreground">Adicionar Coberturas</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pizza.toppings.map(topping => (
                      <div key={topping.value} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={`topping-${topping.value}`}
                          checked={selectedToppings.includes(topping.value)}
                          onCheckedChange={(checked) => handleToppingChange(topping.value, !!checked)}
                        />
                        <Label htmlFor={`topping-${topping.value}`} className="text-sm font-medium cursor-pointer flex-1">
                          {topping.name} <span className="text-muted-foreground text-xs">(+ {formatCurrency(topping.price)})</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator className="my-6" />

            {/* Price and Add to Cart */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/50 p-4 rounded-lg shadow-inner">
              <span className="text-3xl font-bold text-primary">Total: {formatCurrency(calculateTotalPrice())}</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="h-10 w-10"
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <span className="text-xl font-medium w-8 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="h-10 w-10"
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white text-base px-6 py-3" onClick={handleAddToCart}>
                  <ShoppingCart className="h-5 w-5 mr-2" /> Adicionar ao Carrinho
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <section className="mt-16 bg-muted/40 p-8 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-primary">O que nossos clientes dizem</h2>
            {isCustomer && ( // NOVO: Botão para escrever avaliação, visível apenas para clientes logados
              <Button onClick={() => setIsReviewDialogOpen(true)}>Escrever Avaliação</Button>
            )}
          </div>
          
          {pizza.reviews && pizza.reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pizza.reviews.map(review => (
                <Card key={review.id} className="shadow-md hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={review.avatar} alt={review.author} />
                      <AvatarFallback>{review.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg text-foreground">{review.author}</CardTitle>
                      <CardDescription className="flex items-center text-sm">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        ))}
                        {[...Array(5 - review.rating)].map((_, i) => (
                          <Star key={i + review.rating} className="h-4 w-4 text-muted-foreground" />
                        ))}
                        <span className="ml-2 text-muted-foreground">{review.created_at ? new Date(review.created_at).toLocaleDateString('pt-BR') : 'Data desconhecida'}</span>
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <h3 className="text-xl font-semibold mb-2">Nenhuma avaliação ainda.</h3>
              <p className="text-muted-foreground">Seja o primeiro a avaliar este item!</p>
            </div>
          )}
        </section>

        {/* Item Configurator Dialog (existing) */}
        <MenuItemConfiguratorDialog
          isOpen={false} /* This dialog is not used here anymore, it's for adding to cart from category page */
          onClose={() => {}}
          menuItem={null}
          onConfirm={() => {}}
        />

        {/* NOVO: Review Form Dialog */}
        <ReviewFormDialog
          isOpen={isReviewDialogOpen}
          onClose={() => setIsReviewDialogOpen(false)}
          menuItem={pizza}
          onSubmitReview={handleSubmitReview}
        />
      </div>
    </React.Fragment>
  );
};

export default ProductDetailsPage;