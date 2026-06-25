"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface HeroSectionSettingsCardProps {
  heroTitle: string;
  setHeroTitle: (title: string) => void;
  heroDescription: string;
  setHeroDescription: (description: string) => void;
}

const HeroSectionSettingsCard: React.FC<HeroSectionSettingsCardProps> = ({
  heroTitle,
  setHeroTitle,
  heroDescription,
  setHeroDescription,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Texto Principal (Hero)</CardTitle>
        <CardDescription>Defina o título e a descrição exibidos no banner principal da loja.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="heroTitle">Título Principal</Label>
          <Input id="heroTitle" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} placeholder="Ex: Pizza Deliciosa, Entrega Rápida." />
          <p className="text-xs text-muted-foreground">Use vírgula (,) para quebrar a linha no título.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="heroDescription">Descrição do Banner</Label>
          <Textarea id="heroDescription" value={heroDescription} onChange={(e) => setHeroDescription(e.target.value)} rows={2} placeholder="Ex: Pizzas artesanais feitas com os ingredientes mais frescos..." />
        </div>
      </CardContent>
    </Card>
  );
};

export default HeroSectionSettingsCard;