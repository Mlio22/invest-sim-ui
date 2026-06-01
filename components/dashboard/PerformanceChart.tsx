'use client';

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface Point {
  date: string;
  value: number;
}

interface Props {
  data: Point[];
  loading?: boolean;
}

function formatYAxis(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const val: number = payload[0].value;
  return (
    <div className="bg-[#1e2d4a] border border-[#2a3d5a] rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-[#94a3b8] mb-1">{label}</p>
      <p className="text-white font-semibold">
        Rp {val.toLocaleString('id-ID')}
      </p>
    </div>
  );
}

export default function PerformanceChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center text-[#4a5c70] text-sm">
        Loading chart...
      </div>
    );
  }
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-[#4a5c70] text-sm">
        No performance data yet. Start investing to see your chart.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#4a5c70', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(d: string) => {
            const dt = new Date(d);
            return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
          }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#4a5c70', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatYAxis}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#f97316"
          strokeWidth={2}
          fill="url(#perfGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
