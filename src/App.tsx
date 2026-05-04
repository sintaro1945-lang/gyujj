import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  History, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { seedDatabase } from './lib/db';
import PosTerminal from './components/PosTerminal';
import ProductManager from './components/ProductManager';
import TransactionHistory from './components/TransactionHistory';
import Reports from './components/Reports';

type View = 'pos' | 'products' | 'history' | 'reports';

export default function App() {
  const [activeView, setActiveView] = useState<View>('pos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    seedDatabase();
  }, []);

  const navigation = [
    { id: 'pos', name: 'Kasir', icon: ShoppingCart },
    { id: 'products', name: 'Produk & Stok', icon: Package },
    { id: 'history', name: 'Riwayat', icon: History },
    { id: 'reports', name: 'Laporan', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-brand-zinc-light overflow-hidden font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-24 bg-black border-r border-zinc-800 items-center py-8">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-xl italic mb-10 shadow-lg">
          G88
        </div>
        
        <nav className="flex-1 flex flex-col gap-8">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              title={item.name}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-200 group",
                activeView === item.id 
                  ? "text-blue-500 scale-110" 
                  : "text-zinc-500 hover:text-white"
              )}
            >
              <item.icon size={24} strokeWidth={2.5} />
              <span className="text-[9px] font-black uppercase tracking-tight">{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <Store size={20} className="text-brand-blue" />
          <h1 className="text-lg font-black text-brand-blue tracking-tighter">GACOR 88</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-500"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 md:hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100">
                 <h1 className="text-xl font-black text-brand-blue tracking-tighter">GACOR 88</h1>
              </div>
              <nav className="p-4 space-y-2">
                {navigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                        setActiveView(item.id as View);
                        setIsSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                      activeView === item.id 
                        ? "bg-brand-blue text-white shadow-lg shadow-blue-900/20" 
                        : "text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    <item.icon size={20} />
                    {item.name}
                  </button>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-16 md:pt-0 overflow-hidden relative">
        {/* Top Header Desktop */}
        <header className="hidden md:flex h-20 bg-white border-b border-zinc-200 px-8 items-center justify-between shrink-0">
          <div className="flex flex-col">
            <h1 className="text-4xl font-black italic tracking-tighter text-blue-600 flex items-center gap-3">
              GACOR 88
              <span className="inline-block px-2 py-0.5 bg-red-500 text-white text-[10px] uppercase not-italic rounded-sm font-black">Live POS</span>
            </h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] -mt-1">Point of Sales System v4.0</p>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="flex flex-col items-end">
              <span className="text-sm font-black text-zinc-900 italic">Kasir #01</span>
              <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest leading-none">Shift Pagi</span>
            </div>
            <div className="w-12 h-12 bg-zinc-200 rounded-full border-2 border-white shadow-sm ring-1 ring-zinc-100 flex items-center justify-center overflow-hidden">
               <Store size={20} className="text-zinc-400" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeView === 'pos' && <PosTerminal />}
              {activeView === 'products' && <ProductManager />}
              {activeView === 'history' && <TransactionHistory />}
              {activeView === 'reports' && <Reports />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Stats Overlay */}
        <div className="hidden lg:flex absolute bottom-6 left-12 right-[420px] bg-zinc-900 text-white p-4 gap-8 items-center rounded-2xl shadow-2xl border border-zinc-800 z-30">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">Total Omset Hari Ini</span>
            <span className="text-xl font-black text-emerald-400 tracking-tighter italic">Rp 4.250.000</span>
          </div>
          <div className="w-px h-8 bg-zinc-700"></div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">Profit Terkini</span>
            <span className="text-xl font-black text-blue-400 tracking-tighter italic">Rp 1.120.500</span>
          </div>
          <div className="w-px h-8 bg-zinc-700"></div>
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">Target Penjualan</span>
              <span className="text-[9px] font-black italic">85%</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full w-[85%] rounded-full shadow-[0_0_10px_#2563eb]"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
