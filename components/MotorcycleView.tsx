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
  Zap,
  ShieldCheck,
  Bluetooth,
  Lightbulb,
  Rotate3d,
  Sparkles,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Droplets,
  Navigation,
  Eye,
  Layers
} from 'lucide-react';
import { FuelLog, FuelPaymentMethod, FuelType, AppLanguage } from '../types';
import { getLocale } from '../i18n';
import { loadData, saveData, STORAGE_KEYS } from '../services/storage';

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

interface MotoColorPreset {
  id: string;
  name: string;
  badge: string;
  hueRotate: string;
  accentHex: string;
  glowClass: string;
}

const MOTO_COLORS: MotoColorPreset[] = [
  {
    id: 'racing-blue',
    name: 'Racing Blue',
    badge: 'Azul Metálico 2026',
    hueRotate: 'hue-rotate(0deg) saturate(1.1)',
    accentHex: '#2563eb',
    glowClass: 'from-blue-600/30 via-blue-500/10 to-transparent'
  },
  {
    id: 'magma-red',
    name: 'Magma Red',
    badge: 'Vermelho Metálico 2026',
    hueRotate: 'hue-rotate(135deg) saturate(1.25)',
    accentHex: '#dc2626',
    glowClass: 'from-red-600/30 via-red-500/10 to-transparent'
  },
  {
    id: 'matt-green',
    name: 'Matt Green',
    badge: 'Verde Fosco 2026',
    hueRotate: 'hue-rotate(270deg) saturate(0.95)',
    accentHex: '#10b981',
    glowClass: 'from-emerald-600/30 via-emerald-500/10 to-transparent'
  },
  {
    id: 'titanium-black',
    name: 'Midnight Black',
    badge: 'Preto Eclipse 2026',
    hueRotate: 'grayscale(0.85) contrast(1.15)',
    accentHex: '#a1a1aa',
    glowClass: 'from-zinc-500/25 via-zinc-400/10 to-transparent'
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

const FZ25_HOTSPOTS: HotspotInfo[] = [
  {
    id: 'tank',
    x: 52,
    y: 33,
    title: 'Tanque Muscular 14,2L',
    spec: 'Autonomia de até 525 km',
    detail: 'Consumo médio ~37 km/L com tomadas de ar esportivas redesenhadas para 2026.'
  },
  {
    id: 'engine',
    x: 53,
    y: 59,
    title: 'Motor 250cc BlueFlex',
    spec: '21,3 cv @ 8.000 rpm • 2,1 kgf.m',
    detail: 'Cilindro com revestimento cerâmico, pistão forjado em alumínio e radiador de óleo.'
  },
  {
    id: 'headlight',
    x: 71,
    y: 37,
    title: 'Projetor Full LED + DRL',
    spec: 'Iluminação 100% LED 2026',
    detail: 'Canhão projetor bi-funcional, DRL integrado e novos piscas em LED de alta visibilidade.'
  },
  {
    id: 'abs',
    x: 75,
    y: 74,
    title: 'Freios ABS nas 2 Rodas',
    spec: 'Discos 282mm (D) / 220mm (T)',
    detail: 'Sistema antibloqueio de série nas duas rodas com suspensão dianteira dourada.'
  },
  {
    id: 'panel',
    x: 64,
    y: 22,
    title: 'Painel Blackout Y-Connect',
    spec: 'LCD 100% Digital + Bluetooth',
    detail: 'Conectividade Yamaha Motor On, indicador ECO, consumo instantâneo e tomada 12V.'
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

const FUEL_TYPE_META: Record<FuelType, { label: string; badgeClass: string }> = {
  gasoline: { label: 'Gasolina Comum', badgeClass: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  additive: { label: 'Gasolina Aditivada', badgeClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  ethanol: { label: 'Etanol BlueFlex', badgeClass: 'text-lime-400 bg-lime-500/10 border-lime-500/20' }
};

const getLocalTodayISO = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ============================================================================
// 360° INTERACTIVE 3D CANVAS MODEL OF YAMAHA FAZER FZ 25 2026
// ============================================================================
interface Canvas3DProps {
  accentHex: string;
  headlightOn: boolean;
  xrayTank: boolean;
  tankFillRatio: number; // 0 to 1
}

const Interactive3DFZ25Canvas: React.FC<Canvas3DProps> = ({
  accentHex,
  headlightOn,
  xrayTank,
  tankFillRatio
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [yaw, setYaw] = useState<number>(-0.48);
  const [pitch, setPitch] = useState<number>(0.16);
  const [autoSpin, setAutoSpin] = useState<boolean>(true);
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const wheelSpinRef = useRef(0);

  useEffect(() => {
    let animId: number;
    const animate = () => {
      wheelSpinRef.current += 0.035;
      if (autoSpin && !isDraggingRef.current) {
        setYaw(prev => prev + 0.008);
      }
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [autoSpin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 360;
    const height = canvas.clientHeight || 250;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height * 0.56;
    const scale = Math.min(width, height) * 0.95;

    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);

    const project = (x: number, y: number, z: number) => {
      // Rotate around Y (yaw)
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      // Rotate around X (pitch)
      const y2 = y * cosP - z1 * sinP;
      const z2 = y * sinP + z1 * cosP;
      const fov = 3.2;
      const depth = fov / (fov + z2 + 1.2);
      return {
        x: cx + x1 * scale * depth,
        y: cy - y2 * scale * depth,
        z: z2,
        d: depth
      };
    };

    // Draw 3D Showroom Circular Turntable Platform
    ctx.save();
    for (let r = 0.25; r <= 0.85; r += 0.2) {
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.12) {
        const p = project(Math.cos(a) * r, -0.34, Math.sin(a) * r);
        if (a === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = r > 0.7 ? `${accentHex}55` : 'rgba(255,255,255,0.07)';
      ctx.lineWidth = r > 0.7 ? 1.5 : 1;
      ctx.stroke();
    }
    ctx.restore();

    // Helper to draw 3D line segment
    const drawSegment = (
      p1: [number, number, number],
      p2: [number, number, number],
      color: string,
      lineWidth: number
    ) => {
      const a = project(p1[0], p1[1], p1[2]);
      const b = project(p2[0], p2[1], p2[2]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth * ((a.d + b.d) * 0.5);
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    // Helper to draw 3D polygon face
    const drawPoly = (
      pts: [number, number, number][],
      fill: string,
      stroke?: string,
      lineWidth = 1.2
    ) => {
      const projected = pts.map(p => project(p[0], p[1], p[2]));
      ctx.beginPath();
      projected.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    };

    // Helper to draw 3D wheel (tire + 10-spoke alloy rim + ABS brake disc)
    const drawWheel = (wx: number, wy: number, radius: number, isFront: boolean) => {
      const tireWidths = [-0.055, 0.055];
      // Outer tire rings
      tireWidths.forEach(zw => {
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.15) {
          const p = project(wx + Math.cos(a) * radius, wy + Math.sin(a) * radius, zw);
          if (a === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 11;
        ctx.stroke();

        ctx.strokeStyle = '#3f3f46';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Alloy spokes (spinning)
      const rimRadius = radius * 0.76;
      for (let i = 0; i < 5; i++) {
        const angle = wheelSpinRef.current + (i * Math.PI * 2) / 5;
        drawSegment(
          [wx, wy, -0.02],
          [wx + Math.cos(angle) * rimRadius, wy + Math.sin(angle) * rimRadius, -0.02],
          '#71717a',
          2.2
        );
        drawSegment(
          [wx, wy, 0.02],
          [wx + Math.cos(angle + 0.25) * rimRadius, wy + Math.sin(angle + 0.25) * rimRadius, 0.02],
          '#52525b',
          2.2
        );
      }

      // Brake Disc (282mm front / 220mm rear) + Gold ABS ring
      const discR = isFront ? radius * 0.52 : radius * 0.42;
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.2) {
        const p = project(wx + Math.cos(a) * discR, wy + Math.sin(a) * discR, 0.062);
        if (a === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = '#d4d4d8';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // ABS Sensor Ring
      const absR = discR * 0.62;
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.25) {
        const p = project(wx + Math.cos(a) * absR, wy + Math.sin(a) * absR, 0.064);
        if (a === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    // Draw Rear Wheel (-0.42, -0.14) and Front Wheel (0.44, -0.14)
    drawWheel(-0.42, -0.14, 0.2, false);
    drawWheel(0.44, -0.14, 0.2, true);

    // Swingarm & Monocross Rear Suspension
    drawSegment([-0.42, -0.14, -0.07], [-0.12, -0.1, -0.06], '#52525b', 5);
    drawSegment([-0.42, -0.14, 0.07], [-0.12, -0.1, 0.06], '#52525b', 5);
    // Yellow Monocross shock spring
    drawSegment([-0.22, -0.12, 0], [-0.12, 0.05, 0], '#eab308', 4.5);

    // Mid-ship Stubby Exhaust (Right side z = 0.09)
    drawPoly(
      [
        [-0.08, -0.17, 0.09],
        [-0.36, -0.05, 0.1],
        [-0.39, 0.01, 0.1],
        [-0.1, -0.1, 0.09]
      ],
      '#27272a',
      '#71717a',
      1.5
    );

    // 250cc BlueFlex Engine Block & Cooling Fins
    drawPoly(
      [
        [-0.11, -0.17, -0.07],
        [0.14, -0.17, -0.07],
        [0.16, 0.06, -0.07],
        [-0.09, 0.06, -0.07]
      ],
      '#18181b',
      '#3f3f46',
      1.5
    );
    drawPoly(
      [
        [-0.11, -0.17, 0.07],
        [0.14, -0.17, 0.07],
        [0.16, 0.06, 0.07],
        [-0.09, 0.06, 0.07]
      ],
      '#27272a',
      '#52525b',
      1.5
    );

    // Diamond Frame & Subframe
    drawSegment([-0.12, -0.1, 0], [0.22, 0.22, 0], '#3f3f46', 5);
    drawSegment([-0.12, 0.05, 0], [-0.46, 0.22, 0], '#3f3f46', 4);

    // Gold Front Telescopic Forks (signature Yamaha FZ25 gold upside-look tubes)
    drawSegment([0.44, -0.14, -0.065], [0.24, 0.29, -0.065], '#d97706', 5.5);
    drawSegment([0.44, -0.14, 0.065], [0.24, 0.29, 0.065], '#f59e0b', 5.5);

    // Front Fender
    drawPoly(
      [
        [0.34, 0.02, -0.06],
        [0.52, 0.0, -0.06],
        [0.52, 0.0, 0.06],
        [0.34, 0.02, 0.06]
      ],
      accentHex,
      '#ffffff33'
    );

    // Split Two-Level Ergonomic Seat
    drawPoly(
      [
        [-0.05, 0.1, -0.075],
        [-0.25, 0.12, -0.075],
        [-0.25, 0.12, 0.075],
        [-0.05, 0.1, 0.075]
      ],
      '#18181b',
      '#3f3f46'
    );
    drawPoly(
      [
        [-0.25, 0.15, -0.07],
        [-0.47, 0.23, -0.06],
        [-0.47, 0.23, 0.06],
        [-0.25, 0.15, 0.07]
      ],
      '#27272a',
      '#52525b'
    );

    // Tail Section & LED Taillight
    drawPoly(
      [
        [-0.22, 0.08, 0.07],
        [-0.49, 0.22, 0.05],
        [-0.44, 0.16, 0.05],
        [-0.18, 0.02, 0.07]
      ],
      accentHex,
      '#ffffff30'
    );
    drawSegment([-0.49, 0.22, -0.03], [-0.49, 0.22, 0.03], '#ef4444', 4);

    // Muscular 14.2L Fuel Tank & Side Air Intakes (Shrouds)
    const tankFillColor = xrayTank ? `${accentHex}33` : accentHex;
    const tankStrokeColor = xrayTank ? '#38bdf8' : '#ffffff44';

    // Left & Right Tank Shrouds
    [-0.095, 0.095].forEach(zSide => {
      drawPoly(
        [
          [-0.06, 0.11, zSide],
          [0.04, 0.29, zSide * 0.9],
          [0.22, 0.25, zSide],
          [0.27, 0.09, zSide * 1.05],
          [0.08, 0.06, zSide]
        ],
        tankFillColor,
        tankStrokeColor,
        1.5
      );
    });

    // Top Sculpted Tank Crown
    drawPoly(
      [
        [-0.06, 0.11, -0.085],
        [0.04, 0.29, -0.08],
        [0.22, 0.25, -0.08],
        [0.22, 0.25, 0.08],
        [0.04, 0.29, 0.08],
        [-0.06, 0.11, 0.085]
      ],
      xrayTank ? `${accentHex}44` : accentHex,
      tankStrokeColor,
      1.6
    );

    // X-Ray Internal Fuel Level Visualization inside the 14.2L Tank
    if (xrayTank) {
      const levelH = 0.11 + Math.max(0.1, Math.min(1, tankFillRatio)) * 0.16;
      drawPoly(
        [
          [-0.03, 0.11, -0.065],
          [0.03, levelH, -0.065],
          [0.19, levelH - 0.02, -0.065],
          [0.19, levelH - 0.02, 0.065],
          [0.03, levelH, 0.065],
          [-0.03, 0.11, 0.065]
        ],
        'rgba(16, 185, 129, 0.65)',
        '#34d399',
        2
      );
    }

    // Handlebars, Mirrors & Y-Connect Blackout LCD Cluster
    drawSegment([0.21, 0.31, -0.18], [0.21, 0.31, 0.18], '#d4d4d8', 3.5);
    drawSegment([0.21, 0.31, -0.17], [0.19, 0.41, -0.22], '#71717a', 2);
    drawSegment([0.21, 0.31, 0.17], [0.19, 0.41, 0.22], '#71717a', 2);

    // Digital LCD Dashboard Glow
    drawPoly(
      [
        [0.24, 0.3, -0.04],
        [0.27, 0.32, -0.04],
        [0.27, 0.32, 0.04],
        [0.24, 0.3, 0.04]
      ],
      '#0284c7',
      '#38bdf8'
    );

    // Aggressive Bi-Functional LED Projector Headlight & DRL
    drawPoly(
      [
        [0.27, 0.17, -0.055],
        [0.36, 0.21, -0.04],
        [0.36, 0.21, 0.04],
        [0.27, 0.17, 0.055]
      ],
      accentHex,
      '#ffffff44'
    );

    const headCenter = project(0.36, 0.21, 0);
    if (headlightOn) {
      const beamEnd = project(0.95, 0.02, 0);
      const grad = ctx.createLinearGradient(headCenter.x, headCenter.y, beamEnd.x, beamEnd.y);
      grad.addColorStop(0, 'rgba(186, 230, 253, 0.75)');
      grad.addColorStop(0.4, 'rgba(56, 189, 248, 0.25)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.beginPath();
      ctx.moveTo(headCenter.x, headCenter.y);
      ctx.lineTo(beamEnd.x, beamEnd.y - 38);
      ctx.lineTo(beamEnd.x, beamEnd.y + 38);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(headCenter.x, headCenter.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [yaw, pitch, accentHex, headlightOn, xrayTank, tankFillRatio]);

  const handlePointerDown = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    setAutoSpin(false);
    lastPosRef.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const dx = clientX - lastPosRef.current.x;
    const dy = clientY - lastPosRef.current.y;
    lastPosRef.current = { x: clientX, y: clientY };
    setYaw(prev => prev + dx * 0.012);
    setPitch(prev => Math.max(-0.35, Math.min(0.55, prev + dy * 0.008)));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="relative w-full h-[270px] sm:h-[310px] select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={e => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={e => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={e => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={e => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handlePointerUp}
      />
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
          <Rotate3d className="w-3.5 h-3.5 text-accent" />
          Arraste para girar a FZ 25 em 360°
        </span>
        <button
          type="button"
          onClick={() => setAutoSpin(s => !s)}
          className={`pointer-events-auto text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all ${
            autoSpin
              ? 'bg-accent/20 text-accent border-accent/40'
              : 'bg-black/60 text-gray-400 border-white/10 hover:text-white'
          }`}
        >
          {autoSpin ? 'Giro 360° Ativo' : 'Girar Auto'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN MOTORCYCLE 3D & FUEL EXPENSE CONTROL VIEW
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

  // 3D Stage State
  const [viewMode3D, setViewMode3D] = useState<'studio' | '360'>('studio');
  const [selectedColorId, setSelectedColorId] = useState<string>(() =>
    loadData(STORAGE_KEYS.MOTO_COLOR, 'racing-blue')
  );
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [activeHotspot, setActiveHotspot] = useState<HotspotInfo | null>(FZ25_HOTSPOTS[0]);
  const [headlightOn, setHeadlightOn] = useState<boolean>(true);
  const [xrayTank, setXrayTank] = useState<boolean>(false);
  const [tilt, setTilt] = useState<{ rx: number; ry: number; glareX: number; glareY: number }>({
    rx: 0,
    ry: 0,
    glareX: 50,
    glareY: 35
  });

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

  const activeColor = useMemo(
    () => MOTO_COLORS.find(c => c.id === selectedColorId) || MOTO_COLORS[0],
    [selectedColorId]
  );

  const handleSelectColor = (id: string) => {
    setSelectedColorId(id);
    saveData(STORAGE_KEYS.MOTO_COLOR, id);
  };

  // Interactive 3D tilt on Studio Card
  const stageRef = useRef<HTMLDivElement | null>(null);
  const handleStageMove = useCallback((clientX: number, clientY: number) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;
    const ry = (relX - 0.5) * 18;
    const rx = (0.5 - relY) * 12;
    setTilt({
      rx,
      ry,
      glareX: Math.round(relX * 100),
      glareY: Math.round(relY * 100)
    });
  }, []);

  const handleStageReset = useCallback(() => {
    setTilt({ rx: 0, ry: 0, glareX: 50, glareY: 35 });
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

    // Last refueling tank estimate (Yamaha Fazer FZ25 tank = 14.2L, 37 km/L)
    const latestLog = fuelLogs[0];
    const latestLiters = latestLog
      ? latestLog.liters || (latestLog.pricePerLiter ? latestLog.amount / latestLog.pricePerLiter : latestLog.amount / 6.19)
      : 10.5;
    const tankRatio = Math.min(1, Math.max(0.18, latestLiters / 14.2));
    const estimatedRangeKm = Math.round(Math.min(14.2, Math.max(latestLiters, 6)) * 37);

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
  }, [monthLogs, yearLogs, breakdownScope, fuelLogs]);

  // Displayed Logs in History List
  const displayedLogs = useMemo(() => {
    const base = historyScope === 'month' ? monthLogs : yearLogs;
    if (historyFilterMethod === 'all') return base;
    return base.filter(l => l.paymentMethod === historyFilterMethod);
  }, [monthLogs, yearLogs, historyScope, historyFilterMethod]);

  // Open Form for New Refueling
  const handleOpenNewForm = () => {
    setEditingLog(null);
    setAmountInput('');
    setPaymentMethod('pix');
    setFuelType('gasoline');
    const today = getLocalTodayISO();
    const todayParts = today.split('-');
    // If user is viewing a specific month/year, default the date to that month/year if different
    if (
      parseInt(todayParts[0], 10) === selectedYear &&
      parseInt(todayParts[1], 10) - 1 === selectedMonthIdx
    ) {
      setDateInput(today);
    } else {
      const mStr = String(selectedMonthIdx + 1).padStart(2, '0');
      setDateInput(`${selectedYear}-${mStr}-15`);
    }
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
    setPricePerLiterInput((log.pricePerLiter || 6.19).toString());
    setOdometerInput(log.odometer ? log.odometer.toString() : '');
    setStationInput(log.station || '');
    setIsFormOpen(true);
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

    // Automatically jump view to the month/year of the logged entry
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

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* TOP HEADER */}
      <div className="flex items-center justify-between gap-3 mb-5 px-1">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#1c1c1e] flex items-center justify-center border border-white/10 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-accent/10 pointer-events-none" />
            <Fuel className="w-6 h-6 text-accent relative z-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                YAMAHA FAZER FZ 25
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                2026 3D
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mt-0.5">
              <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
              <span>ABS Connected • 250cc BlueFlex • Controle de Combustível</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNewForm}
          data-tour-id="moto-add-fuel-btn"
          className="h-12 px-4 sm:px-5 rounded-2xl bg-accent text-black font-extrabold text-xs sm:text-sm tracking-wide flex items-center gap-2 shadow-lg shadow-accent/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Abastecer</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 3D SHOWROOM STAGE: YAMAHA FAZER FZ 25 2026                           */}
      {/* ==================================================================== */}
      <div className="bg-[#141417] border border-white/10 rounded-[2rem] p-4 sm:p-5 mb-6 relative overflow-hidden shadow-2xl">
        {/* Background Ambient Showroom Glow */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-[90%] h-56 bg-gradient-to-b ${activeColor.glowClass} rounded-full blur-3xl pointer-events-none transition-all duration-500`}
        />

        {/* Top Bar inside 3D Showroom: Telemetry Badges + Mode Switcher */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-black/60 text-white border border-white/10 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Y-CONNECT 3D GARAGE
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white/5 text-gray-300 border border-white/5">
              <Gauge className="w-3 h-3 text-accent" />
              Tanque 14,2L • ~{stats.estimatedRangeKm} km
            </span>
          </div>

          {/* 3D Mode Switcher: Studio 3D vs 360° Interactive CAD */}
          <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setViewMode3D('studio')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode3D === 'studio'
                  ? 'bg-accent text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3D Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode3D('360')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode3D === '360'
                  ? 'bg-accent text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Rotate3d className="w-3.5 h-3.5" />
              <span>360° 3D</span>
            </button>
          </div>
        </div>

        {/* 3D Viewport Area */}
        {viewMode3D === 'studio' ? (
          <div
            ref={stageRef}
            onMouseMove={e => handleStageMove(e.clientX, e.clientY)}
            onMouseLeave={handleStageReset}
            onTouchMove={e => {
              if (e.touches[0]) handleStageMove(e.touches[0].clientX, e.touches[0].clientY);
            }}
            onTouchEnd={handleStageReset}
            className="relative w-full rounded-2xl overflow-hidden bg-[#0a0a0b] border border-white/5 select-none"
            style={{ perspective: '1200px' }}
          >
            <div
              className="relative w-full transition-transform duration-150 ease-out"
              style={{
                transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(1.02)`,
                transformStyle: 'preserve-3d'
              }}
            >
              {/* 3D Studio Render Image of 2026 Yamaha Fazer FZ25 */}
              <img
                src="/fz25-2026-3d.jpg"
                alt="Yamaha Fazer FZ 25 2026 3D"
                className="w-full h-[230px] sm:h-[310px] object-cover object-center transition-all duration-500"
                style={{ filter: activeColor.hueRotate }}
                draggable={false}
              />

              {/* Dynamic Specular 3D Light Reflection */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-200"
                style={{
                  background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.16), transparent 55%)`
                }}
              />

              {/* Interactive LED Projector Headlight High-Beam Overlay */}
              {headlightOn && (
                <div
                  className="absolute pointer-events-none transition-opacity duration-300"
                  style={{
                    left: '66%',
                    top: '26%',
                    width: '26%',
                    height: '26%',
                    background:
                      'radial-gradient(circle, rgba(186,230,253,0.75) 0%, rgba(56,189,248,0.28) 40%, transparent 72%)',
                    filter: 'blur(8px)'
                  }}
                />
              )}

              {/* X-Ray 14.2L Fuel Tank Overlay */}
              {xrayTank && (
                <div
                  className="absolute pointer-events-none rounded-full border-2 border-emerald-400/80 bg-emerald-500/25 backdrop-blur-[2px] flex items-center justify-center animate-pulse"
                  style={{
                    left: '44%',
                    top: '23%',
                    width: '17%',
                    height: '18%'
                  }}
                >
                  <span className="text-[10px] font-black text-emerald-300 drop-shadow">
                    {(stats.tankRatio * 14.2).toFixed(1)}L / 14,2L
                  </span>
                </div>
              )}

              {/* Interactive 3D Hotspots */}
              {showHotspots &&
                FZ25_HOTSPOTS.map(spot => {
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
                      className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer z-20 ${
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

            {/* Active Hotspot Telemetry Overlay Card */}
            {activeHotspot && showHotspots && (
              <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm bg-black/80 backdrop-blur-xl border border-white/15 rounded-2xl p-3 z-30 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-white">{activeHotspot.title}</span>
                    <span className="text-[10px] font-bold text-accent bg-accent/15 px-2 py-0.5 rounded-full border border-accent/25">
                      {activeHotspot.spec}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 mt-1 leading-snug">{activeHotspot.detail}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveHotspot(null)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full rounded-2xl overflow-hidden bg-[#0a0a0b] border border-white/5">
            <Interactive3DFZ25Canvas
              accentHex={activeColor.accentHex}
              headlightOn={headlightOn}
              xrayTank={xrayTank}
              tankFillRatio={stats.tankRatio}
            />
          </div>
        )}

        {/* Showroom Controls Footer: Colors + Interactive Toggles */}
        <div className="relative z-20 mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
          {/* Color Presets */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-1">
              Cor 2026:
            </span>
            {MOTO_COLORS.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectColor(c.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  selectedColorId === c.id
                    ? 'bg-white/15 text-white border-white/30 shadow-sm'
                    : 'bg-[#1c1c1e] text-gray-400 border-white/5 hover:text-white'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: c.accentHex }}
                />
                <span className="hidden sm:inline">{c.name}</span>
              </button>
            ))}
          </div>

          {/* Interactive 3D Action Toggles */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setHeadlightOn(h => !h)}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase flex items-center gap-1 border transition-all cursor-pointer ${
                headlightOn
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                  : 'bg-[#1c1c1e] text-gray-400 border-white/5'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Farol LED</span>
            </button>

            <button
              type="button"
              onClick={() => setXrayTank(x => !x)}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase flex items-center gap-1 border transition-all cursor-pointer ${
                xrayTank
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-[#1c1c1e] text-gray-400 border-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tanque 14,2L</span>
            </button>

            {viewMode3D === 'studio' && (
              <button
                type="button"
                onClick={() => setShowHotspots(s => !s)}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase flex items-center gap-1 border transition-all cursor-pointer ${
                  showHotspots
                    ? 'bg-accent/20 text-accent border-accent/30'
                    : 'bg-[#1c1c1e] text-gray-400 border-white/5'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Specs</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PERIOD SELECTOR (MÊS E ANO)                                          */}
      {/* ==================================================================== */}
      <div className="bg-[#1c1c1e] border border-white/5 rounded-2xl p-3 mb-4 flex items-center justify-between gap-2 shadow-lg">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="w-10 h-10 rounded-xl bg-[#2c2c2e] hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer active:scale-95"
          title="Mês Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-accent" />
          <div className="text-center">
            <span className="text-sm sm:text-base font-extrabold text-white tracking-wider uppercase">
              {MONTH_NAMES_PT[selectedMonthIdx]}
            </span>
            <span className="text-sm sm:text-base font-extrabold text-accent ml-2">
              {selectedYear}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
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
            className="w-10 h-10 rounded-xl bg-[#2c2c2e] hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer active:scale-95"
            title="Próximo Mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MONTHLY & ANNUAL SPENDING KPI CARDS                                  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
        {/* GASTO NO MÊS */}
        <div className="bg-gradient-to-br from-[#1c1c1e] to-[#141416] border border-white/10 rounded-[1.75rem] p-5 relative overflow-hidden shadow-xl">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-accent" />
              Gasto no Mês ({MONTH_SHORT_PT[selectedMonthIdx]}/{selectedYear})
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/25">
              {monthLogs.length} {monthLogs.length === 1 ? 'abastecimento' : 'abastecimentos'}
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight my-1">
            {formatMoney(stats.monthTotal)}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-white/5">
            <span className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-sky-400" />
              ~{stats.monthLiters.toFixed(1)} Litros no mês
            </span>
            <span className="font-semibold text-gray-300">
              Média:{' '}
              {formatMoney(monthLogs.length > 0 ? stats.monthTotal / monthLogs.length : 0)}
              /abast.
            </span>
          </div>
        </div>

        {/* GASTO NO ANO */}
        <div className="bg-gradient-to-br from-[#1c1c1e] to-[#141416] border border-white/10 rounded-[1.75rem] p-5 relative overflow-hidden shadow-xl">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              Gasto no Ano ({selectedYear})
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
              {yearLogs.length} no ano
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight my-1">
            {formatMoney(stats.yearTotal)}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-white/5">
            <span className="flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              ~{Math.round(stats.yearLiters * 37).toLocaleString(locale)} km rodados est.
            </span>
            <span className="font-semibold text-gray-300">
              Média: {formatMoney(stats.monthlyAverageInYear)}/mês
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PAYMENT METHOD BREAKDOWN: CRÉDITO, DÉBITO, PIX, DINHEIRO             */}
      {/* ==================================================================== */}
      <div className="bg-[#1c1c1e] border border-white/5 rounded-[1.75rem] p-5 mb-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Gastos por Forma de Pagamento
            </h2>
            <p className="text-xs text-gray-400">
              Crédito, Débito, Pix e Dinheiro • Toque para filtrar o histórico
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#0a0a0b] p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => {
                setBreakdownScope('month');
                setHistoryScope('month');
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
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
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                breakdownScope === 'year'
                  ? 'bg-accent text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              No Ano ({selectedYear})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-xl ${meta.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase ${meta.color}`}>
                    {data.percent}%
                  </span>
                </div>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {meta.shortLabel}
                </div>
                <div className="text-base sm:text-lg font-extrabold text-white mt-0.5 truncate">
                  {formatMoney(data.amount)}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
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
      <div className="bg-[#1c1c1e] border border-white/5 rounded-[1.75rem] p-5 mb-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Evolução Mensal em {selectedYear}
            </h2>
            <p className="text-xs text-gray-400">
              Toque em qualquer mês para inspecionar os abastecimentos
            </p>
          </div>
          <span className="text-xs font-extrabold text-accent">
            Total {selectedYear}: {formatMoney(stats.yearTotal)}
          </span>
        </div>

        <div className="grid grid-cols-12 gap-1.5 sm:gap-2 items-end h-32 pt-4 px-1">
          {stats.monthlyChart.map(item => {
            const heightPct =
              item.amount > 0 ? Math.max(14, Math.round((item.amount / stats.maxMonthAmount) * 100)) : 6;
            const isCurrent = item.monthIdx === selectedMonthIdx;
            return (
              <button
                key={item.monthIdx}
                type="button"
                onClick={() => setSelectedMonthIdx(item.monthIdx)}
                className="flex flex-col items-center justify-end h-full group cursor-pointer"
                title={`${MONTH_NAMES_PT[item.monthIdx]}: ${formatMoney(item.amount)}`}
              >
                <div className="w-full flex-1 flex items-end justify-center">
                  <div
                    className={`w-full max-w-[22px] rounded-t-lg transition-all duration-300 ${
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
                  className={`text-[9px] sm:text-[10px] font-bold mt-2 uppercase ${
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
      {/* REFUELING HISTORY LIST                                               */}
      {/* ==================================================================== */}
      <div className="bg-[#1c1c1e] border border-white/5 rounded-[1.75rem] p-5 mb-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Histórico de Abastecimentos
            </h2>
            <p className="text-xs text-gray-400">
              {historyScope === 'month'
                ? `${MONTH_NAMES_PT[selectedMonthIdx]} de ${selectedYear}`
                : `Todos os meses de ${selectedYear}`}
              {historyFilterMethod !== 'all' &&
                ` • Filtrado por ${PAYMENT_META[historyFilterMethod].shortLabel}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {historyFilterMethod !== 'all' && (
              <button
                type="button"
                onClick={() => setHistoryFilterMethod('all')}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                Limpar Filtro
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenNewForm}
              className="px-3 py-1.5 rounded-xl bg-accent/15 text-accent border border-accent/25 text-xs font-bold flex items-center gap-1 hover:bg-accent/25 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Registro</span>
            </button>
          </div>
        </div>

        {displayedLogs.length === 0 ? (
          <div className="bg-[#141416] border border-dashed border-white/10 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
              <Fuel className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-sm font-bold text-gray-300">
              Nenhum abastecimento registrado neste período
            </p>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Registre quanto você abasteceu na sua Yamaha Fazer FZ 25 2026 e escolha se foi Crédito,
              Débito, Pix ou Dinheiro.
            </p>
            <button
              type="button"
              onClick={handleOpenNewForm}
              className="px-5 py-2.5 rounded-xl bg-accent text-black font-extrabold text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Registrar Abastecimento</span>
            </button>
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
                  className="bg-[#141416] border border-white/5 hover:border-white/15 rounded-2xl p-4 flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl ${pMeta.bgColor} border ${pMeta.borderColor} flex items-center justify-center shrink-0`}
                    >
                      <PIcon className={`w-5 h-5 ${pMeta.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-black text-white">
                          {formatMoney(log.amount)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${pMeta.bgColor} ${pMeta.color} ${pMeta.borderColor}`}
                        >
                          {pMeta.shortLabel}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${fMeta.badgeClass}`}
                        >
                          {fMeta.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1">
                        <span>{log.date.split('-').reverse().join('/')}</span>
                        <span>• {liters.toFixed(2)} L</span>
                        {log.pricePerLiter && (
                          <span>• {formatMoney(log.pricePerLiter)}/L</span>
                        )}
                        {log.odometer && <span>• {log.odometer.toLocaleString(locale)} km</span>}
                        {log.station && <span className="truncate">• {log.station}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
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
      {/* MODAL FORM: ADD / EDIT REFUELING                                     */}
      {/* ==================================================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1c1e] border border-white/10 w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center">
                  <Fuel className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">
                    {editingLog ? 'Editar Abastecimento' : 'Novo Abastecimento'}
                  </h3>
                  <p className="text-xs text-gray-400">Yamaha Fazer FZ 25 2026 • Tanque 14,2L</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
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
                  {[30, 50, 70, 88].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmountInput(preset.toString())}
                      className="px-3 py-1 rounded-xl bg-[#2c2c2e] hover:bg-white/15 text-xs font-bold text-gray-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {preset === 88 ? `Tanque Cheio (~${currencySymbol} 88)` : `${currencySymbol} ${preset}`}
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
                        <Icon className={`w-5 h-5 ${active ? meta.color : 'text-gray-500'}`} />
                        <span className="text-xs font-extrabold uppercase tracking-wide">
                          {meta.shortLabel}
                        </span>
                        {active && <Check className="w-4 h-4 ml-auto text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DATA E TIPO DE COMBUSTÍVEL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                    Data do Abastecimento
                  </label>
                  <input
                    type="date"
                    required
                    value={dateInput}
                    onChange={e => setDateInput(e.target.value)}
                    className="w-full bg-[#0a0a0b] border border-white/10 focus:border-accent rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                    Combustível (BlueFlex)
                  </label>
                  <select
                    value={fuelType}
                    onChange={e => setFuelType(e.target.value as FuelType)}
                    className="w-full bg-[#0a0a0b] border border-white/10 focus:border-accent rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none"
                  >
                    <option value="gasoline">Gasolina Comum</option>
                    <option value="additive">Gasolina Aditivada</option>
                    <option value="ethanol">Etanol</option>
                  </select>
                </div>
              </div>

              {/* PREÇO POR LITRO & ODÔMETRO OPCIONAL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                    Preço / Litro ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={pricePerLiterInput}
                    onChange={e => setPricePerLiterInput(e.target.value)}
                    className="w-full bg-[#0a0a0b] border border-white/10 focus:border-accent rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                    Odômetro (km - opcional)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 4250"
                    value={odometerInput}
                    onChange={e => setOdometerInput(e.target.value)}
                    className="w-full bg-[#0a0a0b] border border-white/10 focus:border-accent rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none"
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
                  <span className="text-gray-400">Volume estimado no tanque 14,2L:</span>
                  <span className="font-extrabold text-accent">
                    ~{previewLiters.toFixed(2)} L (+{Math.round(previewLiters * 37)} km autonomia)
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
