"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Manter import para o input de URL

interface StoreImageSettingsCardProps {
  imageUrl: string;
  setImageUrl: (url: string) => void;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  finalImagePreview: string | null;
}

const StoreImageSettingsCard: React.FC<StoreImageSettingsCardProps> = ({
  imageUrl,
  setImageUrl,
  imageFile,
  setImageFile,
  finalImagePreview,
}) => {
  const [fileInputKey, setFileInputKey] = React.useState(Date.now()); // NOVO: Chave dinâmica para o input de arquivo

  // Efeito para resetar a chave do input de arquivo quando o componente é montado ou a imagem é limpa
  React.useEffect(() => {
    setFileInputKey(Date.now());
  }, [imageUrl, imageFile]); // Depende de imageUrl e imageFile para resetar quando um deles muda

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[DEBUG] StoreImageSettingsCard: handleFileChange triggered."); // Log inicial
    console.log("[DEBUG] Event target files:", event.target.files);
    const file = event.target.files?.[0];
    console.log("[DEBUG] Captured file:", file);

    if (file) {
      setImageFile(file);
      setImageUrl(""); // Clear manual URL if a file is selected
    } else {
      setImageFile(null);
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    setImageFile(null); // Clear file if manual URL is entered
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Imagem Principal da Loja (Banner)</CardTitle>
        <CardDescription>Esta imagem será usada como banner principal na página inicial da sua loja.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="imageUpload">Upload de Imagem</Label>
          <div className="flex items-center space-x-2">
            <input
              key={fileInputKey} // Usar a chave dinâmica
              id="imageUpload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="flex-1 block w-full text-sm text-gray-500 border border-input rounded-md p-2"
            />
            <span className="text-muted-foreground">ou</span>
            <Input id="imageUrl" placeholder="URL da Imagem" value={imageUrl} onChange={handleImageUrlChange} className="flex-1" />
          </div>
          {finalImagePreview && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Prévia do Banner:</p>
              <img src={finalImagePreview} alt="Prévia do Banner" className="w-full h-48 object-cover rounded-md border" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StoreImageSettingsCard;