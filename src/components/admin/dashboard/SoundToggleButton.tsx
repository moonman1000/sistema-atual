import React, { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { soundManager } from "@/lib/soundManager";
import { cn } from "@/lib/utils";

const SoundToggleButton: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());

  const toggleSound = async () => {
    if (soundEnabled) {
      soundManager.disable();
      setSoundEnabled(false);
      toast.info("🔇 Som desativado", {
        description: "Você não ouvirá alertas sonoros até ativar novamente.",
        duration: 4000,
        position: "top-center",
      });
    } else {
      try {
        await soundManager.enable();
        setSoundEnabled(true);
        toast.success("🔊 Som habilitado com sucesso!", {
          description: "Agora você ouvirá alertas de novas vendas.",
          duration: 4000,
          position: "top-center",
        });
      } catch (error) {
        console.error("Erro ao habilitar som:", error);
        toast.error("Erro ao habilitar som", {
          description: "O navegador bloqueou a reprodução de áudio.",
          duration: 4000,
          position: "top-center",
        });
      }
    }
  };

  return (
    <button
      onClick={toggleSound}
      className={cn(
        "flex items-center rounded-md transition-colors",
        soundEnabled
          ? "bg-green-500 text-white hover:bg-green-600 p-2" // Icon only style
          : "bg-amber-500 text-white hover:bg-amber-600 animate-pulse gap-2 px-4 py-2", // Text style
      )}
    >
      {soundEnabled ? (
        <>
          <Volume2 size={18} />
          <span className="sr-only">Desativar Som</span>
        </>
      ) : (
        <span className="flex items-center gap-2">
          <VolumeX size={18} />
          <span>Ativar Som</span>
        </span>
      )}
    </button>
  );
};

export default SoundToggleButton;