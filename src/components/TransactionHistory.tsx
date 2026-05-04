import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Search, 
  Calendar, 
  Printer, 
  ChevronRight,
  Filter,
  FileText,
  History,
  ShoppingCart,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { db, Transaction } from '../lib/db';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function TransactionHistory() {
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const transactions = useLiveQuery(
    () => db.transactions.orderBy('timestamp').reverse().toArray(),
    []
  );

  const filteredTransactions = transactions?.filter(tx => 
    tx.id?.toString().includes(search) || 
    tx.items.some(item => item.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="text-3xl font-black text-zinc-900 italic tracking-tighter">Arsip Transaksi</h2>
           <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-1 underline decoration-zinc-900 decoration-2 underline-offset-4 font-sans">History Logger v3.0</p>
        </div>
        <div className="flex bg-white border-2 border-zinc-900 px-4 py-2 items-center gap-3 w-full md:w-80 shadow-sm">
            <Search className="text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari No. Resi atau Pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent w-full focus:outline-none font-bold text-xs uppercase tracking-widest placeholder-zinc-300"
            />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden">
          {/* List Section */}
          <div className="flex-[1.5] flex flex-col gap-4 overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-12">
                  {!filteredTransactions || filteredTransactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 bg-white border-2 border-dashed border-zinc-200">
                          <History size={48} className="text-zinc-200 mb-4" />
                          <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest leading-none">Belum Ada Transaksi</p>
                      </div>
                  ) : (
                      filteredTransactions.map((tx) => (
                          <motion.button
                            layout
                            key={tx.id}
                            onClick={() => setSelectedTx(tx)}
                            className={cn(
                                "w-full text-left p-6 transition-all border-2 flex items-center justify-between group",
                                selectedTx?.id === tx.id 
                                    ? "bg-zinc-900 border-zinc-900 text-white shadow-[8px_8px_0_0_#2563eb]" 
                                    : "bg-white border-transparent shadow-sm hover:border-zinc-900"
                            )}
                          >
                            <div className="flex items-center gap-6">
                                <div className={cn(
                                    "w-12 h-12 rounded-lg flex items-center justify-center border-2",
                                    selectedTx?.id === tx.id ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-100"
                                )}>
                                    <ShoppingCart size={20} className={selectedTx?.id === tx.id ? "text-blue-400" : "text-zinc-400"} />
                                </div>
                                <div>
                                    <p className={cn("text-[10px] font-black uppercase tracking-widest", selectedTx?.id === tx.id ? "text-zinc-500" : "text-zinc-400")}>
                                        {format(tx.timestamp, 'dd MMM yyyy • HH:mm')}
                                    </p>
                                    <h3 className="text-lg font-black italic tracking-tighter leading-tight">Order #{tx.id?.toString().slice(-4).toUpperCase()}</h3>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={cn("text-xl font-black italic tracking-tighter", selectedTx?.id === tx.id ? "text-blue-400" : "text-zinc-900")}>
                                    {formatCurrency(tx.total)}
                                </p>
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-50">{tx.items.length} Pesanan</p>
                            </div>
                          </motion.button>
                      ))
                  )}
              </div>
          </div>

          {/* Details Section */}
          <div className="flex-1 bg-white border-2 border-zinc-900 shadow-sm flex flex-col relative overflow-hidden">
              <AnimatePresence mode="wait">
                  {selectedTx ? (
                      <motion.div 
                        key={selectedTx.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col h-full"
                      >
                          <div className="p-8 border-b-2 border-dashed border-zinc-100">
                              <div className="flex justify-between items-start mb-10">
                                  <h3 className="text-3xl font-black italic tracking-tighter text-zinc-900">Nota Digital</h3>
                                  <button onClick={() => window.print()} className="text-zinc-300 hover:text-zinc-900 transition-colors"><Printer size={24} /></button>
                              </div>
                              <div className="space-y-3">
                                  <div className="flex justify-between">
                                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">ID Transaksi</span>
                                      <span className="text-[10px] font-black text-zinc-900 uppercase">TX-{selectedTx.id}</span>
                                  </div>
                                  <div className="flex justify-between">
                                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Waktu</span>
                                      <span className="text-[10px] font-black text-zinc-900 uppercase">{format(selectedTx.timestamp, 'dd/MM/yyyy HH:mm:ss')}</span>
                                  </div>
                                  <div className="flex justify-between">
                                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Metode</span>
                                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter italic font-black">{selectedTx.paymentMethod || 'TUNAI'}</span>
                                  </div>
                              </div>
                          </div>

                          <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar">
                              {selectedTx.items.map((item, i) => (
                                  <div key={i} className="flex justify-between items-start italic">
                                      <div className="flex-1 min-w-0 pr-4">
                                          <p className="text-xs font-black text-zinc-900 truncate tracking-tight">{item.name}</p>
                                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mt-1">{item.quantity} x {formatCurrency(item.price)}</p>
                                      </div>
                                      <span className="text-sm font-black text-zinc-900 italic tracking-tighter shrink-0">{formatCurrency(item.subtotal)}</span>
                                  </div>
                              ))}
                          </div>

                          <div className="p-8 bg-zinc-50 border-t-2 border-zinc-100">
                              <div className="flex justify-between text-zinc-500 font-bold text-[10px] uppercase tracking-widest mb-2">
                                  <span>Subtotal</span>
                                  <span>{formatCurrency(selectedTx.total - (selectedTx.tax || 0))}</span>
                              </div>
                              <div className="flex justify-between text-zinc-500 font-bold text-[10px] uppercase tracking-widest mb-6">
                                  <span>PPN (11%)</span>
                                  <span>{formatCurrency(selectedTx.tax || 0)}</span>
                              </div>
                              <div className="flex justify-between items-end">
                                  <span className="font-black text-zinc-900 uppercase text-[10px] tracking-widest">Total Bayar</span>
                                  <span className="text-3xl font-black tracking-tighter text-zinc-900 italic leading-none">{formatCurrency(selectedTx.total)}</span>
                              </div>
                          </div>
                      </motion.div>
                  ) : (
                      <div className="m-auto flex flex-col items-center justify-center p-12 text-center text-zinc-200">
                          <History size={100} strokeWidth={1} className="mb-6 opacity-40 rotate-12" />
                          <p className="text-sm font-black uppercase tracking-[0.4em] italic mb-2">Details Panel</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase leading-relaxed max-w-[200px]">Pilih salah satu rekaman transaksi untuk melihat rincian nota & statistik item.</p>
                      </div>
                  )}
              </AnimatePresence>
          </div>
      </div>
    </div>
  );
}
