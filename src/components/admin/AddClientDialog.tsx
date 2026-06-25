import React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface AddClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddClientDialog: React.FC<AddClientDialogProps> = ({ isOpen, onClose }) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Como Adicionar um Novo Cliente?</AlertDialogTitle>
          <AlertDialogDescription>
            Novos clientes são adicionados ao sistema quando eles se registram através da página de vendas do seu aplicativo.
            <br /><br />
            Para que um cliente apareça aqui, ele precisa criar uma conta usando a página de login/cadastro do cliente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction asChild>
            <Link to="/customer-login" onClick={onClose}>
              Ir para Página de Cadastro
            </Link>
          </AlertDialogAction>
          <AlertDialogAction onClick={onClose}>Entendi</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AddClientDialog;