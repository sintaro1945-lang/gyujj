import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  QrCode,
  CheckCircle2,
  Printer,
  Package,
  ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, Product, Transaction, TransactionItem } from '../lib/db';
import { cn, formatCurrency } from '../lib/utils';

export default function PosTerminal() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<(TransactionItem & { product: Product })[]>([]);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qris'>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [isSuccessModal, setIsSuccessModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  const products = useLiveQuery(
    () => db.products.where('name').startsWithIgnoreCase(search).toArray(),
    [search]
  );

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = total * 0.11; // 11% PPN
  const grandTotal = total + tax;

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Stok habis!');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('Stok tidak mencukupi!');
          return prev;
        }
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [...prev, { 
        productId: product.id!, 
        name: product.name, 
        price: product.price, 
        quantity: 1, 
        subtotal: product.price,
        product
      }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        if (newQty > item.product.stock && delta > 0) {
          alert('Stok tidak mencukupi!');
          return item;
        }
        return { ...item, quantity: newQty, subtotal: newQty * item.price };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const processPayment = async () => {
    const cash = parseFloat(cashReceived);
    if (paymentMethod === 'cash' && (isNaN(cash) || cash < grandTotal)) {
      alert('Uang tunai tidak mencukupi!');
      return;
    }

    const transaction: Transaction = {
      timestamp: Date.now(),
      items: cart.map(({ product, ...rest }) => ({ ...rest })),
      total: grandTotal,
      tax,
      discount: 0,
      paymentMethod,
      cashReceived: paymentMethod === 'cash' ? cash : undefined,
      change: paymentMethod === 'cash' ? cash - grandTotal : undefined
    };

    try {
      await db.transaction('rw', db.products, db.transactions, async () => {
        // Dedust stock
        for (const item of cart) {
          const product = await db.products.get(item.productId);
          if (product) {
            await db.products.update(item.productId, {
              stock: product.stock - item.quantity
            });
          }
        }
        const id = await db.transactions.add(transaction);
        setLastTransaction({ ...transaction, id });
      });

      setIsSuccessModal(true);
      setPaymentModal(false);
      setCart([]);
      setCashReceived('');
    } catch (error) {
      console.error(error);
      alert('Gagal memproses transaksi');
    }
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full pb-20 lg:pb-0">
      {/* Left: Product Selection */}
      <div className="flex-[1.5] flex flex-col gap-6 overflow-hidden">
        <div className="flex gap-4">
          <div className="flex-1 bg-white border-2 border-zinc-900 px-4 py-3 flex items-center gap-3">
            <Search className="text-zinc-400" size={20} />
            <input 
              type="text" 
              placeholder="Scan Barcode / Cari Produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent w-full focus:outline-none font-bold placeholder-zinc-300"
            />
          </div>
          <button className="w-14 h-14 bg-blue-600 text-white flex items-center justify-center cursor-pointer shadow-lg active:scale-95 transition-transform">
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex gap-2 pb-2 overflow-x-auto custom-scrollbar whitespace-nowrap">
          <button className="px-4 py-2 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Semua</button>
          {['Sembako', 'Minuman', 'Makanan', 'Elektronik', 'Kesehatan'].map(cat => (
            <button key={cat} className="px-4 py-2 bg-white border border-zinc-200 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-full hover:border-zinc-900 transition-colors">{cat}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {!products || products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-300">
               <Package size={64} strokeWidth={1} className="mb-4 opacity-50" />
               <p className="font-black italic uppercase tracking-tighter text-xl">Produk Tidak Ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
              {products.map((product) => (
                <motion.button
                  key={product.id}
                  whileHover={{ y: -4, borderColor: '#2563eb' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addToCart(product)}
                  className="bg-white p-4 border-2 border-transparent shadow-sm flex flex-col items-start gap-3 text-left transition-all group relative overflow-hidden"
                >
                  <div className="w-full aspect-video rounded-lg bg-zinc-100 flex items-center justify-center overflow-hidden">
                    {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-zinc-300 font-black uppercase text-[10px] italic">No Image</span>
                    )}
                  </div>
                  <div className="w-full">
                    <h3 className="text-sm font-black text-zinc-900 leading-tight mb-1 line-clamp-2 italic">{product.name}</h3>
                    <div className="flex items-center justify-between mt-auto">
                        <span className="text-blue-600 font-black text-base italic tracking-tighter">{formatCurrency(product.price)}</span>
                        <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest",
                            product.stock > 5 ? "text-zinc-400" : "text-red-500"
                        )}>
                            Stok: {product.stock}
                        </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Checkout Sidebar */}
      <div className="flex-1 bg-white border-l border-zinc-200 flex flex-col -m-4 md:-m-6 lg:-m-8 md:ml-0 overflow-hidden">
        <div className="p-8 flex flex-col h-full">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic">Keranjang</h2>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{cart.length} Produk</span>
          </div>

          <div className="flex-1 overflow-y-auto px-1 flex flex-col gap-6 custom-scrollbar mb-8">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-200">
                 <ShoppingCart size={80} strokeWidth={1} className="mb-4" />
                 <p className="text-[10px] font-black uppercase tracking-[0.3em]">Kosong</p>
              </div>
            ) : (
              cart.map((item) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={item.productId}
                  className="flex gap-4 items-center border-b border-zinc-100 pb-4 group"
                >
                  <div className="w-12 h-12 bg-zinc-100 rounded-lg shrink-0 flex items-center justify-center overflow-hidden">
                     {item.product.image ? (
                          <img src={item.product.image} alt={item.name} className="w-full h-full object-cover" />
                     ) : (
                          <Package size={20} className="text-zinc-300" />
                     )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-zinc-900 leading-tight italic truncate">{item.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center bg-zinc-100 rounded-md p-0.5">
                            <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 hover:text-red-500 transition-colors"><Minus size={12} strokeWidth={3} /></button>
                            <span className="w-6 text-center text-[10px] font-black">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 hover:text-blue-500 transition-colors"><Plus size={12} strokeWidth={3} /></button>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 italic">{formatCurrency(item.price)}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="font-black text-sm text-zinc-900 italic tracking-tighter">{formatCurrency(item.subtotal)}</span>
                    <button onClick={() => removeFromCart(item.productId)} className="text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="mt-auto pt-8 border-t-4 border-double border-zinc-200">
            <div className="flex justify-between text-zinc-500 font-bold text-[10px] uppercase tracking-widest mb-2">
              <span>Subtotal</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-zinc-500 font-bold text-[10px] uppercase tracking-widest mb-6">
              <span>Pajak (PPN 11%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between items-end mb-8">
              <span className="font-black text-zinc-900 uppercase text-[10px] tracking-widest">Total Bayar</span>
              <span className="text-5xl font-black tracking-tighter text-blue-600 italic leading-none">{formatCurrency(grandTotal)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
               <button onClick={() => {setPaymentMethod('cash'); setPaymentModal(true)}} className="py-4 border-2 border-zinc-900 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-100 transition-colors">Tunai</button>
               <button onClick={() => {setPaymentMethod('qris'); setPaymentModal(true)}} className="py-4 bg-zinc-900 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-800 transition-colors">Digital</button>
            </div>
            <button 
              disabled={cart.length === 0}
              onClick={() => setPaymentModal(true)}
              className="w-full py-6 bg-blue-600 text-white font-black text-2xl uppercase tracking-widest shadow-xl shadow-blue-200 active:translate-y-1 transition-all disabled:opacity-50 disabled:shadow-none italic"
            >
              BAYAR SEKARANG
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {paymentModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setPaymentModal(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="relative w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl"
             >
                <div className="p-8 pb-4">
                   <h3 className="text-2xl font-black text-slate-800 mb-6">Pembayaran</h3>
                   <div className="grid grid-cols-3 gap-3 mb-8">
                      <button 
                        onClick={() => setPaymentMethod('cash')}
                        className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                            paymentMethod === 'cash' ? "border-brand-blue bg-blue-50 text-brand-blue shadow-md shadow-blue-500/10" : "border-slate-100 text-slate-400 hover:bg-slate-50"
                        )}
                      >
                         <Banknote />
                         <span className="text-xs font-bold uppercase tracking-widest">Tunai</span>
                      </button>
                      <button 
                         onClick={() => setPaymentMethod('card')}
                         className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                            paymentMethod === 'card' ? "border-brand-blue bg-blue-50 text-brand-blue shadow-md shadow-blue-500/10" : "border-slate-100 text-slate-400 hover:bg-slate-50"
                        )}
                      >
                         <CreditCard />
                         <span className="text-xs font-bold uppercase tracking-widest">Debit</span>
                      </button>
                      <button 
                         onClick={() => setPaymentMethod('qris')}
                         className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                            paymentMethod === 'qris' ? "border-brand-blue bg-blue-50 text-brand-blue shadow-md shadow-blue-500/10" : "border-slate-100 text-slate-400 hover:bg-slate-50"
                        )}
                      >
                         <QrCode />
                         <span className="text-xs font-bold uppercase tracking-widest">QRIS</span>
                      </button>
                   </div>

                   {paymentMethod === 'cash' && (
                       <div className="space-y-4 mb-8">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Jumlah Terbayar</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">Rp</span>
                            <input 
                              autoFocus
                              type="number" 
                              placeholder="Masukan nominal..."
                              value={cashReceived}
                              onChange={(e) => setCashReceived(e.target.value)}
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-blue/20 text-2xl font-black text-slate-800"
                            />
                          </div>
                          {parseFloat(cashReceived) >= grandTotal && (
                              <div className="p-4 bg-green-50 rounded-xl border border-green-100 animate-in fade-in slide-in-from-top-2">
                                <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Kembalian</p>
                                <p className="text-xl font-black text-green-700">{formatCurrency(parseFloat(cashReceived) - grandTotal)}</p>
                              </div>
                          )}
                       </div>
                   )}

                   {paymentMethod !== 'cash' && (
                       <div className="mb-8 p-12 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-center">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
                              {paymentMethod === 'qris' ? <QrCode size={32} className="text-brand-blue" /> : <CreditCard size={32} className="text-brand-blue" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 italic">Menunggu konfirmasi terminal...</p>
                            <p className="text-xs text-slate-400 mt-1">Silahkan scan kode atau gesek kartu</p>
                          </div>
                       </div>
                   )}
                </div>

                <div className="p-8 pt-0 flex gap-4">
                   <button 
                     onClick={() => setPaymentModal(false)}
                     className="flex-1 py-4 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                   >
                     Batal
                   </button>
                   <button 
                     onClick={processPayment}
                     className="flex-[2] bg-brand-blue text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-600/30 active:scale-95 transition-all"
                   >
                     SELESAIKAN
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {isSuccessModal && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm bg-white rounded-[40px] overflow-hidden shadow-2xl p-10 flex flex-col items-center text-center"
                >
                    <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Transaksi Berhasil!</h3>
                    <p className="text-slate-500 mb-8 font-medium">Terima kasih atas kunjungannya di Gacor 88</p>
                    
                    {lastTransaction && (
                        <div className="w-full p-6 bg-slate-50 rounded-3xl border border-slate-100 mb-8 space-y-2">
                             <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <span>Total Belanja</span>
                                <span>{formatCurrency(lastTransaction.total)}</span>
                             </div>
                             {lastTransaction.change !== undefined && (
                                 <div className="flex justify-between text-lg font-black text-slate-800">
                                    <span>Kembalian</span>
                                    <span className="text-green-600">{formatCurrency(lastTransaction.change)}</span>
                                 </div>
                             )}
                        </div>
                    )}

                    <div className="flex w-full gap-3">
                        <button 
                            onClick={printReceipt}
                            className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-800 text-white rounded-2xl font-black text-sm active:scale-95 transition-all"
                        >
                            <Printer size={18} /> STRUK
                        </button>
                        <button 
                            onClick={() => setIsSuccessModal(false)}
                            className="flex-1 py-4 bg-brand-blue text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-center"
                        >
                            LANJUT
                        </button>
                    </div>
                </motion.div>
                
                {/* Hidden Receipt for Printing */}
                <div id="receipt-print" className="hidden">
                   <div style={{fontFamily: 'monospace', fontSize: '12px', textAlign: 'center', width: '200px', margin: 'auto'}}>
                        <h2 style={{margin: '0'}}>GACOR 88</h2>
                        <p style={{margin: '0'}}>Jl. Keberuntungan No. 88</p>
                        <p style={{margin: '10px 0'}}>-------------------------</p>
                        <div style={{textAlign: 'left'}}>
                            {lastTransaction?.items.map((item, i) => (
                                <div key={i} style={{marginBottom: '5px'}}>
                                    <div>{item.name}</div>
                                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                        <span>{item.quantity} x {formatCurrency(item.price)}</span>
                                        <span>{formatCurrency(item.subtotal)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p style={{margin: '10px 0'}}>-------------------------</p>
                        <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold'}}>
                            <span>TOTAL</span>
                            <span>{formatCurrency(lastTransaction?.total || 0)}</span>
                        </div>
                        <p style={{margin: '10px 0'}}>-------------------------</p>
                        <p>Bayar: {lastTransaction?.paymentMethod.toUpperCase()}</p>
                        <p style={{marginTop: '20px'}}>Terima Kasih!</p>
                   </div>
                </div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
