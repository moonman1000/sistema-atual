import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata uma string de data (YYYY-MM-DD) para o formato brasileiro (DD/MM/AAAA).
 * @param dateString A string de data no formato YYYY-MM-DD.
 * @returns A data formatada ou a string original se for inválida.
 */
export function formatDate(dateString: string): string {
  try {
    // Usamos createLocalDate para garantir que a data seja interpretada como local
    const date = createLocalDate(dateString);
    if (!date || isNaN(date.getTime())) {
      return dateString; // Retorna a string original se for inválida
    }
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  } catch (e) {
    console.error("Erro ao formatar data:", e);
    return dateString;
  }
}

/**
 * Formata um número para o formato de moeda brasileira (R$ X.XXX,XX).
 * @param value O valor numérico.
 * @returns A string formatada.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Converte uma string para um slug amigável de URL, removendo acentos e caracteres especiais.
 * @param text The input string.
 * @returns The slugified string.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // é -> e + ́
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^\w\s-]/g, "") // remove caracteres especiais
    .trim()
    .replace(/\s+/g, "-") // espaços -> hífen
    .replace(/-+/g, "-"); // colapsa hífens
}

/**
 * Calcula a data de negócio atual com corte às 05:00 da manhã.
 * @returns A data de negócio no formato YYYY-MM-DD.
 */
export function getBusinessDateString(): string {
  const now = new Date();
  // Subtrai 5 horas para simular o "dia de negócio" até as 05:00
  const cutoffTime = 5 * 60 * 60 * 1000;
  const businessDate = new Date(now.getTime() - cutoffTime);
  return businessDate.toISOString().split("T")[0];
}

/**
 * Cria um Date local a partir de YYYY-MM-DD, evitando shift de timezone.
 * @param dateString The date string in YYYY-MM-DD format.
 * @returns A Date object or Invalid Date.
 */
export function createLocalDate(dateString: string | undefined): Date {
  if (!dateString) return new Date(NaN);
  const parts = dateString.split("-").map(Number);
  if (
    parts.length === 3 &&
    !isNaN(parts[0]) &&
    !isNaN(parts[1]) &&
    !isNaN(parts[2])
  ) {
    // Mês é 0-based
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(NaN);
}

/**
 * Retorna o prefixo de caminho da URL com base no tipo de restaurante.
 */
export function getRestaurantTypePath(restaurantType: string): string {
  switch (restaurantType) {
    case "restaurant":
      return "loja";
    case "pharmacy":
      return "farmacia";
    case "market":
      return "mercado";
    case "petshop":
      return "petshop";
    case "service":
      return "servico";
    default:
      return "loja";
  }
}