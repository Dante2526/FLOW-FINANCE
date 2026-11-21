import React, { useState, useMemo, Suspense } from 'react';
import {
  Fuel,
  Plus,
  CreditCard,
  Wallet,
  QrCode,
  Banknote,
  Calendar,
  TrendingUp,
  Gauge,
  Bluetooth,
  Lightbulb,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Droplets,
  Navigation,
  Search,
  Car,
  Bike,
  SlidersHorizontal,
  Box,
  Zap,
  BatteryCharging
} from 'lucide-react';
import { FuelLog, FuelPaymentMethod, FuelType, AppLanguage } from '../types';
import { getLocale } from '../i18n';
import { loadData, saveData, STORAGE_KEYS } from '../services/storage';
import { saveUserField } from '../services/supabase';

const Vehicle3DStage = React.lazy(() => import('./Vehicle3DStage'));

interface Props {
  fuelLogs: FuelLog[];
  onAddFuelLog: (log: Omit<FuelLog, 'id' | 'createdAt'>) => void;
  onEditFuelLog: (log: FuelLog) => void;
  onDeleteFuelLog: (id: string) => void;
  appLanguage: AppLanguage;
}

const MONTH_NAMES_PT = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

const MONTH_SHORT_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEK_DAYS_PT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export type VehicleCategory = 'motorcycle' | 'car';
export type VehiclePowertrain = 'combustion' | 'hybrid' | 'electric';

export interface VehiclePreset {
  id: string;
  category: VehicleCategory;
  powertrain?: VehiclePowertrain;
  brand: string;
  model: string;
  year: string;
  typeLabel: string; // e.g. "Naked / Street", "Trail", "Sedan", "SUV", "Hatch", "100% Elétrico"
  engineSpec: string;
  tankCapacityL: number;
  avgKmPerLiter: number;
  batteryCapacityKwh?: number;
  avgKmPerKwh?: number;
  colorName: string;
  hueRotate: string;
  accentHex: string;
  glowClass: string;
  imageUrl: string;
}

