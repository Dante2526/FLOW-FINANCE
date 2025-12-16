
import React, { useState } from 'react';
import { Mail, ArrowRight, ShieldCheck, User } from 'lucide-react';

interface Props {
  onLogin: (email: string, name?: string) => Promise<void>;
}

// Custom SVG Logo matching the brand (F with dots)
const FlowLogo = ({ className }: { className?: string }) => (
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
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validação Básica
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Por favor, insira um e-mail válido.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setError('Por favor, informe seu nome.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        await onLogin(email, name);
      } else {
        await onLogin(email);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro ao conectar.');
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="h-[100dvh] w-full bg-[#0a0a0b] flex flex-col items-center p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Content Wrapper - Flex 1 to push footer down, centered */}
      {/* Dynamic Gap: Reduced gap on Register mode to save vertical space */}
      <div className={`flex-1 flex flex-col items-center justify-center w-full max-w-md relative z-10 ${mode === 'register' ? 'gap-4' : 'gap-6'} animate-in fade-in slide-in-from-bottom-8 duration-700 min-h-0`}>
        
        {/* Brand / Logo Area */}
        <div className={`flex flex-col items-center text-center gap-1 flex-shrink-0 transition-all ${mode === 'register' ? 'scale-90' : 'scale-100'}`}>
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#1c1c1e] rounded-2xl sm:rounded-3xl flex items-center justify-center border border-white/5 shadow-2xl shadow-accent/10 mb-2 group">
             <div className="relative">
                <FlowLogo className="w-8 h-8 sm:w-10 sm:h-10 text-accent group-hover:scale-110 transition-transform duration-500" />
             </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-none">Flow Finance</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Controle financeiro inteligente.</p>
          </div>
        </div>

        {/* Login/Register Card */}
        {/* Dynamic Padding: Reduced vertical padding on Register mode */}
        <div className={`bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/5 ${mode === 'register' ? 'p-6 py-5' : 'p-6 sm:p-8'} rounded-[2rem] shadow-2xl w-full flex flex-col justify-center transition-all duration-300`}>
           <div className="mb-6 flex flex-col gap-1">
             <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
             </h2>
             <p className="text-xs sm:text-sm text-gray-500">
                {mode === 'login' ? 'Entre para acessar suas finanças.' : 'Comece a controlar seu dinheiro hoje.'}
             </p>
           </div>

           <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
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
                           placeholder="Seu Nome"
                           className="w-full bg-transparent text-white p-4 outline-none placeholder-gray-600 font-medium capitalize"
                           autoFocus={mode === 'register'}
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
                         placeholder="seu@email.com"
                         className="w-full bg-transparent text-white p-4 outline-none placeholder-gray-600 font-medium"
                         autoComplete="email"
                         autoFocus={mode === 'login'}
                       />
                    </div>
                 </div>
              </div>

              {error && <p className="text-red-500 text-xs ml-1">{error}</p>}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-accent text-black rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-accentDark transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-accent/20 group mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Entrar' : 'Criar Conta'}
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
                 ? 'Não tem uma conta? Cadastre-se' 
                 : 'Já possui conta? Fazer Login'}
             </button>
           </div>

           {/* Security Badge */}
           <div className={`${mode === 'register' ? 'mt-4' : 'mt-8'} flex justify-center transition-all`}>
              <div className="flex items-center gap-2 bg-[#0a0a0b]/50 px-3 py-1.5 rounded-full border border-white/5">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Sem senha · Acesso Seguro</span>
              </div>
           </div>

        </div>

      </div>
      
      {/* Footer Area - Always at bottom outside card */}
      <div className="w-full flex flex-col items-center gap-3 relative z-10 flex-shrink-0 pb-6 pt-2">
         <p className="text-[10px] text-gray-600">© 2025 Flow Finance</p>
      </div>

    </div>
  );
};

export default LoginScreen;
