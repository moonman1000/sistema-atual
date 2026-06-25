import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"; // NOVO: Importar Switch
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'customer' | 'super_admin';
  restaurant_id?: string;
  is_paid: boolean; // NOVO: Adicionado status de pagamento
}

interface EditProfileRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onUpdateProfile: (updatedProfile: Profile) => Promise<void>; // NOVO: Função para atualizar o perfil completo
}

const EditProfileRoleDialog: React.FC<EditProfileRoleDialogProps> = ({ isOpen, onClose, profile, onUpdateProfile }) => {
  const [newRole, setNewRole] = React.useState<Profile['role']>(profile?.role || 'customer');
  const [isPaid, setIsPaid] = React.useState(profile?.is_paid || false); // NOVO: Estado para isPaid
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    if (profile) {
      setNewRole(profile.role);
      setIsPaid(profile.is_paid); // NOVO: Definir estado inicial de isPaid
    }
  }, [profile]);

  const handleSubmit = async () => {
    if (!profile || !newRole) {
      toast.error("Dados do perfil ou nova função inválidos.");
      return;
    }
    setIsUpdating(true);
    try {
      const updatedProfile: Profile = {
        ...profile,
        role: newRole,
        is_paid: isPaid, // NOVO: Incluir isPaid no objeto de atualização
      };
      await onUpdateProfile(updatedProfile);
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Falha ao atualizar o perfil.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Atualize a função e o status de pagamento para {profile?.first_name} {profile?.last_name} ({profile?.email}).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Função
            </Label>
            <Select value={newRole} onValueChange={(value: Profile['role']) => setNewRole(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Cliente</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="super_admin">Super Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4"> {/* NOVO: Campo para status de pagamento */}
            <Label htmlFor="isPaid" className="text-right">
              Pago
            </Label>
            <Switch
              id="isPaid"
              checked={isPaid}
              onCheckedChange={setIsPaid}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileRoleDialog;