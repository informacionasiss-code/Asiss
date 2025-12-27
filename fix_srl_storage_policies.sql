-- =============================================
-- FIX: Políticas RLS para Storage SRL
-- =============================================

-- 1. ELIMINAR políticas existentes que puedan estar mal configuradas
DROP POLICY IF EXISTS "Authenticated users can upload SRL images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update SRL images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete SRL images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for SRL images" ON storage.objects;

-- 2. CREAR políticas correctas

-- Permitir INSERTAR (subir) archivos a usuarios autenticados
CREATE POLICY "srl_images_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'srl-images');

-- Permitir ACTUALIZAR archivos a usuarios autenticados
CREATE POLICY "srl_images_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'srl-images')
WITH CHECK (bucket_id = 'srl-images');

-- Permitir ELIMINAR archivos a usuarios autenticados
CREATE POLICY "srl_images_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'srl-images');

-- Permitir LECTURA PÚBLICA (para que las imágenes se vean en correos y navegador)
CREATE POLICY "srl_images_select_policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'srl-images');

-- 3. VERIFICAR que el bucket existe y es público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'srl-images';
