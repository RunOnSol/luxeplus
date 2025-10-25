import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'customer' | 'vendor' | 'admin';
  avatar_url: string | null;
  created_at: string;
};

export type Store = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  images: string[];
  is_active: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  customer_id: string;
  store_id: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: 'paystack' | 'flutterwave' | 'whatsapp';
  payment_status: 'pending' | 'completed' | 'failed';
  tracking_number: string | null;
  shipping_address: any;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
};

export type Review = {
  id: string;
  product_id: string;
  customer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type OrderTracking = {
  id: string;
  order_id: string;
  status: string;
  location: string | null;
  notes: string | null;
  created_at: string;
};

export async function uploadImage(file: File, bucket: string, path?: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = path ? `${path}/${fileName}` : fileName;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export function getStorageUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
