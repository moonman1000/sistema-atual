"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface NotificationSettingsCardProps {
  receiveOrderNotifications: boolean;
  setReceiveOrderNotifications: (receive: boolean) => void;
  receiveDeliveryNotifications: boolean;
  setReceiveDeliveryNotifications: (receive: boolean) => void;
  notificationEmail: string;
  setNotificationEmail: (email: string) => void;
}

const NotificationSettingsCard: React.FC<NotificationSettingsCardProps> = ({
  receiveOrderNotifications,
  setReceiveOrderNotifications,
  receiveDeliveryNotifications,
  setReceiveDeliveryNotifications,
  notificationEmail,
  setNotificationEmail,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Notificação</CardTitle>
        <CardDescription>Gerencie como você recebe alertas sobre pedidos e entregas.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="receiveOrderNotifications"
            checked={receiveOrderNotifications}
            onCheckedChange={setReceiveOrderNotifications}
          />
          <Label htmlFor="receiveOrderNotifications">Receber notificações de novos pedidos</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="receiveDeliveryNotifications"
            checked={receiveDeliveryNotifications}
            onCheckedChange={setReceiveDeliveryNotifications}
          />
          <Label htmlFor="receiveDeliveryNotifications">Receber notificações de status de entrega</Label>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="notificationEmail">E-mail para Notificações</Label>
          <Input id="notificationEmail" type="email" value={notificationEmail} onChange={(e) => setNotificationEmail(e.target.value)} />
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettingsCard;