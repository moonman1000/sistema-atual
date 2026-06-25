import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User as UserIcon, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";
import { useRestaurant } from '@/context/RestaurantContext'; // Importar useRestaurant
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { createLocalDate } from "@/lib/utils"; // Importar createLocalDate

const AdminProfilePage = () => {
  const { session, user, profile, isLoading: isLoadingSession, setMockSession, softRevalidateSession } = useSession(); // Added softRevalidateSession
  const { currentRestaurant, isLoadingRestaurants } = useRestaurant(); // Obter currentRestaurant
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(profile?.phone || "");

  useEffect(() => {
    if (!isLoadingSession) {
      if (!session) {
        navigate("/"); // Redireciona para a página principal
        toast.info("Você precisa estar logado para acessar esta página.");
      } else if (session && user && profile) {
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setEmail(user.email || "");
        setPhone(profile.phone || "");
      }
    }
  }, [session, user, profile, isLoadingSession, navigate]);

  if (isLoadingSession || isLoadingRestaurants || !session) {
    return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  }

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      toast.error("Você precisa estar logado para salvar as alterações.");
      return;
    }

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id); // RLS handles the security check (auth.uid() = id)

      if (profileError) {
        throw profileError;
      }

      // Update user metadata if names changed (optional, but good practice for Supabase Auth)
      if (user.user_metadata.first_name !== firstName || user.user_metadata.last_name !== lastName) {
        const { error: userError } = await supabase.auth.updateUser({
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        });
        if (userError) {
          // Log the error but don't necessarily fail the whole operation if profile update succeeded
          console.warn("Erro ao atualizar metadados do usuário:", userError);
        }
      }

      // Use softRevalidateSession to fetch the latest profile data and update the context
      await softRevalidateSession();

      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar alterações do perfil:", error);
      toast.error("Erro ao salvar alterações: " + error.message);
    }
  };

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

  const userAvatar = profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${firstName[0]}${lastName[0]}`;

  return (
    <div className="container py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={userAvatar} alt={`${firstName} ${lastName}`} />
            <AvatarFallback>{firstName[0]}{lastName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl font-bold">{firstName} {lastName}</CardTitle>
            <CardDescription>{email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <form onSubmit={handleSaveChanges} className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Número de Telefone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">Salvar Alterações</Button>
          </form>
          <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfilePage;