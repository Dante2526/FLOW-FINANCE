
export type LogoType = 
  | 'netflix' 
  | 'tnf' 
  | 'amazon' 
  | 'spotify' 
  | 'shopping' 
  | 'food' 
  | 'transport' 
  | 'home' 
  | 'utility' 
  | 'generic'
  | 'youtube'
  | 'apple'
  | 'disney'
  | 'max'
  | 'globo'
  | 'mercadolivre'
  | 'motorcycle'
  | 'insurance'
  | 'wifi'
  | 'mobile'
  | 'rent'
  | 'electricity';

export interface Transaction {
  id: string;
  name: string;
  date: string;
  amount: number;
  type: 'subscription' | 'purchase' | 'transfer';
  paymentMethod?: 'pix' | 'card';
  logoType: LogoType;
  paid: boolean;
  month?: string; // The dashboard month name (e.g. "JANEIRO") this belongs to
  year?: string;  // The dashboard year (e.g. "2025") this belongs to
}

export interface Contact {
  id: string;
  name: string;
  imageUrl: string;
}

export type CardTheme = 'default' | 'lime' | 'purple' | 'blue' | 'orange' | 'red';

export interface Account {
  id: string;
  name: string;
  balance: number;
  colorTheme: CardTheme;
  month?: string;
  year?: string;
}

export interface MonthSummary {
  id: string;
  month: string;
  year: string;
  total: number;
}

export interface UserProfile {
  name: string;
  subtitle: string;
  avatarUrl: string;
  isPro?: boolean; // New PRO status flag
  subscriptionExpiry?: string; // ISO Date string for subscription expiration
}

export interface AppTheme {
  id: string;
  name: string;
  primary: string; // The main accent color (hex)
  secondary: string; // The dark accent color (hex)
}

// New Interface for Long Term (Installments)
export interface LongTermTransaction {
  id: string;
  title: string;
  totalAmount: number;
  installmentsCount: number;
  startDate: string; // ISO string YYYY-MM-DD
  installmentsPaid: number; // How many have been paid
  monthlyAmount?: number; // Current/Active monthly value for unpaid installments
  installmentsHistory?: Record<number, number>; // Map of index -> specific amount paid (history)
  installmentsDates?: Record<number, string>; // Map of index -> specific date override (YYYY-MM-DD)
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'alert' | 'success' | 'info';
}

// Investment Types
export type InvestmentType = 'cdi' | 'fii' | 'stock' | 'crypto' | 'fixed';

export interface Investment {
  id: string;
  name: string; // e.g., "NuBank Caixinha", "MXRF11"
  institution: string; // e.g., "Nubank", "XP", "Inter"
  type: InvestmentType;
  amount: number;
  quantity?: number; // Number of shares/units (mainly for FII/Stocks)
  // For CDI: Percentage of CDI (e.g., 100, 110)
  // For others: Estimated Annual Yield % (optional)
  yieldRate: number; 
}

export type AppView = 'home' | 'settings' | 'long-term' | 'investments';