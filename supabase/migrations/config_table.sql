-- =============================================
-- MIGRACIÓN: CONFIGURACIÓN APP (Email Recipients)
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Crear tabla de configuración
CREATE TABLE IF NOT EXISTS app_configuration (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL,
    description text,
    updated_at timestamptz DEFAULT now()
);

-- 2. Insertar configuración inicial (si no existe)
-- Por defecto el correo que ya funcionaba
INSERT INTO app_configuration (key, value, description)
VALUES (
    'email_notifications', 
    '{"to": ["isaac.avila@transdev.cl"], "cc": []}'::jsonb,
    'Configuración de destinatarios para notificaciones de asistencia'
) 
ON CONFLICT (key) DO NOTHING;

-- 3. Habilitar seguridad (RLS) pero permitir acceso público
-- (Asumiendo que la app funciona mayormente en modo anónimo/cliente o con auth propia)
ALTER TABLE app_configuration ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Config" ON app_configuration;
CREATE POLICY "Public Read Config" ON app_configuration FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public Update Config" ON app_configuration;
CREATE POLICY "Public Update Config" ON app_configuration FOR UPDATE TO public USING (true);

-- Verificación
SELECT * FROM app_configuration;
