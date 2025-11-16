export enum ProductCategory {
  Electronics = "إلكترونيات",
  Clothing = "ملابس",
  Appliances = "أجهزة",
  Tools = "أدوات",
  Other = "غيرها",
}

export interface Product {
  id: string; // Changed to string for Firestore compatibility
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  images: string[];
  videoUrl?: string; // Optional video URL
}

export interface Wilaya {
  id: number;
  name: string;
}

export interface DeliveryFee {
  wilayaId: number;
  fee: number;
}

export enum PaymentMethod {
  OnDelivery = "الدفع عند الاستلام",
  BaridiMob = "BaridiMob",
  CCP = "تحويل CCP",
}

export enum OrderStatus {
  New = "جديد",
  InProgress = "قيد التجهيز",
  Shipped = "تم الشحن",
  Delivered = "تم التوصيل",
  Cancelled = "ملغى",
}

export interface Order {
  id: string;
  productName: string;
  productId: string;
  productImage: string;
  pricePerItem: number;
  quantity: number;
  customerName: string;
  phone: string;
  wilaya: string;
  commune?: string;
  address: string;
  deliveryFee: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  status: OrderStatus;
  timestamp: any; // Firestore timestamp compatible
}