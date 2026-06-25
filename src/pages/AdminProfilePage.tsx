"use client";

import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pizza, Loader2 } from "lucide-react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/context/SessionContext";
import { useRestaurant } from "@/context/RestaurantContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { session, isLoading, isCustomer, isAdmin, isSuperAdmin, profile } = useSession();
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant();

  const [authKey, setAuthKey] = useState(0);

  useEffect(() => {
    // Se já existe sessão + profile o efeito abaixo cuida do redirecionamento.
  }, []);

  useEffect(() => {
    // Quando recebemos uma sessão — seja via useSession ou diretamente — garantimos
    // que há um employee vinculado OU que o usuário é admin (caso contrário, negar acesso).
    const handleAfterLogin = async () => {
      if (!session) return;

      // 1) Se já temos profile no contexto, usar prioridade absoluta ao papel do profile
      if (profile) {
        if (isAdmin || isSuperAdmin) {
          toast.info("Você está logado como administrador. Redirecionando...");
          navigate("/admin/dashboard");
          return; // importante: encerrar aqui
        }
        if (isCustomer) {
          toast.success("Login bem-sucedido!");
          navigate("/profile");
          return;
        }
        // profile existe mas papel desconhecido -> avisar
        console.error("AdminLoginPage: Perfil com papel desconhecido:", profile.role, "ID:", profile.id);
        toast.error("Função de usuário desconhecida. Contate o suporte.");
        return;
      }

      // 2) Se não temos profile ainda, verificar rapidamente metadados da sessão para admin
      //    (isso evita que o fallback para employees desconecte um admin antes do profile chegar)
      const userRoleFromSession =
        session.user?.app_metadata?.role || session.user?.user_metadata?.role || undefined;

      if (userRoleFromSession === "admin" || userRoleFromSession === "super_admin") {
        // Garantimos uma navegação imediata para admin caso a sessão traga esse metadado
        toast.info("Você está logado como administrador. Redirecionando...");
        navigate("/admin/dashboard");
        return;
      }

      // 3) Fallback: se não for admin via metadados, então consultamos employees
      try {
        const userId = session.user?.id;
        if (!userId) {
          console.error("AdminLoginPage: session.user.id indefinido");
          return;
        }

        const { data, error } = await supabase
          .from("employees")
          .select("role, restaurant_id")
          .eq("id", userId)
          .single();

        if (error && error.code !== "PGRST116") {
          // erro real (não apenas 'no rows')
          console.error("Erro ao buscar employee:", error);
          toast.error("Erro ao verificar permissões. Tente novamente.");
          return;
        }

        if (!data) {
          // NÃO encontramos employee — porém não somos rápidos em negar: só negamos se já
          // terminaram todos os carregamentos e não há indicação de admin.
          if (!isLoading && !isLoadingRestaurants) {
            // Não há profile (vimos acima), não há employee e não há metadados de admin => negar
            toast.error("Acesso não autorizado — usuário não vinculado como funcionário.");
            await supabase.auth.signOut();
          } else {
            // Ainda pode estar carregando; aguardar outra rodada do effect
            console.log("AdminLoginPage: employee não encontrado mas ainda carregando contextos. Aguardando.");
          }
          return;
        }

        // Se encontramos employee, decidir rota pelo papel do employee
        const role: string = data.role;
        if (role === "Entregador") {
          toast.success("Login como entregador bem-sucedido.");
          navigate("/driver");
          return;
        }

        if (["Gerente", "Atendente", "Admin"].includes(role)) {
          toast.info("Login administrativo bem-sucedido. Redirecionando...");
          navigate("/admin/dashboard");
          return;
        }

        // Se role está presente mas não reconhecido, fallback para admin dashboard
        toast.info("Login efetuado. Redirecionando...");
        navigate("/admin/dashboard");
      } catch (err) {
        console.error("Erro no pós-login:", err);
        toast.error("Erro no processo de login. Tente novamente.");
      }
    };

    // chamamos a rotina sempre que a sessão ou profile mudarem
    handleAfterLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, profile, isCustomer, isAdmin, isSuperAdmin, isLoading, isLoadingRestaurants, navigate]);

  // Se há sessão ativa e não estamos carregando, mostramos um estado de redirecionamento
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Pizza className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Área Administrativa</CardTitle>
          <CardDescription>
            Faça login ou crie uma conta para gerenciar seu estabelecimento.
          </CardDescription>
        </CardHeader>

        <CardContent>
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
          />

          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">Voltar para a Página Inicial</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginPage;