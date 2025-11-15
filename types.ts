
export enum ProductCategory {
  Electronics = "إلكترونيات",
  Clothing = "ملابس",
  Appliances = "أجهزة",
  Tools = "أدوات",
  Other = "غيرها",
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  images: string[];
}

export interface Wilaya {
  id: number;
  name: string;
}

export interface DeliveryFee {
  wilayaId: number;
  fee: number;
}

export interface Order {
  id: string;
  product: Product;
  customerName: string;
  phone: string;
  wilaya: string;
  municipality: string;
  address: string;
  totalPrice: number;
  deliveryFee: number;
  timestamp: Date;
}
