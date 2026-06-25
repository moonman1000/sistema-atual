import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MenuItem, MenuItemSize, MenuItemTopping } from "@/context/MenuContext";
import { PlusCircle, MinusCircle, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { uploadImageToSupabase, deleteImageFromSupabase } from "@/integrations/supabase/storage";
import { Switch } from "@/components/ui/switch";
import { Restaurant } from "@/context/RestaurantContext"; // Importar Restaurant type

interface EditProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: MenuItem | null;
  onEditProduct: (
    updatedProduct: MenuItem,
    sizes: Omit<MenuItemSize, 'id' | 'menu_item_id' | 'created_at' | 'updated_at'>[],
    toppings: Omit<MenuItemTopping, 'id' | 'menu_item_id' | 'created_at' | 'updated_at'>[]
  ) => void;
  categories: string[];
  restaurantType: Restaurant['type']; // NOVO: Adicionar prop restaurantType
}

const defaultPizzaSizes: Omit<MenuItemSize, 'id' | 'menu_item_id' | 'created_at' | 'updated_at'>[] = [
  { name: "Pequena", value: "small", price_modifier: 0 },
  { name: "Média", value: "medium", price_modifier: 5.00 },
  { name: "Grande", value: "large", price_modifier: 10.00 },
];

const EditProductDialog: React.FC<EditProductDialogProps> = ({ isOpen, onClose, product, onEditProduct, categories, restaurantType }) => {
  const [name, setName] = React.useState(product?.name || "");
  const [description, setDescription] = React.useState(product?.description || "");
  const [basePrice, setBasePrice] = React.useState(product?.base_price.toString() || "");
  const [imageUrl, setImageUrl] = React.useState(product?.image || "");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(product?.image || null);
  const [category, setCategory] = React.useState(product?.category || "");
  const [isFeatured, setIsFeatured] = React.useState(product?.is_featured || false);
  const [dietary, setDietary] = React.useState<string[]>(product?.dietary || []);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isSizeEnabled, setIsSizeEnabled] = React.useState(true);

  const [currentSizes, setCurrentSizes] = React.useState<Omit<MenuItemSize, 'id' | 'menu_item_id' | 'created_at' | 'updated_at'>[]>([]);
  const [currentToppings, setCurrentToppings] = React.useState<Omit<MenuItemTopping, 'id' | 'menu_item_id' | 'created_at' | 'updated_at'>[]>([]);

  const [fileInputKey, setFileInputKey] = React.useState(Date.now());

  const normalizeCategoryName = React.useCallback((catName: string) => 
    catName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(), []);

  // Effect to initialize states when product changes
  React.useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description);
      setBasePrice(product.base_price.toString());
      setImageUrl(product.image);
      setImagePreview(product.image);
      setCategory(product.category);
      setIsFeatured(product.is_featured);
      setDietary(product.dietary || []);
      
      const hasSizes = product.sizes.length > 0;
      setIsSizeEnabled(hasSizes); // Initialize based on existing sizes

      setCurrentSizes(product.sizes.map(s => ({ name: s.name, value: s.value, price_modifier: s.price_modifier })));
      setCurrentToppings(product.toppings.map(t => ({ name: t.name, value: t.value, price: t.price })));
      setImageFile(null);
      setFileInputKey(Date.now());
    } else {
      // Reset to default when no product is selected
      setName("");
      setDescription("");
      setBasePrice("");
      setImageUrl("");
      setImageFile(null);
      setImagePreview(null);
      setCategory(categories.length > 0 ? categories[0] : "");
      setIsFeatured(false);
      setDietary([]);
      setIsSizeEnabled(true);
      setCurrentSizes(defaultPizzaSizes);
      setCurrentToppings([]);
      setFileInputKey(Date.now());
    }
  }, [product, categories]);

  // Effect to manage currentSizes array based on isSizeEnabled state
  React.useEffect(() => {
    if (!isSizeEnabled) {
      setCurrentSizes([]);
    } else if (currentSizes.length === 0) {
      setCurrentSizes(defaultPizzaSizes);
    }
  }, [isSizeEnabled, currentSizes.length]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[DEBUG] EditProductDialog: handleFileChange triggered.");
    console.log("[DEBUG] Event target files:", event.target.files);
    const file = event.target.files?.[0];
    console.log("[DEBUG] Captured file:", file);

    if (file) {
      setImageFile(file);
      setImageUrl("");
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(product?.image || null);
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setImageUrl(newUrl);
    setImageFile(null);
    setImagePreview(newUrl);
  };

  const handleDietaryChange = (diet: string, checked: boolean) => {
    setDietary(prev =>
      checked ? [...prev, diet] : prev.filter(d => d !== diet)
    );
  };

  const handleSizeChange = (index: number, field: keyof Omit<MenuItemSize, 'id' | 'menu_item_id' | 'created_at' | 'updated_at'>, value: string | number) => {
    const updatedSizes = [...currentSizes];
    (updatedSizes[index] as any)[field] = value;
    setCurrentSizes(updatedSizes);
  };

  const addSize = () => {
    setCurrentSizes(prev => [...prev, { name: "", value: "", price_modifier: 0 }]);
  };

  const removeSize = (index: number) => {
    setCurrentSizes(prev => prev.filter((_, i) => i !== index));
  };

  const handleToppingChange = (index: number, field: keyof Omit<MenuItemTopping, 'id' | 'menu_item_id' | 'created_at' | 'updated_at'>, value: string | number) => {
    const updatedToppings = [...currentToppings];
    (updatedToppings[index] as any)[field] = value;
    setCurrentToppings(updatedToppings);
  };

  const addTopping = () => {
    setCurrentToppings(prev => [...prev, { name: "", value: "", price: 0 }]);
  };

  const removeTopping = (index: number) => {
    setCurrentToppings(prev => prev.filter((_, i) => i !== index));
  };

  const handleCloseDialog = () => {
    if (product) {
      setName(product.name);
      setDescription(product.description);
      setBasePrice(product.base_price.toString());
      setImageUrl(product.image);
      setImagePreview(product.image);
      setCategory(product.category);
      setIsFeatured(product.is_featured);
      setDietary(product.dietary || []);
      setIsSizeEnabled(product.sizes.length > 0);
      setCurrentSizes(product.sizes.map(s => ({ name: s.name, value: s.value, price_modifier: s.price_modifier })));
      setCurrentToppings(product.toppings.map(t => ({ name: t.name, value: t.value, price: t.price })));
      setImageFile(null);
      setIsUploading(false);
      setFileInputKey(Date.now());
    }
    onClose();
  };

  const handleSubmit = async () => {
    if (!product) {
      toast.error("Nenhum produto selecionado para edição.");
      return;
    }
    if (!name) {
      toast.error("O nome do produto é obrigatório.");
      return;
    }
    if (!basePrice || isNaN(parseFloat(basePrice))) {
      toast.error("O preço base é obrigatório e deve ser um número.");
      return;
    }
    if (!imageUrl && !imageFile && !product.image) {
      toast.error("É necessário fornecer uma URL de imagem ou fazer upload de um arquivo.");
      return;
    }
    if (!category) {
      toast.error("A categoria é obrigatória.");
      return;
    }
    if (isSizeEnabled && currentSizes.length === 0) {
      toast.error("É necessário adicionar pelo menos um tamanho.");
      return;
    }

    setIsUploading(true);
    let finalImageUrl = imageUrl;

    try {
      if (imageFile) {
        if (product.image && product.image.includes('supabase.co/storage/v1/object/public/menu-images')) {
          await deleteImageFromSupabase(product.image, 'menu-images');
        }
        const uploadedUrl = await uploadImageToSupabase(imageFile, 'menu-images');
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        } else {
          throw new Error("Falha ao obter URL da imagem após o upload.");
        }
      } else if (!imageUrl && product.image && product.image.includes('supabase.co/storage/v1/object/public/menu-images')) {
        await deleteImageFromSupabase(product.image, 'menu-images');
        finalImageUrl = "";
      } else if (imageFile === null && imageUrl === "") {
        finalImageUrl = "";
      } else if (imageFile === null && imageUrl !== "") {
        finalImageUrl = imageUrl;
      }


      const updatedProductData: MenuItem = {
        ...product,
        name,
        description,
        base_price: parseFloat(basePrice),
        image: finalImageUrl,
        category,
        is_featured: isFeatured,
        dietary: restaurantType === 'restaurant' ? dietary : [], // Limpar dietary se não for restaurante
      };
      const sizesToSave = isSizeEnabled ? currentSizes : [];

      onEditProduct(updatedProductData, sizesToSave, currentToppings);
      handleCloseDialog();
    } catch (error: any) {
      toast.error("Erro ao atualizar produto: " + error.message);
      console.error("Erro ao atualizar produto:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
          <DialogDescription>
            Atualize os detalhes do produto.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="basePrice">Preço Base (R$)</Label>
                <Input id="basePrice" type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="imageUpload">Imagem do Produto</Label>
                <div className="flex items-center space-x-2">
                  <input
                    key={fileInputKey}
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="flex-1 block w-full text-sm text-gray-500 border border-input rounded-md p-2"
                  />
                  <span className="text-muted-foreground">ou</span>
                  <Input id="imageUrl" placeholder="URL da Imagem" value={imageUrl} onChange={(e) => handleImageUrlChange(e)} className="flex-1" />
                </div>
                {imagePreview && (
                  <div className="mt-2">
                    <img src={imagePreview} alt="Prévia da Imagem" className="w-32 h-32 object-cover rounded-md" />
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 mt-auto">
                <Checkbox
                  id="isFeatured"
                  checked={isFeatured}
                  onCheckedChange={(checked) => setIsFeatured(!!checked)}
                />
                <Label htmlFor="isFeatured">Destaque</Label>
              </div>
              {restaurantType === 'restaurant' && ( // Conditionally render Dietas
                <div className="grid gap-2 md:col-span-2">
                  <Label className="mb-1">Dietas</Label>
                  <div className="flex flex-wrap gap-4">
                    {["Vegetariana", "Vegana", "Sem Glúten"].map(diet => (
                      <div key={diet} className="flex items-center space-x-2">
                        <Checkbox
                          id={`diet-${diet}`}
                          checked={dietary.includes(diet)}
                          onCheckedChange={(checked) => handleDietaryChange(diet, !!checked)}
                        />
                        <Label htmlFor={`diet-${diet}`}>{diet}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Habilitar Tamanhos</CardTitle>
              <Switch
                checked={isSizeEnabled}
                onCheckedChange={setIsSizeEnabled}
              />
            </CardHeader>
          </Card>

          {isSizeEnabled && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tamanhos</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {currentSizes.map((size, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 border rounded-md">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 w-full">
                      <div className="grid gap-1">
                        <Label htmlFor={`sizeName-${index}`} className="sr-only">Nome</Label>
                        <Input id={`sizeName-${index}`} placeholder="Nome (Ex: Pequena)" value={size.name} onChange={(e) => handleSizeChange(index, "name", e.target.value)} />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor={`sizeValue-${index}`} className="sr-only">Valor</Label>
                        <Input id={`sizeValue-${index}`} placeholder="Valor (Ex: small)" value={size.value} onChange={(e) => handleSizeChange(index, "value", e.target.value)} />
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor={`sizePriceModifier-${index}`} className="sr-only">Modificador Preço</Label>
                        <Input id={`sizePriceModifier-${index}`} type="number" placeholder="Modificador Preço (R$)" value={size.price_modifier} onChange={(e) => handleSizeChange(index, "price_modifier", parseFloat(e.target.value))} />
                      </div>
                    </div>
                    <Button variant="destructive" size="icon" onClick={() => removeSize(index)} className="flex-shrink-0">
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addSize} className="w-full">
                  <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Tamanho
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Coberturas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {currentToppings.map((topping, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 border rounded-md">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 w-full">
                    <div className="grid gap-1">
                      <Label htmlFor={`toppingName-${index}`} className="sr-only">Nome</Label>
                      <Input id={`toppingName-${index}`} placeholder="Nome (Ex: Bacon)" value={topping.name} onChange={(e) => handleToppingChange(index, "name", e.target.value)} />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor={`toppingValue-${index}`} className="sr-only">Valor</Label>
                      <Input id={`toppingValue-${index}`} placeholder="Valor (Ex: bacon)" value={topping.value} onChange={(e) => handleToppingChange(index, "value", e.target.value)} />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor={`toppingPrice-${index}`} className="sr-only">Preço</Label>
                      <Input id={`toppingPrice-${index}`} type="number" placeholder="Preço (R$)" value={topping.price} onChange={(e) => handleToppingChange(index, "price", parseFloat(e.target.value))} />
                    </div>
                  </div>
                  <Button variant="destructive" size="icon" onClick={() => removeTopping(index)} className="flex-shrink-0">
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addTopping} className="w-full">
                <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Cobertura
              </Button>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseDialog} disabled={isUploading}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;