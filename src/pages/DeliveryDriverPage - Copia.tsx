"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Truck, CheckCircle, XCircle, AlertCircle, LogOut, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useDeliveries, Delivery } from "@/context/DeliveryContext";
import { useOrders } from "@/context/OrderContext";
import { useRestaurant } from "@/context/RestaurantContext";
import { getBusinessDateString, cn, slugify } from "@/lib/utils"; // Importar slugify
import OrderTrackingMap from "@/components/sales/OrderTrackingMap";
import { supabase } from '@/integrations/supabase/client'; // Importar supabase client para chamar a Edge Function
import { Textarea } from "@/components/ui/textarea"; // NOVO: Importar Textarea
import { Label } from "@/components/ui/label"; // NOVO: Importar Label
import { useSession } from '@/context/SessionContext'; // NOVO: Importar useSession

const DeliveryDriverPage = () => {
  const { deliveries, isLoadingDeliveries, fetchDeliveries, updateDelivery } = useDeliveries();
  const { orders, isLoadingOrders, updateOrder } = useOrders();
  const { currentRestaurant, isLoadingRestaurants, setCurrentRestaurant, allRestaurants } = useRestaurant(); // Adicionado allRestaurants
  const { softRevalidateSession } = useSession(); // NOVO: Obter softRevalidateSession

  const [driverName, setDriverName] = useState<string>(localStorage.getItem('deliveryDriverName') || '');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!localStorage.getItem('deliveryDriverName'));
  const [loginInput, setLoginInput] = useState<string>('');
  const [restaurantIdentifierInput, setRestaurantIdentifierInput] = useState<string>(localStorage.getItem('deliveryDriverRestaurantId') || '');
  const [showMapForDelivery, setShowMapForDelivery] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [problemDescription, setProblemDescription] = useState<string>(''); // NOVO: Estado para a descrição do problema
  const [activeProblemDeliveryId, setActiveProblemDeliveryId] = useState<string | null>(null); // NOVO: Para qual entrega a descrição se refere
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<Delivery["status"] | null>(null); // NOVO: Status pendente para atualização

  const isLoading = isLoadingDeliveries || isLoadingOrders || isLoadingRestaurants;

  // Helper para resolver o identificador do restaurante para um ID (UUID)
  const resolveRestaurantIdentifierToId = useCallback((identifier: string): string | undefined => {
    // 1. Limpar o identificador: remover prefixos de caminho se presentes
    let cleanedIdentifier = identifier.startsWith('/') ? identifier.split('/').pop() : identifier;
    if (!cleanedIdentifier) return undefined;

    // 2. Tentar encontrar por slug exato
    let foundRestaurant = allRestaurants.find(r => r.slug === cleanedIdentifier);

    // 3. Se não encontrado, tentar por slug normalizado
    if (!foundRestaurant) {
        const normalizedIdentifier = slugify(cleanedIdentifier);
        if (normalizedIdentifier !== cleanedIdentifier) { // Só tenta se slugify realmente mudou algo
            foundRestaurant = allRestaurants.find(r => r.slug === normalizedIdentifier);
        }
    }

    // 4. Se ainda não encontrado, e parece um UUID, tentar por ID
    if (!foundRestaurant && cleanedIdentifier.length === 36 && cleanedIdentifier.includes('-')) {
        foundRestaurant = allRestaurants.find(r => r.id === cleanedIdentifier);
    }

    return foundRestaurant?.id;
  }, [allRestaurants]);

  // Efeito para buscar entregas quando o entregador faz login ou o restaurante muda
  useEffect(() => {
    if (isLoggedIn && driverName && currentRestaurant?.id) {
      fetchDeliveries(currentRestaurant.id);
    }
  }, [isLoggedIn, driverName, currentRestaurant?.id, fetchDeliveries]);

  const handleLogin = async () => {
    if (!loginInput.trim()) {
      toast.error("Por favor, digite seu nome.");
      return;
    }
    if (!restaurantIdentifierInput.trim()) {
      toast.error("Por favor, digite o ID ou Slug do restaurante.");
      return;
    }

    setIsLoggingIn(true);
    try {
      // RESOLVER O IDENTIFICADOR DO RESTAURANTE PARA O ID (UUID) AQUI
      const resolvedRestaurantId = resolveRestaurantIdentifierToId(restaurantIdentifierInput.trim());

      if (!resolvedRestaurantId) {
        toast.error("Restaurante não encontrado. Verifique o ID ou Slug do restaurante.");
        setIsLoggingIn(false);
        return;
      }

      // Chamar a Edge Function para verificar o login com o ID resolvido
      const { data, error } = await supabase.functions.invoke('verify-driver-login', {
        body: {
          restaurantId: resolvedRestaurantId, // USAR O ID RESOLVIDO
          driverName: loginInput.trim(),
        },
      });

      if (error) {
        console.error("Erro ao invocar Edge Function:", error);
        toast.error("Erro no servidor ao tentar login.");
        return;
      }

      if (data.success) {
        setDriverName(data.driverName);
        setIsLoggedIn(true);
        localStorage.setItem('deliveryDriverName', data.driverName);
        localStorage.setItem('deliveryDriverRestaurantId', restaurantIdentifierInput.trim()); // Salvar o identificador original para o RestaurantContext
        toast.success(`Bem-vindo, ${data.driverName}!`);
        // NOVO: Forçar o RestaurantContext a reavaliar o currentRestaurant
        await softRevalidateSession();
      } else {
        toast.error("Nome de entregador não encontrado ou inativo. Verifique seu nome e o ID/Slug do restaurante.");
      }
    } catch (error) {
      console.error("Erro inesperado no login:", error);
      toast.error("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setDriverName('');
    setIsLoggedIn(false);
    setLoginInput('');
    setRestaurantIdentifierInput('');
    localStorage.removeItem('deliveryDriverName');
    localStorage.removeItem('deliveryDriverRestaurantId');
    toast.info("Você foi desconectado.");
    setCurrentRestaurant(null);
  };

  const currentBusinessDate = getBusinessDateString();

  const assignedDeliveries = useMemo(() => {
    if (!isLoggedIn || !driverName || !deliveries) return [];

    const businessDateString = currentBusinessDate;

    return deliveries.filter(
      (delivery) => {
        const deliveryCreatedAtDateString = delivery.created_at?.split('T')[0];

        const isSameBusinessDay = deliveryCreatedAtDateString === businessDateString;

        return (
          delivery.deliveryman.toLowerCase() === driverName.toLowerCase() &&
          delivery.status !== "Entregue" &&
          delivery.status !== "Cancelado" &&
          delivery.problem_resolved === false && // NOVO: Filtrar por problem_resolved
          isSameBusinessDay
        );
      }
    ).sort((a, b) => new Date(a.estimateddeliverytime).getTime() - new Date(b.estimateddeliverytime).getTime());
  }, [isLoggedIn, driverName, deliveries, currentBusinessDate]);

  const handleUpdateStatus = async (delivery: Delivery, newStatus: Delivery["status"]) => {
    if (!currentRestaurant?.id) {
      toast.error("Dados do restaurante não disponíveis.");
      return;
    }

    let descriptionToSend: string | undefined = undefined;
    let problemResolvedStatus: boolean = false; // NOVO: Estado para problem_resolved

    if ((newStatus === "Problema" || newStatus === "Recusado")) {
      descriptionToSend = problemDescription.trim();
      if (!descriptionToSend) {
        toast.error("Por favor, descreva o motivo do problema/recusa.");
        return;
      }
      problemResolvedStatus = false; // Se é problema/recusado, não está resolvido
    } else if (newStatus === "Entregue") {
      problemResolvedStatus = true; // Se entregue, o problema (se houver) está resolvido
    }


    const updatedDelivery: Delivery = {
      ...delivery,
      status: newStatus,
      actualdeliverytime: newStatus === "Entregue" ? new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : undefined,
      problem_description: descriptionToSend,
      problem_resolved: problemResolvedStatus, // NOVO: Enviar o status de resolução
      updated_at: new Date().toISOString(),
    };

    try {
      await updateDelivery(updatedDelivery);
      toast.success(`Entrega ${delivery.orderid} atualizada para "${newStatus}"!`);

      const orderToUpdate = orders.find(o => o.id === delivery.orderid);
      if (orderToUpdate && orderToUpdate.status !== newStatus) {
        await updateOrder({ ...orderToUpdate, status: newStatus });
      }
      setProblemDescription(''); // Limpar o campo de descrição
      setActiveProblemDeliveryId(null); // Resetar o ID da entrega com problema
      setPendingStatusUpdate(null); // Resetar status pendente
    } catch (error) {
      console.error("Erro ao atualizar status da entrega:", error);
      toast.error("Falha ao atualizar status da entrega.");
    }
  };

  const getStatusBadgeVariant = (status: Delivery["status"]) => {
    switch (status) {
      case "Atribuído": return "default";
      case "Em Entrega": return "secondary";
      case "Entregue": return "success";
      case "Problema": return "destructive";
      case "Recusado": // ADICIONADO: Recusado
        return "destructive";
      default: return "outline";
    }
  };

  // NOVO: Função para alternar a visibilidade do campo de descrição e definir o status pendente
  const handleProblemButtonClick = (deliveryId: string, statusToSet: Delivery["status"], currentDescription?: string) => {
    if (activeProblemDeliveryId === deliveryId && pendingStatusUpdate === statusToSet) {
      // Se já está aberto para esta entrega e este status, fechar
      setActiveProblemDeliveryId(null);
      setProblemDescription('');
      setPendingStatusUpdate(null);
    } else {
      // Abrir para esta entrega e definir o status pendente
      setActiveProblemDeliveryId(deliveryId);
      setProblemDescription(currentDescription || '');
      setPendingStatusUpdate(statusToSet);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando dados...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Truck className="h-12 w-12 mx-auto text-primary mb-4" />
            <CardTitle className="text-2xl font-bold">Login do Entregador</CardTitle>
            <CardDescription>Digite seu nome e o identificador do restaurante para acessar suas entregas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Seu nome completo"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              disabled={isLoggingIn}
            />
            <Input
              placeholder="ID ou Slug do Restaurante"
              value={restaurantIdentifierInput}
              onChange={(e) => setRestaurantIdentifierInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              disabled={isLoggingIn}
            />
            <Button onClick={handleLogin} className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Truck className="h-7 w-7" /> Minhas Entregas ({driverName})
        </h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Sair
        </Button>
      </div>

      <CardDescription>
        Entregas atribuídas a você para o dia de negócio atual ({currentBusinessDate}).
      </CardDescription>

      {assignedDeliveries.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <h3 className="text-xl font-semibold mb-2">Nenhuma entrega atribuída para hoje.</h3>
          <p className="text-muted-foreground">Aproveite seu dia ou aguarde novas atribuições!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {assignedDeliveries.map((delivery) => (
            <Card key={delivery.id} className="shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Pedido: {delivery.orderid}</CardTitle>
                <Badge variant={getStatusBadgeVariant(delivery.status)}>{delivery.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Cliente: <span className="font-medium text-foreground">{delivery.clientname}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Endereço: <span className="font-medium text-foreground">{delivery.client_address}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Estimativa: <span className="font-medium text-foreground">{delivery.estimateddeliverytime}</span>
                </p>

                {delivery.trackinglink && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <Button variant="link" className="p-0 h-auto" onClick={() => setShowMapForDelivery(showMapForDelivery === delivery.id ? null : delivery.id)}>
                      {showMapForDelivery === delivery.id ? "Esconder mapa" : "Ver no mapa"}
                    </Button>
                  </div>
                )}

                {showMapForDelivery === delivery.id && delivery.trackinglink && (
                  <div className="mt-4">
                    <OrderTrackingMap trackinglink={delivery.trackinglink} />
                  </div>
                )}

                {/* NOVO: Campo de descrição do problema */}
                {(activeProblemDeliveryId === delivery.id && (pendingStatusUpdate === "Problema" || pendingStatusUpdate === "Recusado")) && (
                  <div className="space-y-2 mt-4">
                    <Label htmlFor={`problem-description-${delivery.id}`}>Motivo do {pendingStatusUpdate === "Recusado" ? "Recusa" : "Problema"}</Label>
                    <Textarea
                      id={`problem-description-${delivery.id}`}
                      value={problemDescription}
                      onChange={(e) => setProblemDescription(e.target.value)}
                      placeholder="Descreva o motivo..."
                      rows={3}
                    />
                    <Button
                      onClick={() => pendingStatusUpdate && handleUpdateStatus(delivery, pendingStatusUpdate)}
                      className={cn(
                        "w-full",
                        pendingStatusUpdate === "Recusado" ? "bg-red-500 hover:bg-red-600 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"
                      )}
                    >
                      Confirmar {pendingStatusUpdate === "Recusado" ? "Recusa" : "Problema"}
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-4 border-t mt-4">
                  <Button
                    onClick={() => handleUpdateStatus(delivery, "Entregue")}
                    className="bg-green-500 hover:bg-green-600 text-white flex-1 min-w-[120px]"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Entregue
                  </Button>
                  <Button
                    onClick={() => handleProblemButtonClick(delivery.id, "Recusado", delivery.problem_description)}
                    className={cn(
                      "flex-1 min-w-[120px]",
                      activeProblemDeliveryId === delivery.id && pendingStatusUpdate === "Recusado" ? "bg-red-700" : "bg-red-500 hover:bg-red-600 text-white"
                    )}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Recusado
                  </Button>
                  <Button
                    onClick={() => handleProblemButtonClick(delivery.id, "Problema", delivery.problem_description)}
                    variant="outline"
                    className={cn(
                      "flex-1 min-w-[120px]",
                      activeProblemDeliveryId === delivery.id && pendingStatusUpdate === "Problema" ? "bg-orange-500 hover:bg-orange-600 text-white" : ""
                    )}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" /> Problema
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryDriverPage;