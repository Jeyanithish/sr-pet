export type Role = 'ROLE_USER' | 'ROLE_ADMIN';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED';

export type FulfillmentType = 'DELIVERY' | 'PICKUP';

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface Bird {
  id: number;
  name: string;
  category: string;
  ageTag?: string;
  description?: string;
  priceInr: number;
  stockQuantity: number;
  unitsSold: number;
  imageUrl?: string;
  active: boolean;
}

export interface BirdUpsertPayload {
  name: string;
  category: string;
  ageTag?: string;
  description?: string;
  priceInr: number;
  stockQuantity: number;
  imageUrl?: string;
  active?: boolean;
}

export interface CartItem {
  bird: Bird;
  quantity: number;
}

export interface CheckoutPayload {
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  fulfillmentType: FulfillmentType;
  items: { birdId: number; quantity: number }[];
}

export interface CheckoutResponse {
  orderCode: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  razorpayKeyId: string;
  totalInr: number;
}

export interface PaymentVerifyPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentVerifyResponse {
  orderCode: string;
  status: OrderStatus;
  razorpayPaymentId: string;
  message: string;
}

export interface OrderItem {
  birdId: number;
  birdName: string;
  unitPriceInr: number;
  quantity: number;
}

export interface Order {
  orderCode: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  fulfillmentType: FulfillmentType;
  subtotalInr: number;
  deliveryFeeInr: number;
  totalInr: number;
  status: OrderStatus;
  razorpayPaymentId?: string;
  createdAt: string;
  items: OrderItem[];
}

export interface RevenuePoint {
  label: string;
  revenueInr: number;
  ordersCount: number;
}

export interface SpeciesShare {
  category: string;
  revenueInr: number;
  unitsSold: number;
}

export interface StockVsSold {
  category: string;
  availableStock: number;
  unitsSold: number;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  activeOrders: number;
  totalStock: number;
  avgOrderValue: number;
  revenueTrend: RevenuePoint[];
  speciesShare: SpeciesShare[];
  stockVsSold: StockVsSold[];
}
