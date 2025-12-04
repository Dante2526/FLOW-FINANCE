
import React from 'react';
import { X, Crown, BarChart3, Users, CheckCircle2, Palette, Building, Star } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const ProModal: React.FC<Props> = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] relative flex flex-col overflow-hidden border border-yellow-500/20 shadow-2xl shadow-yellow-500/10 max-h-[90dvh] overflow-y-auto no-scrollbar">
        
        {/* Golden Gradient Header */}
        <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 h-32 w-full relative flex items-center justify-center shrink-0">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl border-2 border-white/30">
                <Crown className="w-10 h-10 text-white fill-white drop-shadow-md" />
            </div>
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
        </div>

        <div className="p-8 pt-6 flex flex-col items-center text-center">
            <h2 className="text-2xl font-black text-white italic tracking-wide uppercase mb-1">
              Seja <span className="text-yellow-500">PRO</span>
            </h2>
            <p className="text-gray-400 text-sm mb-6">Desbloqueie todo o potencial financeiro.</p>

            {/* Price Badge */}
            <div className="bg-[#2c2c2e] border border-yellow-500/30 rounded-2xl p-4 mb-6 w-full relative overflow-hidden group">
               <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                 MENSAL
               </div>
               <div className="flex flex-col items-center">
                 <span className="text-gray-400 text-xs uppercase font-bold mb-1">Assinatura</span>
                 <div className="flex items-baseline gap-1">
                    <span className="text-yellow-500 font-bold text-lg">R$</span>
                    <span className="text-white font-black text-4xl tracking-tighter">5,00</span>
                 </div>
                 <span className="text-gray-500 text-[10px] mt-1">Renovação a cada 30 dias</span>
               </div>
            </div>

            <div className="flex flex-col gap-5 w-full mb-8">
                
                {/* Analytics */}
                <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">Análise Completa</h3>
                        <p className="text-xs text-gray-500">Gráficos detalhados e insights.</p>
                    </div>
                </div>

                {/* Customization */}
                <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0">
                        <Palette className="w-6 h-6 text-pink-500" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">Temas Premium</h3>
                        <p className="text-xs text-gray-500">7 Cores de App + Cores de Cartão.</p>
                    </div>
                </div>

                {/* Investments */}
                <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Building className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">Investidor FIIs</h3>
                        <p className="text-xs text-gray-500">Acesso a Fundos Imobiliários.</p>
                    </div>
                </div>

                {/* Avatars */}
                <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">8 Avatares Exclusivos</h3>
                        <p className="text-xs text-gray-500">Personalize seu perfil ao máximo.</p>
                    </div>
                </div>

            </div>

            <button 
               onClick={onUpgrade}
               className="w-full h-16 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-[1.5rem] font-bold text-lg text-white flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
               Assinar por R$ 5,00
               <CheckCircle2 className="w-5 h-5" />
            </button>
            
            <p className="mt-4 text-[10px] text-gray-600">
               O valor será descontado do seu saldo no app.
            </p>
        </div>

      </div>
    </div>
  );
};

export default ProModal;