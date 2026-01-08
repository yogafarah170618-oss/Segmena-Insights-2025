import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface CustomerGrowthChartProps {
  data: Array<{
    date: string;
    newCustomers: number;
    totalCustomers: number;
  }>;
}

export const CustomerGrowthChart = ({ data }: CustomerGrowthChartProps) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="border-3 border-border bg-card p-4 shadow-brutal font-mono">
          <p className="font-brutal text-sm mb-2">{payload[0].payload.date}</p>
          <p className="text-sm">
            Customer Baru: {payload[0].value}
          </p>
          <p className="text-sm">
            Total Customer: {payload[1].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="hover:translate-x-0 hover:translate-y-0 hover:shadow-brutal">
      <CardHeader>
        <CardTitle>CUSTOMER GROWTH</CardTitle>
        <CardDescription>Pertumbuhan customer per bulan</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="0" stroke="hsl(var(--border))" strokeWidth={2} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--foreground))"
              fontSize={11}
              fontFamily="Space Mono"
            />
            <YAxis 
              stroke="hsl(var(--foreground))"
              fontSize={11}
              fontFamily="Space Mono"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontFamily: 'Space Mono', fontSize: '12px' }}
            />
            <Bar
              dataKey="newCustomers"
              fill="hsl(var(--foreground))"
              name="Customer Baru"
              radius={0}
              stroke="hsl(var(--background))"
              strokeWidth={2}
            />
            <Bar
              dataKey="totalCustomers"
              fill="hsl(var(--secondary))"
              name="Total Customer"
              radius={0}
              stroke="hsl(var(--background))"
              strokeWidth={2}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
