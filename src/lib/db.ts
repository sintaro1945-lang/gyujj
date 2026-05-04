import Dexie, { type Table } from 'dexie';

export interface Product {
  id?: number;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  barcode?: string;
  image?: string;
}

export interface TransactionItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Transaction {
  id?: number;
  timestamp: number;
  items: TransactionItem[];
  total: number;
  tax: number;
  discount: number;
  paymentMethod: 'cash' | 'card' | 'qris';
  cashReceived?: number;
  change?: number;
}

export class AppDatabase extends Dexie {
  products!: Table<Product>;
  transactions!: Table<Transaction>;

  constructor() {
    super('Gacor88POS');
    this.version(1).stores({
      products: '++id, name, category, barcode',
      transactions: '++id, timestamp'
    });
  }
}

export const db = new AppDatabase();

export async function seedDatabase() {
  const count = await db.products.count();
  if (count === 0) {
    await db.products.bulkAdd([
      {
        name: 'Beras Premium 5kg',
        category: 'Sembako',
        price: 75000,
        costPrice: 68000,
        stock: 50,
        barcode: '8991234567890',
        image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&q=80&w=800'
      },
      {
        name: 'Minyak Goreng 2L',
        category: 'Sembako',
        price: 34000,
        costPrice: 31500,
        stock: 40,
        barcode: '8991234567891',
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=800'
      },
      {
        name: 'Gula Pasir 1kg',
        category: 'Sembako',
        price: 16500,
        costPrice: 15200,
        stock: 100,
        barcode: '8991234567892',
        image: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&q=80&w=800'
      },
      {
        name: 'Telur Ayam Broiler 1kg',
        category: 'Sembako',
        price: 28000,
        costPrice: 25000,
        stock: 15,
        barcode: '8991234567893',
        image: 'https://images.unsplash.com/photo-1553390774-b4822481c894?auto=format&fit=crop&q=80&w=800'
      },
      {
        name: 'Indomie Goreng Satuan',
        category: 'Sembako',
        price: 3100,
        costPrice: 2800,
        stock: 240,
        barcode: '8991234567894',
        image: 'https://images.unsplash.com/photo-1626074312411-9a9ed2c7e096?auto=format&fit=crop&q=80&w=800'
      },
      {
        name: 'Susu Kental Manis',
        category: 'Sembako',
        price: 12000,
        costPrice: 10500,
        stock: 36,
        barcode: '8991234567895',
        image: 'https://images.unsplash.com/photo-1550583724-125581cc258b?auto=format&fit=crop&q=80&w=800'
      }
    ]);
  }
}
