import { AdminUser, Category, MenuItem, Restaurant } from "./types";

export const APP_NAME = "ZapMenu";

// Initial Seed Data for the Demo
export const SEED_RESTAURANTS: Restaurant[] = [
  {
    id: "rest_1",
    name: "Burger King do Zé",
    slug: "burger-ze",
    phone: "5511999999999",
    logo: "https://placehold.co/200x200/png?text=Burger+Ze",
    coverImage: "https://placehold.co/800x300/png?text=Burger+Cover",
    coverImages: [
        "https://placehold.co/800x300/png?text=Burger+Cover+1",
        "https://placehold.co/800x300/png?text=Burger+Promo+2",
        "https://placehold.co/800x300/png?text=Burger+Ambiente+3"
    ],
    address: "Rua das Flores, 123, São Paulo",
    isActive: true,
    deliveryFee: 5.00,
    minOrderValue: 20.00,
    estimatedTime: "40-50 min",
    pixKey: "11999999999"
  },
  {
    id: "rest_2",
    name: "Sushi House",
    slug: "sushi-house",
    phone: "5511888888888",
    logo: "https://placehold.co/200x200/png?text=Sushi",
    coverImage: "https://placehold.co/800x300/png?text=Sushi+Place",
    coverImages: [
        "https://placehold.co/800x300/png?text=Sushi+Place",
        "https://placehold.co/800x300/png?text=Sushi+Bar"
    ],
    address: "Av. Paulista, 1000, São Paulo",
    isActive: true,
    deliveryFee: 0,
    minOrderValue: 50.00,
    estimatedTime: "60 min",
    pixKey: "sushi@email.com"
  }
];

export const SEED_ADMINS: AdminUser[] = [
    { id: 'adm_1', name: 'Master Admin', email: 'admin@zapmenu.com', role: 'super_admin', createdAt: 1625097600000 },
    { id: 'adm_2', name: 'Suporte Técnico', email: 'suporte@zapmenu.com', role: 'support', createdAt: 1625184000000 }
];

export const SEED_CATEGORIES: Category[] = [
  { id: "cat_1", restaurantId: "rest_1", name: "Hambúrgueres" },
  { id: "cat_2", restaurantId: "rest_1", name: "Bebidas" },
  { id: "cat_3", restaurantId: "rest_2", name: "Combinados" },
  { id: "cat_4", restaurantId: "rest_2", name: "Temakis" },
];

export const SEED_MENU_ITEMS: MenuItem[] = [
  {
    id: "item_1",
    restaurantId: "rest_1",
    categoryId: "cat_1",
    name: "X-Bacon Cheddar",
    description: "Pão brioche, burger artesanal 180g, muito bacon e cheddar cremoso.",
    price: 32.90,
    image: "https://placehold.co/300x300/png?text=Burger",
    available: true,
  },
  {
    id: "item_2",
    restaurantId: "rest_1",
    categoryId: "cat_1",
    name: "X-Salada Clássico",
    description: "Pão, carne, queijo, alface, tomate e maionese da casa.",
    price: 25.50,
    image: "https://placehold.co/300x300/png?text=Salad",
    available: true,
  },
  {
    id: "item_3",
    restaurantId: "rest_1",
    categoryId: "cat_2",
    name: "Coca-Cola Lata",
    description: "Lata 350ml gelada.",
    price: 6.00,
    image: "https://placehold.co/300x300/png?text=Coke",
    available: true,
  },
  {
    id: "item_4",
    restaurantId: "rest_2",
    categoryId: "cat_3",
    name: "Combo Salmão 20 peças",
    description: "10 sashimis, 5 niguiris, 5 uramakis.",
    price: 59.90,
    image: "https://placehold.co/300x300/png?text=Combo",
    available: true,
  }
];