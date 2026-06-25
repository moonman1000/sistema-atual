"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FeaturedPizzasTitleSettingsCardProps {
  featuredPizzasTitle: string;
  setFeaturedPizzasTitle: (title: string) => void;
}

const FeaturedPizzasTitleSettingsCard: React.FC<FeaturedPizzasTitleSettingsCardProps> = ({
  featuredPizzasTitle,
  setFeaturedPizzasTitle,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Título da Seção 'Pizzas em Destaque'</CardTitle>
        <CardDescription>Edite o título da seção de pizzas em destaque na página inicial.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="featuredPizzasTitle">Título</Label>
          <Input id="featuredPizzasTitle" value={featuredPizzasTitle} onChange={(e) => setFeaturedPizzasTitle(e.target.value)} placeholder="Ex: Nossas Pizzas Favoritas" />
        </div>
      </CardContent>
    </Card>
  );
};

export default FeaturedPizzasTitleSettingsCard;