
import React, { useState, useEffect } from 'react';
import { X, Crown, CheckCircle2, Copy, Loader2, ArrowRight, ChevronLeft, CreditCard, QrCode, Lock, Building, Palette, CloudLightning, BarChart3, User, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import { TRANSLATIONS } from '../i18n';
import { AppLanguage } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  userEmail?: string;
  userName?: string;
  lang: AppLanguage;
}

type Step = 'benefits' | 'payment';
type PaymentType = 'pix' | 'credit_card';

const ProModal: React.FC<Props> = ({ isOpen, onClose, onUpgrade, userEmail, userName, lang }) => {
  const [step, setStep] = useState<Step>('benefits');
  const [paymentType, setPaymentType] = useState<PaymentType>('pix');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [pixData, setPixData] = useState<{ encodedImage: string; payload: string; expirationDate: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600);

  const [billingData, setBillingData] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
    cpf: ''
  });

  const t = TRANSLATIONS[lang];

  // ... (useEffects remain same)
  useEffect(() => {
    if (isOpen) {
        setStep('benefits');
        setPaymentType('pix');
        setPixData(null);
        setPaymentId(null);
        setError('');
        setLoading(false);
        setBillingData(prev => ({ ...prev, holderName: userName || '' }));
    }
  }, [isOpen, userName]);

  useEffect(() => {
    let timer: any;
    if (isOpen && step === 'payment' && pixData && timeLeft > 0) {
        timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, step, pixData, timeLeft]);

  useEffect(() => {
     if (pixData) setTimeLeft(600);
  }, [pixData]);

  const formatTime = (seconds: number) => {
     const m = Math.floor(seconds / 60);
     const s = seconds % 60;
     return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: any;
    if (isOpen && paymentId) {
       interval = setInterval(async () => {
          try {
             const res = await fetch(`/api/check-status?id=${paymentId}`);
             const data = await res.json();
             if (data.paid) {
                clearInterval(interval);
                onUpgrade();
             }
          } catch (e) {
             console.error("Polling error", e);
          }
       }, 5000);
    }
    return () => clearInterval(interval);
  }, [paymentId, isOpen, onUpgrade]);

  if (!isOpen) return null;

  const handleCopyPix = () => {
    if (pixData?.payload) {
        navigator.clipboard.writeText(pixData.payload);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleCreatePayment = async () => {
    if (!billingData.cpf || billingData.cpf.length < 11) {
        setError('Por favor, informe um CPF válido.');
        return;
    }
    if (!billingData.holderName) {
        setError('Por favor, informe o nome completo.');
        return;
    }

    setLoading(true);
    setError('');

    try {
       const res = await fetch('/api/create-charge', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            paymentType,
            user: { email: userEmail, name: userName },
            billingInfo: {
                name: billingData.holderName,
                cpf: billingData.cpf,
                number: billingData.number,
                expiryMonth: billingData.expiryMonth,
                expiryYear: billingData.expiryYear,
                ccv: billingData.ccv
            }
         })
       });

       const data = await res.json();

       if (!res.ok) {
         throw new Error(data.error || 'Erro ao criar cobrança');
       }

       setPaymentId(data.paymentId);

       if (paymentType === 'pix') {
          setPixData(data.pix);
       } else {
          if (data.status === 'CONFIRMED' || data.status === 'RECEIVED') {
             onUpgrade();
          }
       }

    } catch (err: any) {
       setError(err.message);
    } finally {
       setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBillingData({ ...billingData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] relative flex flex-col overflow-hidden border border-yellow-500/20 shadow-2xl shadow-yellow-500/10 max-h-[90dvh]">
        
        <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 h-24 w-full relative flex items-center justify-center shrink-0">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            
            {step !== 'benefits' && (
                <button 
                    onClick={() => setStep('benefits')}
                    className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors z-20"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
            )}

            <div className="flex items-center gap-2 z-10">
               <Crown className="w-8 h-8 text-white fill-white drop-shadow-md" />
               <span className="text-2xl font-black text-white italic tracking-wide">{t.pro.title}</span>
            </div>
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>
        </div>

        <div className="p-6 pt-4 flex flex-col items-center text-center overflow-y-auto no-scrollbar flex-1">
            
            {step === 'benefits' && (
               <div className="w-full flex flex-col items-center animate-in slide-in-from-right-4 duration-300 gap-4 h-full">
                  
                  <div className="flex flex-col items-center mb-2">
                      <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t.pro.subtitle}</span>
                      <h2 className="text-2xl font-bold text-white">{t.pro.unlock}</h2>
                  </div>

                  <div className="w-full bg-[#2c2c2e] rounded-2xl p-5 border border-white/5 shadow-lg relative overflow-hidden group flex-1 text-left">
                      <ul className="flex flex-col gap-4">
                        <li className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 rounded-xl shrink-0"><BarChart3 className="w-5 h-5 text-blue-400" /></div>
                          <div><span className="text-sm text-white font-bold block">{t.pro.features.analytics}</span><span className="text-xs text-gray-400">{t.pro.features.analyticsDesc}</span></div>
                        </li>
                        <li className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/10 rounded-xl shrink-0"><Building className="w-5 h-5 text-purple-400" /></div>
                          <div><span className="text-sm text-white font-bold block">{t.pro.features.invest}</span><span className="text-xs text-gray-400">{t.pro.features.investDesc}</span></div>
                        </li>
                        <li className="flex items-center gap-3">
                          <div className="p-2 bg-pink-500/10 rounded-xl shrink-0"><Palette className="w-5 h-5 text-pink-400" /></div>
                          <div><span className="text-sm text-white font-bold block">{t.pro.features.themes}</span><span className="text-xs text-gray-400">{t.pro.features.themesDesc}</span></div>
                        </li>
                         <li className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 rounded-xl shrink-0"><CloudLightning className="w-5 h-5 text-green-400" /></div>
                            <div><span className="text-sm text-white font-bold block">{t.pro.features.backup}</span><span className="text-xs text-gray-400">{t.pro.features.backupDesc}</span></div>
                        </li>
                      </ul>
                  </div>

                  <div className="w-full mt-auto">
                      <div className="flex justify-between items-center px-4 mb-4">
                          <span className="text-gray-400 text-sm">{t.pro.priceLabel}</span>
                          <div className="flex items-baseline gap-1">
                             <span className="text-yellow-500 font-bold text-sm">R$</span>
                             <span className="text-white font-black text-2xl">3,00</span>
                          </div>
                      </div>

                      <button 
                        onClick={() => setStep('payment')}
                        className="w-full h-14 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-[1.5rem] font-bold text-black text-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-yellow-500/20"
                      >
                        {t.pro.btn}
                        <ArrowRight className="w-5 h-5" />
                      </button>
                  </div>
               </div>
            )}

            {step === 'payment' && (
               <div className="w-full flex flex-col items-center animate-in slide-in-from-right-4 duration-300 pb-4 h-full">
                  
                  <div className="flex bg-[#2c2c2e] p-1 rounded-xl w-full mb-4">
                     <button 
                       onClick={() => { setPaymentType('pix'); setPaymentId(null); setPixData(null); }}
                       className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${paymentType === 'pix' ? 'bg-[#3a3a3c] text-white shadow-md' : 'text-gray-500'}`}
                     >
                        <QrCode className="w-4 h-4" /> {t.pro.payment.pix}
                     </button>
                     <button 
                       onClick={() => { setPaymentType('credit_card'); setPaymentId(null); }}
                       className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${paymentType === 'credit_card' ? 'bg-[#3a3a3c] text-white shadow-md' : 'text-gray-500'}`}
                     >
                        <CreditCard className="w-4 h-4" /> {t.pro.payment.card}
                     </button>
                  </div>

                  {paymentType === 'pix' && (
                     <div className="w-full flex flex-col items-center gap-3 flex-1 justify-center">
                        {loading ? (
                           <div className="flex flex-col items-center py-10">
                              <Loader2 className="w-10 h-10 text-yellow-500 animate-spin mb-2" />
                              <span className="text-gray-400 text-sm">{t.pro.payment.generating}</span>
                           </div>
                        ) : !pixData ? (
                            <div className="w-full flex flex-col gap-3">
                                <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20 mb-2">
                                   <p className="text-[10px] text-yellow-500 text-center leading-tight" dangerouslySetInnerHTML={{ __html: t.pro.payment.cpfRequired }} />
                                </div>

                                <div className="relative group">
                                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><User className="w-4 h-4" /></div>
                                   <input 
                                      name="holderName"
                                      placeholder={t.profile.namePlaceholder}
                                      value={billingData.holderName}
                                      onChange={handleInputChange}
                                      className="w-full bg-[#2c2c2e] p-3 pl-10 rounded-xl text-white outline-none focus:ring-2 focus:ring-yellow-500 text-sm uppercase"
                                   />
                                </div>

                                <div className="relative group">
                                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><ShieldCheck className="w-4 h-4" /></div>
                                   <input 
                                      name="cpf"
                                      placeholder="CPF"
                                      value={billingData.cpf}
                                      onChange={handleInputChange}
                                      maxLength={14}
                                      className="w-full bg-[#2c2c2e] p-3 pl-10 rounded-xl text-white outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                                   />
                                </div>

                                <button 
                                  onClick={handleCreatePayment}
                                  className="w-full h-12 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition-colors mt-2"
                                >
                                   Pix R$ 3,00
                                </button>
                            </div>
                        ) : (
                           <>
                              <div className="bg-red-500/10 text-red-500 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 mb-1 animate-pulse border border-red-500/20">
                                 <Clock className="w-3 h-3" />
                                 <span>{formatTime(timeLeft)}</span>
                              </div>

                              <div className="bg-white p-2 rounded-xl">
                                 <img src={`data:image/jpeg;base64,${pixData.encodedImage}`} alt="QR Code Pix" className="w-48 h-48 mix-blend-multiply" />
                              </div>
                              
                              <div className="w-full">
                                 <p className="text-gray-400 text-xs mb-2 font-bold uppercase text-left">{t.pro.payment.copyPaste}</p>
                                 
                                 <textarea
                                    readOnly
                                    value={pixData.payload}
                                    className="w-full bg-[#0a0a0b] text-gray-400 text-[10px] p-3 rounded-xl resize-none h-16 outline-none border border-white/5 break-all mb-2 font-mono"
                                    onClick={(e) => e.currentTarget.select()}
                                 />

                                 <button onClick={handleCopyPix} className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border border-white/10 ${isCopied ? 'bg-green-500/20 text-green-500' : 'bg-[#2c2c2e] text-white'}`}>
                                    {isCopied ? <><CheckCircle2 className="w-4 h-4" /> {t.pro.payment.copied}</> : <><Copy className="w-4 h-4" /> {t.pro.payment.copyBtn}</>}
                                 </button>

                                 <div className="bg-red-500/10 p-3 rounded-xl mt-3 border border-red-500/20 flex items-start gap-2 text-left">
                                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                    <div className="flex flex-col gap-1">
                                       <p className="text-[11px] text-white font-bold leading-tight">
                                          {t.pro.payment.bankApp}
                                       </p>
                                       <p className="text-[10px] text-gray-400 leading-tight">
                                          {t.pro.payment.bankAppDesc}
                                       </p>
                                    </div>
                                 </div>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-2">
                                 <Loader2 className="w-3 h-3 text-yellow-500 animate-spin" />
                                 <span className="text-[10px] text-yellow-500 font-bold uppercase">{t.pro.payment.waiting}</span>
                              </div>
                           </>
                        )}
                     </div>
                  )}

                  {paymentType === 'credit_card' && (
                     <div className="w-full flex flex-col gap-3 overflow-y-auto no-scrollbar pt-2 pb-2">
                        {loading ? (
                           <div className="flex flex-col items-center py-12">
                              <Loader2 className="w-10 h-10 text-yellow-500 animate-spin mb-2" />
                              <span className="text-gray-400 text-sm">{t.pro.payment.processing}</span>
                           </div>
                        ) : paymentId ? (
                           <div className="flex flex-col items-center py-10 gap-4">
                              <Lock className="w-12 h-12 text-yellow-500" />
                              <h3 className="text-white font-bold text-lg">Processando...</h3>
                              <div className="flex items-center gap-2 mt-2 animate-pulse">
                                 <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                                 <span className="text-xs text-yellow-500 font-bold uppercase">{t.pro.payment.verifying}</span>
                              </div>
                           </div>
                        ) : (
                           <>
                              <input 
                                name="holderName"
                                placeholder={t.profile.namePlaceholder}
                                value={billingData.holderName}
                                onChange={handleInputChange}
                                className="w-full bg-[#2c2c2e] p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-yellow-500 text-sm uppercase"
                              />
                              <input 
                                name="cpf"
                                placeholder="CPF"
                                value={billingData.cpf}
                                onChange={handleInputChange}
                                className="w-full bg-[#2c2c2e] p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                              />
                              <input 
                                name="number"
                                placeholder="0000 0000 0000 0000"
                                value={billingData.number}
                                onChange={handleInputChange}
                                maxLength={16}
                                className="w-full bg-[#2c2c2e] p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                              />
                              <div className="flex gap-3">
                                 <input 
                                    name="expiryMonth"
                                    placeholder="MM"
                                    maxLength={2}
                                    value={billingData.expiryMonth}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#2c2c2e] p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-yellow-500 text-sm text-center"
                                 />
                                 <input 
                                    name="expiryYear"
                                    placeholder="AAAA"
                                    maxLength={4}
                                    value={billingData.expiryYear}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#2c2c2e] p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-yellow-500 text-sm text-center"
                                 />
                                 <input 
                                    name="ccv"
                                    placeholder="CVV"
                                    maxLength={4}
                                    value={billingData.ccv}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#2c2c2e] p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-yellow-500 text-sm text-center"
                                 />
                              </div>

                              <button 
                                 onClick={handleCreatePayment}
                                 className="w-full h-12 bg-yellow-500 text-black rounded-xl font-bold hover:bg-yellow-400 transition-colors mt-2"
                              >
                                 {t.pro.payment.payBtn} R$ 3,00
                              </button>
                           </>
                        )}
                     </div>
                  )}

                  {error && (
                     <div className="w-full mt-2 p-3 bg-red-500/20 rounded-xl border border-red-500/50">
                        <p className="text-red-400 text-xs text-center font-bold">{error}</p>
                     </div>
                  )}
                  
                  <div className="mt-auto pt-4 flex items-center justify-center gap-1 opacity-50">
                     <Lock className="w-3 h-3 text-gray-500" />
                     <span className="text-[10px] text-gray-500 uppercase font-bold">{t.pro.payment.secure}</span>
                  </div>

               </div>
            )}
            
        </div>
      </div>
    </div>
  );
};

export default ProModal;
