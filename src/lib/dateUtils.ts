import { startOfDay, format as dateFnsFormat } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Converte uma string de data (YYYY-MM-DD) para um objeto Date no fuso horário de Angola (WAT, UTC+1)
 * Garante que a data seja interpretada como meia-noite no horário local de Angola
 */
export function parseAngolaDate(dateString: string): Date {
  if (!dateString) return new Date(NaN);

  // Se vier como timestamp ISO (contém "T" ou tem mais de 10 caracteres),
  // usar o Date nativo e normalizar para o início do dia no fuso local.
  // Isso mantém compatibilidade com a nova coluna TIMESTAMPTZ em reservations
  // sem alterar a lógica do resto da aplicação.
  if (dateString.includes("T") || dateString.length > 10) {
    const isoDate = new Date(dateString);
    return startOfDay(isoDate);
  }

  // Caso clássico: string "YYYY-MM-DD"
  const [year, month, day] = dateString.split("-").map(Number);
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

/**
 * Converte uma string datetime-local para Date
 */
export function parseDateTimeLocal(dateTimeString: string): Date {
  return new Date(dateTimeString);
}

/**
 * Formata uma Date para string datetime-local (formato HTML5)
 */
export function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Calcula o número de dias extras baseado na regra de negócio:
 * - Se saiu às X horas do dia Y, deve retornar às X horas do dia Y+N
 * - Se passar da hora esperada, calcula quantos dias extras foram
 * 
 * @param checkoutDateTime Data e hora real do checkout
 * @param checkinDateTime Data e hora real do checkin
 * @param expectedDays Número de dias esperados da reserva
 * @returns Número de dias extras (0 se não houver)
 */
export function calculateExtraDays(
  checkoutDateTime: Date | string,
  checkinDateTime: Date | string,
  expectedDays: number
): number {
  const checkout = typeof checkoutDateTime === 'string' ? new Date(checkoutDateTime) : checkoutDateTime;
  const checkin = typeof checkinDateTime === 'string' ? new Date(checkinDateTime) : checkinDateTime;

  // Extrair hora e minuto do checkout
  const checkoutHour = checkout.getHours();
  const checkoutMinute = checkout.getMinutes();

  // Calcular data/hora esperada de retorno
  // Mesma hora do checkout + número de dias esperados
  const expectedReturnDate = new Date(checkout);
  expectedReturnDate.setDate(expectedReturnDate.getDate() + expectedDays);
  expectedReturnDate.setHours(checkoutHour, checkoutMinute, 0, 0);

  // Se o checkin não passou da hora esperada, não há dias extras
  if (checkin <= expectedReturnDate) {
    return 0;
  }

  // Calcular diferença em dias completos desde a data esperada
  // A regra: se passou da hora esperada, conta 1 dia extra
  // Para cada dia completo adicional, conta mais 1 dia extra
  const diffTime = checkin.getTime() - expectedReturnDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Se passou da hora esperada no mesmo dia, é 1 dia extra
  if (diffDays === 0) {
    return 1;
  }
  
  // Se passou para outro(s) dia(s), verificar se ainda passou da hora no último dia
  // Se sim, conta diffDays + 1, senão conta apenas diffDays
  const checkinHour = checkin.getHours();
  const checkinMinute = checkin.getMinutes();
  const expectedHour = expectedReturnDate.getHours();
  const expectedMinute = expectedReturnDate.getMinutes();
  
  // Se passou da hora no último dia, conta mais 1
  if (checkinHour > expectedHour || (checkinHour === expectedHour && checkinMinute > expectedMinute)) {
    return diffDays + 1;
  } else {
    // Se retornou antes da hora no último dia, conta apenas os dias completos
    return diffDays;
  }
}

/**
 * Calcula o número de dias de aluguel considerando a regra de negócio:
 * - Se saiu às X horas do dia Y, deve retornar às X horas do dia Y+N
 * - Se passar da hora esperada, conta mais dias
 * 
 * @param checkoutDateTime Data e hora real do checkout
 * @param checkinDateTime Data e hora real do checkin
 * @param expectedDays Número de dias esperados da reserva
 * @returns Número de dias a serem cobrados
 */
export function calculateRentalDays(
  checkoutDateTime: Date | string,
  checkinDateTime: Date | string,
  expectedDays: number
): number {
  const extraDays = calculateExtraDays(checkoutDateTime, checkinDateTime, expectedDays);
  return expectedDays + extraDays;
}

/**
 * Calcula a data/hora esperada de retorno baseada na hora do checkout
 * Preserva a hora e minuto do checkout
 * 
 * @param checkoutDateTime Data e hora real do checkout
 * @param rentalDays Número de dias de aluguel
 * @returns Data/hora esperada de retorno (mesma hora do checkout + dias)
 */
export function getExpectedReturnDateTime(
  checkoutDateTime: Date | string,
  rentalDays: number
): Date {
  const checkout = typeof checkoutDateTime === 'string' ? new Date(checkoutDateTime) : checkoutDateTime;
  const expectedReturn = new Date(checkout);
  expectedReturn.setDate(expectedReturn.getDate() + rentalDays);
  // Preservar a hora e minuto do checkout
  expectedReturn.setHours(checkout.getHours(), checkout.getMinutes(), 0, 0);
  return expectedReturn;
}

