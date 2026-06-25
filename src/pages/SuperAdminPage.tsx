import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, MoreHorizontal, User as UserIcon, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/context/SessionContext';
import EditProfileRoleDialog from "@/components/admin/EditProfileRoleDialog"; // Importar o novo diálogo

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: 'admin' | 'customer' | 'super_admin';
  restaurant_id?: string;
  is_paid: boolean; // NOVO: Adicionado status de pagamento
}

const SuperAdminPage = () => {
  const { session, isSuperAdmin, isLoading: isLoadingSession, softRevalidateSession } = useSession();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("Todos");
  const [filterPaidStatus, setFilterPaidStatus] = useState("Todos"); // NOVO: Estado para filtro de pagamento
  const [sortBy, setSortBy] = useState("name-asc");
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  const fetchProfiles = async () => {
    setIsLoadingProfiles(true);
    console.log("SuperAdminPage: Fetching all profiles...");

    if (!session || !isSuperAdmin) {
      setProfiles([]);
      setIsLoadingProfiles(false);
      console.log("SuperAdminPage: Not authorized as super_admin, clearing profiles.");
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('first_name', { ascending: true });

    if (error) {
      console.error("SuperAdminPage: Erro ao carregar perfis:", error);
      toast.error("Erro ao carregar perfis.");
      setProfiles([]);
    } else {
      setProfiles(data as Profile[]);
      console.log("SuperAdminPage: Perfis carregados com sucesso:", data);
    }
    setIsLoadingProfiles(false);
  };

  useEffect(() => {
    let cancelled = false;
    const runFetch = async () => {
      if (isLoadingSession) {
        if (!cancelled) {
          setProfiles([]);
          setIsLoadingProfiles(true);
        }
        return;
      }
      if (session && isSuperAdmin) {
        await fetchProfiles();
      } else {
        if (!cancelled) {
          setProfiles([]);
          setIsLoadingProfiles(false);
        }
      }
    };
    runFetch();
    return () => { cancelled = true; };
  }, [isLoadingSession, session, isSuperAdmin]);

  const filteredProfiles = useMemo(() => {
    let currentProfiles = profiles;

    if (searchTerm) {
      currentProfiles = currentProfiles.filter(
        (profile) =>
          profile.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== "Todos") {
      currentProfiles = currentProfiles.filter((profile) => profile.role === filterRole);
    }

    if (filterPaidStatus !== "Todos") { // NOVO: Filtrar por status de pagamento
      const isPaidFilter = filterPaidStatus === "Pago";
      currentProfiles = currentProfiles.filter((profile) => profile.is_paid === isPaidFilter);
    }

    currentProfiles.sort((a, b) => {
      const nameA = `${a.first_name} ${a.last_name}`;
      const nameB = `${b.first_name} ${b.last_name}`;
      if (sortBy === "name-asc") {
        return nameA.localeCompare(nameB);
      }
      if (sortBy === "name-desc") {
        return nameB.localeCompare(nameA) * -1;
      }
      return 0;
    });

    return currentProfiles;
  }, [searchTerm, filterRole, filterPaidStatus, sortBy, profiles]); // NOVO: Adicionado filterPaidStatus

  const getRoleBadgeVariant = (role: Profile["role"]) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "admin":
        return "default";
      case "customer":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getPaidStatusBadgeClasses = (isPaid: boolean) => { // ATUALIZADO: Retorna classes Tailwind
    return isPaid ? "bg-green-500 text-white" : "bg-red-500 text-white";
  };

  const handleUpdateProfile = async (updatedProfile: Profile) => { // NOVO: Função para atualizar o perfil completo
    if (!session || !isSuperAdmin) {
      toast.error("Acesso não autorizado. Apenas Super Administradores podem alterar funções e status de pagamento.");
      throw new Error("Unauthorized access.");
    }

    setIsLoadingProfiles(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: updatedProfile.role,
          is_paid: updatedProfile.is_paid, // NOVO: Atualizar is_paid
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedProfile.id);

      if (error) {
        throw error;
      }
      toast.success(`Perfil de ${updatedProfile.first_name} ${updatedProfile.last_name} atualizado com sucesso!`);
      await fetchProfiles(); // Recarregar a lista de perfis
      if (updatedProfile.id === session.user.id) {
        await softRevalidateSession(); // Se o próprio super admin mudou sua função, revalidar a sessão
      }
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil: " + error.message);
      throw error;
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const openEditRoleDialog = (profile: Profile) => {
    setEditingProfile(profile);
    setIsEditRoleDialogOpen(true);
  };

  if (isLoadingProfiles || isLoadingSession) {
    return <div className="flex min-h-screen items-center justify-center">Carregando perfis...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Administradores e Usuários</h1>
        <Button variant="outline" onClick={fetchProfiles}>
          <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Buscar por nome, e-mail ou telefone..."
          className="max-w-sm flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Função: {filterRole === "super_admin" ? "Super Admin" : filterRole === "admin" ? "Admin" : filterRole === "customer" ? "Cliente" : "Todos"} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilterRole("Todos")}>Todos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterRole("super_admin")}>Super Administrador</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterRole("admin")}>Administrador</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterRole("customer")}>Cliente</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu> {/* NOVO: Dropdown para filtrar por status de pagamento */}
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Pagamento: {filterPaidStatus} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilterPaidStatus("Todos")}>Todos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterPaidStatus("Pago")}>Pago</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterPaidStatus("Não Pago")}>Não Pago</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Ordenar por <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy("name-asc")}>Nome (A-Z)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("name-desc")}>Nome (Z-A)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status Pagamento</TableHead> {/* NOVO: Coluna para status de pagamento */}
              <TableHead>Restaurante ID</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfiles.map((profile) => {
              const firstNameInitial = profile.first_name ? profile.first_name[0] : '';
              const lastNameInitial = profile.last_name ? profile.last_name[0] : '';
              const initials = `${firstNameInitial}${lastNameInitial}`.toUpperCase();
              const avatarUrl = profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${initials}`;
              const altText = `${profile.first_name} ${profile.last_name}`;

              return (
                <TableRow key={profile.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={avatarUrl} alt={altText} />
                      <AvatarFallback>
                        {initials.length > 0 ? initials : <UserIcon className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{profile.first_name} {profile.last_name}</TableCell>
                  <TableCell>
                    {profile.email}
                    <br />
                    <span className="text-muted-foreground text-xs">{profile.phone || 'N/A'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(profile.role)}>
                      {profile.role === 'super_admin' ? 'Super Admin' : profile.role === 'admin' ? 'Administrador' : 'Cliente'}
                    </Badge>
                  </TableCell>
                  <TableCell> {/* NOVO: Célula para status de pagamento */}
                    <Badge className={getPaidStatusBadgeClasses(profile.is_paid)}>
                      {profile.is_paid ? 'Pago' : 'Não Pago'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{profile.restaurant_id || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditRoleDialog(profile)}>
                          Editar Perfil
                        </DropdownMenuItem>
                        {/* Outras ações como excluir, etc., podem ser adicionadas aqui */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {editingProfile && (
        <EditProfileRoleDialog
          isOpen={isEditRoleDialogOpen}
          onClose={() => setIsEditRoleDialogOpen(false)}
          profile={editingProfile}
          onUpdateProfile={handleUpdateProfile} // NOVO: Passar a função de atualização completa
        />
      )}
    </div>
  );
};

export default SuperAdminPage;