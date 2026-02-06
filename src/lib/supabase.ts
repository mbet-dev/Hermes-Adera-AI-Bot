import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY ?? '';

// Client-side client (uses anon key)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client (uses service key for elevated privileges)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Types for your Supabase tables (adjust based on your actual schema)
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  created_at: string;
}

export interface Delivery {
  id: string;
  user_id: string;
  order_number: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  pickup_address: string;
  delivery_address: string;
  pickup_time?: string;
  delivery_time?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  in_stock: boolean;
  created_at: string;
}
