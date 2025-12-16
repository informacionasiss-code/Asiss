-- =============================================
-- MIGRACIÓN: FIX PERMISOS CONFIGURACIÓN
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Asegurar que los permisos son completos para 'public'
ALTER TABLE app_configuration ENABLE ROW LEVEL SECURITY;

-- 1. Limpiar políticas antiguas para evitar duplicados/errores
DROP POLICY IF EXISTS "Public Read Config" ON app_configuration;
DROP POLICY IF EXISTS "Public Update Config" ON app_configuration;
DROP POLICY IF EXISTS "Public Insert Config" ON app_configuration;
DROP POLICY IF EXISTS "Public All Config" ON app_configuration;

-- 2. Crear política permisiva TOTAL (Select, Insert, Update)
-- Necesaria para que el .upsert() funcione correctamente
CREATE POLICY "Public All Config"
ON app_configuration
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Verificación: Asegurar que existe la configuración inicial
INSERT INTO app_configuration (key, value, description)
VALUES (
    'email_notifications', 
    '{"to": ["isaac.avila@transdev.cl"], "cc": []}'::jsonb,
    'Configuración de destinatarios para notificaciones de asistencia'
) 
ON CONFLICT (key) DO NOTHING;
