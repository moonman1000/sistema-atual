"use client";

import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pizza, Loader2, AlertCircle } from "lucide-react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/context/SessionContext";
import { useRestaurant } from "@/context/RestaurantContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CustomerLoginPage = () => {
  const navigate = useNavigate();
  const { session, isLoading, isCustomer, isAdmin, isSuperAdmin, profile } = useSession();
  const { currentRestaurant, isLoadingRestaurants, allRestaurants } = useRestaurant();
  const { restaurantId: restaurantIdFromParams } = useParams<{ restaurantId: string }>();

  const [authKey, setAuthKey] = useState(0);
  const restaurantIdForAuth = currentRestaurant?.id || null;

  useEffect(() => {
    if (restaurantIdForAuth) setAuthKey(prev => prev + 1);
  }, [restaurantIdForAuth]);

  useEffect(() => {
    if (!isLoading && session) {
      if (profile) {
        if (isCustomer) {
          toast.success("Login ou cadastro de cliente bem-sucedido!");
          navigate("/profile");
        } else if (isAdmin || isSuperAdmin) {
          toast.info("Você está logado como administrador. Redirecionando...");
          navigate("/admin/dashboard");
        } else {
          toast.error("Função de usuário desconhecida. Contate o suporte.");
        }
      }
    }
  }, [session, isLoading, profile, isCustomer, isAdmin, isSuperAdmin, navigate]);

  const restaurantNotFound =
    restaurantIdFromParams && !isLoadingRestaurants && !currentRestaurant && allRestaurants.length > 0;
  const shouldBlockAuth = restaurantIdFromParams && (!currentRestaurant || !restaurantIdForAuth);

  if (session && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Redirecionando...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || isLoadingRestaurants) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Carregando...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (restaurantNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Restaurante não encontrado</CardTitle>
            <CardDescription>
              O restaurante "{restaurantIdFromParams}" não foi encontrado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Voltar para a Página Inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Pizza className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Área do Cliente</CardTitle>
          <CardDescription>
            {currentRestaurant ? (
              <>
                Faça login ou crie uma conta em <strong>{currentRestaurant.name}</strong>
              </>
            ) : (
              "Faça login ou crie uma conta"
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {shouldBlockAuth ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Não foi possível identificar o restaurante.  
                Por favor, acesse através do link correto do estabelecimento.
              </AlertDescription>
            </Alert>
          ) : restaurantIdForAuth ? (
            <>
              <Auth
                key={authKey}
                supabaseClient={supabase}
                providers={[]}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: "hsl(var(--primary))",
                        brandAccent: "hsl(var(--primary-foreground))",
                      },
                    },
                  },
                }}
                theme="light"
                redirectTo={window.location.origin + "/profile"}
                additionalData={{ restaurant_id: restaurantIdForAuth }}
              />
            </>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Não foi possível carregar as informações do restaurante.  
                Por favor, tente novamente ou entre em contato com o suporte.
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" asChild>
              <Link to={currentRestaurant ? `/loja/${currentRestaurant.slug}` : "/"}>
                Voltar para {currentRestaurant ? currentRestaurant.name : "a Página Inicial"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerLoginPage;