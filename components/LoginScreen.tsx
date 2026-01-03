
import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, ShieldCheck, User, KeyRound, ChevronLeft, AlertCircle, Languages } from 'lucide-react';
import { loadData, saveData, STORAGE_KEYS } from '../services/storage';
import { sendAuthOtp, verifyAuthOtp, supabase } from '../services/supabase';
import { TRANSLATIONS, getBrowserLanguage } from '../i18n';
import { AppLanguage } from '../types';

interface Props {
  onLogin: (email: string, name?: string) => Promise<void>;
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

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Timer para evitar spam no botão de reenvio
  const [resendTimer, setResendTimer] = useState(0);

  // Language State with Browser Detection Fallback
  const [language, setLanguage] = useState<AppLanguage>(() => loadData(STORAGE_KEYS.APP_LANGUAGE, getBrowserLanguage()));
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // Translations shortcut
  const t = TRANSLATIONS[language].auth;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleLanguageChange = (lang: AppLanguage) => {
    setLanguage(lang);
    saveData(STORAGE_KEYS.APP_LANGUAGE, lang);
    setIsLangMenuOpen(false);
  };

  const handleSendCode = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    
    // Se o timer estiver ativo, não faz nada
    if (resendTimer > 0) return;

    setError('');

    // Validação Básica
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError(t.errors.invalidEmail);
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setError(t.errors.missingName);
      return;
    }

    setIsLoading(true);
    console.log(`[FlowAuth] Iniciando processo de envio de OTP para: ${email} (Modo: ${mode})`);

    try {
      // RLS FIX: Check if we actually have a valid session before skipping OTP.
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSessionEmail = sessionData.session?.user?.email;
      const isSessionValid = currentSessionEmail && currentSessionEmail.toLowerCase() === email.toLowerCase().trim();

      // If we have a valid session, we can proceed directly without OTP
      if (mode === 'login' && isSessionValid) {
         console.log(`[FlowAuth] Sessão válida encontrada para ${email}. Pulando OTP.`);
         await onLogin(email);
         return; 
      }

      // If no valid session, we MUST send OTP to authenticate and get the token for RLS.
      console.log(`[FlowAuth] Chamando Supabase Auth para enviar OTP...`);
      const response = await sendAuthOtp(email);
      console.log(`[FlowAuth] Resposta do servidor recebida com sucesso:`, response);
      
      setStep('otp');
      setError('');
      // Inicia um cooldown mais seguro de 60s
      setResendTimer(60);
    } catch (err: any) {
      console.error(`[FlowAuth] Erro crítico ao solicitar OTP:`, err);
      const msg = err.message || t.errors.genericSend;
      setError(msg);

      // Se o erro for de Rate Limit (contém "Aguarde Xs"), ativa o timer com o tempo retornado
      if (msg.includes('Aguarde') && msg.includes('s')) {
         const match = msg.match(/(\d+)s/);
         if (match) {
            setResendTimer(parseInt(match[1]));
         } else {
            setResendTimer(60);
         }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (otpCode.length !== 6) {
      setError(t.errors.invalidCode);
      return;
    }

    setIsLoading(true);
    console.log(`[FlowAuth] Iniciando verificação do código OTP para: ${email}`);

    try {
      // 1. Verifica o código no Supabase Auth
      const verificationData = await verifyAuthOtp(email, otpCode);
      console.log(`[FlowAuth] Código verificado com sucesso. Dados da sessão:`, verificationData);
      
      // 2. Prossegue com a lógica do App (Sync de dados ou Criação)
      if (mode === 'register') {
        console.log(`[FlowAuth] Prosseguindo com registro do usuário: ${name}`);
        await onLogin(email, name);
      } else {
        console.log(`[FlowAuth] Prosseguindo com login do usuário.`);
        await onLogin(email);
      }
    } catch (err: any) {
      console.error(`[FlowAuth] Erro ao verificar código OTP:`, err);
      setError(err.message || t.errors.genericVerify);
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setStep('email');
    setError('');
    setOtpCode('');
    setResendTimer(0);
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtpCode('');
    setError('');
    // Não zeramos o timer aqui propositalmente para manter o cooldown se o usuário voltar rápido
  };

  return (
    <div className="h-[100dvh] w-full bg-[#0a0a0b] flex flex-col items-center p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Language Selector (Top Right) */}
      <div className="absolute top-4 right-4 z-50">
        <div className="relative">
            <button 
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="p-2.5 bg-[#1c1c1e] border border-white/5 rounded-2xl hover:bg-[#2c2c2e] transition-colors cursor-pointer active:scale-95 text-gray-400 flex items-center justify-center shadow-lg"
            >
              <Languages className="w-5 h-5" />
            </button>
            {isLangMenuOpen && (
              <div className="absolute top-full right-0 mt-2 bg-[#1c1c1e] border border-white/5 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 w-32 animate-in fade-in zoom-in duration-200">
                  <button onClick={() => handleLanguageChange('pt')} className={`p-2 rounded-xl text-sm font-bold text-left transition-colors ${language === 'pt' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>
                    Português
                  </button>
                  <button onClick={() => handleLanguageChange('en')} className={`p-2 rounded-xl text-sm font-bold text-left transition-colors ${language === 'en' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>
                    English
                  </button>
                  <button onClick={() => handleLanguageChange('es')} className={`p-2 rounded-xl text-sm font-bold text-left transition-colors ${language === 'es' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>
                    Español
                  </button>
              </div>
            )}
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className={`flex-1 flex flex-col items-center justify-center w-full max-w-md relative z-10 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 min-h-0`}>
        
        {/* Brand / Logo Area */}
        <div className={`flex flex-col items-center text-center gap-1 flex-shrink-0 transition-all ${step === 'otp' ? 'scale-75 mb-4' : 'scale-100'}`}>
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#1c1c1e] rounded-2xl sm:rounded-3xl flex items-center justify-center border border-white/5 shadow-2xl shadow-accent/10 mb-2 group">
             <div className="relative">
                <FlowLogo className="w-8 h-8 sm:w-10 sm:h-10 text-accent group-hover:scale-110 transition-transform duration-500" />
             </div>
          </div>
          {step === 'email' && (
            <div className="items-center flex flex-col">
              <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-none text-center">Flow Finance</h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-1 text-center">{t.appSubtitle}</p>
            </div>
          )}
        </div>

        {/* Login/Register Card */}
        <div className={`bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/5 p-6 sm:p-8 rounded-[2rem] shadow-2xl w-full flex flex-col justify-center transition-all duration-300 relative overflow-hidden`}>
           
           {/* Step 1: Email Form */}
           {step === 'email' && (
             <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="mb-6 flex flex-col gap-1 items-center text-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                      {mode === 'login' ? t.welcomeBack : t.createAccount}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                      {mode === 'login' ? t.loginSub : t.registerSub}
                  </p>
                </div>

                <form onSubmit={handleSendCode} className="flex flex-col gap-4">
                    
                    {/* Name Input */}
                    {mode === 'register' && (
                      <div className="flex flex-col gap-1 animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className="relative group">
                            <div className="relative flex items-center bg-[#0a0a0b] border border-white/10 rounded-2xl overflow-hidden focus-within:border-accent transition-colors h-12">
                              <div className="pl-4 text-gray-400">
                                  <User className="w-5 h-5" />
                              </div>
                              <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t.namePlaceholder}
                                className="w-full bg-transparent text-white p-4 outline-none placeholder-gray-600 font-medium capitalize"
                              />
                            </div>
                        </div>
                      </div>
                    )}

                    {/* Email Input */}
                    <div className="flex flex-col gap-1">
                      <div className="relative group">
                          <div className="relative flex items-center bg-[#0a0a0b] border border-white/10 rounded-2xl overflow-hidden focus-within:border-accent transition-colors h-12">
                            <div className="pl-4 text-gray-400">
                                <Mail className="w-5 h-5" />
                            </div>
                            <input 
                              type="email" 
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder={t.emailPlaceholder}
                              className="w-full bg-transparent text-white p-4 outline-none placeholder-gray-600 font-medium"
                              autoComplete="email"
                              autoFocus
                            />
                          </div>
                      </div>
                    </div>

                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                    <button 
                      type="submit"
                      disabled={isLoading || resendTimer > 0}
                      className="w-full h-14 bg-accent text-black rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-accentDark transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-accent/20 group mt-2"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : resendTimer > 0 ? (
                        <span className="text-sm">{t.resendWait.replace('{s}', resendTimer.toString())}</span>
                      ) : (
                        <>
                          {mode === 'login' ? t.btnEnter : t.btnCreate}
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                </form>

                {/* Toggle Mode */}
                <div className={`${mode === 'register' ? 'mt-4' : 'mt-6'} flex justify-center transition-all`}>
                  <button 
                      onClick={toggleMode}
                      className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors underline decoration-transparent hover:decoration-white/30 underline-offset-4"
                  >
                    {mode === 'login' 
                      ? t.noAccount
                      : t.haveAccount}
                  </button>
                </div>
             </div>
           )}

           {/* Step 2: OTP Form */}
           {step === 'otp' && (
             <div className="animate-in fade-in slide-in-from-right-8 duration-300">
               
               <button onClick={handleBackToEmail} className="flex items-center gap-1 text-gray-500 hover:text-white mb-4 text-xs transition-colors">
                  <ChevronLeft className="w-4 h-4" /> {t.back}
               </button>

               <div className="mb-6 flex flex-col gap-1 items-center text-center">
                 <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                    {t.verifyTitle}
                 </h2>
                 <p className="text-xs sm:text-sm text-gray-500">
                    {t.verifySub} <strong>{email}</strong>
                 </p>
                 
                 {/* Spam Warning */}
                 <div className="mt-2 flex items-center gap-2 bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-lg border border-yellow-500/20">
                    <AlertCircle className="w-3 h-3" />
                    <p className="text-[10px] font-bold uppercase">{t.spamWarning}</p>
                 </div>
               </div>

               <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                     <div className="relative group">
                        <div className="relative flex items-center bg-[#0a0a0b] border border-white/10 rounded-2xl overflow-hidden focus-within:border-accent transition-colors h-14 justify-center">
                           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                              <KeyRound className="w-5 h-5" />
                           </div>
                           <input 
                             id="otp-input"
                             name="one-time-code"
                             type="text" 
                             inputMode="numeric"
                             pattern="\d*"
                             autoComplete="one-time-code"
                             maxLength={6}
                             value={otpCode}
                             onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                             placeholder={t.otpPlaceholder}
                             className="w-full bg-transparent text-white text-center p-4 px-12 outline-none placeholder-gray-700 font-mono text-2xl tracking-widest font-bold"
                             autoFocus
                           />
                        </div>
                     </div>
                  </div>

                  {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                  <button 
                    type="submit"
                    disabled={isLoading || otpCode.length !== 6}
                    className="w-full h-14 bg-accent text-black rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-accentDark transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-accent/20 group mt-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {t.btnVerify}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
               </form>
               
               <div className="mt-6 flex justify-center">
                 <button 
                    onClick={(e) => handleSendCode(e)} // Resend
                    disabled={resendTimer > 0 || isLoading}
                    className={`text-xs transition-colors ${resendTimer > 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-500 hover:text-accent'}`}
                 >
                   {resendTimer > 0 ? t.resendWait.replace('{s}', resendTimer.toString()) : t.resendBtn}
                 </button>
               </div>
             </div>
           )}

           {/* Security Badge */}
           <div className={`mt-8 flex justify-center transition-all`}>
              <div className="flex items-center gap-2 bg-[#0a0a0b]/50 px-3 py-1.5 rounded-full border border-white/5">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{t.security}</span>
              </div>
           </div>

        </div>

      </div>
      
      {/* Footer Area */}
      <div className="w-full flex flex-col items-center gap-3 relative z-10 flex-shrink-0 pb-6 pt-2">
         <p className="text-[10px] text-gray-600">© 2025 Flow Finance</p>
      </div>

    </div>
  );
};

export default LoginScreen;
