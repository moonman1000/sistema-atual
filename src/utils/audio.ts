const playedSounds = new Set<string>();
const DEBOUNCE_TIME_MS = 2000; // 2 segundos de debouncing

export const playSound = (audioPath: string, id: string) => {
  if (playedSounds.has(id)) {
    console.log(`Sound for ID ${id} already played recently. Debouncing.`);
    return;
  }

  const audio = new Audio(audioPath);
  audio.volume = 0.5; // Ajuste o volume conforme necessário (0.0 a 1.0)

  audio.play()
    .then(() => {
      console.log(`Sound played for ID: ${id}`);
      playedSounds.add(id);
      setTimeout(() => {
        playedSounds.delete(id);
      }, DEBOUNCE_TIME_MS);
    })
    .catch(error => {
      console.warn(`Failed to play sound for ID ${id} from ${audioPath}:`, error);
      // Isso geralmente ocorre devido às políticas de autoplay do navegador.
      // O som será reproduzido após a primeira interação do usuário com a página.
    });
};