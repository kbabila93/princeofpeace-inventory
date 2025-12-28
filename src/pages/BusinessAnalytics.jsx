import React, { useState, useMemo } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Receipt,
  Sparkles,
  Calendar,
  BarChart3,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export default function BusinessAnalytics() {
  const [aiAdvice, setAiAdvice] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-date', 1000),
  });

  const { data: expenditures = [], isLoading: expLoading } = useQuery({
    queryKey: ['expenditures'],
    queryFn: () => base44.entities.Expenditure.list('-date', 1000),
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const totalProfit = sales.reduce((sum, s) => sum + (s.total_profit || 0), 0);
    const totalExpenses = expenditures.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const inventoryValue = products.reduce((sum, p) => {
      if (p.status === 'active') {
        return sum + ((p.quantity || 0) * (p.price || 0));
      }
      return sum;
    }, 0);

    const inventoryCost = products.reduce((sum, p) => {
      if (p.status === 'active') {
        return sum + ((p.quantity || 0) * (p.cost_price || 0));
      }
      return sum;
    }, 0);

    const currency = sales[0]?.currency || products[0]?.currency || 'USD';

    return {
      totalRevenue,
      totalProfit,
      totalExpenses,
      netProfit: totalProfit - totalExpenses,
      inventoryValue,
      inventoryCost,
      totalProducts: products.filter(p => p.status === 'active').length,
      totalSales: sales.length,
      currency
    };
  }, [sales, expenditures, products]);

  // Monthly breakdown
  const monthlyData = useMemo(() => {
    const months = {};
    
    sales.forEach(sale => {
      const date = new Date(sale.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = {
          month: monthKey,
          label: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          revenue: 0,
          profit: 0,
          expenses: 0,
          salesCount: 0
        };
      }
      
      months[monthKey].revenue += sale.total_amount || 0;
      months[monthKey].profit += sale.total_profit || 0;
      months[monthKey].salesCount += 1;
    });

    expenditures.forEach(exp => {
      const date = new Date(exp.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = {
          month: monthKey,
          label: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          revenue: 0,
          profit: 0,
          expenses: 0,
          salesCount: 0
        };
      }
      
      months[monthKey].expenses += exp.amount || 0;
    });

    // Calculate net profit
    Object.values(months).forEach(m => {
      m.netProfit = m.profit - m.expenses;
    });

    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
  }, [sales, expenditures]);

  // Selected month details
  const selectedMonthData = useMemo(() => {
    return monthlyData.find(m => m.month === selectedMonth) || null;
  }, [monthlyData, selectedMonth]);

  // Generate AI advice
  const generateAdviceMutation = useMutation({
    mutationFn: async () => {
      const prompt = `You are a business consultant analyzing a retail/inventory business. Based on the following data, provide actionable business advice:

Overall Statistics:
- Total Revenue: ${overallStats.currency} ${overallStats.totalRevenue.toFixed(2)}
- Total Profit: ${overallStats.currency} ${overallStats.totalProfit.toFixed(2)}
- Total Expenses: ${overallStats.currency} ${overallStats.totalExpenses.toFixed(2)}
- Net Profit: ${overallStats.currency} ${overallStats.netProfit.toFixed(2)}
- Inventory Value: ${overallStats.currency} ${overallStats.inventoryValue.toFixed(2)}
- Active Products: ${overallStats.totalProducts}
- Total Sales Transactions: ${overallStats.totalSales}

Recent Monthly Trend (last 3 months):
${monthlyData.slice(-3).map(m => `${m.label}: Revenue ${overallStats.currency} ${m.revenue.toFixed(2)}, Profit ${overallStats.currency} ${m.profit.toFixed(2)}, Expenses ${overallStats.currency} ${m.expenses.toFixed(2)}`).join('\n')}

Top Products by Revenue:
${sales.slice(0, 5).map(s => {
  try {
    const items = JSON.parse(s.items_json || "[]");
    return items.map(i => i.name).join(', ');
  } catch {
    return '';
  }
}).filter(Boolean).slice(0, 10).join(', ')}

Provide:
1. Overall business health assessment
2. 3-5 specific actionable recommendations
3. Areas of concern (if any)
4. Growth opportunities

Keep it practical and actionable. Format with clear sections.`;

      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      return response;
    },
    onSuccess: (data) => {
      setAiAdvice(data);
      toast.success("AI analysis complete");
    },
    onError: () => {
      toast.error("Failed to generate AI advice");
    }
  });

  const isLoading = salesLoading || expLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          Business Analytics & Insights
        </h1>
        <p className="text-gray-500 mt-1">Comprehensive business overview and AI-powered recommendations</p>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {overallStats.currency} {overallStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">From {overallStats.totalSales} sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overallStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {overallStats.currency} {overallStats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Profit margin: {overallStats.totalRevenue > 0 ? ((overallStats.netProfit / overallStats.totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {overallStats.currency} {overallStats.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">{expenditures.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Inventory Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {overallStats.currency} {overallStats.inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">{overallStats.totalProducts} active products</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList>
          <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="ai-advice">AI Business Advice</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
              <CardDescription>Select a month to view detailed breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {monthlyData.map(m => (
                  <Button
                    key={m.month}
                    variant={selectedMonth === m.month ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMonth(m.month)}
                  >
                    {m.label}
                  </Button>
                ))}
              </div>

              {selectedMonthData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-gray-600">Revenue</p>
                      <p className="text-2xl font-bold text-green-700">
                        {overallStats.currency} {selectedMonthData.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-gray-600">Gross Profit</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {overallStats.currency} {selectedMonthData.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-gray-600">Expenses</p>
                      <p className="text-2xl font-bold text-orange-700">
                        {overallStats.currency} {selectedMonthData.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className={`${selectedMonthData.netProfit >= 0 ? 'bg-purple-50 border-purple-200' : 'bg-red-50 border-red-200'}`}>
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-gray-600">Net Profit</p>
                      <p className={`text-2xl font-bold ${selectedMonthData.netProfit >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                        {overallStats.currency} {selectedMonthData.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses Trend</CardTitle>
              <CardDescription>Monthly comparison over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="#f97316" strokeWidth={2} name="Expenses" />
                  <Line type="monotone" dataKey="netProfit" stroke="#8b5cf6" strokeWidth={2} name="Net Profit" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Sales Volume</CardTitle>
              <CardDescription>Number of transactions per month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="salesCount" fill="#6366f1" name="Sales Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-advice" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    AI-Powered Business Advice
                  </CardTitle>
                  <CardDescription>Get personalized recommendations based on your business data</CardDescription>
                </div>
                <Button
                  onClick={() => generateAdviceMutation.mutate()}
                  disabled={generateAdviceMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {generateAdviceMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Advice
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!aiAdvice ? (
                <div className="text-center py-12 text-gray-500">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-300" />
                  <p className="font-medium">Click "Generate Advice" to get AI-powered business insights</p>
                  <p className="text-sm mt-2">Our AI will analyze your sales, expenses, and inventory data to provide actionable recommendations</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200 whitespace-pre-wrap">
                    {aiAdvice}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {overallStats.netProfit > 0 && (
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                    <p>Profitable business with positive net income</p>
                  </div>
                )}
                {overallStats.totalSales > 50 && (
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                    <p>Strong sales volume with {overallStats.totalSales} transactions</p>
                  </div>
                )}
                {overallStats.inventoryValue > 0 && (
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                    <p>Active inventory worth {overallStats.currency} {overallStats.inventoryValue.toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Areas to Monitor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {overallStats.totalRevenue > 0 && (overallStats.totalExpenses / overallStats.totalRevenue) > 0.5 && (
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                    <p>Expenses are {((overallStats.totalExpenses / overallStats.totalRevenue) * 100).toFixed(0)}% of revenue</p>
                  </div>
                )}
                {monthlyData.length > 1 && monthlyData[monthlyData.length - 1].revenue < monthlyData[monthlyData.length - 2].revenue && (
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                    <p>Recent month shows declining revenue trend</p>
                  </div>
                )}
                {overallStats.inventoryCost > overallStats.totalRevenue && (
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                    <p>High inventory value relative to sales - consider optimization</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}