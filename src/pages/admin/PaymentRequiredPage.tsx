import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, LogOut } from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

const PaymentRequiredPage = () => {
  const { setMockSession } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao fazer logout: " + error.message);
    } else {
      toast.info("Você foi desconectado.");
      setMockSession(null, null);
      navigate("/"); // Redireciona para a página principal
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="mx-auto max-w-md text-center">
        <CardHeader>
          <CreditCard className="h-12 w-12 mx-auto text-destructive mb-4" />
          <CardTitle className="text-2xl font-bold">Pagamento Necessário</CardTitle>
          <CardDescription>
            Seu acesso ao painel administrativo está suspenso. Por favor, entre em contato com o suporte para regularizar seu pagamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Para restaurar o acesso, seu status de pagamento precisa ser atualizado por um Super Administrador.
          </p>
          <Button onClick={handleLogout} variant="outline" className="w-full">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
          <Button asChild className="w-full">
            <Link to="/support">Entrar em Contato com o Suporte</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentRequiredPage;