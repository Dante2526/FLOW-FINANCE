
import React from 'react';
import { 
  Bell, 
  Plus, 
  Send, 
  Grid2X2, 
  MoreHorizontal, 
  ArrowRight, 
  Home, 
  Settings, 
  MessageSquare,
  Scan,
  ShoppingBag,
  Utensils,
  Car,
  Zap,
  Music,
  CreditCard,
  Wifi,
  Smartphone,
  ShieldCheck,
  Key,
  TrendingUp,
  Building,
  PieChart,
  Bitcoin,
  Landmark,
  BookOpen,
  Skull,
  Lightbulb,
  Dumbbell,
  PawPrint,
  Plane,
  Gamepad2,
  Gift,
  Beer,
  Scissors
} from 'lucide-react';
import { LogoType } from '../types';

export const IconBell = ({ count, onClick }: { count?: number; onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className="relative p-3 bg-surface rounded-2xl hover:bg-surfaceLight transition-colors cursor-pointer active:scale-95"
  >
    <Bell className="w-6 h-6 text-gray-400" />
    {count !== undefined && count > 0 && (
      <span className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-[#1c1c1e]">
        {count}
      </span>
    )}
  </button>
);

export const IconInvestment = ({ onClick }: { onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className="relative p-3 bg-surface rounded-2xl hover:bg-surfaceLight transition-colors cursor-pointer active:scale-95 group"
  >
    <TrendingUp className="w-6 h-6 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
  </button>
);

export const IconPlus = () => <Plus className="w-6 h-6 text-white" />;
export const IconSend = () => <Send className="w-4 h-4 text-white ml-2" />;
export const IconGrid = () => <Grid2X2 className="w-6 h-6 text-white" />;
export const IconMore = () => <MoreHorizontal className="w-6 h-6 text-white" />;
export const IconScan = () => <Scan className="w-5 h-5 text-white" />;
export const IconArrowRight = () => <ArrowRight className="w-5 h-5 text-gray-400" />;

// Custom Motorcycle Icon
const MotorcycleIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="w-6 h-6 text-white"
  >
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M15 6h-5a1 1 0 0 0-1 1v2" />
    <path d="M5.5 17.5L9 9a2 2 0 0 1 2-2h2.5" />
    <path d="M18.5 17.5L16 11h-4" />
  </svg>
);

// Brand Logos
export const NetflixLogo = () => (
  <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center border border-gray-800 shrink-0">
    <span className="text-red-600 font-bold text-lg">N</span>
  </div>
);

export const TNFLogo = () => (
  <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shrink-0">
    <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fillOpacity="0" /> 
      <path d="M18.5 12a6.5 6.5 0 0 0-6.5-6.5v3.25A3.25 3.25 0 0 1 15.25 12H18.5z" />
      <path d="M18.5 12a6.5 6.5 0 0 0-6.5-6.5" fill="none" /> 
      <path d="M14.5 12a2.5 2.5 0 0 0-2.5-2.5v2.5h2.5z" />
      <path d="M10.5 12a2.5 2.5 0 0 0-2.5-2.5v2.5h2.5z" />
    </svg>
  </div>
);

export const AmazonLogo = () => (
  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden relative">
     <svg viewBox="0 0 24 24" className="w-8 h-8">
        <path d="M15.8 11.8c-1.4 0-2.6 0.7-2.6 2.1c0 1.2 1.1 1.7 2.1 1.7c0.9 0 1.6-0.6 2.1-1.3v-1.8C17.1 12 16.6 11.8 15.8 11.8z M17.4 15.3c-0.6 0.8-1.5 1.3-2.6 1.3c-1.9 0-3.3-1.2-3.3-3.1c0-1.9 1.4-3.1 3.5-3.1c1.5 0 2.4 0.5 2.4 0.5v-0.4c0-1.1-0.7-1.8-2-1.8c-0.9 0-1.8 0.4-2.4 0.9l-0.8-1.3c0.9-0.7 2.3-1.1 3.7-1.1c2.5 0 3.5 1.4 3.5 3.5v6.5h-1.8V15.3z" fill="#000"/>
        <path d="M19.6 17.9c-1.8 1.1-5.1 1.7-7.7 0.9c-2.9-0.8-4.7-3-5.2-3.4c-0.3-0.3-0.2-0.8 0.1-1.1c0.4-0.3 0.9-0.2 1.2 0.1c0.2 0.2 1.7 2 4.1 2.7c1.9 0.5 4.6 0.1 6.2-0.9c0.4-0.2 0.9-0.1 1.1 0.3C19.8 16.9 19.9 17.7 19.6 17.9z" fill="#FF9900"/>
        <path d="M19.3 16.6c-0.1 0-0.2 0-0.3 0c-0.4-0.1-0.6-0.6-0.5-1c0.2-0.7 0.9-1.3 0.9-1.3s0.5 1.2 0.2 1.9C19.6 16.4 19.4 16.6 19.3 16.6z" fill="#FF9900"/>
     </svg>
  </div>
);

export const SpotifyLogo = () => (
  <div className="w-12 h-12 rounded-full bg-[#1DB954] flex items-center justify-center shrink-0">
     <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-black">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.59 14.42c-.17.29-.52.38-.81.21-2.22-1.36-5.02-1.66-8.31-.91-.32.07-.65-.13-.73-.45-.07-.32.13-.65.45-.73 3.62-.82 6.72-.48 9.19 1.04.29.17.38.52.21.81zm1.14-2.53c-.23.36-.7.48-1.07.24-2.54-1.56-6.41-2.02-9.41-1.11-.4.12-.83-.1-95-.51-.12-.41.1-.83.51-.95 3.47-1.05 7.84-.53 10.67 1.21.37.24.49.7.25 1.07zm.11-2.62c-3.04-1.8-8.06-1.97-10.96-1.09-.46.14-.95-.12-1.09-.58-.14-.46.12-.95.58-1.09 3.32-1.01 8.92-.81 12.43 1.28.41.25.54.78.29 1.19-.24.41-.77.54-1.19.29z" />
     </svg>
  </div>
);

// New Subscription Logos
export const YoutubeLogo = () => (
  <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shrink-0">
    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
  </div>
);

export const AppleLogo = () => (
  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0">
     <svg viewBox="0 0 24 24" className="w-6 h-6 fill-black">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.5 1.3 0 2.52.87 3.31.87.76 0 2.17-.87 3.65-.74.62.03 2.37.25 3.49 1.89-.09.06-2.09 1.22-2.06 3.63.03 2.89 2.54 3.85 2.57 3.87-.03.08-.41 1.41-1.07 2.09zM13 3.5c.66-.8 1.1-1.92 1-2.96-1 .04-2.2.67-2.91 1.5-.64.75-1.21 1.95-1.06 2.98 1.12.09 2.26-.72 2.97-1.52z"/>
     </svg>
  </div>
);

export const DisneyLogo = () => (
  <div className="w-12 h-12 rounded-full bg-[#113ccf] flex items-center justify-center shrink-0">
     <span className="text-white font-bold text-[10px] tracking-tighter">Disney+</span>
  </div>
);

export const MaxLogo = () => (
  <div className="w-12 h-12 rounded-full bg-[#002be7] flex items-center justify-center shrink-0">
     <span className="text-white font-extrabold text-[10px]">MAX</span>
  </div>
);

export const GloboLogo = () => (
  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#ff5e00] via-[#ff0037] to-[#8000ff] flex items-center justify-center shrink-0">
     <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#ff5e00] via-[#ff0037] to-[#8000ff]"></div>
     </div>
  </div>
);

export const MercadoLivreLogo = () => (
  <div className="w-12 h-12 rounded-full bg-[#ffe600] flex items-center justify-center shrink-0">
     <span className="text-[#2d3277] font-bold text-[10px] tracking-tighter">Meli+</span>
  </div>
);

// Investment Icons Helper
export const InvestmentIcon = ({ type }: { type: string }) => {
  const baseClasses = "w-12 h-12 rounded-full flex items-center justify-center shrink-0";
  
  switch(type) {
    case 'cdi':
    case 'fixed':
      return <div className={`${baseClasses} bg-emerald-500`}><TrendingUp className="w-6 h-6 text-white" /></div>;
    case 'fii':
      return <div className={`${baseClasses} bg-blue-600`}><Building className="w-6 h-6 text-white" /></div>;
    case 'stock':
      return <div className={`${baseClasses} bg-purple-600`}><PieChart className="w-6 h-6 text-white" /></div>;
    case 'crypto':
      return <div className={`${baseClasses} bg-orange-500`}><Bitcoin className="w-6 h-6 text-white" /></div>;
    default:
      return <div className={`${baseClasses} bg-gray-600`}><Landmark className="w-6 h-6 text-white" /></div>;
  }
};

// Generic Icons helper
const GenericIcon = ({ icon: Icon, bg }: { icon: any, bg: string }) => (
  <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center shrink-0`}>
    <Icon className="w-6 h-6 text-white" />
  </div>
);

export const TransactionIcon = ({ type }: { type: LogoType }) => {
  switch (type) {
    case 'netflix': return <NetflixLogo />;
    case 'tnf': return <TNFLogo />;
    case 'amazon': return <AmazonLogo />;
    case 'spotify': return <SpotifyLogo />;
    
    // Subscriptions
    case 'youtube': return <YoutubeLogo />;
    case 'apple': return <AppleLogo />;
    case 'disney': return <DisneyLogo />;
    case 'max': return <MaxLogo />;
    case 'globo': return <GloboLogo />;
    case 'mercadolivre': return <MercadoLivreLogo />;

    // Categories
    case 'shopping': return <GenericIcon icon={ShoppingBag} bg="bg-purple-600" />;
    case 'food': return <GenericIcon icon={Utensils} bg="bg-orange-500" />;
    case 'transport': return <GenericIcon icon={Car} bg="bg-blue-600" />;
    
    // New Icons (Existing)
    case 'motorcycle': return <GenericIcon icon={MotorcycleIcon} bg="bg-indigo-600" />;
    case 'insurance': return <GenericIcon icon={ShieldCheck} bg="bg-emerald-600" />;
    case 'wifi': return <GenericIcon icon={Wifi} bg="bg-sky-500" />;
    case 'mobile': return <GenericIcon icon={Smartphone} bg="bg-pink-600" />;
    case 'rent': return <GenericIcon icon={Key} bg="bg-rose-500" />;
    case 'electricity': return <GenericIcon icon={Zap} bg="bg-yellow-500" />;
    
    // New Icons (Requested & Extra)
    case 'education': return <GenericIcon icon={BookOpen} bg="bg-indigo-500" />;
    case 'funeral': return <GenericIcon icon={Skull} bg="bg-stone-600" />;
    case 'project': return <GenericIcon icon={Lightbulb} bg="bg-yellow-400" />;
    case 'health': return <GenericIcon icon={Dumbbell} bg="bg-rose-500" />;
    case 'pet': return <GenericIcon icon={PawPrint} bg="bg-amber-600" />;
    case 'travel': return <GenericIcon icon={Plane} bg="bg-sky-500" />;
    
    // New Additions (Games, Gift, Bar, Beauty)
    case 'game': return <GenericIcon icon={Gamepad2} bg="bg-purple-600" />;
    case 'gift': return <GenericIcon icon={Gift} bg="bg-pink-500" />;
    case 'bar': return <GenericIcon icon={Beer} bg="bg-orange-700" />;
    case 'beauty': return <GenericIcon icon={Scissors} bg="bg-fuchsia-600" />;

    case 'utility': return <GenericIcon icon={Zap} bg="bg-yellow-600" />;
    case 'home': return <GenericIcon icon={Home} bg="bg-teal-600" />;
    case 'generic': default: return <GenericIcon icon={CreditCard} bg="bg-gradient-to-br from-indigo-500 to-purple-500" />;
  }
};
