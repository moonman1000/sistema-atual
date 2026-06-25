"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2 } from "lucide-react";
import { MenuItem } from "@/context/MenuContext";
import { toast } from "sonner";

interface ReviewFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem | null;
  onSubmitReview: (menuItemId: string, rating: number, comment: string) => Promise<void>;
}

const ReviewFormDialog: React.FC<ReviewFormDialogProps> = ({ isOpen, onClose, menuItem, onSubmitReview }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setComment("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!menuItem) {
      toast.error("Nenhum item selecionado para avaliação.");
      return;
    }
    if (rating === 0) {
      toast.error("Por favor, selecione uma avaliação em estrelas.");
      return;
    }
    if (comment.trim().length < 10) {
      toast.error("O comentário deve ter pelo menos 10 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitReview(menuItem.id, rating, comment);
      toast.success("Sua avaliação foi enviada com sucesso!");
      onClose();
    } catch (error) {
      // Erro já tratado no contexto
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Avaliar {menuItem?.name}</DialogTitle>
          <DialogDescription>
            Compartilhe sua experiência com este item do cardápio.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="rating" className="text-left">Sua Avaliação</Label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <Star
                  key={starValue}
                  className={`h-8 w-8 cursor-pointer ${starValue <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
                  onClick={() => setRating(starValue)}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="comment" className="text-left">Seu Comentário</Label>
            <Textarea
              id="comment"
              placeholder="O que você achou deste item?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
              </>
            ) : (
              "Enviar Avaliação"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewFormDialog;