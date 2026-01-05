export const SEED_RESTAURANTS = [
  {
    id: '75b2671b-5353-4c92-959c-8519448375e0',
    name: 'Burger Master',
    slug: 'burger-master',
    phone: '5511999999999',
    logo: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=200&h=200&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=400&fit=crop',
    coverImages: [
        'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&h=400&fit=crop'
    ],
    address: 'Av. Paulista, 1000 - São Paulo',
    isActive: true,
    deliveryFee: 5.0,
    minOrderValue: 20.0,
    estimatedTime: '30-45 min',
    pixKey: 'contato@burgermaster.com'
  }
];

export const SEED_ADMINS = [
  {
    name: 'Admin Global',
    email: 'admin@zapmenu.com',
    role: 'super_admin'
  }
];

export const SEED_CATEGORIES = [
  {
    id: 'c1',
    restaurant_id: '75b2671b-5353-4c92-959c-8519448375e0',
    name: 'Hambúrgueres'
  },
  {
    id: 'c2',
    restaurant_id: '75b2671b-5353-4c92-959c-8519448375e0',
    name: 'Bebidas'
  }
];

export const SEED_MENU_ITEMS = [
  {
    restaurant_id: '75b2671b-5353-4c92-959c-8519448375e0',
    category_id: 'c1',
    name: 'Classic Burger',
    description: 'Pão brioche, carne 180g, queijo cheddar e maionese da casa.',
    price: 28.90,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
    available: true,
    stock: 50
  },
  {
    restaurant_id: '75b2671b-5353-4c92-959c-8519448375e0',
    category_id: 'c2',
    name: 'Coca-Cola 350ml',
    description: 'Lata gelada.',
    price: 6.00,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop',
    available: true,
    stock: 100
  }
];