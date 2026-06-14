import type { Decimal } from './format';

// ─── Performance chart ───────────────────────────────────────────────────────
export interface PerformancePoint {
  date: string;
  value: number;
}

function genPerfData(
  days: number,
  startVal: number,
  endVal: number,
): PerformancePoint[] {
  const points: PerformancePoint[] = [];
  const end = new Date('2026-06-01');
  let tradingDay = 0;

  for (let i = days; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    tradingDay++;
    // Deterministic noise using sin/cos
    const noise =
      (Math.sin(tradingDay * 1.7) * 0.012 +
        Math.cos(tradingDay * 2.3) * 0.008) *
      startVal;
    const estTradingDays = Math.floor(days * (5 / 7));
    const progress = tradingDay / estTradingDays;
    const val = startVal + (endVal - startVal) * progress + noise;
    points.push({ date: d.toISOString().split('T')[0], value: Math.round(val) });
  }
  return points;
}

export const MOCK_PERFORMANCE: Record<string, PerformancePoint[]> = {
  '1W': genPerfData(7, 149_000_000, 152_500_000),
  '1M': genPerfData(30, 141_000_000, 152_500_000),
  '3M': genPerfData(90, 126_000_000, 152_500_000),
  '1Y': genPerfData(365, 100_000_000, 152_500_000),
  ALL: genPerfData(365, 100_000_000, 152_500_000),
};

// ─── Types (mirroring backend DTOs) ─────────────────────────────────────────
export interface PortfolioSummary {
  total_value: Decimal;
  cash_balance: Decimal;
  invested_value: Decimal;
  total_pnl: Decimal;
  total_pnl_pct: Decimal;
  today_pnl: Decimal;
  today_pnl_pct: Decimal;
}

export interface Holding {
  symbol: string;
  name: string;
  sector: string;
  quantity: number;
  avg_buy_price: Decimal;
  current_price: Decimal;
  market_value: Decimal;
  unrealized_pnl: Decimal;
  unrealized_pnl_pct: Decimal;
  day_change: Decimal;
  day_change_pct: Decimal;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  price: Decimal;
  change: Decimal;
  change_pct: Decimal;
  note: string;
}

export interface MoverItem {
  symbol: string;
  name: string;
  sector: string;
  price: Decimal;
  change: Decimal;
  change_pct: Decimal;
}

export interface MarketMovers {
  gainers: MoverItem[];
  losers: MoverItem[];
}

export interface Transaction {
  id: string;
  symbol: string;
  transaction_type: 'BUY' | 'SELL';
  quantity: number;
  price: Decimal;
  total_amount: Decimal;
  status: string;
  created_at: string;
}

export interface DashboardData {
  portfolio: PortfolioSummary;
  holdings: Holding[];
  watchlist: WatchlistItem[];
  movers: MarketMovers;
  recent_transactions: Transaction[];
}

export interface StockQuote {
  symbol: string;
  name: string;
  sector: string;
  price: Decimal;
  change: Decimal;
  change_percent: Decimal;
  volume: number;
  currency: string;
  timestamp: string;
}

