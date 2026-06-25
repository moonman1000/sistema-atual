"use client";

import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Importar useParams
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pizza, Loader2 } from "lucide-react";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/context/SessionContext';
import { toast } from "sonner";
import { useRestaurant } from '@/context/RestaurantContext';

const PostCheckoutAuthPage = () => {
  const navigate = useNavigate();
  const { session, isLoading, isCustomer, isAdmin, profile } = useSession();
  const { currentRestaurant, isLoadingRestaurants, allRestaurants } = useRestaurant();
  const { restaurantId: restaurantIdFromParams } = useParams<{ restaurantId: string }>(); // Obter restaurantId da URL

  useEffect(() => {
    if (!isLoading && session) {
      if (profile) {
        if (isCustomer) {
          toast.success("Login/Cadastro bem-sucedido!");
          navigate("/profile");
        } else if (isAdmin) {
          toast.info("Você está logado como administrador. Redirecionando para sua área.");
          navigate("/admin/dashboard");
        } else {
          console.error("PostCheckoutAuthPage: Usuário com perfil, mas papel desconhecido:", profile.role);
          toast.error("Acesso negado. Função de usuário desconhecida. Por favor, entre em contato com o suporte.");
        }
      } else {
        console.log("PostCheckoutAuthPage: Sessão ativa, mas perfil é nulo. Aguardando o SessionContext resolver.");
      }
    }
  }, [session, isLoading, isCustomer, isAdmin, navigate, profile]);

  if (isLoading || isLoadingRestaurants) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando...</p>
      </div>
    );
  }

  // Determina o restaurant_id a ser passado para o Auth component (deve ser o UUID)
  const restaurantIdForAuth = currentRestaurant?.id || null;
  
  if (!restaurantIdForAuth && restaurantIdFromParams && allRestaurants.length > 0) {
    if (!currentRestaurant) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
          <Card className="mx-auto max-w-sm text-center">
            <CardHeader className="space-y-1">
              <Pizza className="h-8 w-8 mx-auto text-primary mb-2" />
              <CardTitle className="text-2xl font-bold">Estabelecimento Não Encontrado</CardTitle>
              <CardDescription>
                Não foi possível carregar os dados do estabelecimento. Verifique a URL.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }
  }

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Card className="mx-auto max-w-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-2">
              <Pizza className="h-8 w-8 mr-2 text-primary" />
              <CardTitle className="text-2xl font-bold">Finalize seu Pedido</CardTitle>
            </div>
            <CardDescription>Crie uma conta ou faça login para gerenciar seus pedidos.</CardDescription>
          </CardHeader>
          <CardContent>
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
                }}
              }
              theme="light"
              redirectTo={window.location.origin + '/profile'}
              data={restaurantIdForAuth ? { restaurant_id: restaurantIdForAuth } : undefined}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PostCheckoutAuthPage;