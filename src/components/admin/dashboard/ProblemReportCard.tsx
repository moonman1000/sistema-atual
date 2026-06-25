import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, X, CheckCircle, ChevronDown, RotateCcw } from "lucide-react"; // NOVO: Importar ChevronDown e RotateCcw
import { Delivery } from "@/context/DeliveryContext";
import { formatCurrency } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"; // NOVO: Importar DropdownMenu

interface ProblemReportCardProps {
  delivery: Delivery;
  onDismiss: (deliveryId: string, newStatus: Delivery["status"]) => void; // ATUALIZADO: onDismiss agora aceita o novo status
  onResolveProblem: (deliveryId: string, newStatus: Delivery["status"]) => void; // ATUALIZADO: onResolveProblem agora aceita o novo status
}

const ProblemReportCard: React.FC<ProblemReportCardProps> = ({ delivery, onDismiss, onResolveProblem }) => {
  return (
    <Card className="relative border-l-4 border-destructive bg-red-50/50 dark:bg-red-900/20 shadow-md">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => onDismiss(delivery.id, delivery.status)} // Descartar mantém o status atual
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Descartar</span>
      </Button>
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <div>
          <CardTitle className="text-lg text-destructive">
            Problema na Entrega #{delivery.orderid.substring(0, 8)}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Status: {delivery.status}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-foreground">
          **Motivo:** {delivery.problem_description || "Nenhum motivo fornecido."}
        </p>
        <p className="text-xs text-muted-foreground">
          Cliente: {delivery.clientname} | Entregador: {delivery.deliveryman}
        </p>
        <p className="text-xs text-muted-foreground">
          Endereço: {delivery.client_address}
        </p>
        
        {/* NOVO: Dropdown de Ações */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
            >
              <ChevronDown className="h-4 w-4 mr-2" /> Ações
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onResolveProblem(delivery.id, "Entregue")}>
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" /> Marcar como Resolvido (Entregue)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onResolveProblem(delivery.id, "Devolvido")}>
              <RotateCcw className="h-4 w-4 mr-2 text-orange-500" /> Marcar como Devolvido
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onResolveProblem(delivery.id, "Problema")}>
              <AlertCircle className="h-4 w-4 mr-2 text-destructive" /> Manter como Problema (Não Entregue)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
};

export default ProblemReportCard;