-- =============================================
-- CREAR BUCKET DE STORAGE PARA SRL
-- =============================================

-- 1. Crear el bucket 'srl-images' (público para lectura)
INSERT INTO storage.buckets (id, name, public)
VALUES ('srl-images', 'srl-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Storage para el bucket srl-images

-- Permitir a usuarios autenticados SUBIR imágenes
CREATE POLICY "Authenticated users can upload SRL images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'srl-images');

-- Permitir a usuarios autenticados ACTUALIZAR sus imágenes
CREATE POLICY "Authenticated users can update SRL images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'srl-images');

-- Permitir a usuarios autenticados ELIMINAR imágenes
CREATE POLICY "Authenticated users can delete SRL images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'srl-images');

-- Permitir lectura PÚBLICA de las imágenes (para que se vean en el correo)
CREATE POLICY "Public read access for SRL images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'srl-images');
