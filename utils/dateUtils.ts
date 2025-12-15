
import { MonthSummary } from '../types';

// Constants
export const MONTH_NAMES = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

export const MONTH_SHORT_CODES: Record<string, string> = {
  'JANEIRO': 'Jan', 'FEVEREIRO': 'Fev', 'MARÇO': 'Mar', 'ABRIL': 'Abr', 'MAIO': 'Mai', 'JUNHO': 'Jun',
  'JULHO': 'Jul', 'AGOSTO': 'Ago', 'SETEMBRO': 'Set', 'OUTUBRO': 'Out', 'NOVEMBRO': 'Nov', 'DEZEMBRO': 'Dez'
};

const SHORT_CODE_TO_FULL: Record<string, string> = {
  'Jan': 'JANEIRO', 'Fev': 'FEVEREIRO', 'Mar': 'MARÇO', 'Abr': 'ABRIL',
  'Mai': 'MAIO', 'Jun': 'JUNHO', 'Jul': 'JULHO', 'Ago': 'AGOSTO',
  'Set': 'SETEMBRO', 'Out': 'OUTUBRO', 'Nov': 'NOVEMBRO', 'Dez': 'DEZEMBRO'
};

const MONTH_REVERSE_MAP: Record<string, string> = {
  'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
  'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
};

/**
 * Sorts month summaries chronologically
 */
export const sortMonths = (monthsList: MonthSummary[]) => {
  return [...monthsList].sort((a, b) => {
    const yearA = parseInt(a.year);
    const yearB = parseInt(b.year);
    
    if (yearA !== yearB) return yearA - yearB;
    
    const monthIndexA = MONTH_NAMES.indexOf(a.month);
    const monthIndexB = MONTH_NAMES.indexOf(b.month);
    
    return monthIndexA - monthIndexB;
  });
};

/**
 * Formats a date string (ISO or legacy) for display in the Transaction List.
 * Example: "2025-05-24" -> "24 Mai"
 */
export const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  if (dateStr.toLowerCase().includes('hoje')) return 'Hoje';
  
  // Handle ISO YYYY-MM-DD
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    const [year, month, day] = dateStr.split(' ')[0].split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  }
  
  // Handle legacy "24 Jan" (Pass through)
  return dateStr;
};

/**
 * Extracts the full Month Name (e.g., "JANEIRO") from a date string.
 */
export const getMonthFromDateStr = (dateStr: string): string => {
  if (!dateStr) return '';
  if (dateStr.toLowerCase().includes('hoje')) return MONTH_NAMES[new Date().getMonth()];
  
  // ISO Format
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    const [year, month, day] = dateStr.split(' ')[0].split('-');
    return MONTH_NAMES[parseInt(month) - 1];
  }

  // Legacy Format "24 Jan"
  const parts = dateStr.split(' ');
  if (parts.length >= 2 && !dateStr.includes('-')) {
    const code = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase(); 
    return SHORT_CODE_TO_FULL[code] || '';
  }
  
  return '';
};

/**
 * Extracts the Year from a date string, using context if needed.
 */
export const getYearFromDateStr = (dateStr: string, activeYearContext?: string): string => {
  if (!dateStr) return new Date().getFullYear().toString();
  if (dateStr.toLowerCase().includes('hoje')) return new Date().getFullYear().toString();
  
  // ISO Format
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) return dateStr.split('-')[0];
  
  // Legacy Format (relies on context or current year)
  if (activeYearContext) return activeYearContext;
  return new Date().getFullYear().toString();
};

/**
 * Converts any display date back to ISO YYYY-MM-DD for storage/editing.
 */
export const parseDateToISO = (displayDate: string, yearContext?: number): string => {
  try {
    if (!displayDate) return new Date().toISOString().split('T')[0];
    if (displayDate.toLowerCase().includes('hoje')) return new Date().toISOString().split('T')[0];
    
    // Already ISO
    if (displayDate.match(/^\d{4}-\d{2}-\d{2}/)) {
        return displayDate.split(' ')[0];
    }

    // Legacy "DD Mmm"
    const parts = displayDate.split(' ');
    if (parts.length >= 2) {
      const day = parts[0].padStart(2, '0');
      const monthCode = parts[1].toLowerCase().substring(0, 3);
      const month = MONTH_REVERSE_MAP[monthCode];
      
      if (month) {
        const year = yearContext || new Date().getFullYear();
        return `${year}-${month}-${day}`;
      }
    }
    return new Date().toISOString().split('T')[0];
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Returns today's date in ISO YYYY-MM-DD
 */
export const getTodayISO = () => new Date().toISOString().split('T')[0];