export const VEHICLE_CATALOG: VehiclePreset[] = [
  // ======================== MOTOS ========================
  {
    id: 'yamaha-fazer-fz25-2026',
    category: 'motorcycle',
    brand: 'Yamaha',
    model: 'FAZER FZ 25',
    year: '2026',
    typeLabel: 'Naked / Street',
    engineSpec: 'ABS Connected • 250cc BlueFlex',
    tankCapacityL: 14.2,
    avgKmPerLiter: 37,
    colorName: 'Racing Blue (Azul Metálico)',
    hueRotate: 'hue-rotate(0deg) saturate(1.12)',
    accentHex: '#2563eb',
    glowClass: 'from-blue-600/35 via-blue-500/15 to-transparent',
    imageUrl: '/fz25-2026-3d.jpg'
  },
  {
    id: 'yamaha-mt03-2026',
    category: 'motorcycle',
    brand: 'Yamaha',
    model: 'MT-03 ABS',
    year: '2026',
    typeLabel: 'Hyper Naked',
    engineSpec: 'Connected • 321cc Bicilíndrica',
    tankCapacityL: 14.0,
    avgKmPerLiter: 24,
    colorName: 'Storm Cyan / Racing Blue',
    hueRotate: 'hue-rotate(340deg) saturate(1.2)',
    accentHex: '#0284c7',
    glowClass: 'from-sky-500/35 via-blue-500/15 to-transparent',
    imageUrl: '/fz25-2026-3d.jpg'
  },
  {
    id: 'yamaha-fazer-fz15-2026',
    category: 'motorcycle',
    brand: 'Yamaha',
    model: 'FAZER FZ 15',
    year: '2026',
    typeLabel: 'Street / City',
    engineSpec: 'ABS Connected • 150cc BlueFlex',
    tankCapacityL: 11.9,
    avgKmPerLiter: 42,
    colorName: 'Midnight Black (Preto)',
    hueRotate: 'grayscale(0.8) contrast(1.15)',
    accentHex: '#a1a1aa',
    glowClass: 'from-zinc-500/30 via-zinc-400/10 to-transparent',
    imageUrl: '/fz25-2026-3d.jpg'
  },
  {
    id: 'yamaha-lander-250-2026',
    category: 'motorcycle',
    brand: 'Yamaha',
    model: 'LANDER 250',
    year: '2026',
    typeLabel: 'Trail / Off-Road',
    engineSpec: 'ABS Connected • 250cc BlueFlex',
    tankCapacityL: 13.6,
    avgKmPerLiter: 34,
    colorName: 'Dakar Sand / Blue',
    hueRotate: 'hue-rotate(15deg) saturate(1.05)',
    accentHex: '#3b82f6',
    glowClass: 'from-blue-500/30 via-indigo-500/10 to-transparent',
    imageUrl: '/fz25-2026-3d.jpg'
  },
  {
    id: 'honda-cb300f-twister-2026',
    category: 'motorcycle',
    brand: 'Honda',
    model: 'CB 300F TWISTER',
    year: '2026',
    typeLabel: 'Naked / Street',
    engineSpec: 'ABS • 293,5cc FlexOne',
    tankCapacityL: 14.1,
    avgKmPerLiter: 35,
    colorName: 'Red Metallic (Vermelho)',
    hueRotate: 'hue-rotate(138deg) saturate(1.3)',
    accentHex: '#dc2626',
    glowClass: 'from-red-600/35 via-red-500/15 to-transparent',
    imageUrl: '/fz25-2026-3d.jpg'
  },
  {
    id: 'honda-cg160-titan-2026',
    category: 'motorcycle',
    brand: 'Honda',
    model: 'CG 160 TITAN',
    year: '2026',
    typeLabel: 'Street / City',
    engineSpec: 'CBS/ABS • 162,7cc FlexOne',
    tankCapacityL: 16.1,
    avgKmPerLiter: 43,
    colorName: 'Red Wine (Vermelho)',
    hueRotate: 'hue-rotate(142deg) saturate(1.25)',
    accentHex: '#ef4444',
    glowClass: 'from-red-600/30 via-orange-500/10 to-transparent',
    imageUrl: '/fz25-2026-3d.jpg'
  },
  {
    id: 'honda-xre300-sahara-2026',
    category: 'motorcycle',
    brand: 'Honda',
    model: 'SAHARA 300',
    year: '2026',
    typeLabel: 'Trail / Adventure',
    engineSpec: 'ABS • 293,5cc FlexOne',
    tankCapacityL: 13.8,
    avgKmPerLiter: 32,
    colorName: 'Rally Gold / Red',
    hueRotate: 'hue-rotate(155deg) saturate(1.2)',
    accentHex: '#f97316',
    glowClass: 'from-orange-500/35 via-amber-500/15 to-transparent',
    imageUrl: '/fz25-2026-3d.jpg'
  },
  {
    id: 'kawasaki-z400-2026',
    category: 'motorcycle',
    brand: 'Kawasaki',
    model: 'Z500 / Z400 SE',
    year: '2026',
    typeLabel: 'Sugomi Naked',
    engineSpec: 'ABS • 451cc Bicilíndrica',
    tankCapacityL: 14.0,
    avgKmPerLiter: 25,
    colorName: 'Candy Lime Green (Verde)',
    hueRotate: 'hue-rotate(265deg) saturate(1.25)',
    accentHex: '#10b981',
    glowClass: 'from-emerald-500/35 via-lime-500/15 to-transparent',
    imageUrl: '/fz25-2026-3d.jpg'
  },
  {
    id: 'bmw-g310r-2026',
    category: 'motorcycle',
    brand: 'BMW',
    model: 'G 310 R',
    year: '2026',
    typeLabel: 'Roadster / Naked',
    engineSpec: 'ABS Motorrad • 313cc',
    tankCapacityL: 11.0,
    avgKmPerLiter: 30,
    colorName: 'Motorsport Blue',
    hueRotate: 'hue-rotate(5deg) saturate(1.15)',
    accentHex: '#3b82f6',
    glowClass: 'from-blue-600/35 via-sky-500/15 to-transparent',
    imageUrl: '/fz25-2026-3d.jpg'
  },
  {
    id: 'bajaj-dominar-400-2026',
    category: 'motorcycle',
    brand: 'Bajaj',
    model: 'DOMINAR 400',
    year: '2026',
    typeLabel: 'Sport Touring',
    engineSpec: 'ABS • 373,3cc DOHC',
    tankCapacityL: 13.0,
    avgKmPerLiter: 28,
    colorName: 'Savanna Green (Verde)',
    hueRotate: 'hue-rotate(270deg) saturate(1.1)',
    accentHex: '#22c55e',
    glowClass: 'from-emerald-600/35 via-green-500/15 to-transparent',
    imageUrl: '/fz25-2026-3d.jpg'
  },

  // ======================== CARROS ========================
  {
    id: 'toyota-corolla-2026',
    category: 'car',
    brand: 'Toyota',
    model: 'COROLLA GR-S / XEi',
    year: '2026',
    typeLabel: 'Sedan Médio',
    engineSpec: '2.0 Dynamic Force Flex / Hybrid',
    tankCapacityL: 50.0,
    avgKmPerLiter: 14.5,
    colorName: 'Metallic Blue / Eclipse',
    hueRotate: 'hue-rotate(0deg) saturate(1.08)',
    accentHex: '#2563eb',
    glowClass: 'from-blue-600/35 via-blue-500/15 to-transparent',
    imageUrl: '/car-2026-3d.jpg'
  },
  {
    id: 'honda-civic-2026',
    category: 'car',
    brand: 'Honda',
    model: 'CIVIC TOURING e:HEV',
    year: '2026',
    typeLabel: 'Sedan Sport',
    engineSpec: '2.0 Híbrido / Turbo 184 cv',
    tankCapacityL: 40.0,
    avgKmPerLiter: 18.3,
    colorName: 'Titanium Silver / Black',
    hueRotate: 'grayscale(0.75) contrast(1.12)',
    accentHex: '#94a3b8',
    glowClass: 'from-slate-500/35 via-zinc-400/15 to-transparent',
    imageUrl: '/car-2026-3d.jpg'
  },
  {
    id: 'vw-polo-gts-2026',
    category: 'car',
    brand: 'Volkswagen',
    model: 'POLO GTS / TRACK',
    year: '2026',
    typeLabel: 'Hatch Compacto',
    engineSpec: '250 TSI / 170 TSI Flex',
    tankCapacityL: 52.0,
    avgKmPerLiter: 13.8,
    colorName: 'Sunset Red (Vermelho)',
    hueRotate: 'hue-rotate(138deg) saturate(1.25)',
    accentHex: '#dc2626',
    glowClass: 'from-red-600/35 via-red-500/15 to-transparent',
    imageUrl: '/car-2026-3d.jpg'
  },
  {
    id: 'vw-nivus-2026',
    category: 'car',
    brand: 'Volkswagen',
    model: 'NIVUS HIGHLINE',
    year: '2026',
    typeLabel: 'SUV Coupé',
    engineSpec: '200 TSI Total Flex • 128 cv',
    tankCapacityL: 52.0,
    avgKmPerLiter: 13.2,
    colorName: 'Titan Blue (Azul)',
    hueRotate: 'hue-rotate(350deg) saturate(1.05)',
    accentHex: '#0284c7',
    glowClass: 'from-sky-600/35 via-blue-500/15 to-transparent',
    imageUrl: '/car-2026-3d.jpg'
  },
  {
    id: 'chevrolet-onix-2026',
    category: 'car',
    brand: 'Chevrolet',
    model: 'ONIX PREMIER RS',
    year: '2026',
    typeLabel: 'Hatch / Sedan',
    engineSpec: '1.0 Turbo Flex • 116 cv',
    tankCapacityL: 44.0,
    avgKmPerLiter: 14.2,
    colorName: 'Seeker Red (Vermelho)',
    hueRotate: 'hue-rotate(142deg) saturate(1.2)',
    accentHex: '#ef4444',
    glowClass: 'from-red-600/35 via-orange-500/15 to-transparent',
    imageUrl: '/car-2026-3d.jpg'
  },
  {
    id: 'fiat-pulse-fastback-2026',
    category: 'car',
    brand: 'Fiat',
    model: 'FASTBACK ABARTH',
    year: '2026',
    typeLabel: 'SUV Coupé',
    engineSpec: 'Turbo 270 Flex • 185 cv',
    tankCapacityL: 47.0,
    avgKmPerLiter: 12.6,
    colorName: 'Abarth Red / Black',
    hueRotate: 'hue-rotate(135deg) saturate(1.3)',
    accentHex: '#e11d48',
    glowClass: 'from-rose-600/35 via-red-500/15 to-transparent',
    imageUrl: '/car-2026-3d.jpg'
  },
  {
    id: 'hyundai-hb20-creta-2026',
    category: 'car',
    brand: 'Hyundai',
    model: 'HB20 / CRETA N-LINE',
    year: '2026',
    typeLabel: 'Hatch / SUV',
    engineSpec: '1.0 TGDI Turbo Flex • 120 cv',
    tankCapacityL: 50.0,
    avgKmPerLiter: 13.5,
    colorName: 'Sapphire Blue',
    hueRotate: 'hue-rotate(10deg) saturate(1.1)',
    accentHex: '#3b82f6',
    glowClass: 'from-blue-600/35 via-indigo-500/15 to-transparent',
    imageUrl: '/car-2026-3d.jpg'
  },
  {
    id: 'voltz-evs-2026',
    category: 'motorcycle',
    powertrain: 'electric',
    brand: 'Voltz',
    model: 'EVS / WATTS W125',
    year: '2026',
    typeLabel: '100% Elétrica',
    engineSpec: 'Motor Elétrico 3000W • Bateria Dupla',
    tankCapacityL: 0,
    avgKmPerLiter: 0,
    batteryCapacityKwh: 4.5,
    avgKmPerKwh: 28,
    colorName: 'Electric Cyan (Azul Elétrico)',
    hueRotate: 'hue-rotate(330deg) saturate(1.2)',
    accentHex: '#06b6d4',
    glowClass: 'from-cyan-500/35 via-teal-500/15 to-transparent',
    imageUrl: '/fz25-2026-3d.jpg'
  },
  {
    id: 'byd-dolphin-mini-2026',
    category: 'car',
    powertrain: 'electric',
    brand: 'BYD',
    model: 'DOLPHIN MINI / PLUS',
    year: '2026',
    typeLabel: '100% Elétrico • Hatch',
    engineSpec: 'Motor Elétrico • Bateria Blade 44,9 kWh',
    tankCapacityL: 0,
    avgKmPerLiter: 0,
    batteryCapacityKwh: 44.9,
    avgKmPerKwh: 7.0,
    colorName: 'Surf Blue (Azul Elétrico)',
    hueRotate: 'hue-rotate(335deg) saturate(1.18)',
    accentHex: '#06b6d4',
    glowClass: 'from-cyan-500/35 via-sky-500/15 to-transparent',
    imageUrl: '/car-2026-3d.jpg'
  },
  {
    id: 'byd-seal-2026',
    category: 'car',
    powertrain: 'electric',
    brand: 'BYD',
    model: 'SEAL AWD',
    year: '2026',
    typeLabel: '100% Elétrico • Sedan',
    engineSpec: '531 cv AWD • Bateria Blade 82,5 kWh',
    tankCapacityL: 0,
    avgKmPerLiter: 0,
    batteryCapacityKwh: 82.5,
    avgKmPerKwh: 6.4,
    colorName: 'Atlantis Blue',
    hueRotate: 'hue-rotate(355deg) saturate(1.15)',
    accentHex: '#0ea5e9',
    glowClass: 'from-sky-500/40 via-blue-500/15 to-transparent',
    imageUrl: '/car-2026-3d.jpg'
  },
  {
    id: 'gwm-ora-03-2026',
    category: 'car',
    powertrain: 'electric',
    brand: 'GWM',
    model: 'ORA 03 GT',
    year: '2026',
    typeLabel: '100% Elétrico • Hatch',
    engineSpec: '171 cv • Bateria 63 kWh',
    tankCapacityL: 0,
    avgKmPerLiter: 0,
    batteryCapacityKwh: 63.0,
    avgKmPerKwh: 6.3,
    colorName: 'Mars Red (Vermelho)',
    hueRotate: 'hue-rotate(138deg) saturate(1.25)',
    accentHex: '#ef4444',
    glowClass: 'from-red-600/35 via-rose-500/15 to-transparent',
    imageUrl: '/car-2026-3d.jpg'
  },
  {
    id: 'volvo-ex30-2026',
    category: 'car',
    powertrain: 'electric',
    brand: 'Volvo',
    model: 'EX30 ULTRA',
    year: '2026',
    typeLabel: '100% Elétrico • SUV',
    engineSpec: '272 cv • Bateria 69 kWh',
    tankCapacityL: 0,
    avgKmPerLiter: 0,
    batteryCapacityKwh: 69.0,
    avgKmPerKwh: 6.6,
    colorName: 'Cloud Blue / Moss',
    hueRotate: 'hue-rotate(285deg) saturate(1.0)',
    accentHex: '#10b981',
    glowClass: 'from-emerald-500/35 via-teal-500/15 to-transparent',
    imageUrl: '/car-2026-3d.jpg'
  },
  {
    id: 'tesla-model-3-2026',
    category: 'car',
    powertrain: 'electric',
    brand: 'Tesla',
    model: 'MODEL 3 HIGHLAND',
    year: '2026',
    typeLabel: '100% Elétrico • Sedan',
    engineSpec: 'RWD / Long Range • Bateria 60 kWh',
    tankCapacityL: 0,
    avgKmPerLiter: 0,
    batteryCapacityKwh: 60.0,
    avgKmPerKwh: 7.5,
    colorName: 'Stealth Grey (Cinza)',
    hueRotate: 'grayscale(0.85) contrast(1.15)',
    accentHex: '#a1a1aa',
    glowClass: 'from-zinc-500/35 via-slate-400/15 to-transparent',
    imageUrl: '/car-2026-3d.jpg'
  },
  {
    id: 'byd-dolphin-song-2026',
    category: 'car',
    powertrain: 'hybrid',
    brand: 'BYD',
    model: 'KING / SONG PRO DM-i',
    year: '2026',
    typeLabel: 'Híbrido Plug-in',
    engineSpec: '1.5 DM-i Super Hybrid (Gasolina + Energia)',
    tankCapacityL: 52.0,
    avgKmPerLiter: 22.0,
    batteryCapacityKwh: 18.3,
    avgKmPerKwh: 6.5,
    colorName: 'Emerald Cyan',
    hueRotate: 'hue-rotate(285deg) saturate(1.1)',
    accentHex: '#10b981',
    glowClass: 'from-emerald-600/35 via-teal-500/15 to-transparent',
    imageUrl: '/car-2026-3d.jpg'
  },
  {
    id: 'bmw-320i-2026',
    category: 'car',
    brand: 'BMW',
    model: '320i M SPORT',
    year: '2026',
    typeLabel: 'Sport Sedan',
    engineSpec: '2.0 TwinPower Turbo ActiveFlex',
    tankCapacityL: 59.0,
    avgKmPerLiter: 12.2,
    colorName: 'Portimao Blue (Azul M)',
    hueRotate: 'hue-rotate(0deg) saturate(1.15)',
    accentHex: '#2563eb',
    glowClass: 'from-blue-600/40 via-blue-500/15 to-transparent',
    imageUrl: '/car-2026-3d.jpg'
  }
];

const PAYMENT_META: Record<
  FuelPaymentMethod,
  {
    label: string;
    shortLabel: string;
    color: string;
    bgColor: string;
    borderColor: string;
    barColor: string;
    icon: React.FC<{ className?: string }>;
  }
> = {
  credit: {
    label: 'Cartão de Crédito',
    shortLabel: 'CRÉDITO',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/30',
    barColor: 'bg-purple-500',
    icon: CreditCard
  },
  debit: {
    label: 'Cartão de Débito',
    shortLabel: 'DÉBITO',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/30',
    barColor: 'bg-blue-500',
    icon: Wallet
  },
  pix: {
    label: 'Pix Instantâneo',
    shortLabel: 'PIX',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30',
    barColor: 'bg-emerald-500',
    icon: QrCode
  },
  cash: {
    label: 'Dinheiro (Espécie)',
    shortLabel: 'DINHEIRO',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30',
    barColor: 'bg-amber-500',
    icon: Banknote
  }
};

const isElectricFuelType = (ft?: FuelType): boolean =>
  ft === 'electric_home' || ft === 'electric_ac' || ft === 'electric_dc';

const FUEL_TYPE_META: Record<
  FuelType,
  { label: string; desc: string; badgeClass: string; dotColor: string; defaultPrice: number }
> = {
  gasoline: {
    label: 'Gasolina Comum',
    desc: 'Octanagem padrão • Uso diário',
    badgeClass: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    dotColor: 'bg-orange-400',
    defaultPrice: 6.19
  },
  additive: {
    label: 'Gasolina Aditivada',
    desc: 'Detergentes dispersantes • Limpeza de bicos',
    badgeClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    dotColor: 'bg-cyan-400',
    defaultPrice: 6.49
  },
  ethanol: {
    label: 'Etanol BlueFlex',
    desc: 'Biocombustível • Maior potência',
    badgeClass: 'text-lime-400 bg-lime-500/10 border-lime-500/20',
    dotColor: 'bg-lime-400',
    defaultPrice: 4.19
  },
  electric_home: {
    label: 'Energia Residencial (Wallbox)',
    desc: 'Recarga em casa / condomínio • ~R$ 0,85/kWh',
    badgeClass: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
    dotColor: 'bg-emerald-400',
    defaultPrice: 0.85
  },
  electric_ac: {
    label: 'Eletroposto AC (Semi-rápida)',
    desc: 'Carregador público AC 7-22 kW • ~R$ 1,80/kWh',
    badgeClass: 'text-sky-300 bg-sky-500/15 border-sky-500/30',
    dotColor: 'bg-sky-400',
    defaultPrice: 1.8
  },
  electric_dc: {
    label: 'Eletroposto DC (Carga Rápida)',
    desc: 'Supercarga DC 50-150 kW • ~R$ 2,40/kWh',
    badgeClass: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30',
    dotColor: 'bg-cyan-400',
    defaultPrice: 2.4
  }
};

const getLocalTodayISO = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDisplayDate = (isoDate: string): string => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const y = parts[0];
  const mIdx = (parseInt(parts[1], 10) || 1) - 1;
  const d = parts[2];
  return `${d} de ${MONTH_SHORT_PT[mIdx] || 'Jan'}, ${y}`;
};

// ============================================================================
// MAIN VEHICLE 3D STUDIO & FUEL EXPENSE CONTROL VIEW
// ============================================================================
const MotorcycleView: React.FC<Props> = ({
  fuelLogs,
  onAddFuelLog,
  onEditFuelLog,
  onDeleteFuelLog,
  appLanguage
}) => {
  const locale = getLocale(appLanguage);
  const currencySymbol = appLanguage === 'pt' ? 'R$' : appLanguage === 'en' ? '$' : '€';

  const now = new Date();
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [breakdownScope, setBreakdownScope] = useState<'month' | 'year'>('month');
  const [historyFilterMethod, setHistoryFilterMethod] = useState<FuelPaymentMethod | 'all'>('all');
  const [historyScope, setHistoryScope] = useState<'month' | 'year'>('month');

  // Selected Vehicle State (Persisted locally & synced to Supabase profile)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(() =>
    loadData<string | null>(STORAGE_KEYS.SELECTED_VEHICLE, null)
  );

  // First screen: Choose Vehicle (Moto vs Carro + Search) before showing 3D Studio & Fuel Control
  const [isVehicleSelectorOpen, setIsVehicleSelectorOpen] = useState<boolean>(() => {
    const savedVehicle = loadData<string | null>(STORAGE_KEYS.SELECTED_VEHICLE, null);
    const hasConfirmed = loadData<boolean>('flow_vehicle_picker_confirmed', false);
    return !savedVehicle || !hasConfirmed;
  });
  const [selectorCategory, setSelectorCategory] = useState<VehicleCategory>(() => {
    const savedVehicle = loadData<string | null>(STORAGE_KEYS.SELECTED_VEHICLE, null);
    const found = VEHICLE_CATALOG.find(v => v.id === savedVehicle);
    return found ? found.category : 'motorcycle';
  });
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState<string>('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('ALL');

  const currentVehicle = useMemo(
    () => VEHICLE_CATALOG.find(v => v.id === selectedVehicleId) || VEHICLE_CATALOG[0],
    [selectedVehicleId]
  );

  // Real-time Three.js WebGL 3D Studio State
  const [headlightOn, setHeadlightOn] = useState<boolean>(true);
  const [is3DAnimActive, setIs3DAnimActive] = useState<boolean>(true);

  // Form / Modal State for Adding or Editing Refueling
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingLog, setEditingLog] = useState<FuelLog | null>(null);
  const [amountInput, setAmountInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<FuelPaymentMethod>('pix');
  const [fuelType, setFuelType] = useState<FuelType>('gasoline');
  const [dateInput, setDateInput] = useState<string>(getLocalTodayISO());
  const [pricePerLiterInput, setPricePerLiterInput] = useState<string>('6.19');
  const [odometerInput, setOdometerInput] = useState<string>('');
  const [stationInput, setStationInput] = useState<string>('');

  // Custom Expandable Calendar & Fuel Type Dropdown States inside Form Modal
  const [isCustomCalendarOpen, setIsCustomCalendarOpen] = useState<boolean>(false);
  const [isFuelDropdownOpen, setIsFuelDropdownOpen] = useState<boolean>(false);
  const [calendarViewYear, setCalendarViewYear] = useState<number>(now.getFullYear());
  const [calendarViewMonth, setCalendarViewMonth] = useState<number>(now.getMonth());

  const handleSelectVehicle = (preset: VehiclePreset) => {
    setSelectedVehicleId(preset.id);
    saveData(STORAGE_KEYS.SELECTED_VEHICLE, preset.id);
    saveData('flow_vehicle_picker_confirmed', true);
    const currentEmail = loadData<string | null>(STORAGE_KEYS.USER_SESSION, null);
    if (currentEmail) {
      saveUserField(currentEmail, 'selectedVehicle', preset.id);
    }
    setIsVehicleSelectorOpen(false);
    // Scroll parent container back to top when entering 3D studio
    const scrollParent = document.querySelector('.overflow-y-auto');
    if (scrollParent) scrollParent.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Parse Date helper
  const parseLogYearMonth = (dateStr: string) => {
    if (!dateStr) return { year: now.getFullYear(), monthIdx: now.getMonth() };
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      return {
        year: parseInt(parts[0], 10) || now.getFullYear(),
        monthIdx: (parseInt(parts[1], 10) || 1) - 1
      };
    }
    return { year: now.getFullYear(), monthIdx: now.getMonth() };
  };

  // Filtered Logs for Selected Month & Year
  const monthLogs = useMemo(() => {
    return fuelLogs.filter(log => {
      const { year, monthIdx } = parseLogYearMonth(log.date);
      return year === selectedYear && monthIdx === selectedMonthIdx;
    });
  }, [fuelLogs, selectedYear, selectedMonthIdx]);

  // Filtered Logs for Selected Year
  const yearLogs = useMemo(() => {
    return fuelLogs.filter(log => {
      const { year } = parseLogYearMonth(log.date);
      return year === selectedYear;
    });
  }, [fuelLogs, selectedYear]);

  const isElectricVehicle = currentVehicle.powertrain === 'electric';
  const isHybridVehicle = currentVehicle.powertrain === 'hybrid';

  // Available fuel/energy types based on vehicle powertrain
  const availableEnergyTypes = useMemo<FuelType[]>(() => {
    if (isElectricVehicle) return ['electric_home', 'electric_ac', 'electric_dc'];
    if (isHybridVehicle) {
      return ['gasoline', 'additive', 'ethanol', 'electric_home', 'electric_ac', 'electric_dc'];
    }
    return ['gasoline', 'additive', 'ethanol'];
  }, [isElectricVehicle, isHybridVehicle]);

  const isSelectedLogElectric = isElectricFuelType(fuelType);

  // Monthly & Annual Totals (supports both Liters and Electric kWh)
  const stats = useMemo(() => {
    const monthTotal = monthLogs.reduce((sum, l) => sum + (l.amount || 0), 0);
    const yearTotal = yearLogs.reduce((sum, l) => sum + (l.amount || 0), 0);

    const getLogUnits = (l: FuelLog) => {
      if (isElectricFuelType(l.fuelType) || (isElectricVehicle && l.kwh !== undefined)) {
        const unitPrice = l.pricePerKwh || l.pricePerLiter || 1.8;
        return l.kwh ?? (unitPrice > 0 ? l.amount / unitPrice : 0);
      }
      const unitPrice = l.pricePerLiter || 6.19;
      return l.liters ?? (unitPrice > 0 ? l.amount / unitPrice : 0);
    };

    const monthUnits = monthLogs.reduce((sum, l) => sum + getLogUnits(l), 0);
    const yearUnits = yearLogs.reduce((sum, l) => sum + getLogUnits(l), 0);

    const yearEstimatedKm = yearLogs.reduce((sum, l) => {
      const units = getLogUnits(l);
      if (isElectricFuelType(l.fuelType) || isElectricVehicle) {
        return sum + units * (currentVehicle.avgKmPerKwh || 6.5);
      }
      return sum + units * (currentVehicle.avgKmPerLiter || 14);
    }, 0);

    const activeMonthsInYear = new Set(yearLogs.map(l => parseLogYearMonth(l.date).monthIdx)).size || 1;
    const monthlyAverageInYear = yearTotal / activeMonthsInYear;

    // Breakdown by Payment Method (for breakdownScope: 'month' | 'year')
    const scopeLogs = breakdownScope === 'month' ? monthLogs : yearLogs;
    const scopeTotal = breakdownScope === 'month' ? monthTotal : yearTotal;

    const byPayment: Record<FuelPaymentMethod, { amount: number; count: number; percent: number }> = {
      credit: { amount: 0, count: 0, percent: 0 },
      debit: { amount: 0, count: 0, percent: 0 },
      pix: { amount: 0, count: 0, percent: 0 },
      cash: { amount: 0, count: 0, percent: 0 }
    };

    scopeLogs.forEach(log => {
      const method = log.paymentMethod || 'pix';
      if (byPayment[method]) {
        byPayment[method].amount += log.amount || 0;
        byPayment[method].count += 1;
      }
    });

    (Object.keys(byPayment) as FuelPaymentMethod[]).forEach(m => {
      byPayment[m].percent = scopeTotal > 0 ? Math.round((byPayment[m].amount / scopeTotal) * 100) : 0;
    });

    // 12-Month Chart Data for Selected Year
    const monthlyChart = MONTH_SHORT_PT.map((shortName, idx) => {
      const mTotal = yearLogs
        .filter(l => parseLogYearMonth(l.date).monthIdx === idx)
        .reduce((s, l) => s + (l.amount || 0), 0);
      return { monthIdx: idx, label: shortName, amount: mTotal };
    });
    const maxMonthAmount = Math.max(...monthlyChart.map(m => m.amount), 1);

    // Autonomy estimate based on currentVehicle specs (Tank L or Battery kWh)
    const capacity = isElectricVehicle
      ? currentVehicle.batteryCapacityKwh || 50
      : currentVehicle.tankCapacityL || 14.2;
    const kmPerUnit = isElectricVehicle
      ? currentVehicle.avgKmPerKwh || 6.5
      : currentVehicle.avgKmPerLiter || 37;
    const estimatedRangeKm = Math.round(capacity * kmPerUnit);

    return {
      monthTotal,
      yearTotal,
      monthUnits,
      yearUnits,
      yearEstimatedKm,
      monthlyAverageInYear,
      byPayment,
      monthlyChart,
      maxMonthAmount,
      estimatedRangeKm
    };
  }, [monthLogs, yearLogs, breakdownScope, currentVehicle, isElectricVehicle]);

  // Displayed Logs in History List
  const displayedLogs = useMemo(() => {
    const base = historyScope === 'month' ? monthLogs : yearLogs;
    if (historyFilterMethod === 'all') return base;
    return base.filter(l => l.paymentMethod === historyFilterMethod);
  }, [monthLogs, yearLogs, historyScope, historyFilterMethod]);

  // Vehicle Catalog Filtering (Category + Brand + Search by Brand/Model/Type/Powertrain)
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    VEHICLE_CATALOG.filter(v => v.category === selectorCategory).forEach(v => brands.add(v.brand));
    return ['ALL', ...Array.from(brands)];
  }, [selectorCategory]);

  const filteredVehicles = useMemo(() => {
    const q = vehicleSearchQuery.trim().toLowerCase();
    return VEHICLE_CATALOG.filter(v => {
      if (v.category !== selectorCategory) return false;
      if (selectedBrandFilter !== 'ALL' && v.brand !== selectedBrandFilter) return false;
      if (!q) return true;
      const powerKeywords =
        v.powertrain === 'electric'
          ? 'eletrico elétrico energia bateria kwh ev recarga'
          : v.powertrain === 'hybrid'
          ? 'hibrido híbrido plug-in energia gasolina'
          : 'flex gasolina etanol combustao combustão';
      const haystack = `${v.brand} ${v.model} ${v.typeLabel} ${v.engineSpec} ${v.colorName} ${v.year} ${powerKeywords}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [selectorCategory, selectedBrandFilter, vehicleSearchQuery]);

  // Open Form for New Refueling / Electric Recharging
  const handleOpenNewForm = () => {
    setEditingLog(null);
    setAmountInput('');
    setPaymentMethod('pix');
    const defaultType: FuelType = isElectricVehicle ? 'electric_home' : 'gasoline';
    setFuelType(defaultType);
    const today = getLocalTodayISO();
    const todayParts = today.split('-');
    let initialDate = today;
    if (
      parseInt(todayParts[0], 10) !== selectedYear ||
      parseInt(todayParts[1], 10) - 1 !== selectedMonthIdx
    ) {
      const mStr = String(selectedMonthIdx + 1).padStart(2, '0');
      initialDate = `${selectedYear}-${mStr}-15`;
    }
    setDateInput(initialDate);
    const { year, monthIdx } = parseLogYearMonth(initialDate);
    setCalendarViewYear(year);
    setCalendarViewMonth(monthIdx);
    setIsCustomCalendarOpen(false);
    setIsFuelDropdownOpen(false);
    setPricePerLiterInput(FUEL_TYPE_META[defaultType].defaultPrice.toString());
    setOdometerInput('');
    setStationInput('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (log: FuelLog) => {
    setEditingLog(log);
    setAmountInput(log.amount.toString());
    setPaymentMethod(log.paymentMethod);
    const logType: FuelType = log.fuelType || (isElectricVehicle ? 'electric_home' : 'gasoline');
    setFuelType(logType);
    setDateInput(log.date);
    const { year, monthIdx } = parseLogYearMonth(log.date);
    setCalendarViewYear(year);
    setCalendarViewMonth(monthIdx);
    setIsCustomCalendarOpen(false);
    setIsFuelDropdownOpen(false);
    const existingPrice = isElectricFuelType(logType)
      ? log.pricePerKwh || log.pricePerLiter || FUEL_TYPE_META[logType].defaultPrice
      : log.pricePerLiter || FUEL_TYPE_META[logType].defaultPrice;
    setPricePerLiterInput(existingPrice.toString());
    setOdometerInput(log.odometer ? log.odometer.toString() : '');
    setStationInput(log.station || '');
    setIsFormOpen(true);
  };

  // Custom Calendar Grid Helper
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(calendarViewYear, calendarViewMonth, 1).getDay();
    const daysInMonth = new Date(calendarViewYear, calendarViewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [calendarViewYear, calendarViewMonth]);

  const handleSelectCalendarDay = (day: number) => {
    const mStr = String(calendarViewMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    setDateInput(`${calendarViewYear}-${mStr}-${dStr}`);
    setIsCustomCalendarOpen(false);
  };

  const handleCalendarPrevMonth = () => {
    if (calendarViewMonth === 0) {
      setCalendarViewMonth(11);
      setCalendarViewYear(y => y - 1);
    } else {
      setCalendarViewMonth(m => m - 1);
    }
  };

  const handleCalendarNextMonth = () => {
    if (calendarViewMonth === 11) {
      setCalendarViewMonth(0);
      setCalendarViewYear(y => y + 1);
    } else {
      setCalendarViewMonth(m => m + 1);
    }
  };

  // Auto-calculated units (Liters or kWh) preview in form
  const previewUnits = useMemo(() => {
    const val = parseFloat(amountInput.replace(',', '.'));
    const unitPrice = parseFloat(pricePerLiterInput.replace(',', '.'));
    if (!isNaN(val) && val > 0 && !isNaN(unitPrice) && unitPrice > 0) {
      return Math.round((val / unitPrice) * 100) / 100;
    }
    return 0;
  }, [amountInput, pricePerLiterInput]);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amountInput.replace(',', '.'));
    if (isNaN(cleanAmount) || cleanAmount <= 0) return;

    const isElec = isElectricFuelType(fuelType);
    const defaultPrice = FUEL_TYPE_META[fuelType]?.defaultPrice || (isElec ? 1.8 : 6.19);
    const cleanUnitPrice = parseFloat(pricePerLiterInput.replace(',', '.')) || defaultPrice;
    const calculatedUnits = Math.round((cleanAmount / cleanUnitPrice) * 100) / 100;
    const cleanOdo = odometerInput ? parseInt(odometerInput, 10) : undefined;

    const payload = {
      amount: Math.round(cleanAmount * 100) / 100,
      date: dateInput || getLocalTodayISO(),
      paymentMethod,
      fuelType,
      pricePerLiter: isElec ? undefined : cleanUnitPrice,
      liters: isElec ? undefined : calculatedUnits,
      pricePerKwh: isElec ? cleanUnitPrice : undefined,
      kwh: isElec ? calculatedUnits : undefined,
      odometer: cleanOdo,
      station: stationInput.trim() || undefined
    };

    if (editingLog) {
      onEditFuelLog({
        ...editingLog,
        ...payload
      });
    } else {
      onAddFuelLog(payload);
    }

    const { year, monthIdx } = parseLogYearMonth(payload.date);
    setSelectedYear(year);
    setSelectedMonthIdx(monthIdx);
    setIsFormOpen(false);
    setEditingLog(null);
  };

  const handlePrevMonth = () => {
    if (selectedMonthIdx === 0) {
      setSelectedMonthIdx(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonthIdx(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonthIdx === 11) {
      setSelectedMonthIdx(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonthIdx(m => m + 1);
    }
  };

  const formatMoney = (val: number) =>
    `${currencySymbol} ${val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fullChargePresetValue = useMemo(() => {
    if (isSelectedLogElectric) {
      const cap = currentVehicle.batteryCapacityKwh || 50;
      const rate = parseFloat(pricePerLiterInput.replace(',', '.')) || FUEL_TYPE_META[fuelType].defaultPrice;
      return Math.max(5, Math.round(cap * rate));
    }
    const tankCap = currentVehicle.tankCapacityL || 14.2;
    const rate = parseFloat(pricePerLiterInput.replace(',', '.')) || 6.19;
    return Math.max(20, Math.round(tankCap * rate));
  }, [isSelectedLogElectric, currentVehicle, pricePerLiterInput, fuelType]);

  const quickPresets = useMemo(() => {
    if (isSelectedLogElectric) {
      return Array.from(new Set([15, 30, 50, fullChargePresetValue]));
    }
    return Array.from(new Set([30, 50, 70, fullChargePresetValue]));
  }, [isSelectedLogElectric, fullChargePresetValue]);

  const motoCount = useMemo(() => VEHICLE_CATALOG.filter(v => v.category === 'motorcycle').length, []);
  const carCount = useMemo(() => VEHICLE_CATALOG.filter(v => v.category === 'car').length, []);

  // ============================================================================
  // FIRST SCREEN: FULL-PAGE VEHICLE SELECTION (MOTO vs CARRO + SEARCH)
  // ============================================================================
  if (isVehicleSelectorOpen) {
    return (
      <div className="w-full max-w-4xl mx-auto px-1 pb-2 space-y-4 animate-in fade-in duration-300">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#1c1c1e] border border-white/10 flex items-center justify-center shadow-lg shrink-0">
              <Box className="w-5 h-5 text-accent" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight truncate">
                ESCOLHA SEU VEÍCULO
              </h1>
              <p className="text-xs text-gray-400 truncate">
                Selecione Moto ou Carro para abrir o 3D Studio e controlar combustível
              </p>
            </div>
          </div>

          {selectedVehicleId && (
            <button
              type="button"
              onClick={() => setIsVehicleSelectorOpen(false)}
              className="px-3.5 py-2 rounded-xl bg-[#1c1c1e] hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span>Voltar</span>
            </button>
          )}
        </div>

        {/* Visual Category Selector Cards: MOTO vs CARRO */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectorCategory('motorcycle');
              setSelectedBrandFilter('ALL');
            }}
            className={`group relative rounded-[1.5rem] overflow-hidden border text-left transition-all cursor-pointer ${
              selectorCategory === 'motorcycle'
                ? 'border-accent ring-2 ring-accent/30 bg-[#18181c] shadow-xl'
                : 'border-white/10 bg-[#141417] opacity-75 hover:opacity-100'
            }`}
          >
            <div className="h-24 sm:h-32 w-full bg-[#0a0a0b] relative overflow-hidden">
              <img
                src="/fz25-2026-3d.jpg"
                alt="Motos 3D"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141417] via-black/30 to-transparent" />
              {selectorCategory === 'motorcycle' && (
                <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-accent text-black flex items-center justify-center shadow-md">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}
            </div>
            <div className="p-3.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Bike
                    className={`w-4 h-4 shrink-0 ${
                      selectorCategory === 'motorcycle' ? 'text-accent' : 'text-gray-400'
                    }`}
                  />
                  <span className="text-sm font-black uppercase tracking-wider text-white">
                    Motos
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
                  {motoCount} modelos 3D
                </span>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectorCategory('car');
              setSelectedBrandFilter('ALL');
            }}
            className={`group relative rounded-[1.5rem] overflow-hidden border text-left transition-all cursor-pointer ${
              selectorCategory === 'car'
                ? 'border-accent ring-2 ring-accent/30 bg-[#18181c] shadow-xl'
                : 'border-white/10 bg-[#141417] opacity-75 hover:opacity-100'
            }`}
          >
            <div className="h-24 sm:h-32 w-full bg-[#0a0a0b] relative overflow-hidden">
              <img
                src="/car-2026-3d.jpg"
                alt="Carros 3D"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141417] via-black/30 to-transparent" />
              {selectorCategory === 'car' && (
                <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-accent text-black flex items-center justify-center shadow-md">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}
            </div>
            <div className="p-3.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Car
                    className={`w-4 h-4 shrink-0 ${
                      selectorCategory === 'car' ? 'text-accent' : 'text-gray-400'
                    }`}
                  />
                  <span className="text-sm font-black uppercase tracking-wider text-white">
                    Carros
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
                  {carCount} modelos 3D
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Search Bar + Brand Filters Card */}
        <div className="bg-[#1c1c1e] border border-white/5 rounded-[1.75rem] p-4 shadow-xl space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={vehicleSearchQuery}
              onChange={e => setVehicleSearchQuery(e.target.value)}
              placeholder={
                selectorCategory === 'motorcycle'
                  ? 'Pesquisar marca, modelo ou tipo (ex: Yamaha, Fazer, Elétrica, Trail)...'
                  : 'Pesquisar marca, modelo ou tipo (ex: BYD, Elétrico, Toyota, SUV, Sedan)...'
              }
              className="w-full bg-[#0a0a0b] border border-white/10 focus:border-accent rounded-2xl pl-10 pr-9 py-3 text-xs sm:text-sm font-semibold text-white placeholder:text-gray-500 outline-none transition-colors"
            />
            {vehicleSearchQuery && (
              <button
                type="button"
                onClick={() => setVehicleSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Brand Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {availableBrands.map(b => (
              <button
                key={b}
                type="button"
                onClick={() => setSelectedBrandFilter(b)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap border transition-all cursor-pointer shrink-0 ${
                  selectedBrandFilter === b
                    ? 'bg-accent text-black border-accent'
                    : 'bg-[#141416] text-gray-400 border-white/5 hover:text-white'
                }`}
              >
                {b === 'ALL' ? 'Todas as Marcas' : b}
              </button>
            ))}
          </div>

          {/* Filtered Vehicles List */}
          <div className="space-y-2.5 pt-1">
            {filteredVehicles.length === 0 ? (
              <div className="bg-[#141416] border border-dashed border-white/10 rounded-2xl p-8 text-center">
                <p className="text-sm font-bold text-gray-300">Nenhum veículo encontrado</p>
                <p className="text-xs text-gray-500 mt-1">
                  Tente pesquisar por outra marca ou tipo (ex: Yamaha, BYD, Elétrico, SUV, Sedan).
                </p>
              </div>
            ) : (
              filteredVehicles.map(v => {
                const isCurrent = v.id === selectedVehicleId;
                const isEv = v.powertrain === 'electric';
                const isHyb = v.powertrain === 'hybrid';
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectVehicle(v)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3.5 cursor-pointer active:scale-[0.99] ${
                      isCurrent
                        ? 'bg-accent/15 border-accent/40 ring-1 ring-accent/40'
                        : 'bg-[#141416] border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="w-20 h-14 rounded-xl overflow-hidden bg-[#0a0a0b] border border-white/10 shrink-0 relative">
                      <img
                        src={v.imageUrl}
                        alt={v.model}
                        className="w-full h-full object-cover object-center"
                        style={{ filter: v.hueRotate }}
                      />
                      {isEv && (
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-black text-[8px] font-black uppercase flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5 fill-current" />
                          EV
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-gray-200 whitespace-nowrap">
                          {v.brand}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-white truncate">
                          {v.model}
                        </span>
                        <span className="text-[10px] font-bold text-accent whitespace-nowrap">
                          {v.year}
                        </span>
                        {isEv && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-extrabold uppercase whitespace-nowrap">
                            <Zap className="w-2.5 h-2.5" />
                            Energia
                          </span>
                        )}
                        {isHyb && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[9px] font-extrabold uppercase whitespace-nowrap">
                            <Zap className="w-2.5 h-2.5" />
                            Híbrido
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1 truncate">
                        <span className="font-semibold text-gray-300 whitespace-nowrap">{v.typeLabel}</span>
                        <span>•</span>
                        <span className="truncate">{v.engineSpec}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 whitespace-nowrap">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: v.accentHex }}
                          />
                          Cor Fixa: {v.colorName}
                        </span>
                        <span className="text-[10px] text-gray-500 whitespace-nowrap">
                          {isEv
                            ? `• Bateria ${(v.batteryCapacityKwh || 50).toString().replace('.', ',')} kWh`
                            : isHyb
                            ? `• ${v.tankCapacityL}L + ${v.batteryCapacityKwh} kWh`
                            : `• Tanque ${v.tankCapacityL.toString().replace('.', ',')}L`}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isCurrent ? (
                        <div className="w-7 h-7 rounded-full bg-accent text-black flex items-center justify-center">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-1 pb-2 space-y-5 animate-in fade-in duration-300">
      {/* TOP HEADER — ONLY ONE TOP "REGISTRAR ABASTECIMENTO" BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#1c1c1e] flex items-center justify-center border border-white/10 shadow-lg relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-accent/10 pointer-events-none" />
            {currentVehicle.category === 'car' ? (
              <Car className="w-5 h-5 sm:w-6 sm:h-6 text-accent relative z-10 shrink-0" />
            ) : (
              <Bike className="w-5 h-5 sm:w-6 sm:h-6 text-accent relative z-10 shrink-0" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight whitespace-nowrap truncate uppercase">
                {currentVehicle.brand} {currentVehicle.model}
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full whitespace-nowrap shrink-0">
                {currentVehicle.year} 3D
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-400 font-medium flex items-center gap-1.5 mt-0.5 min-w-0">
              <Bluetooth className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">
                {currentVehicle.engineSpec} • {currentVehicle.colorName}
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenNewForm}
          data-tour-id="moto-add-fuel-btn"
          className="w-full sm:w-auto h-11 sm:h-12 px-5 rounded-2xl bg-accent text-black font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-accent/20 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shrink-0 whitespace-nowrap"
        >
          {isElectricVehicle ? (
            <>
              <Zap className="w-5 h-5 stroke-[2.5] shrink-0" />
              <span>Registrar Recarga</span>
            </>
          ) : isHybridVehicle ? (
            <>
              <Plus className="w-5 h-5 stroke-[2.5] shrink-0" />
              <span>Abastecer / Recarregar</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 stroke-[2.5] shrink-0" />
              <span>Registrar Abastecimento</span>
            </>
          )}
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 3D ANIMATED STUDIO STAGE (NO 360 MODE, NO AI SPARKLES ICON)          */}
      {/* ==================================================================== */}
      <div className="bg-[#141417] border border-white/10 rounded-[1.75rem] p-3.5 sm:p-5 relative overflow-hidden shadow-2xl">
        {/* Background Ambient Showroom Glow */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-[90%] h-56 bg-gradient-to-b ${currentVehicle.glowClass} rounded-full blur-3xl pointer-events-none transition-all duration-500`}
        />

        {/* Top Bar inside 3D Showroom: Studio Badge + Vehicle Selector Trigger */}
        <div className="relative z-20 flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setIs3DAnimActive(a => !a)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-black/70 text-white border border-white/10 backdrop-blur-md whitespace-nowrap cursor-pointer hover:border-accent/40 transition-all"
              title="Alternar animação 3D"
            >
              <Box className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>3D STUDIO</span>
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  is3DAnimActive ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'
                }`}
              />
            </button>

            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white/5 text-gray-300 border border-white/5 whitespace-nowrap">
              {isElectricVehicle ? (
                <>
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Bateria {(currentVehicle.batteryCapacityKwh || 50).toString().replace('.', ',')} kWh • ~{stats.estimatedRangeKm} km
                </>
              ) : (
                <>
                  <Gauge className="w-3 h-3 text-accent shrink-0" />
                  Tanque {currentVehicle.tankCapacityL.toString().replace('.', ',')}L • ~{stats.estimatedRangeKm} km
                </>
              )}
            </span>
          </div>

          {/* Button to open Vehicle Selector Screen (Carro / Moto + Search) */}
          <button
            type="button"
            onClick={() => {
              setSelectorCategory(currentVehicle.category);
              setSelectedBrandFilter('ALL');
              setVehicleSearchQuery('');
              setIsVehicleSelectorOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-extrabold uppercase tracking-wider bg-white/10 hover:bg-white/15 text-white border border-white/15 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>Trocar Veículo</span>
          </button>
        </div>

        {/* Real-Time Three.js WebGL 3D Viewport */}
        <div className="relative z-10">
          <Suspense
            fallback={
              <div className="w-full h-[235px] sm:h-[320px] rounded-2xl bg-[#0a0a0d] border border-white/5 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Carregando 3D Studio...
                </span>
              </div>
            }
          >
            <Vehicle3DStage
              category={currentVehicle.category}
              powertrain={currentVehicle.powertrain}
              accentHex={currentVehicle.accentHex}
              headlightOn={headlightOn}
              isAnimating={is3DAnimActive}
            />
          </Suspense>
        </div>

        {/* Showroom Controls Footer: Fixed Vehicle Color Badge + Farol LED Toggle */}
        <div className="relative z-20 mt-3.5 flex items-center justify-between gap-2 pt-3 border-t border-white/5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1c1c1e] border border-white/5 min-w-0">
            <span
              className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/25"
              style={{ backgroundColor: currentVehicle.accentHex }}
            />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate">
              Cor Fixa: <strong className="text-white">{currentVehicle.colorName}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setHeadlightOn(h => !h)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              headlightOn
                ? 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                : 'bg-[#1c1c1e] text-gray-400 border-white/5'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 shrink-0" />
            <span>Farol LED</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PERIOD SELECTOR (MÊS E ANO)                                          */}
      {/* ==================================================================== */}
      <div className="bg-[#1c1c1e] border border-white/5 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-lg">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="w-10 h-10 rounded-xl bg-[#2c2c2e] hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer active:scale-95 shrink-0"
          title="Mês Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-2 min-w-0">
          <Calendar className="w-4 h-4 text-accent shrink-0" />
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-sm sm:text-base font-extrabold text-white tracking-wider uppercase">
              {MONTH_NAMES_PT[selectedMonthIdx]}
            </span>
            <span className="text-sm sm:text-base font-extrabold text-accent">
              {selectedYear}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden sm:flex items-center gap-1 mr-1">
            {[selectedYear - 1, selectedYear, selectedYear + 1].map(yr => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  yr === selectedYear
                    ? 'bg-accent text-black'
                    : 'bg-[#2c2c2e] text-gray-400 hover:text-white'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-10 h-10 rounded-xl bg-[#2c2c2e] hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer active:scale-95 shrink-0"
            title="Próximo Mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MONTHLY & ANNUAL SPENDING KPI CARDS                                  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* GASTO NO MÊS */}
        <div className="bg-gradient-to-br from-[#1c1c1e] to-[#141416] border border-white/10 rounded-[1.75rem] p-5 relative overflow-hidden shadow-xl">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 min-w-0 truncate">
              {isElectricVehicle ? (
                <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Fuel className="w-3.5 h-3.5 text-accent shrink-0" />
              )}
              <span className="truncate">
                {isElectricVehicle ? 'Energia no Mês' : 'Gasto no Mês'} ({MONTH_SHORT_PT[selectedMonthIdx]}/{selectedYear})
              </span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/25 whitespace-nowrap shrink-0">
              {monthLogs.length} {isElectricVehicle ? (monthLogs.length === 1 ? 'recarga' : 'recargas') : 'abast.'}
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight my-1 whitespace-nowrap">
            {formatMoney(stats.monthTotal)}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] sm:text-xs text-gray-400 mt-3 pt-3 border-t border-white/5">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              {isElectricVehicle ? (
                <>
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ~{stats.monthUnits.toFixed(1)} kWh no mês
                </>
              ) : (
                <>
                  <Droplets className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  ~{stats.monthUnits.toFixed(1)} L no mês
                </>
              )}
            </span>
            <span className="font-semibold text-gray-300 whitespace-nowrap">
              Média: {formatMoney(monthLogs.length > 0 ? stats.monthTotal / monthLogs.length : 0)}
            </span>
          </div>
        </div>

        {/* GASTO NO ANO */}
        <div className="bg-gradient-to-br from-[#1c1c1e] to-[#141416] border border-white/10 rounded-[1.75rem] p-5 relative overflow-hidden shadow-xl">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 min-w-0 truncate">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">
                {isElectricVehicle ? 'Energia no Ano' : 'Gasto no Ano'} ({selectedYear})
              </span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25 whitespace-nowrap shrink-0">
              {yearLogs.length} no ano
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight my-1 whitespace-nowrap">
            {formatMoney(stats.yearTotal)}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] sm:text-xs text-gray-400 mt-3 pt-3 border-t border-white/5">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ~{Math.round(stats.yearEstimatedKm).toLocaleString(locale)} km est.
            </span>
            <span className="font-semibold text-gray-300 whitespace-nowrap">
              Média: {formatMoney(stats.monthlyAverageInYear)}/mês
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PAYMENT METHOD BREAKDOWN: CRÉDITO, DÉBITO, PIX, DINHEIRO             */}
      {/* ==================================================================== */}
      <div className="bg-[#1c1c1e] border border-white/5 rounded-[1.75rem] p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Gastos por Forma de Pagamento
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Toque em um cartão para filtrar o histórico
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-1 bg-[#0a0a0b] p-1 rounded-xl border border-white/5 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setBreakdownScope('month');
                setHistoryScope('month');
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap text-center ${
                breakdownScope === 'month'
                  ? 'bg-accent text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              No Mês ({MONTH_SHORT_PT[selectedMonthIdx]})
            </button>
            <button
              type="button"
              onClick={() => {
                setBreakdownScope('year');
                setHistoryScope('year');
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap text-center ${
                breakdownScope === 'year'
                  ? 'bg-accent text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              No Ano ({selectedYear})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {(['credit', 'debit', 'pix', 'cash'] as FuelPaymentMethod[]).map(method => {
            const meta = PAYMENT_META[method];
            const data = stats.byPayment[method];
            const Icon = meta.icon;
            const isSelected = historyFilterMethod === method;

            return (
              <button
                key={method}
                type="button"
                onClick={() =>
                  setHistoryFilterMethod(prev => (prev === method ? 'all' : method))
                }
                className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? `${meta.bgColor} ${meta.borderColor} ring-2 ring-white/20`
                    : 'bg-[#141416] border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-xl ${meta.bgColor} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase whitespace-nowrap ${meta.color}`}>
                    {data.percent}%
                  </span>
                </div>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  {meta.shortLabel}
                </div>
                <div className="text-base sm:text-lg font-extrabold text-white mt-0.5 truncate">
                  {formatMoney(data.amount)}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5 whitespace-nowrap">
                  {data.count} {data.count === 1 ? 'vez' : 'vezes'}
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2.5">
                  <div
                    className={`h-full ${meta.barColor} transition-all duration-500`}
                    style={{ width: `${Math.max(data.percent, data.amount > 0 ? 6 : 0)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* ANNUAL 12-MONTH BAR CHART                                            */}
      {/* ==================================================================== */}
      <div className="bg-[#1c1c1e] border border-white/5 rounded-[1.75rem] p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Evolução Mensal em {selectedYear}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Toque em um mês para inspecionar os gastos
            </p>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-accent/15 border border-accent/25 text-[11px] font-extrabold text-accent whitespace-nowrap">
            Total {selectedYear}: {formatMoney(stats.yearTotal)}
          </span>
        </div>

        <div className="grid grid-cols-12 gap-1 sm:gap-2 items-end h-32 pt-4">
          {stats.monthlyChart.map(item => {
            const heightPct =
              item.amount > 0 ? Math.max(14, Math.round((item.amount / stats.maxMonthAmount) * 100)) : 6;
            const isCurrent = item.monthIdx === selectedMonthIdx;
            return (
              <button
                key={item.monthIdx}
                type="button"
                onClick={() => setSelectedMonthIdx(item.monthIdx)}
                className="flex flex-col items-center justify-end h-full group cursor-pointer min-w-0"
                title={`${MONTH_NAMES_PT[item.monthIdx]}: ${formatMoney(item.amount)}`}
              >
                <div className="w-full flex-1 flex items-end justify-center">
                  <div
                    className={`w-full max-w-[20px] rounded-t-lg transition-all duration-300 ${
                      isCurrent
                        ? 'bg-accent shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                        : item.amount > 0
                        ? 'bg-blue-500/50 group-hover:bg-blue-400'
                        : 'bg-white/5 group-hover:bg-white/10'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span
                  className={`text-[8px] sm:text-[10px] font-bold mt-2 uppercase tracking-tighter sm:tracking-normal ${
                    isCurrent ? 'text-accent font-extrabold' : 'text-gray-500 group-hover:text-gray-300'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* REFUELING / RECHARGING HISTORY LIST                                  */}
      {/* ==================================================================== */}
      <div className="bg-[#1c1c1e] border border-white/5 rounded-[1.75rem] p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white truncate">
              {isElectricVehicle
                ? 'Histórico de Recargas'
                : isHybridVehicle
                ? 'Abastecimentos e Recargas'
                : 'Histórico de Abastecimentos'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {historyScope === 'month'
                ? `${MONTH_NAMES_PT[selectedMonthIdx]} de ${selectedYear}`
                : `Ano de ${selectedYear}`}
              {historyFilterMethod !== 'all' &&
                ` • ${PAYMENT_META[historyFilterMethod].shortLabel}`}
            </p>
          </div>

          {historyFilterMethod !== 'all' && (
            <button
              type="button"
              onClick={() => setHistoryFilterMethod('all')}
              className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Limpar Filtro
            </button>
          )}
        </div>

        {displayedLogs.length === 0 ? (
          <div className="bg-[#141416] border border-dashed border-white/10 rounded-2xl p-6 sm:p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
              {isElectricVehicle ? (
                <Zap className="w-6 h-6 text-emerald-400" />
              ) : (
                <Fuel className="w-6 h-6 text-gray-500" />
              )}
            </div>
            <p className="text-sm font-bold text-gray-200">
              {isElectricVehicle
                ? 'Nenhuma recarga elétrica neste período'
                : 'Nenhum abastecimento neste período'}
            </p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Use o botão{' '}
              <strong className="text-accent">
                {isElectricVehicle
                  ? 'Registrar Recarga'
                  : isHybridVehicle
                  ? 'Abastecer / Recarregar'
                  : 'Registrar Abastecimento'}
              </strong>{' '}
              no topo da tela para lançar seus gastos em Crédito, Débito, Pix ou Dinheiro.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedLogs.map(log => {
              const pMeta = PAYMENT_META[log.paymentMethod] || PAYMENT_META.pix;
              const logIsElec = isElectricFuelType(log.fuelType) || (isElectricVehicle && log.kwh !== undefined);
              const fMeta =
                FUEL_TYPE_META[log.fuelType || (logIsElec ? 'electric_home' : 'gasoline')] ||
                FUEL_TYPE_META.gasoline;
              const PIcon = pMeta.icon;
              const unitPrice = logIsElec
                ? log.pricePerKwh || log.pricePerLiter || 1.8
                : log.pricePerLiter || 6.19;
              const units = logIsElec
                ? log.kwh ?? (unitPrice > 0 ? log.amount / unitPrice : 0)
                : log.liters ?? (unitPrice > 0 ? log.amount / unitPrice : 0);

              return (
                <div
                  key={log.id}
                  className="bg-[#141416] border border-white/5 hover:border-white/15 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl ${pMeta.bgColor} border ${pMeta.borderColor} flex items-center justify-center shrink-0`}
                    >
                      <PIcon className={`w-5 h-5 ${pMeta.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm sm:text-base font-black text-white whitespace-nowrap">
                          {formatMoney(log.amount)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border whitespace-nowrap ${pMeta.bgColor} ${pMeta.color} ${pMeta.borderColor}`}
                        >
                          {pMeta.shortLabel}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap ${fMeta.badgeClass}`}
                        >
                          {fMeta.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-gray-400 mt-1">
                        <span className="whitespace-nowrap">{log.date.split('-').reverse().join('/')}</span>
                        <span className="whitespace-nowrap">
                          • {units.toFixed(2)} {logIsElec ? 'kWh' : 'L'}
                        </span>
                        <span className="whitespace-nowrap">
                          • {formatMoney(unitPrice)}/{logIsElec ? 'kWh' : 'L'}
                        </span>
                        {log.odometer && (
                          <span className="whitespace-nowrap">• {log.odometer.toLocaleString(locale)} km</span>
                        )}
                        {log.station && <span className="truncate">• {log.station}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditForm(log)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteFuelLog(log.id)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODAL FORM: ADD / EDIT REFUELING OR ELECTRIC RECHARGING              */}
      {/* ==================================================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div
            className="bg-[#1c1c1e] border border-white/10 w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-center justify-between gap-2 mb-5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
                  {isSelectedLogElectric ? (
                    <Zap className="w-5 h-5 text-accent" />
                  ) : (
                    <Fuel className="w-5 h-5 text-accent" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-extrabold text-white truncate">
                    {editingLog
                      ? isSelectedLogElectric
                        ? 'Editar Recarga Elétrica'
                        : 'Editar Abastecimento'
                      : isSelectedLogElectric
                      ? 'Nova Recarga Elétrica'
                      : 'Novo Abastecimento'}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {currentVehicle.brand} {currentVehicle.model} •{' '}
                    {isSelectedLogElectric
                      ? `Bateria ${(currentVehicle.batteryCapacityKwh || 50).toString().replace('.', ',')} kWh`
                      : `Tanque ${currentVehicle.tankCapacityL.toString().replace('.', ',')}L`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* VALOR ABASTECIDO / RECARGA */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                  {isSelectedLogElectric
                    ? `Valor da Recarga (${currencySymbol})`
                    : `Valor que Abasteci (${currencySymbol})`}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-accent">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    autoFocus
                    placeholder="0,00"
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    className="w-full bg-[#0a0a0b] border border-white/10 focus:border-accent rounded-2xl pl-12 pr-4 py-3.5 text-2xl font-black text-white outline-none transition-colors"
                  />
                </div>
                {/* Quick Value Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {quickPresets.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmountInput(preset.toString())}
                      className="px-3 py-1 rounded-xl bg-[#2c2c2e] hover:bg-white/15 text-xs font-bold text-gray-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {preset === fullChargePresetValue
                        ? isSelectedLogElectric
                          ? `Carga 100% (~${currencySymbol} ${preset})`
                          : `Tanque Cheio (~${currencySymbol} ${preset})`
                        : `${currencySymbol} ${preset}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* FORMA DE PAGAMENTO: CRÉDITO, DÉBITO, PIX, DINHEIRO */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['credit', 'debit', 'pix', 'cash'] as FuelPaymentMethod[]).map(method => {
                    const meta = PAYMENT_META[method];
                    const Icon = meta.icon;
                    const active = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                          active
                            ? `${meta.bgColor} ${meta.borderColor} text-white ring-2 ring-white/20`
                            : 'bg-[#0a0a0b] border-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${active ? meta.color : 'text-gray-500'}`} />
                        <span className="text-xs font-extrabold uppercase tracking-wide whitespace-nowrap">
                          {meta.shortLabel}
                        </span>
                        {active && <Check className="w-4 h-4 ml-auto text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CUSTOM EXPANDABLE DATE CALENDAR (NO BROWSER DATE PICKER) */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                  {isSelectedLogElectric ? 'Data da Recarga' : 'Data do Abastecimento'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCalendarOpen(o => !o);
                    setIsFuelDropdownOpen(false);
                  }}
                  className={`w-full bg-[#0a0a0b] border ${
                    isCustomCalendarOpen ? 'border-accent' : 'border-white/10 hover:border-white/20'
                  } rounded-2xl px-4 py-3.5 flex items-center justify-between gap-2 text-left transition-all cursor-pointer`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Calendar className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-sm font-bold text-white truncate">
                      {formatDisplayDate(dateInput)}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                      isCustomCalendarOpen ? 'rotate-180 text-accent' : ''
                    }`}
                  />
                </button>

                {/* Expandable Custom App Calendar */}
                {isCustomCalendarOpen && (
                  <div className="mt-2 bg-[#121215] border border-white/10 rounded-2xl p-3.5 shadow-xl animate-in fade-in duration-150">
                    <div className="flex items-center justify-between mb-3">
                      <button
                        type="button"
                        onClick={handleCalendarPrevMonth}
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                        {MONTH_NAMES_PT[calendarViewMonth]} {calendarViewYear}
                      </span>
                      <button
                        type="button"
                        onClick={handleCalendarNextMonth}
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                      {WEEK_DAYS_PT.map(wd => (
                        <span key={wd} className="text-[9px] font-extrabold text-gray-500 uppercase">
                          {wd}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((day, idx) => {
                        if (day === null) {
                          return <div key={`empty-${idx}`} className="h-8" />;
                        }
                        const mStr = String(calendarViewMonth + 1).padStart(2, '0');
                        const dStr = String(day).padStart(2, '0');
                        const iso = `${calendarViewYear}-${mStr}-${dStr}`;
                        const isSelected = iso === dateInput;
                        const isToday = iso === getLocalTodayISO();

                        return (
                          <button
                            key={iso}
                            type="button"
                            onClick={() => handleSelectCalendarDay(day)}
                            className={`h-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-accent text-black font-black shadow-md'
                                : isToday
                                ? 'bg-white/10 text-accent border border-accent/40'
                                : 'text-gray-300 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          const today = getLocalTodayISO();
                          setDateInput(today);
                          const { year, monthIdx } = parseLogYearMonth(today);
                          setCalendarViewYear(year);
                          setCalendarViewMonth(monthIdx);
                          setIsCustomCalendarOpen(false);
                        }}
                        className="text-[11px] font-extrabold text-accent hover:underline cursor-pointer"
                      >
                        Selecionar Hoje
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCustomCalendarOpen(false)}
                        className="text-[11px] font-bold text-gray-400 hover:text-white cursor-pointer"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* CUSTOM EXPANDABLE FUEL / ENERGY TYPE SELECTOR */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                  {isElectricVehicle
                    ? 'Tipo de Energia / Recarga'
                    : isHybridVehicle
                    ? 'Combustível ou Energia'
                    : 'Tipo de Combustível'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsFuelDropdownOpen(o => !o);
                    setIsCustomCalendarOpen(false);
                  }}
                  className={`w-full bg-[#0a0a0b] border ${
                    isFuelDropdownOpen ? 'border-accent' : 'border-white/10 hover:border-white/20'
                  } rounded-2xl px-4 py-3.5 flex items-center justify-between gap-2 text-left transition-all cursor-pointer`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${FUEL_TYPE_META[fuelType].dotColor}`}
                    />
                    <span className="text-sm font-bold text-white truncate">
                      {FUEL_TYPE_META[fuelType].label}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                      isFuelDropdownOpen ? 'rotate-180 text-accent' : ''
                    }`}
                  />
                </button>

                {isFuelDropdownOpen && (
                  <div className="mt-2 bg-[#121215] border border-white/10 rounded-2xl p-2 space-y-1 shadow-xl animate-in fade-in duration-150">
                    {availableEnergyTypes.map(ft => {
                      const meta = FUEL_TYPE_META[ft];
                      const isSelected = fuelType === ft;
                      return (
                        <button
                          key={ft}
                          type="button"
                          onClick={() => {
                            setFuelType(ft);
                            setPricePerLiterInput(meta.defaultPrice.toString());
                            setIsFuelDropdownOpen(false);
                          }}
                          className={`w-full p-3 rounded-xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-accent/15 border border-accent/30 text-white'
                              : 'hover:bg-white/5 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dotColor}`} />
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-white truncate">
                                {meta.label}
                              </div>
                              <div className="text-[10px] text-gray-400 truncate">{meta.desc}</div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-accent shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* PREÇO POR LITRO / KWH & ODÔMETRO OPCIONAL */}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="min-w-0">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5 whitespace-nowrap truncate">
                    {isSelectedLogElectric
                      ? `Preço / kWh (${currencySymbol})`
                      : `Preço / Litro (${currencySymbol})`}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={pricePerLiterInput}
                    onChange={e => setPricePerLiterInput(e.target.value)}
                    className="w-full h-12 bg-[#0a0a0b] border border-white/10 focus:border-accent rounded-2xl px-4 text-sm font-bold text-white outline-none transition-colors"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5 whitespace-nowrap truncate">
                    Odômetro (km)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 4250 (opc.)"
                    value={odometerInput}
                    onChange={e => setOdometerInput(e.target.value)}
                    className="w-full h-12 bg-[#0a0a0b] border border-white/10 focus:border-accent rounded-2xl px-4 text-sm font-bold text-white outline-none transition-colors"
                  />
                </div>
              </div>

              {/* POSTO / ELETROPOSTO */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                  {isSelectedLogElectric
                    ? 'Eletroposto ou Local (opcional)'
                    : 'Posto ou Observação (opcional)'}
                </label>
                <input
                  type="text"
                  placeholder={
                    isSelectedLogElectric
                      ? 'Ex: Wallbox Casa / Shopping / Eletroposto'
                      : 'Ex: Shell V-Power / Viagem'
                  }
                  value={stationInput}
                  onChange={e => setStationInput(e.target.value)}
                  className="w-full bg-[#0a0a0b] border border-white/10 focus:border-accent rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none"
                />
              </div>

              {/* LIVE TELEMETRY PREVIEW */}
              {previewUnits > 0 && (
                <div className="bg-[#141416] border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs">
                  <span className="text-gray-400 truncate">
                    {isSelectedLogElectric
                      ? `Energia (${(currentVehicle.batteryCapacityKwh || 50).toString().replace('.', ',')} kWh):`
                      : `Tanque (${currentVehicle.tankCapacityL.toString().replace('.', ',')}L):`}
                  </span>
                  <span className="font-extrabold text-accent whitespace-nowrap shrink-0">
                    ~{previewUnits.toFixed(2)} {isSelectedLogElectric ? 'kWh' : 'L'} (+
                    {Math.round(
                      previewUnits *
                        (isSelectedLogElectric
                          ? currentVehicle.avgKmPerKwh || 6.5
                          : currentVehicle.avgKmPerLiter || 14)
                    )}{' '}
                    km)
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-accent text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-accent/20 hover:brightness-110 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>
                  {editingLog
                    ? 'Salvar Alterações'
                    : isSelectedLogElectric
                    ? 'Confirmar Recarga'
                    : 'Confirmar Abastecimento'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MotorcycleView);
