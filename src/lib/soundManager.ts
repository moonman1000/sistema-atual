// src/lib/soundManager.ts

class SoundManager {
  private audio: HTMLAudioElement | null = null;
  private enabled: boolean = false;
  private audioPath: string = "/sounds/sale-success.mp3"; // Usar o arquivo existente

  constructor() {
    // Verifica se o som estava habilitado anteriormente
    this.enabled = localStorage.getItem("soundEnabled") === "true";
  }

  // Inicializa e toca o som (usado no botão "Ativar Som")
  async enable(): Promise<void> {
    this.audio = new Audio(this.audioPath);
    this.audio.volume = 1.0; // Volume máximo
    
    try {
      await this.audio.play();
      this.enabled = true;
      localStorage.setItem("soundEnabled", "true");
      console.log("🔊 Som habilitado e autorizado pelo navegador");
    } catch (error) {
      console.warn("⚠️ Erro ao habilitar som:", error);
      throw error;
    }
  }

  // Desabilita o som
  disable(): void {
    this.audio = null;
    this.enabled = false;
    localStorage.setItem("soundEnabled", "false");
    console.log("🔇 Som desabilitado");
  }

  // Toca o som de venda (reutiliza a instância autorizada)
  playSaleSound(): void {
    if (!this.enabled) {
      console.log("🔇 Som desativado — sem reprodução.");
      return;
    }

    if (!this.audio) {
      // Se o áudio não foi inicializado (usuário não clicou no botão de ativação),
      // tentamos inicializar silenciosamente, mas não garantimos a reprodução.
      this.audio = new Audio(this.audioPath);
      this.audio.volume = 1.0; // Volume máximo
    }

    this.audio.currentTime = 0; // Reinicia do início
    this.audio.play().catch((error) => {
      console.warn("⚠️ Erro ao tocar som:", error);
    });
    console.log("🔊 Som de venda tocado!");
  }

  // Verifica se o som está habilitado
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Exporta uma instância única (singleton)
export const soundManager = new SoundManager();