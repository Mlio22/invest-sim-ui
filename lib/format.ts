export type Decimal = string;

export function toNum(v: Decimal | number): number {
  if (typeof v === 'number') return v;
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

export function formatIDR(value: Decimal | number, compact = false): string {
  const n = toNum(value);
  if (compact) {
    const abs = Math.abs(n);
    if (abs >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}K`;
    return `Rp ${n.toFixed(0)}`;
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPrice(value: Decimal | number): string {
  return toNum(value).toLocaleString('id-ID');
}

export function formatPct(value: Decimal | number): string {
  const n = toNum(value);
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

export function pnlColor(value: Decimal | number): string {
  const n = toNum(value);
  if (n > 0) return 'text-green-400';
  if (n < 0) return 'text-red-400';
  return 'text-[#94a3b8]';
}

export function formatVol(volume: number): string {
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(1)}B`;
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(0)}K`;
  return `${volume}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
