-- =============================================
-- SOLUCIÓN NUCLEAR: Recrear bucket srl-images
-- =============================================

-- PASO 1: Eliminar TODAS las políticas existentes del bucket
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%srl%')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- PASO 2: Eliminar el bucket (esto también borra todos los archivos)
DELETE FROM storage.objects WHERE bucket_id = 'srl-images';
DELETE FROM storage.buckets WHERE id = 'srl-images';

-- PASO 3: Recrear el bucket como PÚBLICO
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'srl-images', 
    'srl-images', 
    true,  -- PÚBLICO = true
    52428800,  -- 50MB máximo por archivo
    ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif']
);

-- PASO 4: Crear política PERMISIVA para INSERT (sin restricciones de autenticación)
CREATE POLICY "srl_insert_all"
ON storage.objects FOR INSERT
TO public  -- CAMBIO: public en lugar de authenticated
WITH CHECK (bucket_id = 'srl-images');

-- PASO 5: Crear política PERMISIVA para SELECT
CREATE POLICY "srl_select_all"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'srl-images');

-- PASO 6: Crear política PERMISIVA para UPDATE
CREATE POLICY "srl_update_all"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'srl-images')
WITH CHECK (bucket_id = 'srl-images');

-- PASO 7: Crear política PERMISIVA para DELETE
CREATE POLICY "srl_delete_all"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'srl-images');

-- VERIFICACIÓN
SELECT id, name, public FROM storage.buckets WHERE id = 'srl-images';
