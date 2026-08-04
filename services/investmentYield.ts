import { Investment } from '../types';

// =============================================
// FERIADOS NACIONAIS BRASILEIROS
// =============================================

// Feriados fixos (mês, dia) - mês é 0-indexed
const FIXED_HOLIDAYS: [number, number][] = [
  [0, 1],   // Ano Novo
  [3, 21],  // Tiradentes
  [4, 1],   // Dia do Trabalho
  [8, 7],   // Independência
  [9, 12],  // Nossa Senhora Aparecida
  [10, 2],  // Finados
  [10, 15], // Proclamação da República
  [10, 20], // Dia da Consciência Negra
  [11, 25], // Natal
];

/**
 * Calcula a data da Páscoa para qualquer ano do calendário Gregoriano
 * usando o algoritmo de Meeus/Jones/Butcher (Computus)
 */
export const getEasterDate = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

/**
 * Adiciona ou subtrai dias de uma data
 */
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Formata uma data como string ISO (YYYY-MM-DD) em horário local
 */
export const toLocalISODate = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Cache em memória para feriados móveis calculados por ano
const mobileHolidaysCache = new Map<number, Set<string>>();

/**
 * Retorna o conjunto de feriados móveis brasileiros para o ano especificado:
 * - Segunda-feira de Carnaval (Páscoa - 48 dias)
 * - Terça-feira de Carnaval (Páscoa - 47 dias)
 * - Sexta-feira Santa / Paixão de Cristo (Páscoa - 2 dias)
 * - Corpus Christi (Páscoa + 60 dias)
 */
export const getMobileHolidaysForYear = (year: number): Set<string> => {
  if (mobileHolidaysCache.has(year)) {
    return mobileHolidaysCache.get(year)!;
  }

  const easter = getEasterDate(year);

  const carnavalMon = toLocalISODate(addDays(easter, -48));
  const carnavalTue = toLocalISODate(addDays(easter, -47));
  const goodFriday = toLocalISODate(addDays(easter, -2));
  const corpusChristi = toLocalISODate(addDays(easter, 60));

  const holidays = new Set([carnavalMon, carnavalTue, goodFriday, corpusChristi]);
  mobileHolidaysCache.set(year, holidays);
  return holidays;
};

/**
 * Verifica se uma data é feriado nacional brasileiro (fixo ou móvel)
 */
export const isHoliday = (date: Date): boolean => {
  const month = date.getMonth();
  const day = date.getDate();
  const year = date.getFullYear();

  // Check fixed holidays
  for (const [hMonth, hDay] of FIXED_HOLIDAYS) {
    if (month === hMonth && day === hDay) return true;
  }

  // Check dynamic mobile holidays
  const dateStr = toLocalISODate(date);
  const yearHolidays = getMobileHolidaysForYear(year);
  return yearHolidays.has(dateStr);
};

/**
 * Verifica se uma data é dia útil (não é final de semana nem feriado)
 */
const isBusinessDay = (date: Date): boolean => {
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return false; // Sábado ou Domingo
  if (isHoliday(date)) return false;
  return true;
};

/**
 * Conta o número de dias úteis entre duas datas (exclusivo start, inclusivo end)
 * Ex: start=segunda, end=terça => 1 dia útil
 */
const countBusinessDaysBetween = (start: Date, end: Date): number => {
  let count = 0;
  const current = new Date(start);
  current.setDate(current.getDate() + 1); // Start from day AFTER last yield

  while (current <= end) {
    if (isBusinessDay(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

/**
 * Taxa de Imposto de Renda (IR) fixa em 22,5% (alíquota regressiva inicial para CDB/CDI)
 */
const IR_TAX_RATE = 0.225;

/**
 * Aplica o rendimento diário a um investimento individual
 * 
 * Para CDI/Fixed:
 *   Taxa diária = (1 + CDI_anual/100)^(1/252) - 1
 *   Rendimento Bruto = taxa_diária × (yieldRate/100)
 *   Rendimento Líquido = Rendimento Bruto × (1 - 0.225)  <-- NOVO: Dedução de IR
 *   Novo amount = amount × (1 + rendimento_líquido)^dias_uteis
 * 
 * Para FII:
 *   Taxa diária proporcional = (yieldRate/100) / 252
 *   Novo amount = amount × (1 + taxa_diária)^dias_uteis
 */
const applyDailyYield = (investment: Investment, cdiRate: number, referenceDate: Date): Investment => {
  // Only apply to CDI, fixed, and FII types
  if (!['cdi', 'fixed', 'fii'].includes(investment.type)) return investment;
  if (!investment.yieldRate || investment.yieldRate <= 0) return investment;
  if (!investment.amount || investment.amount <= 0) return investment;

  const refDateStr = toLocalISODate(referenceDate);

  // Se não tem lastYieldDate, define como a data de referência e não aplica rendimento
  if (!investment.lastYieldDate) {
    return { ...investment, lastYieldDate: refDateStr };
  }

  // Se já foi atualizado para esta data de referência, não faz nada
  if (investment.lastYieldDate === refDateStr) return investment;

  // Calcular data do último rendimento
  const [y, m, d] = investment.lastYieldDate.split('-').map(Number);
  const lastDate = new Date(y, m - 1, d);

  // Contar dias úteis entre último rendimento e a data de referência (ontem)
  const businessDays = countBusinessDaysBetween(lastDate, referenceDate);

  if (businessDays <= 0) return investment;

  let dailyRate: number;

  if (investment.type === 'cdi' || investment.type === 'fixed') {
    // CDI: Taxa diária base do CDI × percentual do CDI do investimento
    const cdiDailyRate = Math.pow(1 + cdiRate / 100, 1 / 252) - 1;
    const grossDailyRate = cdiDailyRate * (investment.yieldRate / 100);
    
    // Aplicar dedução de IR sobre o rendimento
    dailyRate = grossDailyRate * (1 - IR_TAX_RATE);
  } else {
    // FII: Dividend Yield anual distribuído proporcionalmente por dia útil (Geralmente isento de IR para pessoa física)
    dailyRate = (investment.yieldRate / 100) / 252;
  }

  // Aplicar rendimento composto
  const newAmount = investment.amount * Math.pow(1 + dailyRate, businessDays);

  // Arredondar para 2 casas decimais
  const roundedAmount = Math.round((newAmount + Number.EPSILON) * 100) / 100;

  return {
    ...investment,
    amount: roundedAmount,
    lastYieldDate: refDateStr,
  };
};

/**
 * Aplica rendimento a todos os investimentos elegíveis.
 * Retorna { investments, hasChanges } para saber se algo mudou.
 */
export const applyYieldToAll = (
  investments: Investment[],
  cdiRate: number
): { investments: Investment[]; hasChanges: boolean } => {
  if (!investments || investments.length === 0) {
    return { investments: [], hasChanges: false };
  }

  // AJUSTE: Usar data de "ontem" para evitar antecipação de rendimento que ainda não foi creditado pelo banco
  const referenceDate = new Date();
  referenceDate.setDate(referenceDate.getDate() - 1);
  // Normalizar para meia-noite local
  referenceDate.setHours(0, 0, 0, 0);

  let hasChanges = false;
  const updatedInvestments = investments.map(inv => {
    const updated = applyDailyYield(inv, cdiRate, referenceDate);
    if (updated !== inv) {
      hasChanges = true;
    }
    return updated;
  });

  return { investments: updatedInvestments, hasChanges };
};
