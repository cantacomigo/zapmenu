export type ViewState = 
  | { view: 'LANDING' }
  | { view: 'SUPER_ADMIN' }
  | { view: 'MANAGER_LOGIN' }
  | { view: 'MANAGER_DASHBOARD', restaurantId: string }
  | { view: 'CUSTOMER_MENU', slug: string };

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  phone: string;
  logo: string;
  coverImage: string;
  coverImages: string[];
  address: string;
  isActive: boolean;
  deliveryFee?: number;
  minOrderValue?: number;
  estimatedTime?: string;
  pixKey?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'support';
  createdAt: number;
}

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  stock?: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: 'pix' | 'credit' | 'debit' | 'cash';
  paymentDetails?: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: number;
}

export interface RestaurantStaff {
  id: string;
  restaurantId: string;
  name: string;
  email: string;
  password?: string;
  role: 'manager' | 'kitchen' | 'waiter';
  createdAt: number;
}

export interface Promotion {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  originalPrice?: number;
  discountedPrice: number;
  image: string;
  isActive: boolean;
}

export interface Giveaway {
  id: string;
  restaurantId: string;
  title: string;
  prize: string;
  description: string;
  drawDate: string;
  image: string;
  isActive: boolean;
  winnerName?: string;
  winnerPhone?: string;
  drawnAt?: number;
}

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  password?: string;
  address: string;
  createdAt: number;
}