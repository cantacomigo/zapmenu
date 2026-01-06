import { supabase } from '../integrations/supabase/client';
import { AdminUser, Category, CustomerUser, Giveaway, MenuItem, Order, Promotion, Restaurant, RestaurantStaff } from "../types";
import { SEED_ADMINS, SEED_CATEGORIES, SEED_MENU_ITEMS, SEED_RESTAURANTS } from "../constants";

// Helper to map DB snake_case to JS camelCase for Restaurants
const fromDbRestaurant = (r: any): Restaurant => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    phone: r.phone,
    logo: r.logo,
    coverImage: r.cover_image,
    coverImages: r.cover_images || [],
    address: r.address,
    isActive: r.is_active,
    deliveryFee: Number(r.delivery_fee),
    minOrderValue: Number(r.min_order_value),
    estimatedTime: r.estimated_time,
    pixKey: r.pix_key
});

// Helper for Admin mapping
const fromDbAdmin = (a: any): AdminUser => ({
    id: a.id,
    name: a.name,
    email: a.email,
    role: a.role,
    createdAt: new Date(a.created_at).getTime()
});

export const db = {
  seedDatabase: async () => {
    // 1. Restaurants
    const rests = SEED_RESTAURANTS.map(r => ({
        id: r.id, name: r.name, slug: r.slug, phone: r.phone, logo: r.logo,
        cover_image: r.coverImage, cover_images: r.coverImages, address: r.address,
        is_active: r.isActive, delivery_fee: r.deliveryFee, min_order_value: r.minOrderValue,
        estimated_time: r.estimatedTime, pix_key: r.pixKey
    }));
    await supabase.from('restaurants').upsert(rests);
    
    // 2. Admins
    await supabase.from('admins').upsert(SEED_ADMINS);
    
    // 3. Categories
    await supabase.from('categories').upsert(SEED_CATEGORIES);
    
    // 4. Items
    const items = SEED_MENU_ITEMS.map(i => ({
        restaurant_id: i.restaurant_id,
        category_id: i.category_id,
        name: i.name,
        description: i.description,
        price: i.price,
        image: i.image,
        available: i.available,
        stock: i.stock
    }));
    await supabase.from('menu_items').upsert(items);
    
    return true;
  },

  getRestaurants: async (): Promise<Restaurant[]> => {
    const { data } = await supabase.from('restaurants').select('*').order('name');
    return (data || []).map(fromDbRestaurant);
  },
  
  getRestaurantBySlug: async (slug: string): Promise<Restaurant | undefined> => {
    const { data } = await supabase.from('restaurants').select('*').eq('slug', slug).single();
    return data ? fromDbRestaurant(data) : undefined;
  },

  addRestaurant: async (rest: Restaurant) => {
    const payload = { 
        name: rest.name, slug: rest.slug, phone: rest.phone, address: rest.address,
        logo: rest.logo, cover_image: rest.coverImage, cover_images: rest.coverImages,
        is_active: true 
    };
    return await supabase.from('restaurants').insert(payload);
  },

  updateRestaurant: async (rest: Restaurant) => {
    const payload = {
        name: rest.name, 
        slug: rest.slug,
        phone: rest.phone, 
        address: rest.address,
        logo: rest.logo, 
        cover_image: rest.coverImage, 
        cover_images: rest.coverImages,
        min_order_value: rest.minOrderValue, 
        delivery_fee: rest.deliveryFee
    };
    return await supabase.from('restaurants').update(payload).eq('id', rest.id);
  },

  deleteRestaurant: async (id: string) => supabase.from('restaurants').delete().eq('id', id),

  getCategories: async (restaurantId: string): Promise<Category[]> => {
    const { data } = await supabase.from('categories').select('*').eq('restaurant_id', restaurantId).order('name');
    return (data || []).map(c => ({ id: c.id, restaurantId: c.restaurant_id, name: c.name })) as Category[];
  },

  addCategory: async (cat: Category) => {
    return await supabase.from('categories').insert({ name: cat.name, restaurant_id: cat.restaurantId });
  },

  updateCategory: async (cat: Category) => {
    return await supabase.from('categories').update({ name: cat.name }).eq('id', cat.id);
  },

  deleteCategory: async (id: string) => supabase.from('categories').delete().eq('id', id),

  getMenuItems: async (restaurantId: string): Promise<MenuItem[]> => {
    const { data } = await supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId).order('name');
    return (data || []).map(i => ({ ...i, restaurantId: i.restaurant_id, categoryId: i.category_id })) as MenuItem[];
  },

  saveMenuItem: async (item: MenuItem) => {
    const payload = {
        restaurant_id: item.restaurantId,
        category_id: item.categoryId,
        name: item.name,
        price: item.price,
        description: item.description,
        image: item.image,
        available: item.available
    };
    if (item.id) return await supabase.from('menu_items').update(payload).eq('id', item.id);
    return await supabase.from('menu_items').insert(payload);
  },

  deleteMenuItem: async (id: string) => supabase.from('menu_items').delete().eq('id', id),

  getOrders: async (restaurantId: string): Promise<Order[]> => {
    const { data } = await supabase.from('orders').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: false });
    return (data || []).map(o => ({
        id: o.id,
        restaurantId: o.restaurant_id,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        customerAddress: o.customer_address,
        paymentMethod: o.payment_method,
        items: o.items,
        total: Number(o.total),
        status: o.status,
        createdAt: new Date(o.created_at).getTime()
    })) as Order[];
  },

  addOrder: async (order: Order) => {
    const payload = {
        restaurant_id: order.restaurantId,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        customer_address: order.customerAddress,
        payment_method: order.paymentMethod,
        items: order.items,
        total: order.total,
        status: 'pending'
    };
    return await supabase.from('orders').insert(payload);
  },

  updateOrder: async (order: Order) => {
    return await supabase.from('orders').update({ status: order.status }).eq('id', order.id);
  },

  getAdmins: async (): Promise<AdminUser[]> => {
    const { data } = await supabase.from('admins').select('*').order('created_at', { ascending: false });
    return (data || []).map(fromDbAdmin);
  },
  
  addAdmin: async (admin: AdminUser) => {
      const payload = { name: admin.name, email: admin.email, role: admin.role };
      return await supabase.from('admins').insert(payload);
  },
  
  updateAdmin: async (admin: AdminUser) => {
      const payload = { name: admin.name, email: admin.email, role: admin.role };
      return await supabase.from('admins').update(payload).eq('id', admin.id);
  },
  
  deleteAdmin: async (id: string) => supabase.from('admins').delete().eq('id', id),
  
  getPromotions: async (restaurantId: string): Promise<Promotion[]> => {
    const { data } = await supabase.from('promotions').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: false });
    return (data || []).map(p => ({ ...p, restaurantId: p.restaurant_id, originalPrice: Number(p.original_price), discountedPrice: Number(p.discounted_price), isActive: p.is_active })) as Promotion[];
  },

  savePromotion: async (promo: Promotion) => {
    const payload = {
        restaurant_id: promo.restaurantId,
        title: promo.title,
        description: promo.description,
        original_price: promo.originalPrice,
        discounted_price: promo.discountedPrice,
        image: promo.image,
        is_active: promo.isActive
    };
    if (promo.id) return await supabase.from('promotions').update(payload).eq('id', promo.id);
    return await supabase.from('promotions').insert(payload);
  },

  deletePromotion: async (id: string) => supabase.from('promotions').delete().eq('id', id),

  getGiveaways: async (restaurantId: string): Promise<Giveaway[]> => {
    const { data } = await supabase.from('giveaways').select('*').eq('restaurant_id', restaurantId).order('draw_date', { ascending: false });
    return (data || []).map(g => ({ ...g, restaurantId: g.restaurant_id, drawDate: g.draw_date, isActive: g.is_active, winnerName: g.winner_name, winnerPhone: g.winner_phone, drawnAt: g.drawn_at ? new Date(g.drawn_at).getTime() : undefined })) as Giveaway[];
  },

  saveGiveaway: async (give: Giveaway) => {
    const payload = {
        restaurant_id: give.restaurantId,
        title: give.title,
        prize: give.prize,
        description: give.description,
        draw_date: give.drawDate,
        image: give.image,
        is_active: give.isActive
    };
    if (give.id) return await supabase.from('giveaways').update(payload).eq('id', give.id);
    return await supabase.from('giveaways').insert(payload);
  },

  deleteGiveaway: async (id: string) => supabase.from('giveaways').delete().eq('id', id),
  
  getRestaurantStaff: async (rId: string) => [],

  registerCustomer: async (c: CustomerUser) => {
      // Verifica se já existe
      const { data: existing } = await supabase.from('customers').select('id').eq('phone', c.phone).single();
      if (existing) return { success: false, message: 'Este telefone já está cadastrado.' };

      const { error } = await supabase.from('customers').insert({
          name: c.name,
          phone: c.phone,
          password: c.password,
          address: c.address
      });

      if (error) return { success: false, message: 'Erro ao cadastrar: ' + error.message };
      return { success: true, message: 'Cadastro realizado com sucesso.' };
  },

  loginCustomer: async (phone: string, password: string): Promise<CustomerUser | null> => {
      const { data, error } = await supabase.from('customers')
        .select('*')
        .eq('phone', phone)
        .eq('password', password)
        .single();

      if (error || !data) return null;
      return {
          id: data.id,
          name: data.name,
          phone: data.phone,
          address: data.address,
          createdAt: new Date(data.created_at).getTime()
      } as CustomerUser;
  }
};