// ─── Dashboard mock ──────────────────────────────────────────────────────────
export const MOCK_DASHBOARD: DashboardData = {
  portfolio: {
    total_value: '152500000',
    cash_balance: '34425000',
    invested_value: '118075000',
    total_pnl: '10825000',
    total_pnl_pct: '10.08',
    today_pnl: '1250000',
    today_pnl_pct: '0.83',
  },
  holdings: [
    {
      symbol: 'BREN',
      name: 'Barito Renewables Energy',
      sector: 'Energy',
      quantity: 8000,
      avg_buy_price: '4200',
      current_price: '4800',
      market_value: '38400000',
      unrealized_pnl: '4800000',
      unrealized_pnl_pct: '14.29',
      day_change: '100',
      day_change_pct: '2.13',
    },
    {
      symbol: 'BBCA',
      name: 'Bank Central Asia',
      sector: 'Banking',
      quantity: 2000,
      avg_buy_price: '8500',
      current_price: '9850',
      market_value: '19700000',
      unrealized_pnl: '2700000',
      unrealized_pnl_pct: '15.88',
      day_change: '150',
      day_change_pct: '1.55',
    },
    {
      symbol: 'BMRI',
      name: 'Bank Mandiri',
      sector: 'Banking',
      quantity: 2500,
      avg_buy_price: '7100',
      current_price: '7450',
      market_value: '18625000',
      unrealized_pnl: '875000',
      unrealized_pnl_pct: '4.93',
      day_change: '50',
      day_change_pct: '0.68',
    },
    {
      symbol: 'TLKM',
      name: 'Telkom Indonesia',
      sector: 'Telecom',
      quantity: 5000,
      avg_buy_price: '3400',
      current_price: '3050',
      market_value: '15250000',
      unrealized_pnl: '-1750000',
      unrealized_pnl_pct: '-10.29',
      day_change: '-25',
      day_change_pct: '-0.81',
    },
    {
      symbol: 'BBRI',
      name: 'Bank Rakyat Indonesia',
      sector: 'Banking',
      quantity: 3000,
      avg_buy_price: '4200',
      current_price: '4750',
      market_value: '14250000',
      unrealized_pnl: '1650000',
      unrealized_pnl_pct: '13.10',
      day_change: '75',
      day_change_pct: '1.61',
    },
  ],
  watchlist: [
    {
      id: '1',
      symbol: 'GOTO',
      name: 'GoTo Gojek Tokopedia',
      sector: 'Technology',
      price: '78',
      change: '4',
      change_pct: '5.41',
      note: '',
    },
    {
      id: '2',
      symbol: 'ADRO',
      name: 'Adaro Minerals Indonesia',
      sector: 'Mining',
      price: '3450',
      change: '150',
      change_pct: '4.55',
      note: '',
    },
    {
      id: '3',
      symbol: 'ICBP',
      name: 'Indofood CBP Sukses Makmur',
      sector: 'Consumer Goods',
      price: '10500',
      change: '150',
      change_pct: '1.45',
      note: '',
    },
    {
      id: '4',
      symbol: 'ANTM',
      name: 'Aneka Tambang',
      sector: 'Mining',
      price: '1850',
      change: '75',
      change_pct: '4.23',
      note: '',
    },
  ],
  movers: {
    gainers: [
      {
        symbol: 'GOTO',
        name: 'GoTo Gojek Tokopedia',
        sector: 'Technology',
        price: '78',
        change: '4',
        change_pct: '5.41',
      },
      {
        symbol: 'ADRO',
        name: 'Adaro Minerals Indonesia',
        sector: 'Mining',
        price: '3450',
        change: '150',
        change_pct: '4.55',
      },
      {
        symbol: 'ANTM',
        name: 'Aneka Tambang',
        sector: 'Mining',
        price: '1850',
        change: '75',
        change_pct: '4.23',
      },
    ],
    losers: [
      {
        symbol: 'UNVR',
        name: 'Unilever Indonesia',
        sector: 'Consumer Goods',
        price: '1750',
        change: '-75',
        change_pct: '-4.11',
      },
      {
        symbol: 'SMGR',
        name: 'Semen Indonesia',
        sector: 'Industrial',
        price: '4150',
        change: '-125',
        change_pct: '-2.92',
      },
      {
        symbol: 'EXCL',
        name: 'XL Axiata',
        sector: 'Telecom',
        price: '1975',
        change: '-50',
        change_pct: '-2.47',
      },
    ],
  },
  recent_transactions: [
    {
      id: '1',
      symbol: 'BREN',
      transaction_type: 'BUY',
      quantity: 2000,
      price: '4750',
      total_amount: '9500000',
      status: 'COMPLETED',
      created_at: '2026-05-28T09:15:00Z',
    },
    {
      id: '2',
      symbol: 'BBCA',
      transaction_type: 'BUY',
      quantity: 500,
      price: '9800',
      total_amount: '4900000',
      status: 'COMPLETED',
      created_at: '2026-05-25T10:30:00Z',
    },
    {
      id: '3',
      symbol: 'TLKM',
      transaction_type: 'SELL',
      quantity: 1000,
      price: '3100',
      total_amount: '3100000',
      status: 'COMPLETED',
      created_at: '2026-05-20T14:22:00Z',
    },
    {
      id: '4',
      symbol: 'GOTO',
      transaction_type: 'BUY',
      quantity: 50000,
      price: '65',
      total_amount: '3250000',
      status: 'COMPLETED',
      created_at: '2026-05-15T11:05:00Z',
    },
    {
      id: '5',
      symbol: 'BBRI',
      transaction_type: 'BUY',
      quantity: 1000,
      price: '4300',
      total_amount: '4300000',
      status: 'COMPLETED',
      created_at: '2026-05-10T09:45:00Z',
    },
  ],
};

