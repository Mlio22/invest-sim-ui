import StockDetail from '@/components/stocks/StockDetail';

interface Props {
  params: Promise<{ symbol: string }>;
}

export default async function StockDetailPage({ params }: Props) {
  const { symbol } = await params;
  return <StockDetail symbol={symbol.toUpperCase()} />;
}
