"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface OperationalHoursSettingsCardProps {
  openingHoursMonFri: string;
  setOpeningHoursMonFri: (hours: string) => void;
  openingHoursSatSun: string;
  setOpeningHoursSatSun: (hours: string) => void;
  isClosedOnHolidays: boolean;
  setIsClosedOnHolidays: (closed: boolean) => void;
}

const OperationalHoursSettingsCard: React.FC<OperationalHoursSettingsCardProps> = ({
  openingHoursMonFri,
  setOpeningHoursMonFri,
  openingHoursSatSun,
  setOpeningHoursSatSun,
  isClosedOnHolidays,
  setIsClosedOnHolidays,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Horário de Funcionamento</CardTitle>
        <CardDescription>Defina os horários de abertura e fechamento do seu restaurante.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="openingHoursMonFri">Segunda a Sexta</Label>
          <Input id="openingHoursMonFri" value={openingHoursMonFri} onChange={(e) => setOpeningHoursMonFri(e.target.value)} placeholder="Ex: 11:00 - 23:00" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="openingHoursSatSun">Sábados e Domingos</Label>
          <Input id="openingHoursSatSun" value={openingHoursSatSun} onChange={(e) => setOpeningHoursSatSun(e.target.value)} placeholder="Ex: 12:00 - 00:00" />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isClosedOnHolidays"
            checked={isClosedOnHolidays}
            onCheckedChange={setIsClosedOnHolidays}
          />
          <Label htmlFor="isClosedOnHolidays">Fechado em feriados</Label>
        </div>
      </CardContent>
    </Card>
  );
};

export default OperationalHoursSettingsCard;