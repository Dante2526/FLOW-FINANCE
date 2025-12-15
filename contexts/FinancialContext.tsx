
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useFinancialData } from '../hooks/useFinancialData';
import { loadData, STORAGE_KEYS, saveData } from '../services/storage';
import { supabase } from '../services/supabase';

// Define the shape of the context based on the hook return type
type FinancialContextType = ReturnType<typeof useFinancialData> & {
  currentUserEmail: string | null;
  isSessionReady: boolean;
  logout: () => Promise<void>;
  login: (email: string) => void;
};

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- AUTH STATE MANAGED HERE ---
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return loadData(STORAGE_KEYS.USER_SESSION, null);
  });
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setCurrentUserEmail(session.user.email);
        saveData(STORAGE_KEYS.USER_SESSION, session.user.email);
      }
      setIsSessionReady(true);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
       if (event === 'SIGNED_OUT') {
         setCurrentUserEmail(null);
         localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
         setIsSessionReady(true); 
       } else if (session?.user?.email) {
          setCurrentUserEmail(session.user.email);
          saveData(STORAGE_KEYS.USER_SESSION, session.user.email);
          setIsSessionReady(true);
       }
    });
    return () => subscription.unsubscribe();
  }, []);

  const login = (email: string) => {
    setCurrentUserEmail(email);
    saveData(STORAGE_KEYS.USER_SESSION, email);
  };

  const logout = async () => {
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    await supabase.auth.signOut();
    setCurrentUserEmail(null);
  };

  // --- DATA HOOK ---
  const financialData = useFinancialData(currentUserEmail, isSessionReady);

  return (
    <FinancialContext.Provider value={{ 
      ...financialData, 
      currentUserEmail, 
      isSessionReady,
      logout,
      login
    }}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinancialProvider');
  }
  return context;
};
