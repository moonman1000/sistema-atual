"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface StoreBrandingSettingsCardProps {
  displayName: string;
  setDisplayName: (name: string) => void;
  logoUrl: string;
  setLogoUrl: (url: string) => void;
  logoFile: File | null;
  setLogoFile: (file: File | null) => void;
  finalLogoPreview: string | null;
  logoFileInputKey: number; // NOVO: Receber a chave via props
}

const StoreBrandingSettingsCard: React.FC<StoreBrandingSettingsCardProps> = ({
  displayName,
  setDisplayName,
  logoUrl,
  setLogoUrl,
  logoFile,
  setLogoFile,
  finalLogoPreview,
  logoFileInputKey, // NOVO: Desestruturar a chave
}) => {
  // Removido o estado local logoFileInputKey e seu useEffect

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[StoreBrandingSettingsCard] handleFileChange triggered.");
    console.log("[StoreBrandingSettingsCard] Event target files:", event.target.files);
    const file = event.target.files?.[0];
    console.log("[StoreBrandingSettingsCard] Captured file:", file);

    if (file) {
      console.log("[StoreBrandingSettingsCard] File selected:", file.name);
      setLogoFile(file);
      setLogoUrl(""); // Clear manual URL if a file is selected
      console.log("[StoreBrandingSettingsCard] logoFile state set to:", file.name);
    } else {
      console.log("[StoreBrandingSettingsCard] No file selected.");
      setLogoFile(null);
      console.log("[StoreBrandingSettingsCard] logoFile state set to: null");
    }
  };

  const handleLogoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoUrl(e.target.value);
    setLogoFile(null); // Clear file if manual URL is entered
    console.log("[StoreBrandingSettingsCard] logoUrl state set to:", e.target.value);
    console.log("[StoreBrandingSettingsCard] logoFile state set to: null (due to URL change)");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding da Loja (Cabeçalho/Rodapé)</CardTitle>
        <CardDescription>Defina o nome curto e o logo que aparecerão no cabeçalho e rodapé da sua loja.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="displayName">Nome de Exibição Curto</Label>
          <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ex: PizzaPalace" />
          <p className="text-xs text-muted-foreground">Um nome mais curto para o cabeçalho e rodapé.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="logoUpload">Logo da Loja</Label>
          <div className="flex items-center space-x-2">
            <input
              key={logoFileInputKey} // USANDO A CHAVE RECEBIDA VIA PROPS
              id="logoUpload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="flex-1 block w-full text-sm text-gray-500 border border-input rounded-md p-2"
            />
            <span className="text-muted-foreground">ou</span>
            <Input id="logoUrl" placeholder="URL do Logo" value={logoUrl} onChange={handleLogoUrlChange} className="flex-1" />
          </div>
          {finalLogoPreview && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Prévia do Logo:</p>
              <img src={finalLogoPreview} alt="Prévia do Logo" className="h-16 w-auto object-contain rounded-md border" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StoreBrandingSettingsCard;