
import React from 'react';
import { X, ShieldCheck, Lock, Database, Eye } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-white/5 relative flex flex-col h-[80dvh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 shrink-0 border-b border-white/5">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-white leading-none">Privacidade</h2>
                <p className="text-[10px] text-gray-400 mt-1">Termos e Condições</p>
             </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-4 flex flex-col gap-6 text-sm text-gray-300 leading-relaxed">
           
           <div className="flex flex-col gap-2">
              <h3 className="text-white font-bold flex items-center gap-2">
                 <Database className="w-4 h-4 text-accent" /> 1. Coleta de Dados
              </h3>
              <p className="text-xs text-gray-400 text-justify">
                 O Flow Finance coleta apenas as informações estritamente necessárias para o funcionamento do aplicativo, como seu endereço de e-mail (para autenticação) e os dados financeiros inseridos manualmente por você (transações, contas e investimentos).
              </p>
           </div>

           <div className="flex flex-col gap-2">
              <h3 className="text-white font-bold flex items-center gap-2">
                 <Lock className="w-4 h-4 text-accent" /> 2. Armazenamento e Segurança
              </h3>
              <p className="text-xs text-gray-400 text-justify">
                 Seus dados são armazenados de forma segura utilizando serviços de nuvem criptografados (Supabase/Firebase). O aplicativo também utiliza o armazenamento local do seu dispositivo para garantir o funcionamento offline e melhorar a performance. Não compartilhamos seus dados financeiros com terceiros.
              </p>
           </div>

           <div className="flex flex-col gap-2">
              <h3 className="text-white font-bold flex items-center gap-2">
                 <Eye className="w-4 h-4 text-accent" /> 3. Uso das Informações
              </h3>
              <p className="text-xs text-gray-400 text-justify">
                 As informações inseridas são utilizadas exclusivamente para gerar os gráficos, relatórios e cálculos exibidos no seu painel. O Flow Finance não analisa seus dados para fins de publicidade ou venda de informações.
              </p>
           </div>

           <div className="flex flex-col gap-2">
              <h3 className="text-white font-bold">4. Notificações</h3>
              <p className="text-xs text-gray-400 text-justify">
                 Ao ativar as notificações, você concorda em receber alertas sobre vencimentos de contas. Você pode desativar este recurso a qualquer momento nas configurações do seu navegador ou dispositivo.
              </p>
           </div>

           <div className="flex flex-col gap-2">
              <h3 className="text-white font-bold">5. Exclusão de Conta</h3>
              <p className="text-xs text-gray-400 text-justify">
                 Você tem o direito de solicitar a exclusão total dos seus dados a qualquer momento através da opção "Excluir Conta" presente no menu de perfil. Esta ação é irreversível e remove todas as informações dos nossos servidores.
              </p>
           </div>
           
           <div className="mt-4 pt-4 border-t border-white/5 text-center">
              <p className="text-[10px] text-gray-500">
                 Flow Finance © 2025
              </p>
           </div>

        </div>
        
        {/* Footer Action */}
        <div className="pt-4 shrink-0">
           <button 
             onClick={onClose}
             className="w-full h-12 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white rounded-xl font-bold text-sm transition-colors"
           >
             Entendi
           </button>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
