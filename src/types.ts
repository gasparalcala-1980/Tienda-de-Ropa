export type ProductCategory = 'dama' | 'caballero' | 'unisex' | 'ninos';

export type ProductType = 
  | 'jean' 
  | 'camisa' 
  | 'colonia' 
  | 'zapatos' 
  | 'vestido' 
  | 'accesorio' 
  | 'conjunto' 
  | 'otro' 
  | string;

export interface Product {
  id: string;
  name: string;
  productType?: ProductType; // 'jean', 'camisa', 'colonia', 'zapatos', 'vestido', 'accesorio', etc.
  category: ProductCategory;
  cut?: string; // Style / Cut / Aroma / Model
  priceUSD: number;
  tag?: string;
  rating: number;
  reviewsCount: number;
  description: string;
  image: string;
  gallery: string[];
  availableSizes: string[];
  inStock?: boolean;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  quantity: number;
}

export type PaymentMethodType = 'pago_movil' | 'transferencia' | 'efectivo_usd';
export type PurchaseModeType = 'contado' | 'credito';

export interface PaymentConfig {
  bcvRate: number; // e.g. 37.50 Bs / USD
  lastRateUpdate?: string;
  isAutoRate?: boolean;
  whatsappNumber: string;
  adminPin: string;
  securityQuestion?: string;
  securityAnswer?: string;
  pagoMovil: {
    bank: string;
    phone: string;
    idNumber: string;
    holderName: string;
  };
  transferencia: {
    bank: string;
    accountNumber: string;
    idNumber: string;
    holderName: string;
    accountType: string;
  };
  efectivo: {
    instructions: string;
  };
}

export interface CreditPayment {
  id: string;
  date: string;
  amountUSD: number;
  amountBS: number;
  rateBCV: number;
  method: string;
  reference: string;
  notes?: string;
}

export interface CreditPurchase {
  id: string;
  date: string;
  description: string;
  amountUSD: number;
}

export interface CreditClient {
  id: string;
  name: string;
  phone: string;
  idCard: string;
  saleType?: 'credito' | 'contado';
  secretCode?: string;
  totalPurchasedUSD: number;
  balanceUSD: number; // remaining debt in USD ($0 if fully paid)
  notes?: string;
  createdAt: string;
  purchases: CreditPurchase[];
  payments: CreditPayment[];
}

