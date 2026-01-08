import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="border-3 border-border bg-card p-4 shadow-brutal font-mono">
          <p className="font-brutal text-sm mb-2">{payload[0].payload.date}</p>
          <p className="text-sm">
            Revenue: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm">
            Transaksi: {payload[1].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="hover:translate-x-0 hover:translate-y-0 hover:shadow-brutal">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-xl">REVENUE TREND</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Revenue dan transaksi per bulan</CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="0" stroke="hsl(var(--border))" strokeWidth={1} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--foreground))"
              fontSize={9}
              fontFamily="Space Mono"
              tick={{ fontSize: 9 }}
            />
            <YAxis 
              yAxisId="left"
              stroke="hsl(var(--foreground))"
              fontSize={9}
              fontFamily="Space Mono"
              tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
              width={40}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--secondary))"
              fontSize={9}
              fontFamily="Space Mono"
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontFamily: 'Space Mono', fontSize: '10px' }}
            />
            <Line
              yAxisId="left"
              type="linear"
              dataKey="revenue"
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              name="Revenue"
              dot={{ fill: 'hsl(var(--foreground))', r: 4, strokeWidth: 1 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
            <Line
              yAxisId="right"
              type="linear"
              dataKey="transactions"
              stroke="hsl(var(--secondary))"
              strokeWidth={2}
              name="Transaksi"
              dot={{ fill: 'hsl(var(--secondary))', r: 4, strokeWidth: 1 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
