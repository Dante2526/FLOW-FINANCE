import { AppLanguage } from '../types';
import { TRANSLATIONS } from '../i18n';

// Placeholder for advice, currently disabled as per previous file content
export const getFinancialAdvice = async (query: string, contextData: any, lang: AppLanguage = 'pt'): Promise<string> => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['pt'];
  return t.ai?.disabled || "AI functionality disabled.";
};
