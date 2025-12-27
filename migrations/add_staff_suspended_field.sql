-- ========================================
-- Migración: Agregar campo suspended a staff
-- ========================================

-- Agregar campo suspended a tabla staff
ALTER TABLE staff
ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT FALSE;

-- Índice para mejorar consultas de filtrado
CREATE INDEX IF NOT EXISTS idx_staff_suspended ON staff(suspended);

-- Comentario descriptivo para documentación
COMMENT ON COLUMN staff.suspended IS 'Indica si el trabajador está temporalmente suspendido (puede reactivarse). Diferente de desvinculación que es permanente.';

-- Verificar que el campo se creó correctamente
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'staff' AND column_name = 'suspended';
