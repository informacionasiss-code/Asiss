-- =============================================
-- SQL COMPLETO PARA MÓDULO SRL
-- Ejecuta esto en el SQL Editor de Supabase
-- =============================================

-- PASO 1: Verificar y agregar columnas faltantes a srl_requests
-- (Si ya existen, PostgreSQL las ignora)

ALTER TABLE srl_requests 
ADD COLUMN IF NOT EXISTS technician_name TEXT,
ADD COLUMN IF NOT EXISTS technician_visit_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS technician_message TEXT,
ADD COLUMN IF NOT EXISTS result TEXT CHECK (result IN ('OPERATIVO', 'NO_OPERATIVO')),
ADD COLUMN IF NOT EXISTS next_visit_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- PASO 2: Verificar que srl_email_settings tenga updated_at
ALTER TABLE srl_email_settings 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- PASO 3: Cambiar required_date a TEXT para evitar errores de formato
ALTER TABLE srl_requests 
ALTER COLUMN required_date TYPE TEXT USING required_date::TEXT;

-- PASO 4: Crear bucket de storage 'srl-images' (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('srl-images', 'srl-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- PASO 5: Eliminar políticas viejas de storage
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%srl%')
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects'; 
    END LOOP;
END $$;

-- PASO 6: Crear políticas PERMISIVAS para storage
CREATE POLICY "srl_insert_all" 
ON storage.objects FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'srl-images');

CREATE POLICY "srl_select_all" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'srl-images');

CREATE POLICY "srl_update_all" 
ON storage.objects FOR UPDATE 
TO public 
USING (bucket_id = 'srl-images')
WITH CHECK (bucket_id = 'srl-images');

CREATE POLICY "srl_delete_all" 
ON storage.objects FOR DELETE 
TO public 
USING (bucket_id = 'srl-images');

-- PASO 7: Verificación Final
SELECT 
    'srl_requests columns' as check_type,
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'srl_requests' 
  AND column_name IN ('technician_name', 'result', 'closed_at')
ORDER BY column_name;

SELECT 
    'srl-images bucket' as check_type,
    id, 
    name, 
    public 
FROM storage.buckets 
WHERE id = 'srl-images';

-- ✅ Si ves resultados en ambas queries, está todo listo
