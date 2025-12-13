
import React, { useState, useRef, useEffect } from 'react';
import { X, Crown, CheckCircle2, Copy, Upload, Loader2, AlertCircle, ScanLine, BarChart3, Building, Palette, CloudLightning, ArrowRight, ChevronLeft, Clock } from 'lucide-react';
import { verifyPaymentReceipt } from '../services/geminiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const PIX_CODE = "00020101021126580014br.gov.bcb.pix01363b390a38-81c6-46c8-93a9-038136c6736f52040000530398654047.005802BR5917NAYLAN M DA CUNHA6008SAO LUIS62070503***6304B611";

type Step = 'benefits' | 'payment' | 'verify';

const ProModal: React.FC<Props> = ({ isOpen, onClose, onUpgrade }) => {
  const [step, setStep] = useState<Step>('benefits');
  const [isCopied, setIsCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes in seconds
  
  // Upload States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset step when opening
  useEffect(() => {
    if (isOpen) {
        setStep('benefits');
        setVerificationResult(null);
        setSelectedImage(null);
        setTimeLeft(20 * 60); // Reset timer
    }
  }, [isOpen]);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    // Timer runs on BOTH payment and verify steps now
    if (isOpen && (step === 'payment' || step === 'verify') && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, step, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_CODE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setVerificationResult(null); // Reset previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerify = async () => {
    if (!selectedImage) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Call Gemini Service
      const result = await verifyPaymentReceipt(selectedImage);

      if (result.valid) {
        setVerificationResult({ success: true, message: "Pagamento confirmado! Ativando PRO..." });
        setTimeout(() => {
          onUpgrade();
        }, 2000);
      } else {
        setVerificationResult({ success: false, message: result.reason });
      }
    } catch (error) {
      setVerificationResult({ success: false, message: "Erro ao processar imagem." });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBack = () => {
      if (step === 'payment') setStep('benefits');
      if (step === 'verify') setStep('payment');
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] relative flex flex-col overflow-hidden border border-yellow-500/20 shadow-2xl shadow-yellow-500/10 max-h-[90dvh]">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 h-24 w-full relative flex items-center justify-center shrink-0">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            
            {/* Back Button (Only for steps > 1) */}
            {step !== 'benefits' && (
                <button 
                    onClick={handleBack}
                    className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors z-20"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
            )}

            <div className="flex items-center gap-2 z-10">
               <Crown className="w-8 h-8 text-white fill-white drop-shadow-md" />
               <span className="text-2xl font-black text-white italic tracking-wide">PRO</span>
            </div>
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mt-4">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 'benefits' ? 'w-8 bg-yellow-500' : 'w-2 bg-gray-600'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 'payment' ? 'w-8 bg-yellow-500' : 'w-2 bg-gray-600'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 'verify' ? 'w-8 bg-yellow-500' : 'w-2 bg-gray-600'}`} />
        </div>

        <div className="p-6 pt-4 flex flex-col items-center text-center overflow-y-auto no-scrollbar flex-1">
            
            {/* --- STEP 1: BENEFITS --- */}
            {step === 'benefits' && (
               <div className="w-full flex flex-col items-center animate-in slide-in-from-right-4 duration-300 gap-4 h-full">
                  
                  <div className="flex flex-col items-center mb-2">
                      <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Assinatura Premium</span>
                      <h2 className="text-2xl font-bold text-white">Desbloqueie Tudo</h2>
                  </div>

                  {/* Advantages Card */}
                  <div className="w-full bg-[#2c2c2e] rounded-2xl p-5 border border-white/5 shadow-lg relative overflow-hidden group flex-1">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-full pointer-events-none" />
                      
                      <ul className="flex flex-col gap-4">
                        <li className="flex items-center gap-3 text-left">
                          <div className="p-2 bg-blue-500/10 rounded-xl shrink-0"><BarChart3 className="w-5 h-5 text-blue-400" /></div>
                          <div>
                              <span className="text-sm text-white font-bold block">Análise Avançada</span>
                              <span className="text-xs text-gray-400">Gráficos detalhados de gastos.</span>
                          </div>
                        </li>
                        <li className="flex items-center gap-3 text-left">
                          <div className="p-2 bg-purple-500/10 rounded-xl shrink-0"><Building className="w-5 h-5 text-purple-400" /></div>
                          <div>
                              <span className="text-sm text-white font-bold block">Investimentos</span>
                              <span className="text-xs text-gray-400">Controle FIIs e Renda Fixa.</span>
                          </div>
                        </li>
                        <li className="flex items-center gap-3 text-left">
                          <div className="p-2 bg-pink-500/10 rounded-xl shrink-0"><Palette className="w-5 h-5 text-pink-400" /></div>
                          <div>
                              <span className="text-sm text-white font-bold block">Personalização</span>
                              <span className="text-xs text-gray-400">Acesso a todos os temas de cores.</span>
                          </div>
                        </li>
                        <li className="flex items-center gap-3 text-left">
                            <div className="p-2 bg-green-500/10 rounded-xl shrink-0"><CloudLightning className="w-5 h-5 text-green-400" /></div>
                            <div>
                                <span className="text-sm text-white font-bold block">Backup em Nuvem</span>
                                <span className="text-xs text-gray-400">Seus dados sempre seguros.</span>
                            </div>
                        </li>
                      </ul>
                  </div>

                  {/* Price & CTA */}
                  <div className="w-full mt-auto">
                      <div className="flex justify-between items-center px-4 mb-4">
                          <span className="text-gray-400 text-sm">Valor Mensal</span>
                          <div className="flex items-baseline gap-1">
                             <span className="text-yellow-500 font-bold text-sm">R$</span>
                             <span className="text-white font-black text-2xl">7,00</span>
                          </div>
                      </div>

                      <button 
                        onClick={() => setStep('payment')}
                        className="w-full h-14 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-[1.5rem] font-bold text-black text-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-yellow-500/20"
                      >
                        Quero ser PRO
                        <ArrowRight className="w-5 h-5" />
                      </button>
                  </div>
               </div>
            )}

            {/* --- STEP 2: PAYMENT --- */}
            {step === 'payment' && (
               <div className="w-full flex flex-col items-center animate-in slide-in-from-right-4 duration-300 pb-4 h-full">
                  
                  <h3 className="text-white font-bold text-lg mb-2">Pagamento via Pix</h3>

                  {/* Visual Timer */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 font-mono font-bold text-sm ${
                      timeLeft < 60 ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(timeLeft)}</span>
                  </div>

                  {/* Payment Card */}
                  <div className="w-full bg-[#2c2c2e] rounded-2xl p-5 border border-white/5 shadow-lg flex flex-col items-center flex-1 justify-center">
                      
                      {/* QR Code Container */}
                      <div className="p-3 bg-white rounded-xl mb-4 shadow-sm relative">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(PIX_CODE)}`} 
                            alt="QR Code Pix"
                            className="w-40 h-40 mix-blend-multiply" 
                          />
                          <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
                             R$ 7,00
                          </div>
                      </div>

                      {/* Copy Paste Code */}
                      <div className="w-full bg-[#1c1c1e] p-3 rounded-xl border border-white/5 flex flex-col gap-2 mb-4">
                         <span className="text-[10px] text-gray-500 uppercase font-bold text-left">Pix Copia e Cola</span>
                         <p className="text-xs text-gray-300 font-mono truncate text-left opacity-60">
                           {PIX_CODE}
                         </p>
                      </div>

                      <button 
                        onClick={handleCopyPix}
                        className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                           isCopied ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-gray-200'
                        }`}
                      >
                        {isCopied ? (
                           <>
                             <CheckCircle2 className="w-4 h-4" />
                             Código Copiado!
                           </>
                        ) : (
                           <>
                             <Copy className="w-4 h-4" />
                             Copiar Código Pix
                           </>
                        )}
                      </button>
                  </div>

                  <div className="w-full mt-4">
                      <p className="text-gray-500 text-xs mb-3">
                         Após realizar o pagamento, clique abaixo para validar.
                      </p>
                      <button 
                        onClick={() => setStep('verify')}
                        className="w-full h-14 bg-[#2c2c2e] border border-yellow-500/30 text-yellow-500 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-2 hover:bg-yellow-500/10 transition-all"
                      >
                        Já fiz o pagamento
                        <ArrowRight className="w-5 h-5" />
                      </button>
                  </div>
               </div>
            )}

            {/* --- STEP 3: VERIFY --- */}
            {step === 'verify' && (
               <div className="w-full flex flex-col items-center animate-in slide-in-from-right-4 duration-300 h-full">
                  
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                     <ScanLine className="w-8 h-8 text-blue-500" />
                  </div>

                  {/* Visual Timer (Added here too) */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 font-mono font-bold text-sm ${
                      timeLeft < 60 ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(timeLeft)}</span>
                  </div>

                  <h3 className="text-white font-bold text-lg mb-1">Anexar Comprovante</h3>
                  <p className="text-gray-400 text-xs mb-6 px-4">
                     Envie o print do comprovante. Nossa IA verificará se o pagamento de <strong className="text-white">R$ 7,00</strong> foi concluído.
                  </p>

                  {/* Upload Area */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full flex-1 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all mb-4 overflow-hidden relative min-h-[200px] ${
                       selectedImage ? 'border-yellow-500/50 bg-[#2c2c2e]' : 'border-gray-600 bg-[#2c2c2e]/50 hover:bg-[#2c2c2e]'
                    }`}
                  >
                     {selectedImage ? (
                        <img src={selectedImage} alt="Receipt" className="w-full h-full object-contain" />
                     ) : (
                        <>
                           <Upload className="w-8 h-8 text-gray-400 mb-2" />
                           <span className="text-xs text-gray-400 font-bold">Toque para selecionar</span>
                        </>
                     )}
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                     />
                  </div>

                  {/* Verification Status */}
                  {verificationResult && (
                     <div className={`w-full p-3 rounded-xl mb-4 flex items-center gap-3 text-left ${
                        verificationResult.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                     }`}>
                        {verificationResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                        <p className="text-xs font-bold leading-tight">{verificationResult.message}</p>
                     </div>
                  )}

                  <button 
                     onClick={handleVerify}
                     disabled={!selectedImage || isVerifying || verificationResult?.success}
                     className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[1.5rem] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all mb-2"
                  >
                     {isVerifying ? (
                        <>
                           <Loader2 className="w-5 h-5 animate-spin" />
                           Verificando...
                        </>
                     ) : (
                        <>
                           <CheckCircle2 className="w-5 h-5" />
                           Enviar Comprovante
                        </>
                     )}
                  </button>
               </div>
            )}
            
        </div>
      </div>
    </div>
  );
};

export default ProModal;
