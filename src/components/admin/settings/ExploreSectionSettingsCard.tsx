"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ExploreSectionSettingsCardProps {
  exploreTitle: string;
  setExploreTitle: (title: string) => void;
  exploreDescription: string;
  setExploreDescription: (description: string) => void;
}

const ExploreSectionSettingsCard: React.FC<ExploreSectionSettingsCardProps> = ({
  exploreTitle,
  setExploreTitle,
  exploreDescription,
  setExploreDescription,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Textos da Seção 'Explore Cardápio'</CardTitle>
        <CardDescription>Edite o título e a descrição da seção que leva ao cardápio completo.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="exploreTitle">Título da Seção</Label>
          <Input id="exploreTitle" value={exploreTitle} onChange={(e) => setExploreTitle(e.target.value)} placeholder="Ex: Explore Nosso Cardápio Completo" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="exploreDescription">Descrição da Seção</Label>
          <Textarea id="exploreDescription" value={exploreDescription} onChange={(e) => setExploreDescription(e.target.value)} rows={2} placeholder="Ex: Descubra todas as nossas deliciosas opções..." />
        </div>
      </CardContent>
    </Card>
  );
};

export default ExploreSectionSettingsCard;