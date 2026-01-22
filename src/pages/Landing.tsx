import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, Zap, TrendingUp, Users, Crown, Heart, AlertTriangle, Sparkles, Upload, PieChart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type RevenueDatum = { month: string; revenue: number };

const CHART = {
  w: 280,
  h: 100,
  padX: 10,
  topY: 8,
  bottomY: 72,
} as const;

const REVENUE_DATA: RevenueDatum[] = [
  { month: "Jan", revenue: 58.5 },
  { month: "Feb", revenue: 62.0 },
  { month: "Mar", revenue: 68.5 },
  { month: "Apr", revenue: 71.0 },
  { month: "Mei", revenue: 69.5 },
  { month: "Jun", revenue: 72.0 },
  { month: "Jul", revenue: 74.5 },
  { month: "Agu", revenue: 78.0 },
  { month: "Sep", revenue: 75.5 },
  { month: "Okt", revenue: 79.0 },
  { month: "Nov", revenue: 68.5 },
  { month: "Des", revenue: 70.5 },
];

const Landing = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCustomers: "1,247",
    activeSegments: "4",
    avgTransaction: "Rp 247K",
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const points = useMemo(() => {
    const values = REVENUE_DATA.map((d) => d.revenue);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1e-6, max - min);

    const xStart = CHART.padX;
    const xEnd = CHART.w - CHART.padX;

    return REVENUE_DATA.map((d, i) => {
      const t = REVENUE_DATA.length === 1 ? 0 : i / (REVENUE_DATA.length - 1);
      const x = xStart + t * (xEnd - xStart);
      const y =
        CHART.topY +
        ((max - d.revenue) / range) * (CHART.bottomY - CHART.topY);

      return { ...d, x, y };
    });
  }, []);

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");

  const areaPath = `${linePath} L${points[points.length - 1].x},${CHART.h} L${points[0].x},${CHART.h} Z`;

  const gridYs = [
    CHART.topY + (CHART.bottomY - CHART.topY) * 0.25,
    CHART.topY + (CHART.bottomY - CHART.topY) * 0.5,
    CHART.topY + (CHART.bottomY - CHART.topY) * 0.75,
  ];

  useEffect(() => {
    checkAuthAndLoadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setStats({
          totalCustomers: "1,247",
          activeSegments: "4",
          avgTransaction: "Rp 247K",
        });
      } else if (event === 'SIGNED_IN') {
        checkAuthAndLoadData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id);

      const { data: segments } = await supabase
        .from('customer_segments')
        .select('segment_name')
        .eq('user_id', session.user.id);

      if (transactions && transactions.length > 0) {
        const uniqueCustomers = new Set(transactions.map(t => t.customer_id)).size;
        const uniqueSegments = new Set(segments?.map(s => s.segment_name) || []).size;
        const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.transaction_amount.toString()), 0);
        const avgTransaction = totalRevenue / transactions.length;

        setStats({
          totalCustomers: uniqueCustomers.toLocaleString('id-ID'),
          activeSegments: uniqueSegments.toString(),
          avgTransaction: new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(avgTransaction),
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden relative">
      {/* Background decoration orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="blur-orb blur-orb-primary w-96 h-96 -top-48 -left-48" />
        <div className="blur-orb blur-orb-secondary w-80 h-80 top-1/4 -right-40" />
        <div className="blur-orb blur-orb-accent w-72 h-72 bottom-1/4 -left-36" />
        <div className="blur-orb blur-orb-primary w-64 h-64 -bottom-32 right-1/4" />
      </div>

      {/* Hero Section */}
      <section className="min-h-[80vh] sm:min-h-[90vh] flex items-center justify-center py-6 sm:py-20 px-4 sm:px-6 relative z-10">
        <div className="w-full max-w-5xl mx-auto">
          {/* Main Title */}
          <div className="mb-6 sm:mb-12 text-center animate-fade-in">
            <h1 className="text-display gradient-text mb-3 sm:mb-6">
              SEGMENA
            </h1>
            <div className="inline-block soft-badge mb-4 sm:mb-8">
              <span className="text-sm sm:text-base">
                Customer Intelligence Platform
              </span>
            </div>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-12 leading-relaxed">
              Platform Customer Intelligence untuk UMKM. Segmentasi otomatis, insight siap pakai, mudah digunakan.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center mb-6 sm:mb-16 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Button
              size="lg"
              variant="gradient"
              onClick={() => navigate("/upload")}
              className="text-sm sm:text-base px-6 sm:px-10 py-3 sm:py-6 w-full sm:w-auto"
            >
              Upload Data
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              size="lg"
              variant="glass"
              onClick={() => navigate("/dashboard")}
              className="text-sm sm:text-base px-6 sm:px-10 py-3 sm:py-6 w-full sm:w-auto"
            >
              Try Demo
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            {[
              { label: "Customers", value: stats.totalCustomers, color: "primary" },
              { label: "Segments", value: stats.activeSegments, color: "secondary" },
              { label: "Avg. Transaction", value: stats.avgTransaction, color: "accent" },
            ].map((stat, i) => (
              <div 
                key={i} 
                className="glass-card p-3 sm:p-6 text-center glass-hover"
              >
                <div className="text-caption mb-1 sm:mb-2">{stat.label}</div>
                <div className={`text-lg sm:text-3xl font-bold ${stat.color === 'primary' ? 'text-primary' : stat.color === 'secondary' ? 'text-secondary' : 'text-accent'}`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Dashboard Preview */}
          <div className="mt-6 sm:mt-16 glass-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {/* Window Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent/80"></div>
                  <div className="w-3 h-3 rounded-full bg-secondary/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <span className="text-sm sm:text-base font-semibold">Segmena Dashboard</span>
              </div>
              <span className="text-caption">v1.0</span>
            </div>

            <div className="p-4 sm:p-8">
             {/* Step indicator */}
              <div className="mb-6 sm:mb-8 p-4 sm:p-5 glass rounded-xl">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 justify-center">
                  {[
                    { step: 1, label: "Upload CSV" },
                    { step: 2, label: "Analisis Otomatis" },
                    { step: 3, label: "Lihat Insight" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 sm:gap-3">
                      {i > 0 && <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />}
                      <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {item.step}
                        </div>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Segment Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {[
                  { icon: Crown, label: "Champions", value: "312", color: "text-amber-500", bg: "from-amber-500/20 to-amber-500/5", desc: "Pelanggan terbaik" },
                  { icon: Heart, label: "Loyal", value: "428", color: "text-pink-500", bg: "from-pink-500/20 to-pink-500/5", desc: "Sering berbelanja" },
                  { icon: AlertTriangle, label: "At Risk", value: "156", color: "text-red-500", bg: "from-red-500/20 to-red-500/5", desc: "Perlu perhatian" },
                  { icon: Sparkles, label: "New", value: "351", color: "text-emerald-500", bg: "from-emerald-500/20 to-emerald-500/5", desc: "Pelanggan baru" },
                ].map((segment, i) => (
                  <div 
                    key={i} 
                    className={`glass rounded-xl p-3 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-glass-hover bg-gradient-to-br ${segment.bg}`}
                  >
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <segment.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${segment.color}`} />
                      <span className="text-xs sm:text-sm font-semibold">{segment.label}</span>
                    </div>
                    <div className={`text-xl sm:text-3xl font-bold ${segment.color}`}>{segment.value}</div>
                    <div className="text-caption mt-1">{segment.desc}</div>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Revenue Chart */}
                <div className="glass rounded-xl p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span className="text-sm sm:text-base font-semibold">Revenue Trend</span>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">↑ 23%</span>
                  </div>
                  
                  {/* SVG Line Chart */}
                  <div className="h-24 sm:h-32 relative" onMouseLeave={() => setHoveredPoint(null)}>
                    <svg viewBox={`0 0 ${CHART.w} ${CHART.h}`} className="w-full h-full" preserveAspectRatio="none">
                      {/* Grid lines */}
                      {gridYs.map((y, idx) => (
                        <line
                          key={idx}
                          x1="0"
                          y1={y}
                          x2={CHART.w}
                          y2={y}
                          stroke="currentColor"
                          className="text-border"
                          strokeWidth="0.5"
                          strokeDasharray="4 2"
                          opacity="0.3"
                        />
                      ))}

                      {/* Area fill */}
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={areaPath} fill="url(#areaGradient)" />

                      {/* Line chart path */}
                      <path
                        d={linePath}
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Interactive data points */}
                      {points.map((point, i) => (
                        <g key={i}>
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="12"
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPoint(i)}
                          />
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r={hoveredPoint === i ? 6 : 3}
                            fill="hsl(var(--primary))"
                            stroke={hoveredPoint === i ? "white" : "none"}
                            strokeWidth="2"
                            className="transition-all duration-200 pointer-events-none"
                          />
                        </g>
                      ))}
                    </svg>

                    {/* Tooltip */}
                    {hoveredPoint !== null && (
                      <div
                        className="absolute z-10 glass rounded-lg px-3 py-2 pointer-events-none transform -translate-x-1/2 -translate-y-full"
                        style={{
                          left: `${(points[hoveredPoint].x / CHART.w) * 100}%`,
                          top: `${(points[hoveredPoint].y / CHART.h) * 100}%`,
                          marginTop: "-10px",
                        }}
                      >
                        <div className="text-xs sm:text-sm font-semibold">
                          {points[hoveredPoint].month}
                        </div>
                        <div className="text-xs text-primary">
                          Rp {points[hoveredPoint].revenue} Jt
                        </div>
                      </div>
                    )}

                    {/* Month labels */}
                    <div className="absolute inset-x-0 bottom-0 h-4 pointer-events-none">
                      {points.map((p, i) => (
                        <span
                          key={i}
                          className={`absolute bottom-0 -translate-x-1/2 text-[6px] sm:text-[8px] transition-all duration-200 ${hoveredPoint === i ? "opacity-100 text-primary font-semibold" : "text-muted-foreground opacity-60"}`}
                          style={{ left: `${(p.x / CHART.w) * 100}%` }}
                        >
                          {p.month}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-caption">Total Revenue 2024</div>
                    <div className="text-lg sm:text-2xl font-bold gradient-text">Rp 847.5 Juta</div>
                  </div>
                </div>

                {/* Action Insights */}
                <div className="glass rounded-xl p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-accent" />
                    <span className="text-sm sm:text-base font-semibold">Rekomendasi</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { emoji: "🎯", label: "Champions", action: "Berikan reward eksklusif", color: "text-amber-500" },
                      { emoji: "⚠️", label: "At Risk", action: "Kirim promo win-back", color: "text-red-500" },
                      { emoji: "✨", label: "New Customers", action: "Onboarding campaign", color: "text-emerald-500" },
                    ].map((item, i) => (
                      <div 
                        key={i} 
                        className={`p-3 sm:p-4 rounded-xl bg-${item.color}-500/10 border border-${item.color}-500/20 transition-all duration-300 hover:-translate-y-0.5`}
                      >
                        <div className={`text-xs sm:text-sm font-semibold text-${item.color}-500`}>
                          {item.emoji} {item.label}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1">{item.action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="mt-6 p-4 sm:p-5 glass rounded-xl text-center bg-gradient-to-r from-primary/5 to-secondary/5">
                <div className="text-sm sm:text-base font-medium mb-2">
                  Upload data transaksi Anda dan dapatkan insight seperti ini!
                </div>
                <div className="flex items-center justify-center gap-2 text-caption">
                  <Upload className="w-4 h-4" />
                  <span>Format: CSV dengan kolom customer_id, transaction_date, amount</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-24 relative z-10">
        <div className="px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-16 animate-fade-in">
            <h2 className="text-headline mb-3 sm:mb-4">
              <span className="gradient-text">Keunggulan</span> Platform Kami
            </h2>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
              Solusi lengkap untuk memahami pelanggan Anda lebih baik
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {[
              {
                icon: Target,
                title: "Segmentasi Otomatis",
                description: "Algoritma canggih mengelompokkan pelanggan berdasarkan perilaku transaksi.",
                gradient: "from-primary to-blue-400",
              },
              {
                icon: Zap,
                title: "Insight Siap Pakai",
                description: "Rekomendasi strategi marketing langsung dari data Anda.",
                gradient: "from-secondary to-purple-400",
              },
              {
                icon: TrendingUp,
                title: "Mudah Digunakan",
                description: "Upload CSV, lihat hasil. Tidak perlu keahlian data science.",
                gradient: "from-accent to-pink-400",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass-card p-6 sm:p-10 glass-hover group animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-title mb-2 sm:mb-4">{feature.title}</h3>
                <p className="text-body text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      {!isLoggedIn && (
        <section className="py-12 sm:py-24 relative z-10">
          <div className="px-4 sm:px-6 text-center">
            <div className="glass-card max-w-3xl mx-auto p-8 sm:p-16 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
              <h2 className="text-headline mb-4 sm:mb-6">
                Mulai <span className="gradient-text">Sekarang</span>
              </h2>
              <p className="text-body-lg text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto">
                Daftar gratis dan mulai analisis pelanggan Anda dalam hitungan menit
              </p>
              <Button
                size="lg"
                variant="gradient"
                onClick={() => navigate("/auth")}
                className="text-sm sm:text-lg px-8 sm:px-12 py-4 sm:py-6"
              >
                Daftar Gratis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Landing;
