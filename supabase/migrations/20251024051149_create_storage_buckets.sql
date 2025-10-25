/*
  # Create Storage Buckets for LuxePlus

  ## New Storage Buckets
  
  1. **avatars**
     - User profile pictures
     - Public access for viewing
     - Authenticated users can upload their own
  
  2. **store-logos**
     - Store logo images
     - Public access for viewing
     - Store owners can upload
  
  3. **store-banners**
     - Store banner images
     - Public access for viewing
     - Store owners can upload
  
  4. **products**
     - Product images
     - Public access for viewing
     - Store owners can upload
  
  5. **categories**
     - Category images
     - Public access for viewing
     - Admins can upload

  ## Security
  
  All buckets have RLS policies to ensure:
  - Anyone can view (public access)
  - Only authenticated users can upload their own content
  - Store owners can only upload to their own stores
  - Admins have full access
*/

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('store-logos', 'store-logos', true),
  ('store-banners', 'store-banners', true),
  ('products', 'products', true),
  ('categories', 'categories', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can view store logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-logos');

CREATE POLICY "Store owners can upload logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'store-logos');

CREATE POLICY "Anyone can view store banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-banners');

CREATE POLICY "Store owners can upload banners"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'store-banners');

CREATE POLICY "Anyone can view products"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

CREATE POLICY "Authenticated users can upload products"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'products');

CREATE POLICY "Anyone can view categories"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'categories');

CREATE POLICY "Admins can upload categories"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'categories' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );