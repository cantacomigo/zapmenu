export interface Restaurant {
  id: string;
  name: string;
  slug: string; // Used for URL /#restaurant-slug
  phone: string; // WhatsApp number
  logo: string;
  coverImage: string; // Main/Fallback image
  coverImages?: string[]; // Array for Carousel
  address: string;
  isActive: boolean;
  // New Business Rules
  deliveryFee?: number;
  minOrderValue?: number;
  estimatedTime?: string; // e.g. "30-40 min"
  pixKey?: string; // New field for Online Payment
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'support';
  createdAt: number;
}

export interface RestaurantStaff {
  id: string;
  restaurantId: string;
  name: string;
  email: string;
  password?: string; // Optional in UI, required in logic
  role: 'manager' | 'kitchen' | 'waiter';
  createdAt?: number;
}

export interface CustomerUser {
  id: string;
  name: string;
  phone: string; // Used as Login ID
  password: string;
  address: string;
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
  stock?: number; // Inventory Control
}

export interface Promotion {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  originalPrice?: number;
  discountedPrice: number;
  image?: string;
  isActive: boolean;
}

export interface Giveaway {
  id: string;
  restaurantId: string;
  title: string;
  prize: string;
  description: string;
  drawDate: string; // ISO Date string (YYYY-MM-DD)
  image?: string;
  isActive: boolean;
  // Raffle Results
  winnerName?: string;
  winnerPhone?: string;
  drawnAt?: number;
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
  paymentMethod: 'credit' | 'debit' | 'cash' | 'pix';
  paymentDetails?: string; // Store details like "Troco para 50" or "Online"
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: number;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MANAGER = 'MANAGER',
  CUSTOMER = 'CUSTOMER',
  GUEST = 'GUEST' // Landing page
}

export type ViewState = 
  | { view: 'LANDING' }
  | { view: 'SUPER_ADMIN' }
  | { view: 'MANAGER_LOGIN' }
  | { view: 'MANAGER_DASHBOARD'; restaurantId: string }
  | { view: 'CUSTOMER_MENU'; slug: string };