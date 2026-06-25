"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Restaurant } from "@/context/RestaurantContext";

interface GeneralSettingsCardProps {
  restaurantName: string;
  setRestaurantName: (name: string) => void;
  address: string;
  setAddress: (address: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  email: string;
  setEmail: (email: string) => void;
  description: string;
  setDescription: (description: string) => void;
  slug: string;
  setSlug: (slug: string) => void;
  restaurantType: Restaurant['type'];
  setRestaurantType: (type: Restaurant['type']) => void;
}

const GeneralSettingsCard: React.FC<GeneralSettingsCardProps> = ({
  restaurantName,
  setRestaurantName,
  address,
  setAddress,
  phone,
  setPhone,
  email,
  setEmail,
  description,
  setDescription,
  slug,
  setSlug,
  restaurantType,
  setRestaurantType,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações Gerais do Restaurante</CardTitle>
        <CardDescription>Gerencie os detalhes básicos do seu restaurante.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="restaurantName">Nome do Estabelecimento</Label>
          <Input id="restaurantName" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="slug">Nome da Loja (URL Slug)</Label>
          <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ex: pizza-palace-sp" />
          <p className="text-xs text-muted-foreground">A URL da sua loja será: /loja/{slug}</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="address">Endereço</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail de Contato</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Descrição Curta</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="restaurantType">Tipo de Estabelecimento</Label>
          <Select value={restaurantType} onValueChange={(value: Restaurant['type']) => setRestaurantType(value)}>
            <SelectTrigger id="restaurantType">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="restaurant">Restaurante</SelectItem>
              <SelectItem value="cafe">Café</SelectItem>
              <SelectItem value="bar">Bar</SelectItem>
              <SelectItem value="pharmacy">Farmácia</SelectItem>
              <SelectItem value="market">Mercado</SelectItem>
              <SelectItem value="petshop">Petshop</SelectItem>
              <SelectItem value="service">Serviço</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralSettingsCard;