"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pizza, Loader2 } from "lucide-react";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/context/SessionContext';
import { toast } from "sonner";
import { useRestaurant } from '@/context/RestaurantContext';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { session, isLoading, isCustomer, isAdmin, isSuperAdmin, profile } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();

  useEffect(() => {
    if (!isLoading && session) {
      if (profile) {
        if (isSuperAdmin) {
          toast.info("Você está logado como Super Administrador. Redirecionando para sua área.");
          navigate("/super-admin/manage-profiles");
        } else if (isCustomer) {
          toast.success("Senha redefinida com sucesso! Redirecionando para o perfil.");
          navigate("/profile");
        } else if (isAdmin) {
          toast.info("Você está logado como administrador. Redirecionando para sua área.");
          navigate("/admin/dashboard");
        } else {
          console.error("ResetPasswordPage: Usuário com perfil, mas papel desconhecido:", profile.role);
          toast.error("Acesso negado. Função de usuário desconhecida. Por favor, entre em contato com o suporte.");
        }
      } else {
        console.log("ResetPasswordPage: Sessão ativa, mas perfil é nulo. Aguardando o SessionContext resolver.");
      }
    }
  }, [session, isLoading, isCustomer, isAdmin, isSuperAdmin, navigate, profile]);

  if (isLoading || isLoadingRestaurants) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="mx-auto max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-2">
            <Pizza className="h-8 w-8 mr-2 text-primary" />
            <CardTitle className="text-2xl font-bold">Redefinir Senha</CardTitle>
          </div>
          <CardDescription>Digite sua nova senha abaixo.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isLoadingRestaurants ? (
            <Auth
              supabaseClient={supabase}
              providers={[]}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'hsl(var(--primary))',
                      brandAccent: 'hsl(var(--primary-foreground))',
                    },
                  },
                },
              }}
              theme="light"
              view="update_password"
              redirectTo={window.location.origin + '/customer-login'}
              data={{
                restaurant_id: currentRestaurant?.id,
              }}
            />
          ) : (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Carregando dados do restaurante...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;