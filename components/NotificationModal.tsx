
import React, { useState, useEffect } from 'react';
import { X, Bell, Trash2, Mail, CheckCircle2, Send, Share2, DollarSign, MessageSquare, CloudLightning } from 'lucide-react';
import { AppNotification } from '../types';
import { saveUserField } from '../services/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
  currentUserEmail: string | null;
}

type TabType = 'inbox' | 'send';

// VAPID Public Key provided by the user
const VAPID_PUBLIC_KEY = 'BOabgmhdqm_B03NgjZgZUG4tT6whqH_sfr9-ZmMt1XY-lbI_ADbOzze9pRDU3tnj7oXttv01ZXcNKLhzeXlifC8';

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const NotificationModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  notifications, 
  onMarkAllRead, 
  onDelete,
  currentUserEmail
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [notificationPermission, setNotificationPermission] = useState(
    'Notification' in window ? Notification.permission : 'default'
  );
  // State to track if we have a valid cloud subscription
  const [hasPushSubscription, setHasPushSubscription] = useState(true); // Default to true to prevent flicker

  // Check permissions and subscription status when modal opens
  useEffect(() => {
    if (isOpen) {
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
      
      // Check for existing Push Subscription
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.pushManager.getSubscription().then(subscription => {
            setHasPushSubscription(!!subscription);
          });
        });
      }
    }
  }, [isOpen]);

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) return;
    try {
      // 1. Request Permission (or verify if already granted)
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        let subscribed = false;

        // 2. Try to Subscribe to Push Service (GitHub Actions Backend)
        if ('serviceWorker' in navigator && currentUserEmail) {
          try {
             const registration = await navigator.serviceWorker.ready;
             
             // Check if already subscribed to avoid duplicate work, but ensure we save it
             let subscription = await registration.pushManager.getSubscription();
             
             if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
             }

             // Save to Firebase (Updated logic)
             if (subscription) {
                const subscriptionJson = JSON.parse(JSON.stringify(subscription));
                await saveUserField(currentUserEmail, 'pushSubscription', subscriptionJson);
                
                registration.showNotification('Flow Finance', {
                  body: 'Sincronização com a nuvem concluída! ☁️',
                  icon: 'https://api.dicebear.com/9.x/shapes/png?seed=FlowFinance&backgroundColor=0a0a0b'
                });
                
                subscribed = true;
                setHasPushSubscription(true);
             }

          } catch (pushError) {
             console.warn("Falha ao registrar Push Notification:", pushError);
             alert("Erro ao conectar com servidor de notificações. Tente novamente.");
          }
        }

        // 3. Fallback local notification test if push setup failed
        if (!subscribed) {
             new Notification('Flow Finance', {
               body: 'Notificações locais ativadas! 🚀',
               icon: 'https://api.dicebear.com/9.x/shapes/png?seed=FlowFinance&backgroundColor=0a0a0b'
             });
        }
      }
    } catch (e) {
      console.error(e);
      alert("Não foi possível ativar as notificações. Verifique as configurações do navegador.");
    }
  };

  // Form States for Sending
  const [recipientName, setRecipientName] = useState('');
  const [messageType, setMessageType] = useState<'cobranca' | 'aviso'>('aviso');
  const [customMessage, setCustomMessage] = useState('');
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleShare = async () => {
    if (!recipientName) return;

    let textToSend = '';
    const date = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (messageType === 'cobranca') {
      textToSend = `🚨 *FLOW FINANCE - NOTIFICAÇÃO DE COBRANÇA*\n\nOlá ${recipientName},\n\nConsta um pendência financeira que precisa da sua atenção.\n\n💰 *Valor:* R$ ${amount || '0,00'}\n📝 *Detalhe:* ${customMessage || 'Pagamento pendente'}\n\nPor favor, verifique assim que possível.\n_Gerado às ${date}_`;
    } else {
      textToSend = `🔔 *FLOW FINANCE - NOVO AVISO*\n\nOlá ${recipientName},\n\n${customMessage || 'Você tem uma nova mensagem do sistema financeiro.'}\n\n_Gerado às ${date}_`;
    }

    // Try Native Share API first (Mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Notificação Flow Finance',
          text: textToSend,
        });
        onClose();
        return;
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    }

    // Fallback to WhatsApp URL
    const encodedText = encodeURIComponent(textToSend);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[2rem] shadow-2xl border border-white/5 relative flex flex-col h-[85vh] max-h-[700px] overflow-hidden">
        
        {/* HEADER SECTION (Fixed) */}
        <div className="flex-shrink-0 p-5 pb-0 bg-[#1c1c1e] z-10">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                  <Bell className="w-6 h-6 text-accent" />
                  {unreadCount > 0 && activeTab === 'inbox' && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-[#1c1c1e]" />
                  )}
              </div>
              <h2 className="text-xl font-bold text-white">Central</h2>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex p-1 bg-[#2c2c2e] rounded-xl mb-2">
              <button
                onClick={() => setActiveTab('inbox')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'inbox' ? 'bg-[#3a3a3c] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Recebidas
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{unreadCount}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('send')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'send' ? 'bg-[#3a3a3c] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Enviar
                <Send className="w-3 h-3" />
              </button>
          </div>
        </div>

        {/* CONTENT AREA - Always scrollable */}
        <div className="flex-1 p-5 pt-2 flex flex-col gap-3 overflow-y-auto no-scrollbar">
          
          {/* --- TAB: INBOX --- */}
          {activeTab === 'inbox' && (
            <>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60 min-h-[200px]">
                  <Mail className="w-16 h-16 mb-4" />
                  <p className="text-sm">Caixa de entrada vazia.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 rounded-2xl flex items-start gap-4 border transition-all flex-shrink-0 ${
                      notif.read 
                        ? 'bg-[#2c2c2e]/50 border-transparent opacity-70' 
                        : 'bg-[#2c2c2e] border-accent/20'
                    }`}
                  >
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notif.read ? 'bg-gray-600' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className={`text-sm font-bold mb-1 truncate ${notif.read ? 'text-gray-400' : 'text-white'}`}>
                          {notif.title}
                        </h3>
                        <span className="text-[10px] text-gray-500 flex-shrink-0 ml-2">{notif.date}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed break-words">
                        {notif.message}
                      </p>
                    </div>

                    <button 
                      onClick={() => onDelete(notif.id)}
                      className="text-gray-600 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </>
          )}

          {/* --- TAB: SEND --- */}
          {activeTab === 'send' && (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-right-4 duration-300 pb-2">
              
              <div className="bg-[#2c2c2e]/50 p-3 rounded-2xl border border-white/5 flex-shrink-0">
                <p className="text-[10px] text-gray-400 mb-1 font-bold uppercase">Como funciona?</p>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Crie uma notificação aqui e envie diretamente para o <strong>WhatsApp</strong> de quem divide as contas com você.
                </p>
              </div>

              {/* Recipient */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                <label className="text-[10px] text-gray-400 ml-2 font-bold uppercase">Para quem?</label>
                <input 
                  type="text"
                  name="notification_recipient_hidden"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)} 
                  placeholder="Nome do contato..."
                  className="w-full bg-[#2c2c2e] text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-accent font-medium text-sm"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  data-lpignore="true"
                />
              </div>

              {/* Type Toggle */}
              <div className="flex gap-3 flex-shrink-0">
                 <button 
                   onClick={() => setMessageType('aviso')}
                   className={`flex-1 h-10 rounded-xl border border-white/10 flex items-center justify-center gap-2 text-[10px] font-bold transition-all ${
                     messageType === 'aviso' ? 'bg-blue-600 text-white border-blue-500' : 'bg-[#2c2c2e] text-gray-400'
                   }`}
                 >
                   <MessageSquare className="w-3 h-3" /> AVISO
                 </button>
                 <button 
                   onClick={() => setMessageType('cobranca')}
                   className={`flex-1 h-10 rounded-xl border border-white/10 flex items-center justify-center gap-2 text-[10px] font-bold transition-all ${
                     messageType === 'cobranca' ? 'bg-orange-600 text-white border-orange-500' : 'bg-[#2c2c2e] text-gray-400'
                   }`}
                 >
                   <DollarSign className="w-3 h-3" /> COBRANÇA
                 </button>
              </div>

              {/* Amount (Only if Cobranca) */}
              {messageType === 'cobranca' && (
                <div className="flex flex-col gap-1 animate-in fade-in duration-300 flex-shrink-0">
                  <label className="text-[10px] text-gray-400 ml-2 font-bold uppercase">Valor</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 font-bold text-sm">R$</span>
                    <input 
                      type="number"
                      name="notification_amount_hidden"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)} 
                      placeholder="0.00"
                      className="w-full bg-[#2c2c2e] text-white p-3 pl-10 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-base"
                      autoComplete="off"
                      data-lpignore="true"
                    />
                  </div>
                </div>
              )}

              {/* Message */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                <label className="text-[10px] text-gray-400 ml-2 font-bold uppercase">Mensagem</label>
                <textarea 
                  name="notification_message_hidden"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)} 
                  placeholder={messageType === 'cobranca' ? "Ex: Preciso que pague sua parte da internet..." : "Ex: Já paguei a conta de luz..."}
                  className="w-full h-32 bg-[#2c2c2e] text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-accent font-medium resize-none text-sm"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  data-lpignore="true"
                />
              </div>

            </div>
          )}

        </div>

        {/* FOOTER ACTIONS (Fixed) */}
        <div className="flex-shrink-0 p-5 pt-3 border-t border-white/5 bg-[#1c1c1e] z-10">
           {activeTab === 'inbox' ? (
             <div className="flex flex-col gap-3">
                {/* Permission Request Button - Shows if Permission is NOT granted OR Subscription is missing */}
                {('Notification' in window) && (notificationPermission !== 'granted' || !hasPushSubscription) && (
                   <button 
                     onClick={handleRequestPermission}
                     className="w-full h-14 rounded-[1.5rem] bg-blue-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors shadow-lg"
                   >
                     {notificationPermission === 'granted' ? <CloudLightning className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                     {notificationPermission === 'granted' ? 'Sincronizar Notificações Automáticas' : 'Ativar Notificações no Celular'}
                   </button>
                )}
                
                {notifications.length > 0 && (
                  <button 
                    onClick={onMarkAllRead}
                    className="w-full h-14 rounded-[1.5rem] bg-accent text-black font-bold flex items-center justify-center gap-2 hover:bg-accentDark transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Marcar todas como lidas
                  </button>
                )}
             </div>
           ) : (
             <button 
               onClick={handleShare}
               disabled={!recipientName}
               className="w-full h-14 rounded-[1.5rem] bg-green-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-green-500 disabled:bg-[#2c2c2e] disabled:text-gray-500 transition-colors shadow-lg"
             >
               <Share2 className="w-5 h-5" />
               Enviar via WhatsApp
             </button>
           )}
        </div>

      </div>
    </div>
  );
};

export default NotificationModal;
