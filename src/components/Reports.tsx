import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart,
  Calendar,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, startOfDay, endOfDay, subDays, eachDayOfInterval } from 'date-fns';
import { db } from '../lib/db';
import { formatCurrency, cn } from '../lib/utils';

export default function Reports() {
  const transactions = useLiveQuery(() => db.transactions.toArray());
  const products = useLiveQuery(() => db.products.toArray());

  const stats = useMemo(() => {
    if (!transactions || !products) return { totalSales: 0, totalProfit: 0, totalItems: 0, avgTicket: 0 };

    let sales = 0;
    let cost = 0;
    let items = 0;

    transactions.forEach(tx => {
      sales += tx.total;
      items += tx.items.reduce((sum, item) => sum + item.quantity, 0);

      tx.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          cost += product.costPrice * item.quantity;
        }
      });
    });

    return {
      totalSales: sales,
      totalProfit: sales - (sales * 0.11) - cost, // Net Profit (after tax & COGS)
      totalItems: items,
      avgTicket: transactions.length > 0 ? sales / transactions.length : 0
    };
  }, [transactions, products]);

  const chartData = useMemo(() => {
    if (!transactions) return [];

    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    return last7Days.map(day => {
      const dayStart = startOfDay(day).getTime();
      const dayEnd = endOfDay(day).getTime();

      const daySales = transactions
        .filter(tx => tx.timestamp >= dayStart && tx.timestamp <= dayEnd)
        .reduce((sum, tx) => sum + tx.total, 0);

      return {
        name: format(day, 'EEE'),
        sales: daySales
      };
    });
  }, [transactions]);

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-black text-zinc-900 italic tracking-tighter">Analisis Finansial</h2>
           <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-1">Laporan Performa Gacor 88</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 border-2 border-zinc-900 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-100 transition-all shadow-sm">
           <Download size={16} /> EXPORT DATA
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Omzet', value: formatCurrency(stats.totalSales), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Laba Bersih', value: formatCurrency(stats.totalProfit), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Item Terjual', value: `${stats.totalItems} Unit`, icon: ShoppingCart, color: 'text-orange-500', bg: 'bg-orange-50' },
            { label: 'Avg Ticket', value: formatCurrency(stats.avgTicket), icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <div key={i} className="p-6 bg-white border-2 border-zinc-900 shadow-[4px_4px_0_0_#18181b] relative overflow-hidden group">
                <div className="relative z-10">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-4 border border-zinc-200", stat.bg, stat.color)}>
                      <stat.icon size={20} strokeWidth={2.5} />
                  </div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-xl font-black text-zinc-900 italic tracking-tighter">{stat.value}</p>
                </div>
            </div>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
          {/* Sales Chart */}
          <div className="lg:col-span-2 bg-white border-2 border-zinc-900 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-zinc-900 italic tracking-tight">Tren Mingguan</h3>
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-widest italic">
                      Live Update
                  </div>
              </div>
              <div className="flex-1 w-full min-h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                          <XAxis 
                            dataKey="name" 
                            axisLine={{ stroke: '#18181b', strokeWidth: 2 }} 
                            tickLine={false} 
                            tick={{fontSize: 9, fontWeight: 900, fill: '#18181b', textTransform: 'uppercase'}} 
                          />
                          <YAxis 
                            axisLine={{ stroke: '#18181b', strokeWidth: 2 }} 
                            tickLine={false} 
                            tick={{fontSize: 9, fontWeight: 900, fill: '#111827'}}
                            tickFormatter={(val) => `Rp${val/1000}k`}
                          />
                          <Tooltip 
                            cursor={{fill: '#f1f5f9'}}
                            contentStyle={{ borderRadius: '0', border: '2px solid #18181b', boxShadow: '8px 8px 0 0 #2563eb', padding: '12px', fontFamily: 'monospace' }}
                            formatter={(val: number) => [formatCurrency(val), 'Sales']}
                          />
                          <Bar dataKey="sales">
                              {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#2563eb' : '#18181b'} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Breakdown / Info */}
          <div className="bg-zinc-900 p-10 text-white flex flex-col justify-between border-2 border-zinc-900 shadow-[8px_8px_0_0_#2563eb]">
              <div>
                  <h3 className="text-3xl font-black italic tracking-tighter mb-4">Summary</h3>
                  <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10">Pusat kontrol keuangan Gacor 88 Retail Group.</p>
                  
                  <div className="space-y-8">
                      <div className="flex items-center gap-6">
                          <span className="text-xs font-black text-blue-500 italic w-12 shrink-0">TAX</span>
                          <div className="flex-1">
                              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">PPN 11% Terkumpul</p>
                              <p className="text-lg font-black tracking-tighter">{formatCurrency(stats.totalSales * 0.11)}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-6">
                          <span className="text-xs font-black text-orange-500 italic w-12 shrink-0">COGS</span>
                          <div className="flex-1">
                              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Estimasi Harga Pokok</p>
                              <p className="text-lg font-black tracking-tighter">{formatCurrency(stats.totalSales - stats.totalProfit - (stats.totalSales * 0.11))}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-6">
                          <span className="text-xs font-black text-emerald-500 italic w-12 shrink-0">NET</span>
                          <div className="flex-1">
                              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Margin Keuntungan</p>
                              <p className="text-lg font-black tracking-tighter text-emerald-400">{stats.totalSales > 0 ? ((stats.totalProfit / stats.totalSales) * 100).toFixed(1) : 0}%</p>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="mt-12 p-5 bg-zinc-800 border-l-4 border-blue-600">
                  <p className="text-[10px] font-black leading-relaxed tracking-wider">
                    <span className="text-blue-500">ADVISORY:</span> Strategi optimasi stok diperlukan untuk kategori terlaris guna memaksimalkan profit margin bulan depan.
                  </p>
              </div>
          </div>
      </div>
    </div>
  );
}
