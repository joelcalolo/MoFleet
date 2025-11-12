import { startOfDay, format as dateFnsFormat } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Converte uma string de data (YYYY-MM-DD) para um objeto Date no fuso horário de Angola (WAT, UTC+1)
 * Garante que a data seja interpretada como meia-noite no horário local de Angola
 */
export function parseAngolaDate(dateString: string): Date {
  // Se a data já vem como string no formato YYYY-MM-DD, criar a data no fuso local
  // Isso evita problemas de conversão UTC
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return startOfDay(date);
}

/**
 * Obtém a data atual no fuso horário de Angola
 */
export function getAngolaDate(): Date {
  return startOfDay(new Date());
}

/**
 * Formata uma data no formato brasileiro/português
 * Aceita Date, string (YYYY-MM-DD) ou timestamp ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
 */
export function formatAngolaDate(date: Date | string, formatStr: string = "dd/MM/yyyy"): string {
  if (!date) return "Data inválida";
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    // Se for um timestamp ISO (contém T ou tem mais de 10 caracteres)
    if (date.includes('T') || date.length > 10) {
      dateObj = new Date(date);
    } else {
      // Se for uma string de data simples (YYYY-MM-DD)
      dateObj = parseAngolaDate(date);
    }
  } else {
    dateObj = date;
  }
  
  // Verificar se a data é válida
  if (isNaN(dateObj.getTime())) {
    console.error("Invalid date:", date);
    return "Data inválida";
  }
  
  return dateFnsFormat(dateObj, formatStr, { locale: ptBR });
}

/**
 * Verifica se duas datas são do mesmo dia no fuso horário de Angola
 */
export function isSameAngolaDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseAngolaDate(date1) : startOfDay(date1);
  const d2 = typeof date2 === 'string' ? parseAngolaDate(date2) : startOfDay(date2);
  return d1.getTime() === d2.getTime();
}

