import React from "react";
import { Link } from "react-router-dom";
import { Card, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const QuickNavigationCards: React.FC = () => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="flex flex-col items-center justify-center p-6 text-center">
        <CardTitle className="text-lg font-semibold mb-2">
          Criar Novo Pedido
        </CardTitle>
        <CardDescription>
          Adicionar pedido para balcão ou telefone.
        </CardDescription>
        <Button className="mt-4" asChild>
          <Link to="/admin/pedidos">Novo Pedido</Link>
        </Button>
      </Card>

      <Card className="flex flex-col items-center justify-center p-6 text-center">
        <CardTitle className="text-lg font-semibold mb-2">
          Gerenciar Cardápio
        </CardTitle>
        <CardDescription>
          Atribuir rotas e acompanhar status.
        </CardDescription>
        <Button className="mt-4" asChild>
          <Link to="/admin/cardapio">Ir para Cardápio</Link>
        </Button>
      </Card>

      <Card className="flex flex-col items-center justify-center p-6 text-center">
        <CardTitle className="text-lg font-semibold mb-2">
          Relatórios
        </CardTitle>
        <CardDescription>
          Visualizar performance e métricas.
        </CardDescription>
        <Button className="mt-4" asChild>
          <Link to="/admin/relatorios">Ver Relatórios</Link>
        </Button>
      </Card>
    </div>
  );
};

export default QuickNavigationCards;