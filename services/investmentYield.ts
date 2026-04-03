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

// Feriados móveis pré-calculados (Carnaval segunda, Carnaval terça, Sexta-feira Santa, Corpus Christi)
// Calculados pela Páscoa de cada ano
const MOBILE_HOLIDAYS: Record<number, string[]> = {
  2024: ['2024-02-12', '2024-02-13', '2024-03-29', '2024-05-30'],
  2025: ['2025-03-03', '2025-03-04', '2025-04-18', '2025-06-19'],
  2026: ['2026-02-16', '2026-02-17', '2026-04-03', '2026-06-04'],
  2027: ['2027-02-08', '2027-02-09', '2027-03-26', '2027-05-27'],
  2028: ['2028-02-28', '2028-02-29', '2028-04-14', '2028-06-15'],
  2029: ['2029-02-12', '2029-02-13', '2029-03-30', '2029-05-31'],
  2030: ['2030-03-04', '2030-03-05', '2030-04-19', '2030-06-20'],
};

/**
 * Formata uma data como string ISO (YYYY-MM-DD) em horário local
 */
const toLocalISODate = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Verifica se uma data é feriado nacional brasileiro
 */
const isHoliday = (date: Date): boolean => {
  const month = date.getMonth();
  const day = date.getDate();
  const year = date.getFullYear();

  // Check fixed holidays
  for (const [hMonth, hDay] of FIXED_HOLIDAYS) {
    if (month === hMonth && day === hDay) return true;
  }

  // Check mobile holidays
  const dateStr = toLocalISODate(date);
  const yearHolidays = MOBILE_HOLIDAYS[year];
  if (yearHolidays && yearHolidays.includes(dateStr)) return true;

  return false;
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
 * Aplica o rendimento diário a um investimento individual
 * 
 * Para CDI/Fixed:
 *   Taxa diária = (1 + CDI_anual/100)^(1/252) - 1
 *   Rendimento = taxa_diária × (yieldRate/100)
 *   Novo amount = amount × (1 + rendimento)^dias_uteis
 * 
 * Para FII:
 *   Taxa diária proporcional = (yieldRate/100) / 252
 *   Novo amount = amount × (1 + taxa_diária)^dias_uteis
 */
const applyDailyYield = (investment: Investment, cdiRate: number, today: Date): Investment => {
  // Only apply to CDI, fixed, and FII types
  if (!['cdi', 'fixed', 'fii'].includes(investment.type)) return investment;
  if (!investment.yieldRate || investment.yieldRate <= 0) return investment;
  if (!investment.amount || investment.amount <= 0) return investment;

  const todayStr = toLocalISODate(today);

  // Se não tem lastYieldDate, define como hoje (primeira vez) e não aplica rendimento
  if (!investment.lastYieldDate) {
    return { ...investment, lastYieldDate: todayStr };
  }

  // Se já foi atualizado hoje, não faz nada
  if (investment.lastYieldDate === todayStr) return investment;

  // Calcular data do último rendimento
  const [y, m, d] = investment.lastYieldDate.split('-').map(Number);
  const lastDate = new Date(y, m - 1, d);

  // Contar dias úteis entre último rendimento e hoje
  const businessDays = countBusinessDaysBetween(lastDate, today);

  if (businessDays <= 0) return investment;

  let dailyRate: number;

  if (investment.type === 'cdi' || investment.type === 'fixed') {
    // CDI: Taxa diária base do CDI × percentual do CDI do investimento
    const cdiDailyRate = Math.pow(1 + cdiRate / 100, 1 / 252) - 1;
    dailyRate = cdiDailyRate * (investment.yieldRate / 100);
  } else {
    // FII: Dividend Yield anual distribuído proporcionalmente por dia útil
    dailyRate = (investment.yieldRate / 100) / 252;
  }

  // Aplicar rendimento composto
  const newAmount = investment.amount * Math.pow(1 + dailyRate, businessDays);

  // Arredondar para 2 casas decimais
  const roundedAmount = Math.round((newAmount + Number.EPSILON) * 100) / 100;

  return {
    ...investment,
    amount: roundedAmount,
    lastYieldDate: todayStr,
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

  const today = new Date();
  // Normalizar para meia-noite local
  today.setHours(0, 0, 0, 0);

  let hasChanges = false;
  const updatedInvestments = investments.map(inv => {
    const updated = applyDailyYield(inv, cdiRate, today);
    if (updated !== inv) {
      hasChanges = true;
    }
    return updated;
  });

  return { investments: updatedInvestments, hasChanges };
};
