export const SEED_RESTAURANTS = [
  {
    id: '75b2671b-5353-4c92-959c-8519448375e0',
    name: 'Barranco Lanches',
    slug: 'barranco-lanches',
    phone: '5511999999999',
    logo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=200&h=200&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&h=400&fit=crop',
    coverImages: [
        'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&h=400&fit=crop'
    ],
    address: 'Rua do Barranco, 123 - Centro',
    isActive: true,
    deliveryFee: 7.0,
    minOrderValue: 25.0,
    estimatedTime: '40-60 min',
    pixKey: 'financeiro@barrancolanches.com'
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
  { id: 'c1', restaurant_id: '75b2671b-5353-4c92-959c-8519448375e0', name: 'Lanches' },
  { id: 'c2', restaurant_id: '75b2671b-5353-4c92-959c-8519448375e0', name: 'XT (X-Tudo)' },
  { id: 'c3', restaurant_id: '75b2671b-5353-4c92-959c-8519448375e0', name: 'Bebidas' }
];

export const SEED_MENU_ITEMS = [
  {
    restaurant_id: '75b2671b-5353-4c92-959c-8519448375e0',
    category_id: 'c1',
    name: 'X-Salada Especial',
    description: 'Pão, hambúrguer, queijo, alface, tomate e maionese especial.',
    price: 22.00,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
    available: true,
    stock: 100
  },
  {
    restaurant_id: '75b2671b-5353-4c92-959c-8519448375e0',
    category_id: 'c2',
    name: 'XT Monstro',
    description: 'Pão gigante, 2 carnes, ovo, bacon, presunto, queijo, calabresa, alface e tomate.',
    price: 38.00,
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=400&fit=crop',
    available: true,
    stock: 30
  }
];

export const SEED_ORDERS = [
    {
        restaurant_id: '75b2671b-5353-4c92-959c-8519448375e0',
        customer_name: 'João Silva',
        customer_phone: '5511988887777',
        customer_address: 'Av. Paulista, 1000 - Apt 12',
        payment_method: 'pix',
        total: 60.00,
        status: 'completed',
        items: [{ name: 'XT Monstro', quantity: 1, price: 38.00 }, { name: 'X-Salada Especial', quantity: 1, price: 22.00 }]
    },
    {
        restaurant_id: '75b2671b-5353-4c92-959c-8519448375e0',
        customer_name: 'Maria Oliveira',
        customer_phone: '5511911112222',
        customer_address: 'Rua das Flores, 50',
        payment_method: 'credit',
        total: 44.00,
        status: 'pending',
        items: [{ name: 'X-Salada Especial', quantity: 2, price: 22.00 }]
    }
];