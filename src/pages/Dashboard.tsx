import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingCart, TrendingUp, Target } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { SegmentPieChart } from "@/components/charts/SegmentPieChart";
import { CustomerGrowthChart } from "@/components/charts/CustomerGrowthChart";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface SegmentData {
  segment_name: string;
  customer_count: number;
  percentage: number;
  avg_spend: number;
  total_revenue: number;
}

interface DashboardMetrics {
  totalCustomers: number;
  totalTransactions: number;
  avgSpend: number;
  totalRevenue: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCustomers: 0,
    totalTransactions: 0,
    avgSpend: 0,
    totalRevenue: 0,
  });
  const [segments, setSegments] = useState<SegmentData[]>([]);
  const [revenueData, setRevenueData] = useState<Array<{ date: string; revenue: number; transactions: number }>>([]);
  const [customerGrowthData, setCustomerGrowthData] = useState<Array<{ date: string; newCustomers: number; totalCustomers: number }>>([]);
  const [segmentPieData, setSegmentPieData] = useState<Array<{ name: string; value: number; color: string }>>([]);

  useEffect(() => {
    loadDashboardData();
  }, [location.key]);

  const loadDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setMetrics({
          totalCustomers: 1247,
          totalTransactions: 3842,
          avgSpend: 679000,
          totalRevenue: 847500000,
        });

        setSegments([
          { segment_name: 'Champions', customer_count: 187, percentage: 15, avg_spend: 520000, total_revenue: 97240000 },
          { segment_name: 'Loyal Customers', customer_count: 312, percentage: 25, avg_spend: 310000, total_revenue: 96720000 },
          { segment_name: 'At Risk', customer_count: 249, percentage: 20, avg_spend: 180000, total_revenue: 44820000 },
          { segment_name: 'Recent Customers', customer_count: 374, percentage: 30, avg_spend: 150000, total_revenue: 56100000 },
          { segment_name: 'Lost', customer_count: 125, percentage: 10, avg_spend: 110000, total_revenue: 13750000 },
        ]);

        setRevenueData([
          { date: 'Jan', revenue: 58500000, transactions: 520 },
          { date: 'Feb', revenue: 62000000, transactions: 560 },
          { date: 'Mar', revenue: 68500000, transactions: 610 },
          { date: 'Apr', revenue: 71000000, transactions: 640 },
          { date: 'Mei', revenue: 69500000, transactions: 620 },
          { date: 'Jun', revenue: 72000000, transactions: 670 },
          { date: 'Jul', revenue: 74500000, transactions: 695 },
          { date: 'Agu', revenue: 78000000, transactions: 720 },
          { date: 'Sep', revenue: 75500000, transactions: 700 },
          { date: 'Okt', revenue: 79000000, transactions: 740 },
          { date: 'Nov', revenue: 68500000, transactions: 630 },
          { date: 'Des', revenue: 70500000, transactions: 660 },
        ]);

        setCustomerGrowthData([
          { date: 'Jun 2024', newCustomers: 145, totalCustomers: 825 },
          { date: 'Jul 2024', newCustomers: 167, totalCustomers: 992 },
          { date: 'Aug 2024', newCustomers: 183, totalCustomers: 1175 },
          { date: 'Sep 2024', newCustomers: 156, totalCustomers: 1331 },
          { date: 'Oct 2024', newCustomers: 178, totalCustomers: 1509 },
          { date: 'Nov 2024', newCustomers: 194, totalCustomers: 1703 },
        ]);

        setSegmentPieData([
          { name: 'Champions', value: 187, color: '#4F6BED' },
          { name: 'Loyal Customers', value: 312, color: '#22C7A9' },
          { name: 'At Risk', value: 249, color: '#F59E0B' },
          { name: 'Recent Customers', value: 374, color: '#A78BFA' },
          { name: 'Lost', value: 125, color: '#9CA3AF' },
        ]);

        setLoading(false);
        return;
      }

      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id);

      if (transError) throw transError;

      const { data: segmentData, error: segError } = await supabase
        .from('customer_segments')
        .select('*')
        .eq('user_id', session.user.id);

      if (segError) throw segError;

      if (!transactions || transactions.length === 0) {
        setLoading(false);
        return;
      }

      const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.transaction_amount.toString()), 0);
      const uniqueCustomers = new Set(transactions.map(t => t.customer_id)).size;
      
      setMetrics({
        totalCustomers: uniqueCustomers,
        totalTransactions: transactions.length,
        avgSpend: totalRevenue / uniqueCustomers,
        totalRevenue: totalRevenue,
      });

      const segmentGroups = new Map<string, {
        count: number;
        totalSpend: number;
        totalRevenue: number;
      }>();

      segmentData?.forEach(seg => {
        const existing = segmentGroups.get(seg.segment_name) || {
          count: 0,
          totalSpend: 0,
          totalRevenue: 0,
        };
        existing.count++;
        existing.totalSpend += parseFloat(seg.avg_spend.toString());
        existing.totalRevenue += parseFloat(seg.total_spend.toString());
        segmentGroups.set(seg.segment_name, existing);
      });

      const segmentArray: SegmentData[] = Array.from(segmentGroups.entries()).map(([name, data]) => ({
        segment_name: name,
        customer_count: data.count,
        percentage: (data.count / uniqueCustomers) * 100,
        avg_spend: data.totalSpend / data.count,
        total_revenue: data.totalRevenue,
      }));

      setSegments(segmentArray.sort((a, b) => b.total_revenue - a.total_revenue));

      await prepareChartData(transactions, segmentData);
      
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = async (transactions: any[], segments: any[]) => {
    const monthlyData = new Map<string, { revenue: number; transactions: number }>();
    
    transactions.forEach(t => {
      const date = new Date(t.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const existing = monthlyData.get(monthKey) || { revenue: 0, transactions: 0 };
      existing.revenue += parseFloat(t.transaction_amount.toString());
      existing.transactions += 1;
      monthlyData.set(monthKey, existing);
    });

    const revenueChartData = Array.from(monthlyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([date, data]) => ({
        date: new Date(date + '-01').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        revenue: data.revenue,
        transactions: data.transactions,
      }));

    setRevenueData(revenueChartData);

    const customersByMonth = new Map<string, Set<string>>();
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    const allCustomers = new Set<string>();
    sortedTransactions.forEach(t => {
      const date = new Date(t.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!customersByMonth.has(monthKey)) {
        customersByMonth.set(monthKey, new Set());
      }
      customersByMonth.get(monthKey)!.add(t.customer_id);
      allCustomers.add(t.customer_id);
    });

    let cumulativeCustomers = 0;
    const growthChartData = Array.from(customersByMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([date, customers]) => {
        cumulativeCustomers += customers.size;
        return {
          date: new Date(date + '-01').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
          newCustomers: customers.size,
          totalCustomers: cumulativeCustomers,
        };
      });

    setCustomerGrowthData(growthChartData);

    const segmentColors: Record<string, string> = {
      'Champions': '#4F6BED',
      'Loyal Customers': '#22C7A9',
      'At Risk': '#F59E0B',
      'Lost': '#9CA3AF',
      'Potential Loyalists': '#A78BFA',
      'Recent Customers': '#A78BFA',
      'Cant Lose Them': '#F59E0B',
      'Big Spenders': '#4F6BED',
      'Need Attention': '#22C7A9',
    };

    const segmentGroupsForPie = new Map<string, number>();
    segments?.forEach(seg => {
      segmentGroupsForPie.set(seg.segment_name, (segmentGroupsForPie.get(seg.segment_name) || 0) + 1);
    });

    const pieData = Array.from(segmentGroupsForPie.entries()).map(([name, count]) => ({
      name,
      value: count,
      color: segmentColors[name] || '#9CA3AF',
    }));

    setSegmentPieData(pieData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-8 space-y-4 sm:space-y-8">
        <div className="glass-card p-3 sm:p-4">
          <Skeleton className="h-8 sm:h-12 w-1/2 sm:w-1/3 bg-white/10" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <Skeleton className="h-24 sm:h-32 glass-card" />
          <Skeleton className="h-24 sm:h-32 glass-card" />
          <Skeleton className="h-24 sm:h-32 glass-card" />
        </div>
      </div>
    );
  }

  if (metrics.totalCustomers === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative">
        {/* Background Decorations */}
        <div className="blur-orb blur-orb-primary w-96 h-96 top-20 -left-48" />
        <div className="blur-orb blur-orb-accent w-80 h-80 bottom-20 -right-40" />
        
        <div className="glass-card p-6 sm:p-12 text-center max-w-md mx-4 relative z-10">
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <ShoppingCart className="w-7 h-7 sm:w-10 sm:h-10 text-primary" />
          </div>
          <h2 className="text-xl sm:text-3xl font-display font-bold mb-2 sm:mb-4">Belum Ada Data</h2>
          <p className="text-sm text-muted-foreground mb-4 sm:mb-8">
            Upload file CSV transaksi pelanggan untuk mulai analisis
          </p>
          <Button onClick={() => navigate("/upload")} size="lg" variant="gradient" className="w-full sm:w-auto">
            Upload Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 overflow-x-hidden relative">
      {/* Background Decorations */}
      <div className="blur-orb blur-orb-primary w-96 h-96 top-20 -left-48" />
      <div className="blur-orb blur-orb-accent w-80 h-80 top-1/2 -right-40" />
      <div className="blur-orb blur-orb-secondary w-72 h-72 bottom-20 left-1/4" />

      {/* Header */}
      <div className="glass-card p-4 sm:p-6 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold mb-1 sm:mb-2 gradient-text">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Real-time customer intelligence insights</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 relative z-10">
        {[
          { icon: Users, label: "Total Customers", value: metrics.totalCustomers.toLocaleString(), gradient: 'from-primary/20 to-primary/5' },
          { icon: ShoppingCart, label: "Total Transactions", value: metrics.totalTransactions.toLocaleString(), gradient: 'from-accent/20 to-accent/5' },
          { icon: TrendingUp, label: "Avg. Spend", value: formatCurrency(metrics.avgSpend), gradient: 'from-secondary/20 to-secondary/5' },
        ].map((metric, i) => (
          <div 
            key={i} 
            className="glass-card glass-hover p-4 sm:p-6 relative overflow-hidden group"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-2 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <metric.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-display font-bold mb-1">{metric.value}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">{metric.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Segments Grid */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold whitespace-nowrap">Customer Segments</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent"></div>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {segments.map((segment, i) => (
            <div
              key={i}
              className="glass-card glass-hover p-4 sm:p-6 cursor-pointer group"
              onClick={() => navigate(`/segments?segment=${segment.segment_name}`)}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div className="text-lg sm:text-2xl font-display font-bold text-primary">{segment.percentage.toFixed(0)}%</div>
              </div>
              <h3 className="text-sm sm:text-lg font-display font-semibold mb-2 sm:mb-4">{segment.segment_name}</h3>
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customers:</span>
                  <span className="font-semibold">{segment.customer_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Spend:</span>
                  <span className="font-semibold text-[10px] sm:text-sm">{formatCurrency(segment.avg_spend)}</span>
                </div>
              </div>
              <div className="h-1 sm:h-1.5 bg-gradient-to-r from-primary to-accent rounded-full mt-3 sm:mt-4 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Total Revenue Card */}
      <div className="glass-card p-4 sm:p-6 md:p-8 relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10" />
        <div className="relative z-10">
          <h2 className="text-sm sm:text-lg md:text-xl font-display font-semibold mb-1 sm:mb-2 text-muted-foreground">Total Revenue</h2>
          <div className="text-2xl sm:text-3xl md:text-5xl font-display font-bold gradient-text break-all sm:break-normal">
            {formatCurrency(metrics.totalRevenue)}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 relative z-10">
        <RevenueChart data={revenueData} />
        <CustomerGrowthChart data={customerGrowthData} />
      </div>

      {segmentPieData.length > 0 && (
        <div className="relative z-10">
          <SegmentPieChart data={segmentPieData} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;