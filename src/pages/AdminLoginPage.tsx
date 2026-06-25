"use client";

import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pizza, Loader2 } from "lucide-react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/context/SessionContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { session, isLoading } = useSession();

  // DEBUG: confirma que esta versão está rodando
  console.log("DEBUG: Versão Nova do Login Carregada. Sessão:", !!session);

  useEffect(() => {
    const handleAfterLogin = async () => {
      if (!session) return;

      const userId = session.user?.id;
      if (!userId) return;

      try {
        // 1) VERIFICAÇÃO PRIORITÁRIA: Profiles (admins)
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();

        if (profileError && (profileError as any).code !== "PGRST116") {
          // erro real (não simplesmente "no rows"); log e avisar
          console.error("Erro ao buscar profile:", profileError);
          toast.error("Erro ao verificar seu perfil. Tente novamente.");
        }

        if (profileData && (profileData.role === "admin" || profileData.role === "super_admin")) {
          console.log("Admin detectado via profile:", profileData.role);
          toast.info("Você está logado como administrador. Redirecionando...");
          navigate("/admin/dashboard");
          return; // <-- IMPORTANTE: evita que o restante rode
        }

        // 2) SE NÃO FOR ADMIN, VERIFICA EMPLOYEES (entregadores/funcionários)
        const { data: employeeData, error: employeeError } = await supabase
          .from("employees")
          .select("role")
          .eq("id", userId)
          .single();

        if (employeeError && (employeeError as any).code !== "PGRST116") {
          console.error("Erro ao buscar employee:", employeeError);
        }

        if (employeeData) {
          if (employeeData.role === "Entregador") {
            toast.success("Login como entregador bem-sucedido.");
            navigate("/driver");
            return;
          }
          if (["Gerente", "Atendente", "Admin"].includes(employeeData.role)) {
            toast.info("Login de funcionário bem-sucedido.");
            navigate("/admin/dashboard");
            return;
          }
        }

        // 3) SE FOR CLIENTE (opcional)
        if (profileData?.role === "customer") {
          toast.success("Login de cliente bem-sucedido!");
          navigate("/profile");
          return;
        }

        // 4) CASO NÃO SEJA NENHUMA DAS OPÇÕES ACIMA
        if (!isLoading) {
          toast.error("Acesso não autorizado — usuário não vinculado como administrador ou funcionário.");
          await supabase.auth.signOut();
        }
      } catch (err) {
        console.error("Erro crítico no login:", err);
      }
    };

    handleAfterLogin();
  }, [session, isLoading, navigate]);

  if (session && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Validando permissões de acesso...</p>
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
          <CardDescription>Faça login para gerenciar seu estabelecimento.</CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{ theme: ThemeSupa }}
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