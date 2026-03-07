"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  LayoutGrid,
  LayoutList,
  Columns,
  Download,
  GitCompare,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  X,
  StickyNote,
  Bell,
  BarChart3,
  Activity,
  Heart,
  DollarSign,
  Briefcase,
  PieChart,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddStockModal from "../watchlist/AddStockModal";

interface Holding {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  currentValue: number;
  dayChange: number;
  totalReturn: number;
  plAmount: number;
  healthScore: number;
  pe: number;
  roe: number;
  marketCap: string;
  weekHigh52: number;
  weekLow52: number;
  weight: number;
}

interface Transaction {
  id: string;
  date: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
}

const HoldingsPage = () => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"table" | "card" | "compact">(
    "table",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<keyof Holding>("currentValue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [healthFilter, setHealthFilter] = useState<string>("all");
  const [returnFilter, setReturnFilter] = useState<string>("all");
  const [selectedHoldings, setSelectedHoldings] = useState<Set<string>>(
    new Set(),
  );
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [watchlists, setWatchlists] = useState<string[]>([
    "Main Watchlist",
    "Banking Stocks",
    "IT Sector",
    "High Growth",
  ]);

  // Sector concentration data
  const sectorConcentration = [
    { sector: "IT", percentage: 38, color: "#3b82f6", alert: true },
    { sector: "Banking", percentage: 32, color: "#10b981", alert: false },
    { sector: "Energy", percentage: 14, color: "#8b5cf6", alert: false },
    { sector: "FMCG", percentage: 10, color: "#f59e0b", alert: false },
    { sector: "Telecom", percentage: 8, color: "#eab308", alert: false },
    { sector: "Other", percentage: 3, color: "#6b7280", alert: false },
  ];

  const topHoldings = [
    { symbol: "HDFC", name: "HDFC Bank", weight: 14.6, value: 91000 },
    {
      symbol: "RELIANCE",
      name: "Reliance Industries",
      weight: 14.4,
      value: 89775,
    },
    {
      symbol: "TCS",
      name: "Tata Consultancy Services",
      weight: 13.0,
      value: 81070,
    },
    { symbol: "INFY", name: "Infosys", weight: 10.7, value: 66510 },
    { symbol: "ITC", name: "ITC Limited", weight: 10.3, value: 64440 },
  ];

  const concentrationRatio = 63.0; // Top 5 stocks as % of total

  // Mock holdings data
  const holdings: Holding[] = [
    {
      id: "1",
      ticker: "HDFC",
      name: "HDFC Bank",
      sector: "Banking",
      quantity: 50,
      avgCost: 1640,
      currentPrice: 1820,
      currentValue: 91000,
      dayChange: 3.2,
      totalReturn: 10.98,
      plAmount: 9000,
      healthScore: 85,
      pe: 22.5,
      roe: 18.2,
      marketCap: "₹12.5T",
      weekHigh52: 1950,
      weekLow52: 1450,
      weight: 14.6,
    },
    {
      id: "2",
      ticker: "RELIANCE",
      name: "Reliance Industries",
      sector: "Energy",
      quantity: 35,
      avgCost: 2380,
      currentPrice: 2565,
      currentValue: 89775,
      dayChange: 2.1,
      totalReturn: 7.77,
      plAmount: 6475,
      healthScore: 83,
      pe: 25.3,
      roe: 15.8,
      marketCap: "₹17.2T",
      weekHigh52: 2750,
      weekLow52: 2200,
      weight: 14.4,
    },
    {
      id: "3",
      ticker: "TCS",
      name: "Tata Consultancy Services",
      sector: "IT",
      quantity: 22,
      avgCost: 3200,
      currentPrice: 3685,
      currentValue: 81070,
      dayChange: 1.8,
      totalReturn: 15.16,
      plAmount: 10670,
      healthScore: 88,
      pe: 28.4,
      roe: 42.5,
      marketCap: "₹13.4T",
      weekHigh52: 3900,
      weekLow52: 3050,
      weight: 13.0,
    },
    {
      id: "4",
      ticker: "INFY",
      name: "Infosys",
      sector: "IT",
      quantity: 45,
      avgCost: 1520,
      currentPrice: 1478,
      currentValue: 66510,
      dayChange: -0.8,
      totalReturn: -2.76,
      plAmount: -1890,
      healthScore: 86,
      pe: 24.1,
      roe: 31.2,
      marketCap: "₹6.1T",
      weekHigh52: 1650,
      weekLow52: 1350,
      weight: 10.7,
    },
    {
      id: "5",
      ticker: "ITC",
      name: "ITC Limited",
      sector: "FMCG",
      quantity: 180,
      avgCost: 315,
      currentPrice: 358,
      currentValue: 64440,
      dayChange: 1.2,
      totalReturn: 13.65,
      plAmount: 7740,
      healthScore: 82,
      pe: 29.8,
      roe: 26.5,
      marketCap: "₹4.5T",
      weekHigh52: 395,
      weekLow52: 295,
      weight: 10.3,
    },
    {
      id: "6",
      ticker: "HDFCBANK",
      name: "HDFC Bank Ltd",
      sector: "Banking",
      quantity: 40,
      avgCost: 1450,
      currentPrice: 1620,
      currentValue: 64800,
      dayChange: 2.3,
      totalReturn: 11.72,
      plAmount: 6800,
      healthScore: 87,
      pe: 20.5,
      roe: 17.8,
      marketCap: "₹11.2T",
      weekHigh52: 1750,
      weekLow52: 1380,
      weight: 10.4,
    },
    {
      id: "7",
      ticker: "ICICIBANK",
      name: "ICICI Bank",
      sector: "Banking",
      quantity: 55,
      avgCost: 880,
      currentPrice: 1025,
      currentValue: 56375,
      dayChange: 1.9,
      totalReturn: 16.48,
      plAmount: 7975,
      healthScore: 84,
      pe: 18.7,
      roe: 16.5,
      marketCap: "₹7.2T",
      weekHigh52: 1100,
      weekLow52: 820,
      weight: 9.0,
    },
    {
      id: "8",
      ticker: "BHARTIARTL",
      name: "Bharti Airtel",
      sector: "Telecom",
      quantity: 60,
      avgCost: 745,
      currentPrice: 885,
      currentValue: 53100,
      dayChange: 0.5,
      totalReturn: 18.79,
      plAmount: 8400,
      healthScore: 78,
      pe: 35.2,
      roe: 12.4,
      marketCap: "₹5.3T",
      weekHigh52: 950,
      weekLow52: 680,
      weight: 8.5,
    },
    {
      id: "9",
      ticker: "WIPRO",
      name: "Wipro",
      sector: "IT",
      quantity: 85,
      avgCost: 425,
      currentPrice: 465,
      currentValue: 39525,
      dayChange: -0.3,
      totalReturn: 9.41,
      plAmount: 3400,
      healthScore: 79,
      pe: 22.8,
      roe: 18.5,
      marketCap: "₹2.5T",
      weekHigh52: 510,
      weekLow52: 390,
      weight: 6.3,
    },
    {
      id: "10",
      ticker: "AXISBANK",
      name: "Axis Bank",
      sector: "Banking",
      quantity: 35,
      avgCost: 950,
      currentPrice: 1085,
      currentValue: 37975,
      dayChange: 1.4,
      totalReturn: 14.21,
      plAmount: 4725,
      healthScore: 81,
      pe: 12.5,
      roe: 14.2,
      marketCap: "₹3.4T",
      weekHigh52: 1180,
      weekLow52: 880,
      weight: 6.1,
    },
    {
      id: "11",
      ticker: "MARUTI",
      name: "Maruti Suzuki",
      sector: "Automotive",
      quantity: 3,
      avgCost: 9850,
      currentPrice: 11250,
      currentValue: 33750,
      dayChange: 2.8,
      totalReturn: 14.21,
      plAmount: 4200,
      healthScore: 75,
      pe: 27.3,
      roe: 16.8,
      marketCap: "₹3.4T",
      weekHigh52: 12000,
      weekLow52: 9200,
      weight: 5.4,
    },
    {
      id: "12",
      ticker: "ASIANPAINT",
      name: "Asian Paints",
      sector: "Consumer",
      quantity: 10,
      avgCost: 2950,
      currentPrice: 3180,
      currentValue: 31800,
      dayChange: 0.9,
      totalReturn: 7.8,
      plAmount: 2300,
      healthScore: 80,
      pe: 55.2,
      roe: 28.4,
      marketCap: "₹3.1T",
      weekHigh52: 3450,
      weekLow52: 2750,
      weight: 5.1,
    },
    {
      id: "13",
      ticker: "SUNPHARMA",
      name: "Sun Pharmaceutical",
      sector: "Pharma",
      quantity: 25,
      avgCost: 1080,
      currentPrice: 1245,
      currentValue: 31125,
      dayChange: -1.2,
      totalReturn: 15.28,
      plAmount: 4125,
      healthScore: 76,
      pe: 38.5,
      roe: 14.2,
      marketCap: "₹3.0T",
      weekHigh52: 1350,
      weekLow52: 1000,
      weight: 5.0,
    },
    {
      id: "14",
      ticker: "LT",
      name: "Larsen & Toubro",
      sector: "Infrastructure",
      quantity: 8,
      avgCost: 2850,
      currentPrice: 3420,
      currentValue: 27360,
      dayChange: 1.6,
      totalReturn: 20.0,
      plAmount: 4560,
      healthScore: 83,
      pe: 32.4,
      roe: 15.6,
      marketCap: "₹4.8T",
      weekHigh52: 3650,
      weekLow52: 2650,
      weight: 4.4,
    },
    {
      id: "15",
      ticker: "HCLTECH",
      name: "HCL Technologies",
      sector: "IT",
      quantity: 18,
      avgCost: 1320,
      currentPrice: 1485,
      currentValue: 26730,
      dayChange: 0.7,
      totalReturn: 12.5,
      plAmount: 2970,
      healthScore: 85,
      pe: 26.8,
      roe: 22.3,
      marketCap: "₹4.0T",
      weekHigh52: 1600,
      weekLow52: 1220,
      weight: 4.3,
    },
  ];

  // Mock transactions for expanded view
  const getRecentTransactions = (ticker: string): Transaction[] => {
    return [
      { id: "1", date: "2 days ago", type: "buy", quantity: 10, price: 1800 },
      { id: "2", date: "1 week ago", type: "buy", quantity: 20, price: 1750 },
      { id: "3", date: "2 weeks ago", type: "sell", quantity: 5, price: 1820 },
    ];
  };

  // Mini chart data for inline expanded view
  const getMiniChartData = (ticker: string) => {
    const basePrice =
      holdings.find((h) => h.ticker === ticker)?.currentPrice || 1000;
    return Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      price: basePrice * (0.92 + Math.random() * 0.16),
    }));
  };

  // Computed values
  const totalValue = useMemo(
    () => holdings.reduce((sum, h) => sum + h.currentValue, 0),
    [holdings],
  );

  const totalInvested = useMemo(
    () => holdings.reduce((sum, h) => sum + h.quantity * h.avgCost, 0),
    [holdings],
  );

  const totalGain = useMemo(
    () => holdings.reduce((sum, h) => sum + h.plAmount, 0),
    [holdings],
  );

  const totalGainPercent = useMemo(
    () => (totalGain / totalInvested) * 100,
    [totalGain, totalInvested],
  );

  // Filtering and sorting
  const filteredAndSortedHoldings = useMemo(() => {
    let filtered = holdings.filter((h) => {
      const matchesSearch =
        searchQuery === "" ||
        h.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSector = sectorFilter === "all" || h.sector === sectorFilter;

      const matchesHealth =
        healthFilter === "all" ||
        (healthFilter === "excellent" && h.healthScore >= 85) ||
        (healthFilter === "good" &&
          h.healthScore >= 70 &&
          h.healthScore < 85) ||
        (healthFilter === "fair" &&
          h.healthScore >= 50 &&
          h.healthScore < 70) ||
        (healthFilter === "poor" && h.healthScore < 50);

      const matchesReturn =
        returnFilter === "all" ||
        (returnFilter === "high" && h.totalReturn >= 15) ||
        (returnFilter === "medium" &&
          h.totalReturn >= 5 &&
          h.totalReturn < 15) ||
        (returnFilter === "low" && h.totalReturn >= 0 && h.totalReturn < 5) ||
        (returnFilter === "negative" && h.totalReturn < 0);

      return matchesSearch && matchesSector && matchesHealth && matchesReturn;
    });

    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    holdings,
    searchQuery,
    sectorFilter,
    healthFilter,
    returnFilter,
    sortBy,
    sortOrder,
  ]);

  // Get unique sectors
  const sectors = useMemo(
    () => Array.from(new Set(holdings.map((h) => h.sector))),
    [holdings],
  );

  // Best and worst performers
  const bestPerformer = useMemo(
    () => [...holdings].sort((a, b) => b.totalReturn - a.totalReturn)[0],
    [holdings],
  );

  const worstPerformer = useMemo(
    () => [...holdings].sort((a, b) => a.totalReturn - b.totalReturn)[0],
    [holdings],
  );

  // Helper functions
  const getHealthColor = (score: number) => {
    if (score >= 85)
      return "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400";
    if (score >= 70)
      return "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400";
    if (score >= 50)
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400";
    return "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400";
  };

  const getHealthBadge = (score: number) => {
    if (score >= 85)
      return {
        label: "Excellent",
        color: "border-green-500 bg-green-500/30 text-green-200",
      };
    if (score >= 70)
      return {
        label: "Good",
        color: "border-amber-500 bg-amber-500/30 text-amber-200",
      };
    if (score >= 50)
      return {
        label: "Fair",
        color: "border-yellow-500 bg-yellow-500/30 text-yellow-200",
      };
    return {
      label: "Poor",
      color: "border-red-500 bg-red-500/30 text-red-200",
    };
  };

  const handleSort = (column: keyof Holding) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const toggleSelectHolding = (id: string) => {
    const newSet = new Set(selectedHoldings);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedHoldings(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedHoldings.size === filteredAndSortedHoldings.length) {
      setSelectedHoldings(new Set());
    } else {
      setSelectedHoldings(new Set(filteredAndSortedHoldings.map((h) => h.id)));
    }
  };

  const handleAddStock = (data:any) => {
    // Handle adding stock to watchlist
    console.log("Adding stock:", data);
    // TODO: Implement actual add stock logic
  };

  const handleCreateWatchlist = (name: string) => {
    if (!watchlists.includes(name)) {
      setWatchlists([...watchlists, name]);
    }
  };

  const handleCompare = () => {
    const selectedIds = Array.from(selectedHoldings);
    const selectedStocks = holdings.filter((h) => selectedIds.includes(h.id));

    if (selectedStocks.length === 1) {
      // Navigate to comparison page with left side pre-filled
      router.push(`/comparison?left=${selectedStocks[0].ticker}`);
    } else if (selectedStocks.length === 2) {
      // Navigate directly to comparison result page
      const ticker1 = selectedStocks[0].ticker.toLowerCase();
      const ticker2 = selectedStocks[1].ticker.toLowerCase();
      router.push(`/comparison/${ticker1}-vs-${ticker2}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-[1600px]">
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: HOLDINGS COMMAND CENTER (Control Panel)
      ═══════════════════════════════════════════════════════════════ */}
      <div id="holdings-command-center" className="space-y-4">
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total Holdings
                  </p>
                  <p className="text-2xl font-bold">{holdings.length}</p>
                </div>
                <Briefcase className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total Invested
                  </p>
                  <p className="text-2xl font-bold">
                    ₹{(totalInvested / 1000).toFixed(0)}K
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Current Value</p>
                  <p className="text-2xl font-bold">
                    ₹{(totalValue / 1000).toFixed(0)}K
                  </p>
                </div>
                <Activity className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total P&L</p>
                  <p
                    className={`text-2xl font-bold ${
                      totalGain >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {totalGain >= 0 ? "+" : ""}₹{(totalGain / 1000).toFixed(0)}K
                  </p>
                  <p
                    className={`text-xs ${
                      totalGain >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {totalGain >= 0 ? "+" : ""}
                    {totalGainPercent.toFixed(2)}%
                  </p>
                </div>
                <TrendingUp
                  className={`w-8 h-8 ${
                    totalGain >= 0 ? "text-green-500" : "text-red-500"
                  } opacity-50`}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: FILTERS & ACTIONS TOOLBAR
      ═══════════════════════════════════════════════════════════════ */}
      <Card id="filters-actions-toolbar">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search and Primary Actions */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ticker or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stock
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            <AddStockModal
              open={showAddModal}
              onClose={() => setShowAddModal(false)}
              watchlists={watchlists}
              onAddStock={handleAddStock}
              onCreateWatchlist={handleCreateWatchlist}
            />

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {sectorFilter === "all" ? "All Sectors" : sectorFilter}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSectorFilter("all")}>
                    All Sectors
                  </DropdownMenuItem>
                  {sectors.map((sector) => (
                    <DropdownMenuItem
                      key={sector}
                      onClick={() => setSectorFilter(sector)}
                    >
                      {sector}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {healthFilter === "all"
                      ? "All Health Levels"
                      : healthFilter === "excellent"
                        ? "Excellent (85+)"
                        : healthFilter === "good"
                          ? "Good (70-84)"
                          : healthFilter === "fair"
                            ? "Fair (50-69)"
                            : "Poor (<50)"}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setHealthFilter("all")}>
                    All Health Levels
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setHealthFilter("excellent")}
                  >
                    Excellent (85+)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setHealthFilter("good")}>
                    Good (70-84)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setHealthFilter("fair")}>
                    Fair (50-69)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setHealthFilter("poor")}>
                    Poor (&lt;50)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {returnFilter === "all"
                      ? "All Return Ranges"
                      : returnFilter === "high"
                        ? "High (15%+)"
                        : returnFilter === "medium"
                          ? "Medium (5-15%)"
                          : returnFilter === "low"
                            ? "Low (0-5%)"
                            : "Negative"}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setReturnFilter("all")}>
                    All Return Ranges
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setReturnFilter("high")}>
                    High Returns (15%+)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setReturnFilter("medium")}>
                    Medium (5-15%)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setReturnFilter("low")}>
                    Low (0-5%)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setReturnFilter("negative")}>
                    Negative Returns
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {(searchQuery ||
                sectorFilter !== "all" ||
                healthFilter !== "all" ||
                returnFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSectorFilter("all");
                    setHealthFilter("all");
                    setReturnFilter("all");
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Results Count */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredAndSortedHoldings.length} of {holdings.length}{" "}
              holdings
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: MAIN HOLDINGS DISPLAY - TABLE VIEW
      ═══════════════════════════════════════════════════════════════ */}

      <Card id="main-holdings-display">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <button onClick={toggleSelectAll} className="p-0">
                      {selectedHoldings.size ===
                        filteredAndSortedHoldings.length &&
                      filteredAndSortedHoldings.length > 0 ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("ticker")}
                      className="flex items-center gap-2 font-semibold hover:text-foreground"
                    >
                      Stock <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => handleSort("quantity")}
                      className="flex items-center gap-2 font-semibold hover:text-foreground ml-auto"
                    >
                      Qty <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => handleSort("avgCost")}
                      className="flex items-center gap-2 font-semibold hover:text-foreground ml-auto"
                    >
                      Avg Cost <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => handleSort("currentPrice")}
                      className="flex items-center gap-2 font-semibold hover:text-foreground ml-auto"
                    >
                      Current <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => handleSort("currentValue")}
                      className="flex items-center gap-2 font-semibold hover:text-foreground ml-auto"
                    >
                      Value <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => handleSort("dayChange")}
                      className="flex items-center gap-2 font-semibold hover:text-foreground ml-auto"
                    >
                      Day % <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => handleSort("totalReturn")}
                      className="flex items-center gap-2 font-semibold hover:text-foreground ml-auto"
                    >
                      Total Return <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-center">
                    <button
                      onClick={() => handleSort("healthScore")}
                      className="flex items-center gap-2 font-semibold hover:text-foreground mx-auto"
                    >
                      Health <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">P/E</TableHead>
                  <TableHead className="text-right">ROE</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedHoldings.map((holding) => (
                  <React.Fragment key={holding.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() =>
                        setExpandedRow(
                          expandedRow === holding.id ? null : holding.id,
                        )
                      }
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSelectHolding(holding.id)}
                          className="p-0"
                        >
                          {selectedHoldings.has(holding.id) ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {holding.ticker}
                            {expandedRow === holding.id ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {holding.name}
                          </div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {holding.sector}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {holding.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{holding.avgCost.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{holding.currentPrice.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{(holding.currentValue / 1000).toFixed(1)}K
                        <div className="text-xs text-muted-foreground">
                          {holding.weight}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            holding.dayChange >= 0
                              ? "text-green-600 font-medium"
                              : "text-red-600 font-medium"
                          }
                        >
                          {holding.dayChange >= 0 ? "+" : ""}
                          {holding.dayChange.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className={
                            holding.totalReturn >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          <div className="font-semibold">
                            {holding.totalReturn >= 0 ? "+" : ""}
                            {holding.totalReturn.toFixed(2)}%
                          </div>
                          <div className="text-xs">
                            {holding.plAmount >= 0 ? "+" : ""}₹
                            {(holding.plAmount / 1000).toFixed(1)}K
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getHealthBadge(holding.healthScore) && (
                          <Badge
                            className={
                              getHealthBadge(holding.healthScore).color
                            }
                          >
                            {holding.healthScore}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {holding.pe}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {holding.roe}%
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Position
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Full Analysis
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Bell className="w-4 h-4 mr-2" />
                                Add Alert
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Sell
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* ═══════════════════════════════════════════════════════════════
                          INLINE EXPANDED VIEW
                      ═══════════════════════════════════════════════════════════════ */}
                    {expandedRow === holding.id && (
                      <TableRow>
                        <TableCell colSpan={12} className="bg-muted/30 p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Mini Chart */}
                            <div className="md:col-span-2 space-y-3">
                              <h4 className="text-sm font-semibold flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />1 Month
                                Performance
                              </h4>
                              <div className="bg-background rounded-lg border p-4">
                                <ResponsiveContainer width="100%" height={180}>
                                  <LineChart
                                    data={getMiniChartData(holding.ticker)}
                                    margin={{
                                      top: 5,
                                      right: 5,
                                      left: 5,
                                      bottom: 5,
                                    }}
                                  >
                                    <defs>
                                      <linearGradient
                                        id={`colorPrice-${holding.id}`}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop
                                          offset="5%"
                                          stopColor="var(--primary)"
                                          stopOpacity={0.3}
                                        />
                                        <stop
                                          offset="95%"
                                          stopColor="var(--primary)"
                                          stopOpacity={0}
                                        />
                                      </linearGradient>
                                    </defs>
                                    <XAxis
                                      dataKey="day"
                                      stroke="var(--muted-foreground)"
                                      fontSize={10}
                                      tickLine={false}
                                      axisLine={false}
                                      tickFormatter={(value) => `D${value}`}
                                    />
                                    <YAxis
                                      stroke="var(--muted-foreground)"
                                      fontSize={10}
                                      tickLine={false}
                                      axisLine={false}
                                      tickFormatter={(value) =>
                                        `₹${(value / 1000).toFixed(0)}K`
                                      }
                                      domain={["dataMin - 50", "dataMax + 50"]}
                                    />
                                    <RechartsTooltip
                                      contentStyle={{
                                        backgroundColor: "var(--popover)",
                                        border: "1px solid var(--border)",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                      }}
                                      labelStyle={{
                                        color: "var(--foreground)",
                                        fontWeight: "600",
                                      }}
                                      formatter={(value: any) => [
                                        `₹${value.toFixed(2)}`,
                                        "Price",
                                      ]}
                                      labelFormatter={(label) => `Day ${label}`}
                                    />
                                    <Line
                                      type="monotone"
                                      dataKey="price"
                                      stroke="var(--primary)"
                                      strokeWidth={2.5}
                                      dot={false}
                                      activeDot={{ r: 4, strokeWidth: 2 }}
                                      fill={`url(#colorPrice-${holding.id})`}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>

                              {/* Recent Activity */}
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold mb-3">
                                  Recent Activity
                                </h4>
                                <div className="space-y-2">
                                  {getRecentTransactions(holding.ticker).map(
                                    (txn) => (
                                      <div
                                        key={txn.id}
                                        className="flex items-center justify-between text-sm p-2 bg-background rounded border"
                                      >
                                        <div className="flex items-center gap-3">
                                          <Badge
                                            variant={
                                              txn.type === "buy"
                                                ? "default"
                                                : "secondary"
                                            }
                                          >
                                            {txn.type.toUpperCase()}
                                          </Badge>
                                          <span className="text-muted-foreground">
                                            {txn.date}
                                          </span>
                                        </div>
                                        <div className="text-right">
                                          <div className="font-medium">
                                            {txn.quantity} shares @ ₹{txn.price}
                                          </div>
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Key Metrics */}
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold">
                                Key Metrics
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-background rounded-lg border">
                                  <p className="text-xs text-muted-foreground">
                                    P/E Ratio
                                  </p>
                                  <p className="text-lg font-bold">
                                    {holding.pe}
                                  </p>
                                </div>
                                <div className="p-3 bg-background rounded-lg border">
                                  <p className="text-xs text-muted-foreground">
                                    ROE
                                  </p>
                                  <p className="text-lg font-bold">
                                    {holding.roe}%
                                  </p>
                                </div>
                                <div className="p-3 bg-background rounded-lg border">
                                  <p className="text-xs text-muted-foreground">
                                    Market Cap
                                  </p>
                                  <p className="text-sm font-bold">
                                    {holding.marketCap}
                                  </p>
                                </div>
                                <div className="p-3 bg-background rounded-lg border">
                                  <p className="text-xs text-muted-foreground">
                                    52W High
                                  </p>
                                  <p className="text-sm font-bold">
                                    ₹{holding.weekHigh52}
                                  </p>
                                </div>
                                <div className="p-3 bg-background rounded-lg border">
                                  <p className="text-xs text-muted-foreground">
                                    52W Low
                                  </p>
                                  <p className="text-sm font-bold">
                                    ₹{holding.weekLow52}
                                  </p>
                                </div>
                                <div className="p-3 bg-background rounded-lg border">
                                  <p className="text-xs text-muted-foreground">
                                    Current vs Avg
                                  </p>
                                  <p
                                    className={`text-sm font-bold ${
                                      holding.currentPrice > holding.avgCost
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {(
                                      ((holding.currentPrice -
                                        holding.avgCost) /
                                        holding.avgCost) *
                                      100
                                    ).toFixed(1)}
                                    %
                                  </p>
                                </div>
                              </div>

                              {/* Quick Notes */}
                              <div className="mt-4 p-3 bg-background rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-semibold text-muted-foreground">
                                    Quick Notes
                                  </p>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground italic">
                                  No notes yet. Click to add your thoughts...
                                </p>
                              </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="md:col-span-3 flex gap-2 pt-4 border-t">
                              <Button variant="outline" size="sm">
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Full Analysis
                              </Button>
                              <Button variant="outline" size="sm">
                                <Heart className="w-4 h-4 mr-2" />
                                Add to Watchlist
                              </Button>
                              <Button variant="outline" size="sm">
                                <Bell className="w-4 h-4 mr-2" />
                                Set Alert
                              </Button>
                              <Button variant="outline" size="sm">
                                <StickyNote className="w-4 h-4 mr-2" />
                                Add Note
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          ALLOCATION ANALYSIS
      ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Are you putting all your eggs in one basket?
          </p>
          <h3 className="text-xl font-bold flex items-center gap-2">
            🧩 Allocation Analysis
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sector Concentration */}
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Sector Concentration
              </CardTitle>
              <CardDescription>
                Weight distribution across sectors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Treemap-style visualization */}
              <div className="grid grid-cols-3 gap-2 h-48">
                {sectorConcentration.map((sector, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg p-3 flex flex-col justify-between transition-all hover:scale-105 cursor-pointer ${
                      idx === 0 ? "col-span-2 row-span-2" : ""
                    }`}
                    style={{
                      backgroundColor: sector.color + "20",
                      borderLeft: `4px solid ${sector.color}`,
                    }}
                  >
                    <div>
                      <p className="text-xs font-medium">{sector.sector}</p>
                      {sector.alert && (
                        <AlertTriangle className="w-3 h-3 text-red-500 mt-1" />
                      )}
                    </div>
                    <p className="text-lg font-bold">{sector.percentage}%</p>
                  </div>
                ))}
              </div>

              {/* Critical Alert */}
              {sectorConcentration.some((s) => s.alert) && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg mt-14">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                        ⚠️ High Sector Risk
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        Your 38% exposure to IT makes you vulnerable to tech
                        sector volatility.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock Weighting */}
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Top 5 Holdings
              </CardTitle>
              <CardDescription>
                Concentration in your largest positions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {topHoldings.map((holding, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-semibold">{holding.symbol}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          {holding.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">
                          ₹{holding.value.toLocaleString()}
                        </span>
                        <span className="font-bold w-12 text-right">
                          {holding.weight}%
                        </span>
                      </div>
                    </div>
                    <Progress value={holding.weight} className="h-2" />
                  </div>
                ))}
              </div>

              {/* Concentration Ratio */}
              <div className="pt-4 border-t border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Concentration Ratio
                  </span>
                  <span className="text-lg font-bold">
                    {concentrationRatio}%
                  </span>
                </div>
                <Progress value={concentrationRatio} className="h-2 mb-2" />
                <div className="flex items-center gap-2">
                  {concentrationRatio > 60 ? (
                    <>
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950/20"
                      >
                        Top Heavy
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Consider diversifying beyond top 5
                      </p>
                    </>
                  ) : (
                    <>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950/20"
                      >
                        Well Diversified
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Good balance across holdings
                      </p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5: BULK ACTIONS BAR (when stocks selected)
      ═══════════════════════════════════════════════════════════════ */}
      {selectedHoldings.size > 0 && (
        <div
          id="bulk-actions-bar"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4"
        >
          <Card className="shadow-2xl border-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="font-semibold">
                  {selectedHoldings.size} stocks selected
                </div>
                <div className="h-6 w-px bg-border" />
                <div className="flex gap-2">
                  {selectedHoldings.size > 0 && selectedHoldings.size < 3 && (
                    <Button size="sm" variant="outline" onClick={handleCompare}>
                      <GitCompare className="w-4 h-4 mr-2" />
                      Compare ({selectedHoldings.size})
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button size="sm" variant="outline">
                    <Bell className="w-4 h-4 mr-2" />
                    Set Alerts
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedHoldings(new Set())}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Deselect All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HoldingsPage;
