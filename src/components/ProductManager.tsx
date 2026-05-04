import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Package, 
  BarChart3,
  X,
  Upload,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, Product } from '../lib/db';
import { cn, formatCurrency } from '../lib/utils';

export default function ProductManager() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    category: 'Umum',
    price: 0,
    costPrice: 0,
    stock: 0,
    barcode: '',
    image: ''
  });

  const products = useLiveQuery(
    () => db.products.where('name').startsWithIgnoreCase(search).toArray(),
    [search]
  );

  const categories = ['Umum', 'Makanan', 'Minuman', 'Elektronik', 'Pakaian', 'Kesehatan'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct?.id) {
        await db.products.update(editingProduct.id, formData);
      } else {
        await db.products.add(formData);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        category: 'Umum',
        price: 0,
        costPrice: 0,
        stock: 0,
        barcode: '',
        image: ''
      });
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan produk');
    }
  };

  const deleteProduct = async (id: number) => {
    if (confirm('Hapus produk ini?')) {
      await db.products.delete(id);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        costPrice: product.costPrice,
        stock: product.stock,
        barcode: product.barcode || '',
        image: product.image || ''
    });
    setIsModalOpen(true);
  };

  const lowStockProducts = products?.filter(p => p.stock <= 5) || [];

  return (
    <div className="flex flex-col gap-8 h-full pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="text-3xl font-black text-zinc-900 italic tracking-tighter">Manajemen Inventori</h2>
           <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-1 underline decoration-blue-600 decoration-2 underline-offset-4">Database Produk v2.1</p>
        </div>
        <button 
          onClick={() => {
            setEditingProduct(null);
            setFormData({
              name: '',
              category: 'Umum',
              price: 0,
              costPrice: 0,
              stock: 0,
              barcode: '',
              image: ''
            });
            setIsModalOpen(true);
          }}
          className="btn-bold flex items-center gap-2"
        >
          <Plus size={20} strokeWidth={3} /> TAMBAH PRODUK
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
              {/* Search */}
              <div className="flex gap-4">
                  <div className="flex-1 bg-white border-2 border-zinc-900 px-4 py-3 flex items-center gap-3">
                    <Search className="text-zinc-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Cari ID atau nama produk..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-transparent w-full focus:outline-none font-bold placeholder-zinc-300 uppercase text-xs tracking-widest"
                    />
                  </div>
              </div>

              {/* Table */}
              <div className="bg-white border-2 border-zinc-900 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-zinc-900 text-[10px] font-black text-white uppercase tracking-[0.2em] border-b border-zinc-900">
                            <th className="px-6 py-5">Produk</th>
                            <th className="px-6 py-5">Kategori</th>
                            <th className="px-6 py-5">Modal</th>
                            <th className="px-6 py-5">Jual</th>
                            <th className="px-6 py-5">Stok</th>
                            <th className="px-6 py-5 text-right italic">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 italic">
                        {products?.map((product) => (
                            <tr key={product.id} className="hover:bg-zinc-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-zinc-100 shrink-0 border border-zinc-200 overflow-hidden">
                                            {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <Package size={20} className="text-zinc-300 m-auto mt-2" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-zinc-900 leading-tight">{product.name}</p>
                                            <p className="text-[10px] font-bold text-zinc-400">Barcode: {product.barcode || '---'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-black px-2 py-1 bg-zinc-900 text-white rounded-sm uppercase tracking-tighter italic">{product.category}</span>
                                </td>
                                <td className="px-6 py-4 text-xs font-bold text-zinc-500">
                                    {formatCurrency(product.costPrice)}
                                </td>
                                <td className="px-6 py-4 text-sm font-black text-blue-600 tracking-tighter italic">
                                    {formatCurrency(product.price)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-xs font-black p-1 leading-none rounded-sm border-2",
                                            product.stock <= 5 ? "text-red-500 border-red-500 bg-red-50" : "text-zinc-900 border-zinc-900 shadow-[2px_2px_0_0_#18181b50]"
                                        )}>{product.stock}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                          onClick={() => openEditModal(product)}
                                          className="p-2 text-zinc-400 hover:text-blue-600 transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                          onClick={() => deleteProduct(product.id!)}
                                          className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
          </div>

          <div className="space-y-6">
              <div className="p-8 bg-zinc-900 border-2 border-zinc-900 shadow-[8px_8px_0_0_#2563eb] text-white">
                  <BarChart3 className="mb-4 opacity-50 text-blue-500" size={32} />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">Stock Master</p>
                  <p className="text-4xl font-black italic tracking-tighter">{products?.length || 0} <span className="text-sm not-italic font-bold text-zinc-600">SKU</span></p>
              </div>

              {lowStockProducts.length > 0 && (
                  <div className="p-6 bg-white border-2 border-red-500 shadow-[8px_8px_0_0_#ef4444]">
                      <div className="flex items-center gap-2 text-red-500 mb-4 animate-pulse">
                        <AlertTriangle size={20} strokeWidth={3} />
                        <h4 className="text-[10px] font-black uppercase tracking-widest leading-none">Restock Required</h4>
                      </div>
                      <div className="space-y-3">
                          {lowStockProducts.map(p => (
                              <div key={p.id} className="flex items-center justify-between p-2 border-b border-zinc-100 last:border-0 italic">
                                  <span className="text-[11px] font-black text-zinc-900 truncate mr-2">{p.name}</span>
                                  <span className="text-[10px] font-black text-red-500">{p.stock} pcs</span>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* Modal CRUD */}
      <AnimatePresence>
          {isModalOpen && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsModalOpen(false)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-xl bg-white rounded-[32px] overflow-hidden shadow-2xl"
                  >
                      <form onSubmit={handleSubmit}>
                          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                              <h3 className="text-xl font-black text-slate-800">{editingProduct ? 'Ubah Produk' : 'Tambah Produk Baru'}</h3>
                              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X /></button>
                          </div>
                          
                          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[70vh]">
                              <div className="space-y-4 md:col-span-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Produk</label>
                                  <input 
                                    required
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-blue/20 font-bold"
                                    placeholder="Contoh: Indomie Goreng"
                                  />
                              </div>

                              <div className="space-y-4">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</label>
                                  <select 
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none font-bold"
                                  >
                                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                              </div>

                              <div className="space-y-4">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Barkode</label>
                                  <input 
                                    type="text" 
                                    value={formData.barcode}
                                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none font-bold"
                                    placeholder="Scan barkode barang..."
                                  />
                              </div>

                              <div className="space-y-4">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga Modal (Rp)</label>
                                  <input 
                                    required
                                    type="number" 
                                    value={formData.costPrice}
                                    onChange={(e) => setFormData({...formData, costPrice: parseFloat(e.target.value)})}
                                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none font-bold"
                                  />
                              </div>

                              <div className="space-y-4">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga Jual (Rp)</label>
                                  <input 
                                    required
                                    type="number" 
                                    value={formData.price}
                                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none font-bold text-brand-blue"
                                  />
                              </div>

                              <div className="space-y-4">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stok Awal</label>
                                  <input 
                                    required
                                    type="number" 
                                    value={formData.stock}
                                    onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none font-bold"
                                  />
                              </div>

                              <div className="space-y-4 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 group cursor-pointer hover:bg-slate-100 transition-colors">
                                 <Upload className="text-slate-300 group-hover:text-brand-blue transition-colors mb-2" />
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload Foto</p>
                                 <input type="file" className="hidden" />
                              </div>
                          </div>

                          <div className="p-8 pt-0">
                              <button 
                                type="submit"
                                className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                              >
                                SIMPAN PRODUK
                              </button>
                          </div>
                      </form>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
}
