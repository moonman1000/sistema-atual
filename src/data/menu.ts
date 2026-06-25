export interface MenuItem {
  id: string;
  name: string;
  description: string;
  base_price: number;
  image: string;
  category: string;
  dietary: string[];
  is_featured: boolean;
  sizes: { id: string; name: string; price_modifier: number; value: string }[];
  toppings: { id: string; name: string; price: number; value: string }[];
  reviews: {
    id: string;
    author: string;
    rating: number;
    comment: string;
    time: string; // Note: 'time' is not directly from DB, will need to be derived from created_at
    avatar: string;
  }[];
}

export const menuItems: MenuItem[] = []; // Dados agora virão do Supabase