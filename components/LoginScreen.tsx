import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, ShieldCheck, User, ChevronLeft, AlertCircle, Languages, MailCheck } from 'lucide-react';
import { sendMagicLink } from '../services/supabase';
import { TRANSLATIONS } from '../i18n';
import { AppLanguage } from '../types';
import { loadData, saveData, STORAGE_KEYS } from '../services/storage';

interface Props {
  onLogin: (email: string) => Promise<void>;
  currentLang: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
}

// Custom SVG Logo matching the brand (F with dots)
export const FlowLogo = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Left Dots */}
    <circle cx="5" cy="6" r="2.2" />
    <circle cx="5" cy="12" r="2.2" />
    <circle cx="5" cy="18" r="2.2" />
    
    {/* Top Bar */}
    <rect x="10" y="3.8" width="12" height="4.4" rx="2.2" />
    
    {/* Middle Bar + Vertical Stem */}
    <path d="M10 12.2C10 10.985 10.985 10 12.2 10H16.8C18.015 10 19 10.985 19 12.2C19 13.415 18.015 14.4 16.8 14.4H14.4V17.8C14.4 19.015 13.415 20 12.2 20C10.985 20 10 19.015 10 17.8V12.2Z" />
  </svg>
);

const LoginScreen: React.FC<Props> = ({ onLogin, currentLang, onLanguageChange }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'email' | 'magic_link_sent'>('email');
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const t = TRANSLATIONS[currentLang].auth;

  useEffect(() => {
    const visitCount = loadData<number>(STORAGE_KEYS.VISIT_COUNT, 0);
    if (visitCount === 0) {
      setMode('register');
    }
    saveData(STORAGE_KEYS.VISIT_COUNT, visitCount + 1);
  }, []);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError(t.errors.invalidEmail);
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError(t.errors.missingName);
      return;
    }

    setIsLoading(true);

    try {
      await sendMagicLink(email, mode === 'register' ? name : undefined);
      setStep('magic_link_sent');
    } catch (err: any) {
      setError(err.message || t.errors.genericSend);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setError('');
  };

  const backToForm = () => {
    setStep('email');
    setError('');
  };

  return (
    <div className="h-[100dvh] w-full bg-[#0a0a0b] flex flex-col items-center p-4 relative overflow-hidden">
      
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute top-4 right-4 z-50">
        <div className="relative">
            <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className="p-2.5 bg-[#1c1c1e] border border-white/5 rounded-2xl hover:bg-[#2c2c2e] transition-colors cursor-pointer active:scale-95 text-gray-400 flex items-center justify-center shadow-lg">
              <Languages className="w-5 h-5" />
            </button>
            {isLangMenuOpen && (
              <div className="absolute top-full right-0 mt-2 bg-[#1c1c1e] border border-white/5 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 w-32 animate-in fade-in zoom-in duration-200">
                  <button onClick={() => { onLanguageChange('pt'); setIsLangMenuOpen(false); }} className={`p-2 rounded-xl text-sm font-bold text-left transition-colors ${currentLang === 'pt' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>Português</button>
                  <button onClick={() => { onLanguageChange('en'); setIsLangMenuOpen(false); }} className={`p-2 rounded-xl text-sm font-bold text-left transition-colors ${currentLang === 'en' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>English</button>
                  <button onClick={() => { onLanguageChange('es'); setIsLangMenuOpen(false); }} className={`p-2 rounded-xl text-sm font-bold text-left transition-colors ${currentLang === 'es' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>Español</button>
              </div>
            )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col items-center justify-center w-full max-w-md relative z-10 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 min-h-0`}>
        <div className="flex flex-col items-center text-center gap-1 flex-shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#1c1c1e] rounded-2xl sm:rounded-3xl flex items-center justify-center border border-white/5 shadow-2xl shadow-accent/10 mb-2 group">
             <FlowLogo className="w-8 h-8 sm:w-10 sm:h-10 text-accent group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-none text-center">Flow Finance</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1 text-center">{t.appSubtitle}</p>
        </div>

        <div className={`bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/5 p-6 sm:p-8 rounded-[2rem] shadow-2xl w-full flex flex-col justify-center transition-all duration-300 relative overflow-hidden`}>
           
           {step === 'email' ? (
             <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="mb-6 flex flex-col gap-1 items-center text-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">{mode === 'login' ? t.welcomeBack : t.createAccount}</h2>
                  <p className="text-xs sm:text-sm text-gray-500">{mode === 'login' ? t.loginSub : t.registerSub}</p>
                </div>

                <form onSubmit={handleSendLink} className="flex flex-col gap-4">
                    {mode === 'register' && (
                      <div className="relative flex items-center bg-[#0a0a0b] border border-white/10 rounded-2xl overflow-hidden focus-within:border-accent h-12 animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className="pl-4 text-gray-400"><User className="w-5 h-5" /></div>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePlaceholder} className="w-full bg-transparent text-white p-4 outline-none placeholder-gray-600 font-medium capitalize" required />
                      </div>
                    )}
                    <div className="relative flex items-center bg-[#0a0a0b] border border-white/10 rounded-2xl overflow-hidden focus-within:border-accent h-12">
                      <div className="pl-4 text-gray-400"><Mail className="w-5 h-5" /></div>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder} className="w-full bg-transparent text-white p-4 outline-none placeholder-gray-600 font-medium" autoComplete="email" required autoFocus />
                    </div>

                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                    <button type="submit" disabled={isLoading} className="w-full h-14 bg-accent text-black rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-accentDark transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-accent/20 group mt-2">
                      {isLoading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : (<>{mode === 'login' ? t.btnEnter : t.btnCreate}<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>)}
                    </button>
                </form>

                <div className="mt-6 flex justify-center">
                  <button onClick={toggleMode} className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors underline decoration-transparent hover:decoration-white/30 underline-offset-4">
                    {mode === 'login' ? t.noAccount : t.haveAccount}
                  </button>
                </div>
             </div>
           ) : (
             <div className="animate-in fade-in duration-300 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500/20">
                  <MailCheck className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-white leading-tight">{t.magicLinkTitle}</h2>
                <p className="text-sm text-gray-400">{t.magicLinkSub.replace('{email}', email)}</p>
                <div className="mt-2 flex items-center gap-2 bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-lg border border-yellow-500/20">
                    <AlertCircle className="w-3 h-3" />
                    <p className="text-[10px] font-bold uppercase">{t.spamWarning}</p>
                </div>
                <button onClick={backToForm} className="w-full h-12 bg-[#2c2c2e] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#3a3a3c] transition-all mt-4">
                   <ChevronLeft className="w-4 h-4" /> {t.back}
                </button>
             </div>
           )}

           <div className={`mt-8 flex justify-center transition-all`}>
              <div className="flex items-center gap-2 bg-[#0a0a0b]/50 px-3 py-1.5 rounded-full border border-white/5">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{t.security}</span>
              </div>
           </div>
        </div>
      </div>
      
      <div className="w-full flex flex-col items-center gap-3 relative z-10 flex-shrink-0 pb-6 pt-2">
         <p className="text-[10px] text-gray-600">{t.copyright}</p>
      </div>
    </div>
  );
};

export default LoginScreen;
