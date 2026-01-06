import { supabase } from '../integrations/supabase/client';
import { AdminUser, Category, CustomerUser, Giveaway, MenuItem, Order, Promotion, Restaurant, RestaurantStaff, CartItem } from "../types";

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

const fromDbOrder = (o: any): Order => ({
    id: o.id,
    restaurantId: o.restaurant_id,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    customerAddress: o.customer_address,
    paymentMethod: o.payment_method,
    items: o.items as CartItem[],
    total: Number(o.total),
    status: o.status,
    createdAt: new Date(o.created_at).getTime()
});

export const db = {
  // Auth Admins
  loginAdmin: async (email: string, password: string): Promise<AdminUser | null> => {
    const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();
    
    if (error || !data) return null;
    return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        createdAt: new Date(data.created_at).getTime()
    };
  },

  // Auth Managers/Staff
  loginStaff: async (email: string, password: string): Promise<RestaurantStaff | null> => {
    const { data, error } = await supabase
        .from('restaurant_staff')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();
    
    if (error || !data) return null;
    return {
        id: data.id,
        restaurantId: data.restaurant_id,
        name: data.name,
        email: data.email,
        role: data.role,
        createdAt: new Date(data.created_at).getTime()
    };
  },

  addStaff: async (staff: Partial<RestaurantStaff>) => {
    const { data, error } = await supabase.from('restaurant_staff').insert({
        restaurant_id: staff.restaurantId,
        name: staff.name,
        email: staff.email,
        password: staff.password,
        role: staff.role || 'manager'
    }).select().single();
    
    if (error) throw error;
    return data;
  },

  getRestaurants: async () => {
    const { data } = await supabase.from('restaurants').select('*').order('name');
    return (data || []).map(fromDbRestaurant);
  },

  getRestaurantById: async (id: string) => {
    const { data } = await supabase.from('restaurants').select('*').eq('id', id).single();
    return data ? fromDbRestaurant(data) : null;
  },
  
  getRestaurantBySlug: async (slug: string) => {
    const { data } = await supabase.from('restaurants').select('*').eq('slug', slug).single();
    return data ? fromDbRestaurant(data) : undefined;
  },

  addRestaurant: async (rest: Restaurant) => {
    return await supabase.from('restaurants').insert({ 
        name: rest.name, slug: rest.slug, phone: rest.phone, address: rest.address,
        logo: rest.logo, cover_image: rest.coverImage, is_active: true 
    });
  },

  updateRestaurant: async (rest: Restaurant) => {
    return await supabase.from('restaurants').update({
        name: rest.name, slug: rest.slug, phone: rest.phone, address: rest.address,
        logo: rest.logo, cover_image: rest.coverImage, min_order_value: rest.minOrderValue, delivery_fee: rest.deliveryFee
    }).eq('id', rest.id);
  },

  deleteRestaurant: async (id: string) => supabase.from('restaurants').delete().eq('id', id),

  getCategories: async (restaurantId: string): Promise<Category[]> => {
    const { data } = await supabase.from('categories').select('*').eq('restaurant_id', restaurantId).order('name');
    return (data || []).map(c => ({ id: c.id, restaurantId: c.restaurant_id, name: c.name }));
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
    return (data || []).map(i => ({ ...i, restaurantId: i.restaurant_id, categoryId: i.category_id }));
  },

  saveMenuItem: async (item: MenuItem) => {
    const payload = {
        restaurant_id: item.restaurantId,
        category_id: item.categoryId,
        name: item.name,
        price: item.price,
        description: item.description,
        image: item.image,
        available: item.available,
        stock: item.stock
    };
    if (item.id) return await supabase.from('menu_items').update(payload).eq('id', item.id);
    return await supabase.from('menu_items').insert(payload);
  },

  deleteMenuItem: async (id: string) => supabase.from('menu_items').delete().eq('id', id),

  getOrders: async (restaurantId: string): Promise<Order[]> => {
    const { data } = await supabase.from('orders').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: false });
    return (data || []).map(fromDbOrder);
  },

  getCustomerOrders: async (phone: string, restaurantId: string): Promise<Order[]> => {
    const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', phone)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
    return (data || []).map(fromDbOrder);
  },

  addOrder: async (order: Order) => {
    return await supabase.from('orders').insert({
        restaurant_id: order.restaurantId,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        customer_address: order.customerAddress,
        payment_method: order.paymentMethod,
        items: order.items,
        total: order.total,
        status: 'pending'
    });
  },

  updateOrder: async (order: Order) => {
    return await supabase.from('orders').update({ status: order.status }).eq('id', order.id);
  },

  getPromotions: async (restaurantId: string): Promise<Promotion[]> => {
    const { data } = await supabase.from('promotions').select('*').eq('restaurant_id', restaurantId);
    return (data || []).map(p => ({ ...p, restaurantId: p.restaurant_id, discountedPrice: Number(p.discount_price), originalPrice: Number(p.original_price), isActive: p.is_active }));
  },

  savePromotion: async (promo: Promotion) => {
    const payload = {
        restaurant_id: promo.restaurantId,
        title: promo.title,
        description: promo.description,
        original_price: promo.originalPrice,
        discount_price: promo.discountedPrice,
        image: promo.image,
        is_active: promo.isActive
    };
    if (promo.id) return await supabase.from('promotions').update(payload).eq('id', promo.id);
    return await supabase.from('promotions').insert(payload);
  },

  deletePromotion: async (id: string) => supabase.from('promotions').delete().eq('id', id),

  getGiveaways: async (restaurantId: string): Promise<Giveaway[]> => {
    const { data } = await supabase.from('giveaways').select('*').eq('restaurant_id', restaurantId).order('draw_date', { ascending: false });
    return (data || []).map(g => ({ ...g, restaurantId: g.restaurant_id, drawDate: g.draw_date, isActive: g.is_active, winnerName: g.winner_name, drawnAt: g.drawn_at ? new Date(g.drawn_at).getTime() : undefined }));
  },

  saveGiveaway: async (give: Giveaway) => {
    const payload = {
        restaurant_id: give.restaurantId,
        title: give.title,
        prize: give.prize,
        description: give.description,
        draw_date: give.drawDate,
        image: give.image,
        is_active: give.isActive,
        winner_name: give.winnerName,
        winner_phone: give.winnerPhone,
        drawn_at: give.drawnAt ? new Date(give.drawnAt).toISOString() : null
    };
    if (give.id) return await supabase.from('giveaways').update(payload).eq('id', give.id);
    return await supabase.from('giveaways').insert(payload);
  },

  deleteGiveaway: async (id: string) => supabase.from('giveaways').delete().eq('id', id),

  getCustomers: async (): Promise<CustomerUser[]> => {
      const { data } = await supabase.from('customers').select('*').order('name');
      return (data || []).map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          address: c.address,
          createdAt: new Date(c.created_at).getTime()
      }));
  },

  loginCustomer: async (phone: string, password: string): Promise<CustomerUser | null> => {
    const { data, error } = await supabase
        .from('customers')
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
    };
  },

  registerCustomer: async (customer: Partial<CustomerUser>): Promise<CustomerUser | null> => {
    const { data, error } = await supabase
        .from('customers')
        .insert({
            name: customer.name,
            phone: customer.phone,
            password: customer.password,
            address: customer.address
        })
        .select()
        .single();
    
    if (error || !data) return null;
    return {
        id: data.id,
        name: data.name,
        phone: data.phone,
        address: data.address,
        createdAt: new Date(data.created_at).getTime()
    };
  },

  getAdmins: async (): Promise<AdminUser[]> => {
    const { data } = await supabase.from('admins').select('*').order('created_at');
    return (data || []).map(a => ({
        id: a.id,
        name: a.name,
        email: a.email,
        role: a.role,
        createdAt: new Date(a.created_at).getTime()
    }));
  },

  addAdmin: async (admin: Partial<AdminUser>) => {
    return await supabase.from('admins').insert({
        name: admin.name,
        email: admin.email,
        role: admin.role || 'support'
    });
  },

  deleteAdmin: async (id: string) => supabase.from('admins').delete().eq('id', id)
};