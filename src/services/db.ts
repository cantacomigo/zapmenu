import { supabase } from '../integrations/supabase/client';
import { AdminUser, Category, CustomerUser, Giveaway, MenuItem, Order, Promotion, Restaurant, RestaurantStaff, CartItem, ProductAddon } from "../types";

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
    pixKey: r.pix_key,
    openingTime: r.opening_time,
    closingTime: r.closing_time
});

const fromDbOrder = (o: any): Order => ({
    id: o.id,
    restaurantId: o.restaurant_id,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    customerAddress: o.customer_address,
    paymentMethod: o.payment_method,
    paymentDetails: o.payment_details,
    scheduledTime: o.scheduled_time,
    items: o.items as CartItem[],
    total: Number(o.total),
    status: o.status,
    createdAt: new Date(o.created_at).getTime()
});

export const db = {
  loginAdmin: async (email: string, password: string): Promise<AdminUser | null> => {
    const { data, error } = await supabase.from('admins').select('*').eq('email', email).eq('password', password).single();
    if (error || !data) return null;
    return { id: data.id, name: data.name, email: data.email, role: data.role, createdAt: new Date(data.created_at).getTime() };
  },

  loginStaff: async (email: string, password: string): Promise<RestaurantStaff | null> => {
    const { data, error } = await supabase.from('restaurant_staff').select('*').eq('email', email).eq('password', password).single();
    if (error || !data) return null;
    return { id: data.id, restaurantId: data.restaurant_id, name: data.name, email: data.email, role: data.role, createdAt: new Date(data.created_at).getTime() };
  },

  addStaff: async (staff: Partial<RestaurantStaff>) => {
    return await supabase.from('restaurant_staff').insert({ restaurant_id: staff.restaurantId, name: staff.name, email: staff.email, password: staff.password, role: staff.role || 'manager' });
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

  addRestaurant: async (rest: Partial<Restaurant>) => {
    return await supabase.from('restaurants').insert({ 
        name: rest.name, 
        slug: rest.slug, 
        phone: rest.phone, 
        address: rest.address,
        logo: rest.logo, 
        cover_image: rest.coverImage, 
        is_active: true 
    });
  },

  updateRestaurant: async (rest: Restaurant) => {
    return await supabase.from('restaurants').update({
        name: rest.name, slug: rest.slug, phone: rest.phone, address: rest.address,
        logo: rest.logo, cover_image: rest.coverImage, min_order_value: rest.minOrderValue, 
        delivery_fee: rest.deliveryFee, pix_key: rest.pixKey, opening_time: rest.openingTime, closing_time: rest.closingTime
    }).eq('id', rest.id);
  },

  deleteRestaurant: async (id: string) => {
    return await supabase.from('restaurants').delete().eq('id', id);
  },

  getCategories: async (restaurantId: string): Promise<Category[]> => {
    const { data } = await supabase.from('categories').select('*').eq('restaurant_id', restaurantId).order('name');
    return (data || []).map(c => ({ id: c.id, restaurantId: c.restaurant_id, name: c.name, parentId: c.parent_id }));
  },

  addCategory: async (cat: Partial<Category>) => {
    return await supabase.from('categories').insert({ name: cat.name, restaurant_id: cat.restaurantId, parent_id: cat.parentId });
  },

  updateCategory: async (cat: Category) => {
    return await supabase.from('categories').update({ name: cat.name, parent_id: cat.parentId }).eq('id', cat.id);
  },

  deleteCategory: async (id: string) => supabase.from('categories').delete().eq('id', id),

  getMenuItems: async (restaurantId: string): Promise<MenuItem[]> => {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        addons:menu_item_addons(
          addon:product_addons(*)
        )
      `)
      .eq('restaurant_id', restaurantId)
      .order('name');
    
    return (data || []).map(i => ({
      ...i,
      restaurantId: i.restaurant_id,
      categoryId: i.category_id,
      addons: i.addons?.map((a: any) => ({
        id: a.addon.id,
        restaurantId: a.addon.restaurant_id,
        name: a.addon.name,
        price: Number(a.addon.price),
        available: a.addon.available
      })) || []
    }));
  },

  saveMenuItem: async (item: MenuItem, addonIds: string[] = []) => {
    const payload = {
        restaurant_id: item.restaurantId,
        category_id: item.categoryId,
        name: item.name,
        price: item.price,
        description: item.description,
        image: item.image,
        available: item.available
    };

    let itemId = item.id;
    if (itemId) {
      await supabase.from('menu_items').update(payload).eq('id', itemId);
    } else {
      const { data } = await supabase.from('menu_items').insert(payload).select().single();
      itemId = data.id;
    }

    await supabase.from('menu_item_addons').delete().eq('menu_item_id', itemId);
    if (addonIds.length > 0) {
      await supabase.from('menu_item_addons').insert(addonIds.map(aId => ({ menu_item_id: itemId, addon_id: aId })));
    }
    return itemId;
  },

  deleteMenuItem: async (id: string) => supabase.from('menu_items').delete().eq('id', id),

  getAddons: async (restaurantId: string): Promise<ProductAddon[]> => {
    const { data } = await supabase.from('product_addons').select('*').eq('restaurant_id', restaurantId).order('name');
    return (data || []).map(a => ({ id: a.id, restaurantId: a.restaurant_id, name: a.name, price: Number(a.price), available: a.available }));
  },

  saveAddon: async (addon: Partial<ProductAddon>) => {
    const payload = { restaurant_id: addon.restaurantId, name: addon.name, price: addon.price, available: addon.available };
    if (addon.id) return await supabase.from('product_addons').update(payload).eq('id', addon.id);
    return await supabase.from('product_addons').insert(payload);
  },

  deleteAddon: async (id: string) => supabase.from('product_addons').delete().eq('id', id),

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
        restaurant_id: order.restaurantId, customer_name: order.customerName, customer_phone: order.customerPhone,
        customer_address: order.customerAddress, payment_method: order.paymentMethod, payment_details: order.paymentDetails,
        scheduled_time: order.scheduledTime, items: order.items, total: order.total, status: 'pending'
    });
  },

  updateOrder: async (order: Order) => {
    return await supabase.from('orders').update({ status: order.status }).eq('id', order.id);
  },

  getPromotions: async (restaurantId: string): Promise<Promotion[]> => {
    const { data } = await supabase.from('promotions').select('*').eq('restaurant_id', restaurantId);
    return (data || []).map(p => ({ ...p, restaurantId: p.restaurant_id, discountedPrice: Number(p.discounted_price), originalPrice: Number(p.original_price), isActive: p.is_active }));
  },

  savePromotion: async (promo: Promotion) => {
    const payload = { restaurant_id: promo.restaurantId, title: promo.title, description: promo.description, original_price: promo.originalPrice, discounted_price: promo.discountedPrice, image: promo.image, is_active: promo.isActive };
    if (promo.id) return await supabase.from('promotions').update(payload).eq('id', promo.id);
    return await supabase.from('promotions').insert(payload);
  },

  deletePromotion: async (id: string) => supabase.from('promotions').delete().eq('id', id),

  getGiveaways: async (restaurantId: string): Promise<Giveaway[]> => {
    const { data } = await supabase.from('giveaways').select('*').eq('restaurant_id', restaurantId).order('draw_date', { ascending: false });
    return (data || []).map(g => ({ ...g, restaurantId: g.restaurant_id, drawDate: g.draw_date, isActive: g.is_active, winnerName: g.winner_name, drawnAt: g.drawn_at ? new Date(g.drawn_at).getTime() : undefined }));
  },

  saveGiveaway: async (give: Giveaway) => {
    const payload = { restaurant_id: give.restaurantId, title: give.title, prize: give.prize, description: give.description, draw_date: give.drawDate, image: give.image, is_active: give.isActive, winner_name: give.winnerName, winner_phone: give.winnerPhone, drawn_at: give.drawnAt ? new Date(give.drawnAt).toISOString() : null };
    if (give.id) return await supabase.from('giveaways').update(payload).eq('id', give.id);
    return await supabase.from('giveaways').insert(payload);
  },

  deleteGiveaway: async (id: string) => supabase.from('giveaways').delete().eq('id', id),

  loginCustomer: async (phone: string, password: string): Promise<CustomerUser | null> => {
    const { data, error } = await supabase.from('customers').select('*').eq('phone', phone).eq('password', password).single();
    if (error || !data) return null;
    return { id: data.id, name: data.name, phone: data.phone, address: data.address, createdAt: new Date(data.created_at).getTime() };
  },

  registerCustomer: async (customer: Partial<CustomerUser>): Promise<CustomerUser | null> => {
    const { data, error } = await supabase.from('customers').insert({ name: customer.name, phone: customer.phone, password: customer.password, address: customer.address }).select().single();
    if (error || !data) return null;
    return { id: data.id, name: data.name, phone: data.phone, address: data.address, createdAt: new Date(data.created_at).getTime() };
  },

  getAdmins: async (): Promise<AdminUser[]> => {
    const { data } = await supabase.from('admins').select('*').order('created_at');
    return (data || []).map(a => ({ id: a.id, name: a.name, email: a.email, role: a.role, createdAt: new Date(a.created_at).getTime() }));
  },

  addAdmin: async (admin: Partial<AdminUser>) => {
    return await supabase.from('admins').insert({ name: admin.name, email: admin.email, role: admin.role || 'support' });
  },

  deleteAdmin: async (id: string) => supabase.from('admins').delete().eq('id', id)
};