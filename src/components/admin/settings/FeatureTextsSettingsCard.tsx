"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FeatureTextsSettingsCardProps {
  feature1Title: string;
  setFeature1Title: (title: string) => void;
  feature1Description: string;
  setFeature1Description: (description: string) => void;
  feature2Title: string;
  setFeature2Title: (title: string) => void;
  feature2Description: string;
  setFeature2Description: (description: string) => void;
  feature3Title: string;
  setFeature3Title: (title: string) => void;
  feature3Description: string;
  setFeature3Description: (description: string) => void;
}

const FeatureTextsSettingsCard: React.FC<FeatureTextsSettingsCardProps> = ({
  feature1Title,
  setFeature1Title,
  feature1Description,
  setFeature1Description,
  feature2Title,
  setFeature2Title,
  feature2Description,
  setFeature2Description,
  feature3Title,
  setFeature3Title,
  feature3Description,
  setFeature3Description,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Textos da Seção de Destaques (Features)</CardTitle>
        <CardDescription>Edite os títulos e descrições das três colunas de destaque na página inicial.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-3">
        {/* Feature 1 */}
        <div className="grid gap-2">
          <Label htmlFor="feature1Title" className="font-semibold">Destaque 1 (Ícone: Clock)</Label>
          <Input id="feature1Title" value={feature1Title} onChange={(e) => setFeature1Title(e.target.value)} placeholder="Título" />
          <Textarea id="feature1Description" value={feature1Description} onChange={(e) => setFeature1Description(e.target.value)} rows={2} placeholder="Descrição" />
        </div>
        {/* Feature 2 */}
        <div className="grid gap-2">
          <Label htmlFor="feature2Title" className="font-semibold">Destaque 2 (Ícone: Utensils)</Label>
          <Input id="feature2Title" value={feature2Title} onChange={(e) => setFeature2Title(e.target.value)} placeholder="Título" />
          <Textarea id="feature2Description" value={feature2Description} onChange={(e) => setFeature2Description(e.target.value)} rows={2} placeholder="Descrição" />
        </div>
        {/* Feature 3 */}
        <div className="grid gap-2">
          <Label htmlFor="feature3Title" className="font-semibold">Destaque 3 (Ícone: ShoppingCart)</Label>
          <Input id="feature3Title" value={feature3Title} onChange={(e) => setFeature3Title(e.target.value)} placeholder="Título" />
          <Textarea id="feature3Description" value={feature3Description} onChange={(e) => setFeature3Description(e.target.value)} rows={2} placeholder="Descrição" />
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureTextsSettingsCard;