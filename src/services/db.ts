import { supabase } from '../integrations/supabase/client';
import { AdminUser, Category, CustomerUser, Giveaway, MenuItem, Order, Promotion, Restaurant, RestaurantStaff } from "../types";
import { SEED_ADMINS, SEED_CATEGORIES, SEED_MENU_ITEMS, SEED_RESTAURANTS } from "../constants";

// Helper to handle response
const handle = async <T>(promise: Promise<any>): Promise<T[]> => {
    const { data, error } = await promise;
    if (error) {
        console.error("DB Error:", error);
        return [];
    }
    return data as T[];
};

// Mappers - Handling mixed schema
const toDbRestaurant = (r: Restaurant) => {
    const payload: any = {
        id: r.id,
        name: r.name,
        slug: r.slug,
        phone: r.phone,
        logo: r.logo,
        cover_image: r.coverImage,
        cover_images: r.coverImages,
        address: r.address,
        is_active: r.isActive,
        delivery_fee: r.deliveryFee,
        min_order_value: r.minOrderValue,
        estimated_time: r.estimatedTime,
        pix_key: r.pixKey
    };
    
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
    return payload;
};

const fromDbRestaurant = (r: any): Restaurant => {
    return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        phone: r.phone,
        logo: r.logo,
        coverImage: r.cover_image,
        coverImages: r.cover_images || [],
        address: r.address,
        isActive: r.is_active,
        deliveryFee: r.delivery_fee,
        minOrderValue: r.min_order_value,
        estimatedTime: r.estimated_time,
        pixKey: r.pix_key
    };
};

export const db = {
  // Utility: Seed Database
  seedDatabase: async () => {
    const dbRestaurants = SEED_RESTAURANTS.map(toDbRestaurant);
    await supabase.from('restaurants').upsert(dbRestaurants);
    await supabase.from('admins').upsert(SEED_ADMINS);
    await supabase.from('categories').upsert(SEED_CATEGORIES);
    await supabase.from('menu_items').upsert(SEED_MENU_ITEMS);
    return true;
  },

  // Restaurants
  getRestaurants: async (): Promise<Restaurant[]> => {
    const { data } = await supabase.from('restaurants').select('*');
    if (!data) return [];
    return data.map(fromDbRestaurant);
  },
  
  addRestaurant: async (rest: Restaurant) => {
    const payload = toDbRestaurant(rest);
    if (!payload.id) delete payload.id; 
    const { error } = await supabase.from('restaurants').insert(payload);
    return { error };
  },
  
  updateRestaurant: async (rest: Restaurant) => {
    const payload = toDbRestaurant(rest);
    const { error } = await supabase.from('restaurants').update(payload).eq('id', rest.id);
    return { error };
  },
  
  deleteRestaurant: async (id: string) => {
    await supabase.from('restaurants').delete().eq('id', id);
  },
  
  getRestaurantBySlug: async (slug: string): Promise<Restaurant | undefined> => {
    const { data } = await supabase.from('restaurants').select('*').eq('slug', slug).limit(1);
    if (data && data.length > 0) {
        return fromDbRestaurant(data[0]);
    }
    return undefined;
  },

  // Restaurant Staff
  getRestaurantStaff: async (restaurantId: string): Promise<RestaurantStaff[]> => {
    const { data } = await supabase.from('restaurant_staff').select('*').eq('restaurant_id', restaurantId);
    return (data || []) as RestaurantStaff[];
  },
  saveRestaurantStaff: async (staff: RestaurantStaff) => {
    const payload = { ...staff, restaurant_id: staff.restaurantId };
    delete (payload as any).restaurantId;
    await supabase.from('restaurant_staff').upsert(payload);
  },
  deleteRestaurantStaff: async (id: string) => {
    await supabase.from('restaurant_staff').delete().eq('id', id);
  },

  // Promotions
  getPromotions: async (restaurantId: string): Promise<Promotion[]> => {
    const { data } = await supabase.from('promotions').select('*').eq('restaurant_id', restaurantId);
    return (data || []) as Promotion[];
  },
  savePromotion: async (promo: Promotion) => {
    const payload = { ...promo, restaurant_id: promo.restaurantId, original_price: promo.originalPrice, discounted_price: promo.discountedPrice, is_active: promo.isActive };
    delete (payload as any).restaurantId;
    delete (payload as any).originalPrice;
    delete (payload as any).discountedPrice;
    delete (payload as any).isActive;
    await supabase.from('promotions').upsert(payload);
  },
  deletePromotion: async (id: string) => {
    await supabase.from('promotions').delete().eq('id', id);
  },

  // Giveaways
  getGiveaways: async (restaurantId: string): Promise<Giveaway[]> => {
    const { data } = await supabase.from('giveaways').select('*').eq('restaurant_id', restaurantId);
    return (data || []) as Giveaway[];
  },
  saveGiveaway: async (giveaway: Giveaway) => {
    const payload = { 
        ...giveaway, 
        restaurant_id: giveaway.restaurantId, 
        draw_date: giveaway.drawDate, 
        is_active: giveaway.isActive,
        winner_name: giveaway.winnerName,
        winner_phone: giveaway.winnerPhone,
        drawn_at: giveaway.drawnAt
    };
    delete (payload as any).restaurantId;
    delete (payload as any).drawDate;
    delete (payload as any).isActive;
    delete (payload as any).winnerName;
    delete (payload as any).winnerPhone;
    delete (payload as any).drawnAt;
    await supabase.from('giveaways').upsert(payload);
  },
  deleteGiveaway: async (id: string) => {
    await supabase.from('giveaways').delete().eq('id', id);
  },

  // Admins
  getAdmins: async (): Promise<AdminUser[]> => {
     const { data } = await supabase.from('admins').select('*');
     return (data || []) as AdminUser[];
  },
  addAdmin: async (admin: AdminUser) => {
    await supabase.from('admins').insert(admin);
  },
  updateAdmin: async (admin: AdminUser) => {
    await supabase.from('admins').update(admin).eq('id', admin.id);
  },
  deleteAdmin: async (id: string) => {
    await supabase.from('admins').delete().eq('id', id);
  },

  // Categories
  getCategories: async (restaurantId: string): Promise<Category[]> => {
    const { data } = await supabase.from('categories').select('*').eq('restaurant_id', restaurantId);
    return (data || []) as Category[];
  },
  addCategory: async (cat: Category) => {
    const payload = { ...cat, restaurant_id: cat.restaurantId };
    delete (payload as any).restaurantId;
    await supabase.from('categories').insert(payload);
  },
  updateCategory: async (cat: Category) => {
    const payload = { ...cat, restaurant_id: cat.restaurantId };
    delete (payload as any).restaurantId;
    await supabase.from('categories').update(payload).eq('id', cat.id);
  },
  deleteCategory: async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
  },

  // Menu Items
  getMenuItems: async (restaurantId: string): Promise<MenuItem[]> => {
    const { data } = await supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId);
    return (data || []) as MenuItem[];
  },
  saveMenuItem: async (item: MenuItem) => {
    const payload = { ...item, restaurant_id: item.restaurantId, category_id: item.categoryId };
    delete (payload as any).restaurantId;
    delete (payload as any).categoryId;
    await supabase.from('menu_items').upsert(payload);
  },
  deleteMenuItem: async (id: string) => {
    await supabase.from('menu_items').delete().eq('id', id);
  },

  // Orders
  getOrders: async (restaurantId: string): Promise<Order[]> => {
    const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
    return (data || []) as Order[];
  },
  addOrder: async (order: Order) => {
    const payload = { 
        ...order, 
        restaurant_id: order.restaurantId, 
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        customer_address: order.customerAddress,
        payment_method: order.paymentMethod,
        payment_details: order.paymentDetails,
        created_at: order.createdAt
    };
    delete (payload as any).restaurantId;
    delete (payload as any).customerName;
    delete (payload as any).customerPhone;
    delete (payload as any).customerAddress;
    delete (payload as any).paymentMethod;
    delete (payload as any).paymentDetails;
    delete (payload as any).createdAt;
    
    await supabase.from('orders').insert(payload);
    
    // Update stock
    for (const cartItem of order.items) {
        if (cartItem.stock !== undefined && cartItem.stock !== null) {
            const newStock = Math.max(0, cartItem.stock - cartItem.quantity);
            await supabase.from('menu_items').update({ stock: newStock, available: newStock > 0 }).eq('id', cartItem.id);
        }
    }
  },
  updateOrder: async (order: Order) => {
    await supabase.from('orders').update(order).eq('id', order.id);
  },

  // Customers
  registerCustomer: async (customer: CustomerUser): Promise<{ success: boolean, message?: string }> => {
    const { data } = await supabase.from('customers').select('id').eq('phone', customer.phone).limit(1);
    if (data && data.length > 0) return { success: false, message: 'Telefone já cadastrado.' };
    const { error } = await supabase.from('customers').insert(customer);
    if (error) return { success: false, message: error.message };
    return { success: true };
  },

  loginCustomer: async (phone: string, password: string): Promise<CustomerUser | null> => {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .eq('password', password)
        .limit(1);
      return data && data.length > 0 ? data[0] : null;
  }
};