// ─── Markets mock ────────────────────────────────────────────────────────────
export const MOCK_STOCKS: StockQuote[] = [
  { symbol: 'ADRO', name: 'Adaro Minerals Indonesia', sector: 'Mining', price: '3450', change: '150', change_percent: '4.55', volume: 38_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
  { symbol: 'ANTM', name: 'Aneka Tambang', sector: 'Mining', price: '1850', change: '75', change_percent: '4.23', volume: 75_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
  { symbol: 'ASII', name: 'Astra International', sector: 'Automotive', price: '5650', change: '-46', change_percent: '-0.81', volume: 78_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
  { symbol: 'BBCA', name: 'Bank Central Asia', sector: 'Banking', price: '9850', change: '150', change_percent: '1.55', volume: 85_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
  { symbol: 'BBNI', name: 'Bank Negara Indonesia', sector: 'Banking', price: '5400', change: '40', change_percent: '0.75', volume: 68_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
  { symbol: 'BBRI', name: 'Bank Rakyat Indonesia', sector: 'Banking', price: '4750', change: '56', change_percent: '1.19', volume: 125_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
  { symbol: 'BMRI', name: 'Bank Mandiri', sector: 'Banking', price: '7450', change: '50', change_percent: '0.68', volume: 95_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
  { symbol: 'BREN', name: 'Barito Renewables Energy', sector: 'Energy', price: '4800', change: '100', change_percent: '2.13', volume: 52_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
  { symbol: 'EXCL', name: 'XL Axiata', sector: 'Telecom', price: '1975', change: '-50', change_percent: '-2.47', volume: 55_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
  { symbol: 'GOTO', name: 'GoTo Gojek Tokopedia', sector: 'Technology', price: '78', change: '4', change_percent: '5.41', volume: 250_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
  { symbol: 'ICBP', name: 'Indofood CBP Sukses Makmur', sector: 'Consumer Goods', price: '10500', change: '150', change_percent: '1.45', volume: 28_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
  { symbol: 'INDF', name: 'Indofood Sukses Makmur', sector: 'Consumer Goods', price: '7800', change: '70', change_percent: '0.91', volume: 35_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
  { symbol: 'JSMR', name: 'Jasa Marga', sector: 'Infrastructure', price: '4250', change: '30', change_percent: '0.71', volume: 18_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
  { symbol: 'KLBF', name: 'Kalbe Farma', sector: 'Healthcare', price: '1925', change: '-25', change_percent: '-1.28', volume: 41_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
  { symbol: 'PGAS', name: 'Perusahaan Gas Negara', sector: 'Energy', price: '1625', change: '10', change_percent: '0.62', volume: 62_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
  { symbol: 'PTBA', name: 'Bukit Asam', sector: 'Mining', price: '2750', change: '86', change_percent: '3.23', volume: 48_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
  { symbol: 'SMGR', name: 'Semen Indonesia', sector: 'Industrial', price: '4150', change: '-125', change_percent: '-2.92', volume: 22_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
  { symbol: 'TLKM', name: 'Telkom Indonesia', sector: 'Telecom', price: '3050', change: '-25', change_percent: '-0.81', volume: 142_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
  { symbol: 'TOWR', name: 'Sarana Menara Nusantara', sector: 'Infrastructure', price: '875', change: '5', change_percent: '0.57', volume: 25_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
  { symbol: 'UNVR', name: 'Unilever Indonesia', sector: 'Consumer Goods', price: '1750', change: '-75', change_percent: '-4.11', volume: 45_000_000, currency: 'IDR', timestamp: '2026-06-01T09:00:00Z' },
];

export const MOCK_MOVERS: MarketMovers = {
  gainers: [
    { symbol: 'GOTO', name: 'GoTo Gojek Tokopedia', sector: 'Technology', price: '78', change: '4', change_pct: '5.41' },
    { symbol: 'ADRO', name: 'Adaro Minerals Indonesia', sector: 'Mining', price: '3450', change: '150', change_pct: '4.55' },
    { symbol: 'ANTM', name: 'Aneka Tambang', sector: 'Mining', price: '1850', change: '75', change_pct: '4.23' },
    { symbol: 'BREN', name: 'Barito Renewables Energy', sector: 'Energy', price: '4800', change: '100', change_pct: '2.13' },
    { symbol: 'PTBA', name: 'Bukit Asam', sector: 'Mining', price: '2750', change: '86', change_pct: '3.23' },
  ],
  losers: [
    { symbol: 'UNVR', name: 'Unilever Indonesia', sector: 'Consumer Goods', price: '1750', change: '-75', change_pct: '-4.11' },
    { symbol: 'SMGR', name: 'Semen Indonesia', sector: 'Industrial', price: '4150', change: '-125', change_pct: '-2.92' },
    { symbol: 'EXCL', name: 'XL Axiata', sector: 'Telecom', price: '1975', change: '-50', change_pct: '-2.47' },
    { symbol: 'KLBF', name: 'Kalbe Farma', sector: 'Healthcare', price: '1925', change: '-25', change_pct: '-1.28' },
    { symbol: 'TLKM', name: 'Telkom Indonesia', sector: 'Telecom', price: '3050', change: '-25', change_pct: '-0.81' },
  ],
};

// ─── Market Indexes ──────────────────────────────────────────────────────────
export interface IndexQuote {
  symbol: string;
  name: string;
  value: number;
  change: number;
  change_pct: number;
}

export const MOCK_INDEXES: IndexQuote[] = [
  { symbol: 'IHSG', name: 'IDX Composite', value: 7128.43, change: 45.32, change_pct: 0.64 },
  { symbol: 'LQ45', name: 'LQ45 Index', value: 923.17, change: 7.84, change_pct: 0.86 },
  { symbol: 'IDX30', name: 'IDX30', value: 481.52, change: -2.31, change_pct: -0.48 },
  { symbol: 'KOMPAS100', name: 'Kompas100', value: 1380.91, change: 12.07, change_pct: 0.88 },
];

// ─── Stock Detail types ───────────────────────────────────────────────────────
export interface StockDetail {
  symbol: string;
  name: string;
  sector: string;
  price: Decimal;
  change: Decimal;
  change_percent: Decimal;
  open: Decimal;
  high: Decimal;
  low: Decimal;
  prev_close: Decimal;
  volume: number;
  market_cap: Decimal;
  trailing_pe: Decimal;
  div_yield: Decimal;
  week_52_high: Decimal;
  week_52_low: Decimal;
  currency: string;
  timestamp: string;
}

export interface StockPosition {
  symbol: string;
  lots: number;
  quantity: number;
  avg_buy_price: Decimal;
  current_price: Decimal;
  market_value: Decimal;
  unrealized_pnl: Decimal;
  unrealized_pnl_pct: Decimal;
  allocation_pct: Decimal;
  cash_balance: Decimal;
}
