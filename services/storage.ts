
// Keys for LocalStorage
export const STORAGE_KEYS = {
  TRANSACTIONS: 'flow_transactions',
  ACCOUNTS: 'flow_accounts',
  MONTHS: 'flow_months',
  USER_PROFILE: 'flow_user_profile',
  APP_THEME: 'flow_app_theme',
  LONG_TERM_TRANSACTIONS: 'flow_long_term',
  NOTIFICATIONS: 'flow_notifications',
  INVESTMENTS: 'flow_investments',
  CDI_RATE: 'flow_cdi_rate',
  NOTEPAD_CONTENT: 'flow_notepad_content',
  USER_SESSION: 'flow_user_session',
  IS_SYNC_DIRTY: 'flow_is_sync_dirty', // New key to track if local data is ahead of cloud
};

// Generic load function
export const loadData = <T>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    
    const parsed = JSON.parse(saved);
    // Safety check: if parsed is null (e.g. "null" string in storage), return fallback
    return parsed !== null ? parsed : fallback;
  } catch (e) {
    console.warn(`Error loading ${key} from storage`, e);
    return fallback;
  }
};

// Generic save function
export const saveData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key} to storage`, e);
  }
};
