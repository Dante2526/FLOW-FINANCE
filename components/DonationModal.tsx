import React, { useState, useEffect } from 'react';
import { X, Heart, QrCode, Copy, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { AppLanguage } from '../types';
import { TRANSLATIONS, getLocale } from '../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  appLanguage: AppLanguage;
}

const DonationModal: React.FC<Props> = ({ isOpen, onClose, userEmail, userName, appLanguage }) => {
  const [amount, setAmount] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ encodedImage: string; payload: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState('');

  const t = TRANSLATIONS[appLanguage];
  const tModal = t.donationModal;
  const locale = getLocale(appLanguage);
  const currencySymbol = appLanguage === 'pt' ? 'R$' : appLanguage === 'en' ? '$' : '€';

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setCpf('');
      setPixData(null);
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setAmount('');
      return;
    }
    const amountVal = parseFloat(rawValue) / 100;
    setAmount(amountVal.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  // Function to ensure input visibility when keyboard opens
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target;
    // Delay to allow keyboard to animate up
    setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
  };

  const getApiErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'CPF_REQUIRED':
        return tModal.errors.cpf;
      case 'ASAAS_CUSTOMER_ERROR':
      case 'ASAAS_CHARGE_ERROR':
      case 'INTERNAL_SERVER_ERROR':
      default:
        return tModal.errors.generic;
    }
  };

  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpf || cpf.length < 11) {
      setError(tModal.errors.cpf);
      return;
    }
    
    // Parse Amount
    let finalAmount = 0;
    if (locale === 'en-US') {
        finalAmount = parseFloat(amount.replace(/,/g, ''));
    } else {
        finalAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    }

    if (finalAmount < 1) {
        setError(tModal.errors.min);
        return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/create-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentType: 'pix',
          user: { email: userEmail, name: userName },
          billingInfo: {
            name: userName || 'Apoiador do Projeto',
            cpf: cpf
          },
          value: finalAmount, // Dynamic value
          description: `Doação ao Projeto - ${userName || userEmail}`
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(getApiErrorMessage(data.error));
      }

      setPixData(data.pix);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (pixData?.payload) {
      navigator.clipboard.writeText(pixData.payload);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

      {/* 
          Items-end handles the "Bottom Sheet" style on mobile to avoid jumping issues.
          Padding bottom ensures space for keyboard.
      */}
      <div 
        className="flex min-h-full items-end sm:items-center justify-center p-4 pb-32 text-center pointer-events-none"
        style={{ 
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingBottom: 'max(8rem, env(safe-area-inset-bottom))'
        }}
      >
        <div 
          className="pointer-events-auto relative w-full max-w-sm bg-[#1c1c1e] rounded-t-[2.5rem] sm:rounded-[2.5rem] flex flex-col overflow-hidden border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 transition-all"
        >
        
          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 h-24 w-full relative flex items-center justify-center shrink-0">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              
              <div className="flex items-center gap-2 z-10">
                <Heart className="w-8 h-8 text-white fill-white drop-shadow-md animate-pulse" />
                <span className="text-2xl font-black text-white tracking-wide uppercase">{tModal.title}</span>
              </div>
              
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>
          </div>

          {/* Content */}
          <div className="p-6 pt-4 flex flex-col items-center text-center gap-4">
              
              {!pixData ? (
                  <>
                      <div className="flex flex-col gap-1">
                          <h3 className="text-white font-bold text-lg">{tModal.subtitle}</h3>
                          <p className="text-gray-400 text-xs leading-relaxed max-w-[260px] mx-auto">
                            {tModal.desc}
                          </p>
                      </div>

                      <form onSubmit={handleGeneratePix} className="w-full flex flex-col gap-4 mt-2 mb-2">
                          
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-emerald-500 uppercase self-start ml-4">{tModal.valueLabel}</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-2xl">{currencySymbol}</span>
                                <input 
                                  type="text" 
                                  inputMode="numeric"
                                  value={amount}
                                  onChange={handleAmountChange}
                                  placeholder="0,00"
                                  className="w-full bg-[#2c2c2e] text-white text-4xl font-bold py-6 pl-16 pr-4 rounded-[2rem] outline-none focus:ring-2 focus:ring-emerald-500 border border-transparent focus:border-emerald-500/50 transition-all text-center"
                                />
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase self-start ml-4">{tModal.cpfLabel}</label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                <input 
                                  type="text" 
                                  inputMode="numeric"
                                  value={cpf}
                                  onChange={(e) => setCpf(e.target.value)}
                                  onFocus={handleInputFocus}
                                  placeholder="000.000.000-00"
                                  maxLength={14}
                                  className="w-full bg-[#2c2c2e] text-white py-4 pl-12 pr-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-lg"
                                />
                            </div>
                          </div>

                          {error && <p className="text-red-500 text-xs font-bold bg-red-500/10 p-2 rounded-lg w-full">{error}</p>}

                          <button 
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 bg-emerald-500 text-emerald-950 rounded-[1.5rem] font-bold text-xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 mt-2 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
                          >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>{tModal.btnGenerate} <QrCode className="w-6 h-6" /></>}
                          </button>
                      </form>
                  </>
              ) : (
                  <div className="w-full flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 mb-2">
                      <div className="bg-white p-3 rounded-2xl shadow-xl">
                        <img src={`data:image/jpeg;base64,${pixData.encodedImage}`} alt="QR Code Pix" className="w-52 h-52 mix-blend-multiply" />
                      </div>
                      
                      <div className="w-full">
                        <p className="text-gray-400 text-[10px] mb-2 font-bold uppercase text-left tracking-wider">{tModal.copyTitle}</p>
                        
                        <textarea
                            readOnly
                            value={pixData.payload}
                            className="w-full bg-[#0a0a0b] text-emerald-500 text-[10px] p-4 rounded-xl resize-none h-20 outline-none border border-emerald-500/20 break-all mb-3 font-mono"
                            onClick={(e) => e.currentTarget.select()}
                        />

                        <button onClick={handleCopyPix} className={`w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all border ${isCopied ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50' : 'bg-[#2c2c2e] text-white border-white/5 hover:bg-[#3a3a3c]'}`}>
                            {isCopied ? <><CheckCircle2 className="w-5 h-5" /> {tModal.btnCopied}</> : <><Copy className="w-5 h-5" /> {tModal.btnCopy}</>}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1 opacity-70">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-gray-500 font-medium">Pagamento Seguro via Asaas</span>
                      </div>
                  </div>
              )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationModal;