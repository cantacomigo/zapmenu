import { supabase } from './supabase';
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

// Mappers - Handling mixed schema (camelCase for coverImage, snake_case for others)
const toDbRestaurant = (r: Restaurant) => {
    // Note: The database schema seems to use mixed casing or specific column names.
    // 'cover_images' (snake_case) was reported as missing. 
    // We will attempt to use 'coverImages' (camelCase) or omit it if not supported.
    // For now, swapping to 'coverImages' to match 'coverImage' style, or purely relying on what works.
    
    const payload: any = {
        id: r.id,
        name: r.name,
        slug: r.slug,
        phone: r.phone,
        logo: r.logo,
        coverImage: r.coverImage, // Known to work
        coverImages: r.coverImages, // Trying camelCase as 'cover_images' does not exist
        address: r.address,
        is_active: r.isActive,
        delivery_fee: r.deliveryFee,
        min_order_value: r.minOrderValue,
        estimated_time: r.estimatedTime,
        pix_key: r.pixKey
    };
    
    // Remove undefined keys to prevent overriding with NULL if intention is to keep existing (though update replaces provided keys)
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
        coverImage: r.coverImage || r.cover_image,
        coverImages: r.coverImages || r.cover_images || [],
        address: r.address,
        isActive: r.is_active !== undefined ? r.is_active : r.isActive,
        deliveryFee: r.delivery_fee !== undefined ? r.delivery_fee : r.deliveryFee,
        minOrderValue: r.min_order_value !== undefined ? r.min_order_value : r.minOrderValue,
        estimatedTime: r.estimated_time !== undefined ? r.estimated_time : r.estimatedTime,
        pixKey: r.pix_key !== undefined ? r.pix_key : r.pixKey
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
    if (!payload.id) delete (payload as any).id; 
    
    const { error } = await supabase.from('restaurants').insert(payload);
    if (error) console.error("Error adding restaurant:", error);
    return { error };
  },
  
  updateRestaurant: async (rest: Restaurant) => {
    const payload = toDbRestaurant(rest);
    
    // Attempt update
    const { error } = await supabase.from('restaurants').update(payload).eq('id', rest.id);
    
    if (error) {
        console.error("Failed to update restaurant:", JSON.stringify(error, null, 2));
        
        // Fallback: If coverImages fails (PGRST204), try updating without it to save other settings
        if (error.code === 'PGRST204' && payload.coverImages) {
             console.warn("Retrying update without 'coverImages' column...");
             delete payload.coverImages;
             const retry = await supabase.from('restaurants').update(payload).eq('id', rest.id);
             return retry;
        }
    }
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
    const { data } = await supabase.from('restaurant_staff').select('*').eq('restaurantId', restaurantId);
    return (data || []) as RestaurantStaff[];
  },
  saveRestaurantStaff: async (staff: RestaurantStaff) => {
    await supabase.from('restaurant_staff').upsert(staff);
  },
  deleteRestaurantStaff: async (id: string) => {
    await supabase.from('restaurant_staff').delete().eq('id', id);
  },

  // Promotions
  getPromotions: async (restaurantId: string): Promise<Promotion[]> => {
    const { data, error } = await supabase.from('promotions').select('*').eq('restaurantId', restaurantId);
    if (error) {
        console.warn("Supabase error (promotions), falling back to local:", error);
        const local = localStorage.getItem(`promotions_${restaurantId}`);
        return local ? JSON.parse(local) : [];
    }
    return (data || []) as Promotion[];
  },
  savePromotion: async (promo: Promotion) => {
    const { error } = await supabase.from('promotions').upsert(promo);
    if (error) {
         const key = `promotions_${promo.restaurantId}`;
         const existingStr = localStorage.getItem(key);
         const existing: Promotion[] = existingStr ? JSON.parse(existingStr) : [];
         
         const pToSave = { ...promo };
         if (!pToSave.id) pToSave.id = `local_${Date.now()}`;

         const idx = existing.findIndex(p => p.id === pToSave.id);
         if (idx >= 0) existing[idx] = pToSave;
         else existing.push(pToSave);
         
         localStorage.setItem(key, JSON.stringify(existing));
    }
  },
  deletePromotion: async (id: string) => {
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) {
         for (let i = 0; i < localStorage.length; i++) {
             const key = localStorage.key(i);
             if (key?.startsWith('promotions_')) {
                 const items: Promotion[] = JSON.parse(localStorage.getItem(key) || '[]');
                 const newItems = items.filter(p => p.id !== id);
                 if (newItems.length !== items.length) {
                     localStorage.setItem(key, JSON.stringify(newItems));
                 }
             }
         }
    }
  },

  // Giveaways
  getGiveaways: async (restaurantId: string): Promise<Giveaway[]> => {
    const { data, error } = await supabase.from('giveaways').select('*').eq('restaurantId', restaurantId);
    if (error) {
        console.warn("Supabase error (giveaways), falling back to local:", error);
        const local = localStorage.getItem(`giveaways_${restaurantId}`);
        return local ? JSON.parse(local) : [];
    }
    return (data || []) as Giveaway[];
  },
  saveGiveaway: async (giveaway: Giveaway) => {
    const { error } = await supabase.from('giveaways').upsert(giveaway);
    if (error) {
         const key = `giveaways_${giveaway.restaurantId}`;
         const existingStr = localStorage.getItem(key);
         const existing: Giveaway[] = existingStr ? JSON.parse(existingStr) : [];
         
         const gToSave = { ...giveaway };
         if (!gToSave.id) gToSave.id = `local_${Date.now()}`;

         const idx = existing.findIndex(g => g.id === gToSave.id);
         if (idx >= 0) existing[idx] = gToSave;
         else existing.push(gToSave);
         
         localStorage.setItem(key, JSON.stringify(existing));
    }
  },
  deleteGiveaway: async (id: string) => {
    const { error } = await supabase.from('giveaways').delete().eq('id', id);
    if (error) {
         for (let i = 0; i < localStorage.length; i++) {
             const key = localStorage.key(i);
             if (key?.startsWith('giveaways_')) {
                 const items: Giveaway[] = JSON.parse(localStorage.getItem(key) || '[]');
                 const newItems = items.filter(g => g.id !== id);
                 if (newItems.length !== items.length) {
                     localStorage.setItem(key, JSON.stringify(newItems));
                 }
             }
         }
    }
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
    const { data } = await supabase.from('categories').select('*').eq('restaurantId', restaurantId);
    return (data || []) as Category[];
  },
  addCategory: async (cat: Category) => {
    await supabase.from('categories').insert(cat);
  },
  updateCategory: async (cat: Category) => {
    await supabase.from('categories').update(cat).eq('id', cat.id);
  },
  deleteCategory: async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
  },

  // Menu Items
  getMenuItems: async (restaurantId: string): Promise<MenuItem[]> => {
    const { data } = await supabase.from('menu_items').select('*').eq('restaurantId', restaurantId);
    return (data || []) as MenuItem[];
  },
  saveMenuItem: async (item: MenuItem) => {
    await supabase.from('menu_items').upsert(item);
  },
  deleteMenuItem: async (id: string) => {
    await supabase.from('menu_items').delete().eq('id', id);
  },

  // Orders
  getOrders: async (restaurantId: string): Promise<Order[]> => {
    const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurantId', restaurantId)
        .order('createdAt', { ascending: false });
    return (data || []) as Order[];
  },
  addOrder: async (order: Order) => {
    await supabase.from('orders').insert(order);
    for (const cartItem of order.items) {
        if (cartItem.stock !== undefined && cartItem.stock !== null) {
            const newStock = Math.max(0, cartItem.stock - cartItem.quantity);
            const { error } = await supabase.from('menu_items').update({ stock: newStock }).eq('id', cartItem.id);
            if (!error && newStock === 0) {
                await supabase.from('menu_items').update({ available: false }).eq('id', cartItem.id);
            }
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