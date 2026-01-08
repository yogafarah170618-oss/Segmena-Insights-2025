import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, Calendar, ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SegmentCustomer {
  customer_id: string;
  customer_name?: string;
  total_transactions: number;
  total_spend: number;
  avg_spend: number;
  last_transaction_date: string;
  recency_score: number;
  frequency_score: number;
  monetary_score: number;
}

interface SegmentStats {
  totalCustomers: number;
  avgSpend: number;
  avgFrequency: number;
  totalRevenue: number;
}

const Segments = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const segmentName = searchParams.get('segment') || 'Champions';
  
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<SegmentCustomer[]>([]);
  const [stats, setStats] = useState<SegmentStats>({
    totalCustomers: 0,
    avgSpend: 0,
    avgFrequency: 0,
    totalRevenue: 0,
  });
  const [selectedStrategy, setSelectedStrategy] = useState<{title: string; description: string; examples: string[]} | null>(null);

  useEffect(() => {
    loadSegmentData();
  }, [segmentName]);

  const loadSegmentData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const dummyData: Record<string, SegmentCustomer[]> = {
          'Champions': [
            { customer_id: 'CUST-001', customer_name: 'Budi Santoso', total_transactions: 45, total_spend: 2250000, avg_spend: 50000, last_transaction_date: '2024-11-15', recency_score: 5, frequency_score: 5, monetary_score: 5 },
            { customer_id: 'CUST-002', customer_name: 'Siti Rahayu', total_transactions: 38, total_spend: 1900000, avg_spend: 50000, last_transaction_date: '2024-11-14', recency_score: 5, frequency_score: 5, monetary_score: 4 },
            { customer_id: 'CUST-003', customer_name: 'Ahmad Wijaya', total_transactions: 42, total_spend: 2100000, avg_spend: 50000, last_transaction_date: '2024-11-13', recency_score: 5, frequency_score: 5, monetary_score: 5 },
          ],
          'Loyal Customers': [
            { customer_id: 'CUST-101', customer_name: 'Dewi Lestari', total_transactions: 28, total_spend: 1120000, avg_spend: 40000, last_transaction_date: '2024-11-10', recency_score: 4, frequency_score: 4, monetary_score: 4 },
            { customer_id: 'CUST-102', customer_name: 'Rudi Hartono', total_transactions: 25, total_spend: 1000000, avg_spend: 40000, last_transaction_date: '2024-11-08', recency_score: 4, frequency_score: 4, monetary_score: 4 },
          ],
          'At Risk': [
            { customer_id: 'CUST-201', customer_name: 'Linda Kusuma', total_transactions: 15, total_spend: 525000, avg_spend: 35000, last_transaction_date: '2024-09-20', recency_score: 2, frequency_score: 3, monetary_score: 3 },
            { customer_id: 'CUST-202', customer_name: 'Agus Pratama', total_transactions: 12, total_spend: 420000, avg_spend: 35000, last_transaction_date: '2024-09-15', recency_score: 2, frequency_score: 3, monetary_score: 3 },
          ],
          'Recent Customers': [
            { customer_id: 'CUST-301', customer_name: 'Rina Wati', total_transactions: 3, total_spend: 120000, avg_spend: 40000, last_transaction_date: '2024-11-16', recency_score: 5, frequency_score: 2, monetary_score: 2 },
            { customer_id: 'CUST-302', customer_name: 'Bambang Susilo', total_transactions: 2, total_spend: 80000, avg_spend: 40000, last_transaction_date: '2024-11-15', recency_score: 5, frequency_score: 1, monetary_score: 2 },
          ],
          'Lost': [
            { customer_id: 'CUST-401', customer_name: 'Yuni Astuti', total_transactions: 8, total_spend: 320000, avg_spend: 40000, last_transaction_date: '2024-06-10', recency_score: 1, frequency_score: 2, monetary_score: 3 },
            { customer_id: 'CUST-402', customer_name: 'Hendra Gunawan', total_transactions: 6, total_spend: 240000, avg_spend: 40000, last_transaction_date: '2024-05-25', recency_score: 1, frequency_score: 2, monetary_score: 2 },
          ],
        };

        const dummyCustomers = dummyData[segmentName] || [];
        setCustomers(dummyCustomers);

        const totalRevenue = dummyCustomers.reduce((sum, c) => sum + c.total_spend, 0);
        const totalTransactions = dummyCustomers.reduce((sum, c) => sum + c.total_transactions, 0);

        setStats({
          totalCustomers: dummyCustomers.length,
          avgSpend: dummyCustomers.length > 0 ? totalRevenue / dummyCustomers.length : 0,
          avgFrequency: dummyCustomers.length > 0 ? totalTransactions / dummyCustomers.length : 0,
          totalRevenue: totalRevenue,
        });

        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('customer_segments')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('segment_name', segmentName)
        .order('total_spend', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      const customerIds = data.map(c => c.customer_id);
      const { data: transData } = await supabase
        .from('transactions')
        .select('customer_id, customer_name')
        .eq('user_id', session.user.id)
        .in('customer_id', customerIds)
        .not('customer_name', 'is', null)
        .order('created_at', { ascending: false });

      const nameMap = new Map<string, string>();
      transData?.forEach(t => {
        if (t.customer_name && !nameMap.has(t.customer_id)) {
          nameMap.set(t.customer_id, t.customer_name);
        }
      });

      const customerData: SegmentCustomer[] = data.map(c => ({
        customer_id: c.customer_id,
        customer_name: nameMap.get(c.customer_id) || undefined,
        total_transactions: c.total_transactions,
        total_spend: parseFloat(c.total_spend.toString()),
        avg_spend: parseFloat(c.avg_spend.toString()),
        last_transaction_date: c.last_transaction_date,
        recency_score: c.recency_score,
        frequency_score: c.frequency_score,
        monetary_score: c.monetary_score,
      }));

      setCustomers(customerData);

      const totalRevenue = customerData.reduce((sum, c) => sum + c.total_spend, 0);
      const totalTransactions = customerData.reduce((sum, c) => sum + c.total_transactions, 0);

      setStats({
        totalCustomers: customerData.length,
        avgSpend: totalRevenue / customerData.length,
        avgFrequency: totalTransactions / customerData.length,
        totalRevenue: totalRevenue,
      });

    } catch (error: any) {
      console.error('Error loading segment:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getSegmentDescription = (name: string) => {
    const descriptions: Record<string, string> = {
      'Champions': 'Pelanggan terbaik dengan frekuensi dan nilai transaksi tertinggi',
      'Loyal Customers': 'Pelanggan setia dengan transaksi reguler dan konsisten',
      'At Risk': 'Pelanggan yang sebelumnya aktif tapi mulai menjauh',
      'Lost': 'Pelanggan yang sudah lama tidak bertransaksi',
      'Potential Loyalists': 'Pelanggan baru dengan potensi menjadi loyal',
      'Recent Customers': 'Pelanggan yang baru saja melakukan transaksi',
      'Cant Lose Them': 'Pelanggan berharga yang mulai tidak aktif',
      'Big Spenders': 'Pelanggan dengan nilai transaksi tinggi',
      'Need Attention': 'Pelanggan yang memerlukan perhatian khusus',
    };
    return descriptions[name] || 'Segmen pelanggan berdasarkan analisis RFM';
  };

  const getStrategies = (name: string) => {
    const strategies: Record<string, string[]> = {
      'Champions': [
        'Berikan exclusive benefits dan early access',
        'Program VIP dengan rewards khusus',
        'Jadikan brand ambassador dengan referral program',
      ],
      'Loyal Customers': [
        'Pertahankan dengan loyalty program',
        'Personalized recommendations',
        'Upgrade program untuk jadi Champions',
      ],
      'At Risk': [
        'Win-back campaign dengan special offers',
        'Survey untuk understand pain points',
        'Re-engagement email series',
      ],
      'Lost': [
        'Aggressive win-back offers',
        'Investigate churn reasons',
        'Consider if worth re-engaging',
      ],
    };
    return strategies[name] || [
      'Analyze customer behavior patterns',
      'Create targeted engagement campaigns',
      'Monitor progress regularly',
    ];
  };

  const getStrategyDetails = (name: string, index: number) => {
    const details: Record<string, Array<{title: string; description: string; examples: string[]}>> = {
      'Champions': [
        {
          title: 'Exclusive Benefits & Early Access',
          description: 'Champions adalah pelanggan terbaik Anda. Berikan mereka akses istimewa ke produk baru, event khusus, atau promo eksklusif sebelum pelanggan lain.',
          examples: [
            'Pre-launch access ke produk atau koleksi baru',
            'Undangan ke event VIP atau private sale',
            'Free shipping atau priority delivery',
            'Akses ke customer service khusus',
          ]
        },
        {
          title: 'Program VIP dengan Rewards Khusus',
          description: 'Ciptakan tier VIP khusus untuk Champions dengan benefit yang tidak tersedia untuk pelanggan lain.',
          examples: [
            'Poin reward dengan multiplier lebih tinggi',
            'Birthday gifts atau anniversary rewards',
            'Complimentary gift wrapping',
            'Akses ke limited edition products',
          ]
        },
        {
          title: 'Brand Ambassador & Referral Program',
          description: 'Champions yang puas adalah promoter terbaik. Manfaatkan word-of-mouth mereka dengan program referral.',
          examples: [
            'Referral rewards untuk mereka dan teman',
            'User-generated content campaign',
            'Testimony atau review rewards program',
            'Community building melalui exclusive group',
          ]
        },
      ],
      'Loyal Customers': [
        {
          title: 'Loyalty Program yang Menarik',
          description: 'Loyal Customers konsisten tapi belum di level Champions. Pertahankan mereka dengan program loyalitas.',
          examples: [
            'Tiered loyalty program dengan clear benefits',
            'Milestone rewards untuk transaksi ke-10, ke-20',
            'Seasonal bonus points atau cashback',
            'Member exclusive discounts',
          ]
        },
        {
          title: 'Personalized Recommendations',
          description: 'Gunakan data pembelian mereka untuk memberikan rekomendasi produk yang relevan.',
          examples: [
            'Email marketing dengan product recommendations',
            'Replenishment reminders',
            'Bundle suggestions yang complement past purchases',
            'Personalized content berdasarkan preferences',
          ]
        },
        {
          title: 'Upgrade Program ke Champions',
          description: 'Berikan insentif dan path yang jelas untuk naik ke tier Champions.',
          examples: [
            'Clear communication tentang benefit Champions',
            'Limited time promotion untuk upgrade',
            'Gamification dengan progress tracker',
            'Exclusive challenges untuk unlock Champions status',
          ]
        },
      ],
      'At Risk': [
        {
          title: 'Win-back Campaign dengan Special Offers',
          description: 'At Risk customers mulai menjauh. Butuh immediate action untuk menarik mereka kembali.',
          examples: [
            'Personalized discount code dengan urgency',
            '"We miss you" email dengan special offer',
            'Free gift with next purchase',
            'Reactivation bonus points',
          ]
        },
        {
          title: 'Survey & Understanding Pain Points',
          description: 'Pahami mengapa mereka mulai menjauh. Feedback langsung adalah insight berharga.',
          examples: [
            'Short survey dengan incentive',
            'Personal outreach via email atau phone',
            'Focus group invitation',
            'Review request dengan follow-up',
          ]
        },
        {
          title: 'Re-engagement Email Series',
          description: 'Automated campaign yang strategis untuk gradually rebuild relationship.',
          examples: [
            'Series email dengan progressively increase offer',
            'Educational content tentang new features',
            'Social proof email dengan testimonials',
            'Last chance email sebelum list removal',
          ]
        },
      ],
      'Lost': [
        {
          title: 'Aggressive Win-back Offers',
          description: 'Lost customers sudah lama tidak bertransaksi. Butuh approach yang lebih agresif.',
          examples: [
            'High-value discount atau BOGO offers',
            'Free product atau gift dengan minimal purchase',
            'Store credit atau voucher',
            'Clearance sale access',
          ]
        },
        {
          title: 'Investigate Churn Reasons',
          description: 'Analisis mendalam mengapa mereka berhenti. Data ini crucial untuk prevent future churn.',
          examples: [
            'Exit survey dengan attractive incentive',
            'Data analysis untuk identify patterns',
            'Competitor analysis',
            'Product audit based on feedback',
          ]
        },
        {
          title: 'Evaluate Re-engagement Worth',
          description: 'Tidak semua lost customers worth effort untuk win back. Fokuskan resource ke high-value.',
          examples: [
            'Calculate customer lifetime value',
            'Segment by past purchase value',
            'Cost-benefit analysis untuk campaigns',
            'Archive inactive customers untuk list hygiene',
          ]
        },
      ],
    };

    const defaultDetails = [
      {
        title: 'Analisis Behavior Patterns',
        description: 'Pelajari pola perilaku pelanggan di segment ini.',
        examples: [
          'Track purchase frequency dan seasonality',
          'Analyze product preferences',
          'Monitor engagement dengan marketing channels',
          'Identify triggers untuk purchase decisions',
        ]
      },
      {
        title: 'Targeted Engagement Campaigns',
        description: 'Buat campaign yang spesifik untuk segment ini.',
        examples: [
          'Segmented email campaigns',
          'Personalized offers based on behavior',
          'Channel-specific campaigns',
          'A/B testing untuk optimize messaging',
        ]
      },
      {
        title: 'Regular Progress Monitoring',
        description: 'Monitor pergerakan customers antar segments.',
        examples: [
          'Monthly segment health check',
          'Track segment movement',
          'Measure campaign effectiveness',
          'Adjust strategy based on results',
        ]
      },
    ];

    return (details[name] || defaultDetails)[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-8 space-y-4 sm:space-y-8">
        <div className="border-3 border-border p-3 sm:p-4 bg-muted">
          <Skeleton className="h-8 sm:h-12 w-1/2 sm:w-1/3 bg-border" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 sm:h-32 border-3 border-border" />)}
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 dotted-bg">
        <div className="border-3 border-border p-6 sm:p-12 bg-card shadow-brutal-lg text-center max-w-md mx-4">
          <div className="w-14 h-14 sm:w-20 sm:h-20 border-3 border-border bg-muted flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Users className="w-7 h-7 sm:w-10 sm:h-10" />
          </div>
          <h2 className="text-xl sm:text-3xl font-brutal mb-2 sm:mb-4">TIDAK ADA DATA</h2>
          <p className="font-mono text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-8">
            Belum ada customer di segmen {segmentName}
          </p>
          <Button onClick={() => navigate("/dashboard")} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            KEMBALI
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-start gap-2 sm:gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-4xl md:text-5xl font-brutal mb-1 sm:mb-2 truncate">{segmentName.toUpperCase()}</h1>
          <p className="font-mono text-xs sm:text-sm text-muted-foreground line-clamp-2">{getSegmentDescription(segmentName)}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {[
          { icon: Users, label: "TOTAL CUSTOMERS", value: stats.totalCustomers, style: 'bg-card' },
          { icon: DollarSign, label: "AVG. SPEND", value: formatCurrency(stats.avgSpend), style: 'bg-secondary text-secondary-foreground' },
          { icon: TrendingUp, label: "AVG. FREQUENCY", value: `${stats.avgFrequency.toFixed(1)}x`, style: 'bg-card' },
          { icon: Calendar, label: "TOTAL REVENUE", value: formatCurrency(stats.totalRevenue), style: 'bg-foreground text-background' },
        ].map((stat, i) => (
          <div 
            key={i} 
            className={`border-3 border-border p-3 sm:p-6 shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-hover transition-all ${stat.style}`}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-current flex items-center justify-center">
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-base sm:text-2xl font-brutal mb-0.5 sm:mb-1 truncate">{stat.value}</div>
            <div className="text-[9px] sm:text-xs font-mono opacity-70">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Customers Table */}
      <div>
        <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-brutal whitespace-nowrap">CUSTOMERS IN SEGMENT</h2>
          <div className="flex-1 h-0.5 sm:h-1 bg-border"></div>
        </div>
        <div className="border-3 border-border bg-card shadow-brutal overflow-hidden">
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            {customers.map((customer, i) => (
              <div key={i} className="p-3 border-b-3 border-border last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs bg-muted px-2 py-1 border border-border truncate max-w-[140px]">
                    {customer.customer_id}
                  </span>
                  <div className="flex gap-1">
                    <span className="text-[10px] font-mono bg-foreground text-background px-1.5 py-0.5">
                      R:{customer.recency_score}
                    </span>
                    <span className="text-[10px] font-mono bg-secondary text-secondary-foreground px-1.5 py-0.5">
                      F:{customer.frequency_score}
                    </span>
                    <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5">
                      M:{customer.monetary_score}
                    </span>
                  </div>
                </div>
                {customer.customer_name && (
                  <p className="font-mono text-sm mb-2">{customer.customer_name}</p>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-muted-foreground">Transactions: </span>
                    <span className="font-bold">{customer.total_transactions}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-bold">{formatCurrency(customer.total_spend)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg: </span>
                    <span>{formatCurrency(customer.avg_spend)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last: </span>
                    <span>{new Date(customer.last_transaction_date).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-3 border-border bg-muted">
                  <th className="text-left p-3 sm:p-4 text-[10px] sm:text-xs font-brutal tracking-wider">CUSTOMER ID</th>
                  <th className="text-left p-3 sm:p-4 text-[10px] sm:text-xs font-brutal tracking-wider">NAME</th>
                  <th className="text-left p-3 sm:p-4 text-[10px] sm:text-xs font-brutal tracking-wider">TRANS</th>
                  <th className="text-left p-3 sm:p-4 text-[10px] sm:text-xs font-brutal tracking-wider">TOTAL SPEND</th>
                  <th className="text-left p-3 sm:p-4 text-[10px] sm:text-xs font-brutal tracking-wider hidden lg:table-cell">AVG SPEND</th>
                  <th className="text-left p-3 sm:p-4 text-[10px] sm:text-xs font-brutal tracking-wider hidden lg:table-cell">LAST</th>
                  <th className="text-left p-3 sm:p-4 text-[10px] sm:text-xs font-brutal tracking-wider">RFM</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, i) => (
                  <tr
                    key={i}
                    className="border-b-3 border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-3 sm:p-4">
                      <span className="font-mono text-xs sm:text-sm bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 border border-border">
                        {customer.customer_id}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 font-mono text-sm">
                      {customer.customer_name || <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="p-3 sm:p-4 font-mono text-sm">{customer.total_transactions}</td>
                    <td className="p-3 sm:p-4 font-mono text-sm font-bold">{formatCurrency(customer.total_spend)}</td>
                    <td className="p-3 sm:p-4 font-mono text-sm hidden lg:table-cell">{formatCurrency(customer.avg_spend)}</td>
                    <td className="p-3 sm:p-4 font-mono text-sm text-muted-foreground hidden lg:table-cell">
                      {new Date(customer.last_transaction_date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex gap-1">
                        <span className="text-[10px] sm:text-xs font-mono bg-foreground text-background px-1.5 sm:px-2 py-0.5">
                          R:{customer.recency_score}
                        </span>
                        <span className="text-[10px] sm:text-xs font-mono bg-secondary text-secondary-foreground px-1.5 sm:px-2 py-0.5">
                          F:{customer.frequency_score}
                        </span>
                        <span className="text-[10px] sm:text-xs font-mono bg-muted px-1.5 sm:px-2 py-0.5">
                          M:{customer.monetary_score}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Strategies */}
      <div>
        <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-brutal whitespace-nowrap">RECOMMENDED STRATEGIES</h2>
          <div className="flex-1 h-0.5 sm:h-1 bg-border"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {getStrategies(segmentName).map((strategy, i) => (
            <div 
              key={i} 
              className="border-3 border-border p-4 sm:p-6 bg-card shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-lg transition-all cursor-pointer group"
              onClick={() => setSelectedStrategy(getStrategyDetails(segmentName, i))}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border-3 border-border bg-foreground text-background flex items-center justify-center mb-3 sm:mb-4 font-brutal text-base sm:text-xl">
                    {i + 1}
                  </div>
                  <p className="font-mono text-xs sm:text-sm text-muted-foreground leading-relaxed">{strategy}</p>
                </div>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Detail Modal */}
      <Dialog open={!!selectedStrategy} onOpenChange={() => setSelectedStrategy(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border-3 border-border shadow-brutal-lg mx-3 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-2xl font-brutal">{selectedStrategy?.title.toUpperCase()}</DialogTitle>
            <DialogDescription className="text-sm sm:text-base font-mono mt-2">
              {selectedStrategy?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 sm:mt-6">
            <h4 className="font-brutal text-xs sm:text-sm tracking-wider mb-3 sm:mb-4">CONTOH IMPLEMENTASI:</h4>
            <ul className="space-y-2 sm:space-y-3">
              {selectedStrategy?.examples.map((example, i) => (
                <li key={i} className="flex gap-2 sm:gap-3">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 bg-foreground text-background flex items-center justify-center text-[10px] sm:text-xs font-brutal flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-mono text-xs sm:text-sm text-muted-foreground">{example}</span>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Segments;
