"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RegionalSettingsCardProps {
  language: string;
  setLanguage: (lang: string) => void;
  timezone: string;
  setTimezone: (zone: string) => void;
}

const RegionalSettingsCard: React.FC<RegionalSettingsCardProps> = ({
  language,
  setLanguage,
  timezone,
  setTimezone,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações Regionais</CardTitle>
        <CardDescription>Ajuste as configurações de idioma e fuso horário.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="language">Idioma</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="language">
              <SelectValue placeholder="Selecione o idioma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
              <SelectItem value="en-US">English (US)</SelectItem>
              <SelectItem value="es-ES">Español (España)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="timezone">Fuso Horário</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger id="timezone">
              <SelectValue placeholder="Selecione o fuso horário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="America/Sao_Paulo">America/Sao_Paulo (GMT-3)</SelectItem>
              <SelectItem value="America/New_York">America/New_York (GMT-4)</SelectItem>
              <SelectItem value="Europe/London">Europe/London (GMT+1)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegionalSettingsCard;