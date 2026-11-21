import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
  Eye,
  Layers,
  Search,
  Car,
  Bike,
  SlidersHorizontal,
  Box
} from 'lucide-react';
import { FuelLog, FuelPaymentMethod, FuelType, AppLanguage } from '../types';
import { getLocale } from '../i18n';
import { loadData, saveData, STORAGE_KEYS } from '../services/storage';
import { saveUserField } from '../services/supabase';

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

export interface VehiclePreset {
  id: string;
  category: VehicleCategory;
  brand: string;
  model: string;
  year: string;
  typeLabel: string; // e.g. "Naked / Street", "Trail", "Sedan", "SUV", "Hatch"
  engineSpec: string;
  tankCapacityL: number;
  avgKmPerLiter: number;
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
    id: 'byd-dolphin-song-2026',
    category: 'car',
    brand: 'BYD',
    model: 'KING / SONG PRO DM-i',
    year: '2026',
    typeLabel: 'Híbrido Plug-in',
    engineSpec: '1.5 DM-i Super Hybrid',
    tankCapacityL: 52.0,
    avgKmPerLiter: 22.0,
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

interface HotspotInfo {
  id: string;
  x: number; // %
  y: number; // %
  title: string;
  spec: string;
  detail: string;
}

const getVehicleHotspots = (vehicle: VehiclePreset): HotspotInfo[] => {
  if (vehicle.category === 'car') {
    return [
      {
        id: 'tank',
        x: 78,
        y: 44,
        title: `Tanque ${vehicle.tankCapacityL}L`,
        spec: `Autonomia ~${Math.round(vehicle.tankCapacityL * vehicle.avgKmPerLiter)} km`,
        detail: `Consumo médio estimado de ${vehicle.avgKmPerLiter} km/L para ${vehicle.brand} ${vehicle.model}.`
      },
      {
        id: 'engine',
        x: 24,
        y: 52,
        title: `Motor ${vehicle.model}`,
        spec: vehicle.engineSpec,
        detail: `Conjunto mecânico ${vehicle.year} com gerenciamento eletrônico de alta eficiência.`
      },
      {
        id: 'headlight',
        x: 25,
        y: 51,
        title: 'Faróis Full LED + DRL',
        spec: 'Projetor LED Adaptativo',
        detail: 'Iluminação diurna em LED de alta definição e assinatura luminosa esportiva.'
      },
      {
        id: 'wheels',
        x: 41,
        y: 67,
        title: 'Freios ABS + Rodas Liga',
        spec: 'Discos Ventilados + EBD',
        detail: 'Controle eletrônico de estabilidade e freios a disco nas 4 rodas.'
      }
    ];
  }

  return [
    {
      id: 'tank',
      x: 52,
      y: 33,
      title: `Tanque Muscular ${vehicle.tankCapacityL.toString().replace('.', ',')}L`,
      spec: `Autonomia de até ${Math.round(vehicle.tankCapacityL * vehicle.avgKmPerLiter)} km`,
      detail: `Consumo médio ~${vehicle.avgKmPerLiter} km/L com tomadas de ar esportivas ${vehicle.year}.`
    },
    {
      id: 'engine',
      x: 53,
      y: 59,
      title: `Motor ${vehicle.brand} ${vehicle.year}`,
      spec: vehicle.engineSpec,
      detail: 'Cilindro com alta dissipação térmica, injeção eletrônica e máxima confiabilidade.'
    },
    {
      id: 'headlight',
      x: 71,
      y: 37,
      title: 'Projetor Full LED + DRL',
      spec: 'Iluminação 100% LED 2026',
      detail: 'Canhão projetor bi-funcional, DRL integrado e piscas em LED de alta visibilidade.'
    },
    {
      id: 'abs',
      x: 75,
      y: 74,
      title: 'Freios a Disco com ABS',
      spec: 'Segurança Ativa 2026',
      detail: 'Sistema antibloqueio de alta precisão com suspensão calibrada para asfalto e curvas.'
    },
    {
      id: 'panel',
      x: 64,
      y: 22,
      title: 'Painel Digital Blackout',
      spec: 'LCD 100% Digital + Conectividade',
      detail: 'Indicador ECO de pilotagem econômica, computador de bordo e alerta de consumo.'
    }
  ];
};

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

const FUEL_TYPE_META: Record<FuelType, { label: string; desc: string; badgeClass: string; dotColor: string }> = {
  gasoline: {
    label: 'Gasolina Comum',
    desc: 'Octanagem padrão • Uso diário',
    badgeClass: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    dotColor: 'bg-orange-400'
  },
  additive: {
    label: 'Gasolina Aditivada',
    desc: 'Detergentes dispersantes • Limpeza de bicos',
    badgeClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    dotColor: 'bg-cyan-400'
  },
  ethanol: {
    label: 'Etanol BlueFlex',
    desc: 'Biocombustível • Maior potência',
    badgeClass: 'text-lime-400 bg-lime-500/10 border-lime-500/20',
    dotColor: 'bg-lime-400'
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

  const vehicleHotspots = useMemo(() => getVehicleHotspots(currentVehicle), [currentVehicle]);

  // 3D Animated Studio State
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [activeHotspot, setActiveHotspot] = useState<HotspotInfo | null>(null);
  const [headlightOn, setHeadlightOn] = useState<boolean>(true);
  const [xrayTank, setXrayTank] = useState<boolean>(false);
  const [is3DAnimActive, setIs3DAnimActive] = useState<boolean>(true);
  const [animPhase, setAnimPhase] = useState<number>(0);
  const isUserInteractingRef = useRef<boolean>(false);
  const [manualTilt, setManualTilt] = useState<{ rx: number; ry: number; glareX: number; glareY: number }>({
    rx: 0,
    ry: 0,
    glareX: 50,
    glareY: 35
  });

  // Reset active hotspot when vehicle changes
  useEffect(() => {
    const spots = getVehicleHotspots(currentVehicle);
    setActiveHotspot(spots[0] || null);
  }, [currentVehicle]);

  // Smooth Continuous 3D Studio Animation Loop
  useEffect(() => {
    if (!is3DAnimActive || isVehicleSelectorOpen) return;
    let rafId: number;
    let start: number | null = null;

    const tick = (timestamp: number) => {
      if (start === null) start = timestamp;
      const elapsed = (timestamp - start) / 1000;
      setAnimPhase(elapsed);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [is3DAnimActive, isVehicleSelectorOpen]);

  // Computed 3D transform combining continuous 3D studio animation + user touch/mouse tilt
  const computed3D = useMemo(() => {
    if (isUserInteractingRef.current) {
      return {
        rx: manualTilt.rx,
        ry: manualTilt.ry,
        translateY: 0,
        scale: 1.03,
        glareX: manualTilt.glareX,
        glareY: manualTilt.glareY
      };
    }
    if (!is3DAnimActive) {
      return { rx: 0, ry: 0, translateY: 0, scale: 1.0, glareX: 50, glareY: 35 };
    }
    // Smooth 3D breathing & orbital showroom motion
    const ry = Math.sin(animPhase * 1.15) * 8.5;
    const rx = Math.cos(animPhase * 0.85) * 4.2;
    const translateY = Math.sin(animPhase * 1.7) * -5.5;
    const scale = 1.02 + Math.sin(animPhase * 0.9) * 0.015;
    const glareX = Math.round(50 + Math.sin(animPhase * 1.15) * 32);
    const glareY = Math.round(36 + Math.cos(animPhase * 0.85) * 18);

    return { rx, ry, translateY, scale, glareX, glareY };
  }, [animPhase, is3DAnimActive, manualTilt]);

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

  // Interactive 3D tilt on Studio Card
  const stageRef = useRef<HTMLDivElement | null>(null);
  const handleStageMove = useCallback((clientX: number, clientY: number) => {
    if (!stageRef.current) return;
    isUserInteractingRef.current = true;
    const rect = stageRef.current.getBoundingClientRect();
    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;
    const ry = (relX - 0.5) * 20;
    const rx = (0.5 - relY) * 13;
    setManualTilt({
      rx,
      ry,
      glareX: Math.round(relX * 100),
      glareY: Math.round(relY * 100)
    });
  }, []);

  const handleStageReset = useCallback(() => {
    isUserInteractingRef.current = false;
    setManualTilt({ rx: 0, ry: 0, glareX: 50, glareY: 35 });
  }, []);

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

  // Monthly & Annual Totals
  const stats = useMemo(() => {
    const monthTotal = monthLogs.reduce((sum, l) => sum + (l.amount || 0), 0);
    const yearTotal = yearLogs.reduce((sum, l) => sum + (l.amount || 0), 0);

    const monthLiters = monthLogs.reduce(
      (sum, l) => sum + (l.liters || (l.pricePerLiter ? l.amount / l.pricePerLiter : l.amount / 6.19)),
      0
    );
    const yearLiters = yearLogs.reduce(
      (sum, l) => sum + (l.liters || (l.pricePerLiter ? l.amount / l.pricePerLiter : l.amount / 6.19)),
      0
    );

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

    // Tank estimate based on currentVehicle specs
    const tankCap = currentVehicle.tankCapacityL;
    const avgKmL = currentVehicle.avgKmPerLiter;
    const latestLog = fuelLogs[0];
    const latestLiters = latestLog
      ? latestLog.liters || (latestLog.pricePerLiter ? latestLog.amount / latestLog.pricePerLiter : latestLog.amount / 6.19)
      : tankCap * 0.75;
    const tankRatio = Math.min(1, Math.max(0.2, latestLiters / tankCap));
    const estimatedRangeKm = Math.round(Math.min(tankCap, Math.max(latestLiters, tankCap * 0.45)) * avgKmL);

    return {
      monthTotal,
      yearTotal,
      monthLiters,
      yearLiters,
      monthlyAverageInYear,
      byPayment,
      monthlyChart,
      maxMonthAmount,
      tankRatio,
      estimatedRangeKm
    };
  }, [monthLogs, yearLogs, breakdownScope, fuelLogs, currentVehicle]);

  // Displayed Logs in History List
  const displayedLogs = useMemo(() => {
    const base = historyScope === 'month' ? monthLogs : yearLogs;
    if (historyFilterMethod === 'all') return base;
    return base.filter(l => l.paymentMethod === historyFilterMethod);
  }, [monthLogs, yearLogs, historyScope, historyFilterMethod]);

  // Vehicle Catalog Filtering (Category + Brand + Search by Brand/Model/Type)
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
      const haystack = `${v.brand} ${v.model} ${v.typeLabel} ${v.engineSpec} ${v.colorName} ${v.year}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [selectorCategory, selectedBrandFilter, vehicleSearchQuery]);

  // Open Form for New Refueling
  const handleOpenNewForm = () => {
    setEditingLog(null);
    setAmountInput('');
    setPaymentMethod('pix');
    setFuelType('gasoline');
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
    setPricePerLiterInput('6.19');
    setOdometerInput('');
    setStationInput('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (log: FuelLog) => {
    setEditingLog(log);
    setAmountInput(log.amount.toString());
    setPaymentMethod(log.paymentMethod);
    setFuelType(log.fuelType || 'gasoline');
    setDateInput(log.date);
    const { year, monthIdx } = parseLogYearMonth(log.date);
    setCalendarViewYear(year);
    setCalendarViewMonth(monthIdx);
    setIsCustomCalendarOpen(false);
    setIsFuelDropdownOpen(false);
    setPricePerLiterInput((log.pricePerLiter || 6.19).toString());
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

  // Auto-calculated liters preview in form
  const previewLiters = useMemo(() => {
    const val = parseFloat(amountInput.replace(',', '.'));
    const ppl = parseFloat(pricePerLiterInput.replace(',', '.'));
    if (!isNaN(val) && val > 0 && !isNaN(ppl) && ppl > 0) {
      return Math.round((val / ppl) * 100) / 100;
    }
    return 0;
  }, [amountInput, pricePerLiterInput]);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amountInput.replace(',', '.'));
    if (isNaN(cleanAmount) || cleanAmount <= 0) return;

    const cleanPpl = parseFloat(pricePerLiterInput.replace(',', '.')) || 6.19;
    const calculatedLiters = Math.round((cleanAmount / cleanPpl) * 100) / 100;
    const cleanOdo = odometerInput ? parseInt(odometerInput, 10) : undefined;

    const payload = {
      amount: Math.round(cleanAmount * 100) / 100,
      date: dateInput || getLocalTodayISO(),
      paymentMethod,
      fuelType,
      pricePerLiter: cleanPpl,
      liters: calculatedLiters,
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

  const fullTankPresetValue = Math.round(currentVehicle.tankCapacityL * 6.19);
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
                  ? 'Pesquisar marca, modelo ou tipo (ex: Yamaha, Fazer, Naked, Trail)...'
                  : 'Pesquisar marca, modelo ou tipo (ex: Toyota, Sedan, SUV, Hatch)...'
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
                  Tente pesquisar por outra marca ou tipo (ex: Yamaha, Honda, SUV, Sedan, Naked).
                </p>
              </div>
            ) : (
              filteredVehicles.map(v => {
                const isCurrent = v.id === selectedVehicleId;
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
                          • Tanque {v.tankCapacityL.toString().replace('.', ',')}L
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
          <Plus className="w-5 h-5 stroke-[2.5] shrink-0" />
          <span>Registrar Abastecimento</span>
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
              <Gauge className="w-3 h-3 text-accent shrink-0" />
              Tanque {currentVehicle.tankCapacityL.toString().replace('.', ',')}L • ~{stats.estimatedRangeKm} km
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

        {/* 3D Animated Viewport */}
        <div className="relative z-10">
          <div
            ref={stageRef}
            onMouseMove={e => handleStageMove(e.clientX, e.clientY)}
            onMouseLeave={handleStageReset}
            onTouchMove={e => {
              if (e.touches[0]) handleStageMove(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchEnd={handleStageReset}
            className="relative w-full rounded-2xl overflow-hidden bg-[#0a0a0b] border border-white/5 select-none"
            style={{ perspective: '1100px' }}
          >
            {/* Animated 3D Showroom Floor Reflection Ring */}
            <div
              className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[82%] h-8 rounded-full pointer-events-none transition-transform duration-300"
              style={{
                background: `radial-gradient(ellipse at center, ${currentVehicle.accentHex}40 0%, transparent 72%)`,
                transform: `translate3d(0, ${computed3D.translateY * -0.4}px, 0) scale(${computed3D.scale})`,
                filter: 'blur(6px)'
              }}
            />

            <div
              className="relative w-full will-change-transform"
              style={{
                transform: `translate3d(0, ${computed3D.translateY}px, 0) rotateX(${computed3D.rx}deg) rotateY(${computed3D.ry}deg) scale(${computed3D.scale})`,
                transformStyle: 'preserve-3d',
                transition: isUserInteractingRef.current ? 'transform 120ms ease-out' : 'none'
              }}
            >
              {/* 3D Studio Render Image of Vehicle */}
              <img
                src={currentVehicle.imageUrl}
                alt={`${currentVehicle.brand} ${currentVehicle.model} 3D`}
                className="w-full h-[215px] sm:h-[310px] object-cover object-center block transition-all duration-500"
                style={{ filter: currentVehicle.hueRotate }}
                draggable={false}
              />

              {/* Animated Dynamic Specular 3D Light Reflection */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at ${computed3D.glareX}% ${computed3D.glareY}%, rgba(255,255,255,0.18), transparent 55%)`
                }}
              />

              {/* Interactive LED Projector Headlight High-Beam Overlay */}
              {headlightOn && (
                <div
                  className="absolute pointer-events-none transition-opacity duration-300 animate-pulse"
                  style={
                    currentVehicle.category === 'car'
                      ? {
                          left: '14%',
                          top: '38%',
                          width: '24%',
                          height: '24%',
                          background:
                            'radial-gradient(circle, rgba(186,230,253,0.8) 0%, rgba(56,189,248,0.3) 42%, transparent 72%)',
                          filter: 'blur(7px)'
                        }
                      : {
                          left: '66%',
                          top: '26%',
                          width: '26%',
                          height: '26%',
                          background:
                            'radial-gradient(circle, rgba(186,230,253,0.8) 0%, rgba(56,189,248,0.3) 42%, transparent 72%)',
                          filter: 'blur(8px)'
                        }
                  }
                />
              )}

              {/* X-Ray Fuel Tank Overlay */}
              {xrayTank && (
                <div
                  className="absolute pointer-events-none rounded-full border-2 border-emerald-400/80 bg-emerald-500/25 backdrop-blur-[2px] flex items-center justify-center animate-pulse"
                  style={
                    currentVehicle.category === 'car'
                      ? { left: '66%', top: '34%', width: '22%', height: '20%' }
                      : { left: '43%', top: '22%', width: '20%', height: '20%' }
                  }
                >
                  <span className="text-[9px] sm:text-[10px] font-black text-emerald-300 drop-shadow whitespace-nowrap">
                    {(stats.tankRatio * currentVehicle.tankCapacityL).toFixed(1)}L /{' '}
                    {currentVehicle.tankCapacityL.toString().replace('.', ',')}L
                  </span>
                </div>
              )}

              {/* Interactive 3D Hotspots */}
              {showHotspots &&
                vehicleHotspots.map(spot => {
                  const isSelected = activeHotspot?.id === spot.id;
                  return (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setActiveHotspot(spot);
                      }}
                      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all cursor-pointer z-20 ${
                        isSelected
                          ? 'bg-accent text-black scale-125 shadow-[0_0_20px_rgba(255,255,255,0.7)] ring-4 ring-accent/30'
                          : 'bg-black/75 text-white border border-white/40 hover:scale-110'
                      }`}
                      title={spot.title}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Active Hotspot Telemetry Card */}
          {activeHotspot && showHotspots && (
            <div className="mt-3 sm:mt-0 sm:absolute sm:bottom-3 sm:left-3 sm:max-w-sm bg-black/85 backdrop-blur-xl border border-white/15 rounded-2xl p-3 z-30 flex items-start justify-between gap-2.5 animate-in fade-in duration-200">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-extrabold text-white">{activeHotspot.title}</span>
                  <span className="text-[10px] font-bold text-accent bg-accent/15 px-2 py-0.5 rounded-full border border-accent/25 whitespace-nowrap">
                    {activeHotspot.spec}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 mt-1 leading-snug">{activeHotspot.detail}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveHotspot(null)}
                className="text-gray-400 hover:text-white p-1 shrink-0 cursor-pointer"
                aria-label="Fechar especificação"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Showroom Controls Footer: Fixed Vehicle Color Badge + Interactive 3D Toggles */}
        <div className="relative z-20 mt-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-white/5">
          {/* Fixed Color Info Badge (Color is fixed per vehicle model) */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1c1c1e] border border-white/5">
              <span
                className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/25"
                style={{ backgroundColor: currentVehicle.accentHex }}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">
                Cor Fixa: <strong className="text-white">{currentVehicle.colorName}</strong>
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 sm:hidden whitespace-nowrap">
              {currentVehicle.typeLabel}
            </span>
          </div>

          {/* Interactive 3D Action Toggles */}
          <div className="grid grid-cols-3 sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setHeadlightOn(h => !h)}
              className={`px-2.5 py-2 sm:py-1.5 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                headlightOn
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                  : 'bg-[#1c1c1e] text-gray-400 border-white/5'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 shrink-0" />
              <span>Farol LED</span>
            </button>

            <button
              type="button"
              onClick={() => setXrayTank(x => !x)}
              className={`px-2.5 py-2 sm:py-1.5 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                xrayTank
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-[#1c1c1e] text-gray-400 border-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Tanque {currentVehicle.tankCapacityL.toString().replace('.', ',')}L</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHotspots(s => !s)}
              className={`px-2.5 py-2 sm:py-1.5 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                showHotspots
                  ? 'bg-accent/20 text-accent border-accent/30'
                  : 'bg-[#1c1c1e] text-gray-400 border-white/5'
              }`}
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span>Specs</span>
            </button>
          </div>
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
              <Fuel className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="truncate">Gasto no Mês ({MONTH_SHORT_PT[selectedMonthIdx]}/{selectedYear})</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/25 whitespace-nowrap shrink-0">
              {monthLogs.length} {monthLogs.length === 1 ? 'abast.' : 'abast.'}
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight my-1 whitespace-nowrap">
            {formatMoney(stats.monthTotal)}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] sm:text-xs text-gray-400 mt-3 pt-3 border-t border-white/5">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Droplets className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              ~{stats.monthLiters.toFixed(1)} L no mês
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
              <span className="truncate">Gasto no Ano ({selectedYear})</span>
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
              ~{Math.round(stats.yearLiters * currentVehicle.avgKmPerLiter).toLocaleString(locale)} km est.
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
      {/* REFUELING HISTORY LIST (NO DUPLICATE BOTTOM REGISTER BUTTON)         */}
      {/* ==================================================================== */}
      <div className="bg-[#1c1c1e] border border-white/5 rounded-[1.75rem] p-4 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white truncate">
              Histórico de Abastecimentos
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
              <Fuel className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-sm font-bold text-gray-200">
              Nenhum abastecimento neste período
            </p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Use o botão <strong className="text-accent">Registrar Abastecimento</strong> no topo da tela para lançar seus gastos em Crédito, Débito, Pix ou Dinheiro.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedLogs.map(log => {
              const pMeta = PAYMENT_META[log.paymentMethod] || PAYMENT_META.pix;
              const fMeta = FUEL_TYPE_META[log.fuelType || 'gasoline'] || FUEL_TYPE_META.gasoline;
              const PIcon = pMeta.icon;
              const liters =
                log.liters ||
                (log.pricePerLiter ? log.amount / log.pricePerLiter : log.amount / 6.19);

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
                        <span className="whitespace-nowrap">• {liters.toFixed(2)} L</span>
                        {log.pricePerLiter && (
                          <span className="whitespace-nowrap">• {formatMoney(log.pricePerLiter)}/L</span>
                        )}
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
      {/* MODAL FORM: ADD / EDIT REFUELING (CUSTOM CALENDAR & FUEL DROPDOWN)   */}
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
                  <Fuel className="w-5 h-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-extrabold text-white truncate">
                    {editingLog ? 'Editar Abastecimento' : 'Novo Abastecimento'}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {currentVehicle.brand} {currentVehicle.model} • Tanque{' '}
                    {currentVehicle.tankCapacityL.toString().replace('.', ',')}L
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
              {/* VALOR ABASTECIDO */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                  Valor que Abasteci ({currencySymbol})
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
                  {[30, 50, 70, fullTankPresetValue].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmountInput(preset.toString())}
                      className="px-3 py-1 rounded-xl bg-[#2c2c2e] hover:bg-white/15 text-xs font-bold text-gray-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {preset === fullTankPresetValue
                        ? `Tanque Cheio (~${currencySymbol} ${preset})`
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
                  Data do Abastecimento
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

              {/* CUSTOM EXPANDABLE FUEL TYPE SELECTOR (NO NATIVE SELECT) */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                  Tipo de Combustível
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
                    {(['gasoline', 'additive', 'ethanol'] as FuelType[]).map(ft => {
                      const meta = FUEL_TYPE_META[ft];
                      const isSelected = fuelType === ft;
                      return (
                        <button
                          key={ft}
                          type="button"
                          onClick={() => {
                            setFuelType(ft);
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

              {/* PREÇO POR LITRO & ODÔMETRO OPCIONAL */}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="min-w-0">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5 whitespace-nowrap truncate">
                    Preço / Litro ({currencySymbol})
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

              {/* POSTO / OBSERVAÇÃO */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                  Posto ou Observação (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Shell V-Power / Viagem"
                  value={stationInput}
                  onChange={e => setStationInput(e.target.value)}
                  className="w-full bg-[#0a0a0b] border border-white/10 focus:border-accent rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none"
                />
              </div>

              {/* LIVE TELEMETRY PREVIEW */}
              {previewLiters > 0 && (
                <div className="bg-[#141416] border border-white/5 rounded-2xl p-3 flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    Volume no tanque ({currentVehicle.tankCapacityL.toString().replace('.', ',')}L):
                  </span>
                  <span className="font-extrabold text-accent">
                    ~{previewLiters.toFixed(2)} L (+
                    {Math.round(previewLiters * currentVehicle.avgKmPerLiter)} km)
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-accent text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-accent/20 hover:brightness-110 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>{editingLog ? 'Salvar Alterações' : 'Confirmar Abastecimento'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MotorcycleView);
