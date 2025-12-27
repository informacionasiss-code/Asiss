-- ========================================
-- SQL SCRIPTS PARA BORRAR MARCAS DE ASISTENCIA "PRESENTE"
-- ========================================
-- ⚠️ ADVERTENCIA: Haz un backup antes de ejecutar estos comandos
-- ⚠️ Estos comandos NO se pueden deshacer
-- ========================================

-- ====================
-- OPCIÓN 1: Borrar TODOS los presentes de TODAS las fechas
-- ====================
-- ⚠️ PELIGRO: Esto borrará TODAS las marcas de presente en el sistema
DELETE FROM attendance_marks
WHERE mark = 'P';

-- ====================
-- OPCIÓN 2: Borrar presentes de UNA FECHA ESPECÍFICA
-- ====================
-- Reemplaza '2025-12-27' con la fecha que necesites
DELETE FROM attendance_marks
WHERE mark = 'P'
AND mark_date = '2025-12-27';

-- ====================
-- OPCIÓN 3: Borrar presentes de UN RANGO DE FECHAS
-- ====================
-- Reemplaza las fechas según necesites
DELETE FROM attendance_marks
WHERE mark = 'P'
AND mark_date BETWEEN '2025-12-22' AND '2025-12-28';

-- ====================
-- OPCIÓN 4: Borrar presentes de UN TRABAJADOR ESPECÍFICO
-- ====================
-- Reemplaza 'staff_id_aqui' con el ID del trabajador
DELETE FROM attendance_marks
WHERE mark = 'P'
AND staff_id = 'staff_id_aqui';

-- ====================
-- OPCIÓN 5: Borrar presentes de un TERMINAL ESPECÍFICO
-- ====================
-- Primero necesitamos unir con la tabla staff para filtrar por terminal
DELETE FROM attendance_marks
WHERE mark = 'P'
AND staff_id IN (
    SELECT id FROM staff WHERE terminal_code = 'EL_ROBLE'
);

-- ====================
-- OPCIÓN 6: Borrar presentes de la SEMANA ACTUAL
-- ====================
DELETE FROM attendance_marks
WHERE mark = 'P'
AND mark_date >= DATE_TRUNC('week', CURRENT_DATE)
AND mark_date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days';

-- ====================
-- OPCIÓN 7: Borrar presentes del MES ACTUAL
-- ====================
DELETE FROM attendance_marks
WHERE mark = 'P'
AND mark_date >= DATE_TRUNC('month', CURRENT_DATE)
AND mark_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- ====================
-- VERIFICAR ANTES DE BORRAR
-- ====================
-- Ejecuta este SELECT primero para ver cuántos registros se borrarán:

-- Ver TODOS los presentes
SELECT COUNT(*) as total_presentes
FROM attendance_marks
WHERE mark = 'P';

-- Ver presentes de una fecha específica
SELECT COUNT(*) as total_presentes,
       mark_date,
       COUNT(DISTINCT staff_id) as trabajadores_afectados
FROM attendance_marks
WHERE mark = 'P'
AND mark_date = '2025-12-27'
GROUP BY mark_date;

-- Ver detalle de presentes a borrar (con información del trabajador)
SELECT 
    am.mark_date,
    am.mark,
    s.rut,
    s.nombre,
    s.cargo,
    s.terminal_code
FROM attendance_marks am
JOIN staff s ON am.staff_id = s.id
WHERE am.mark = 'P'
AND am.mark_date = '2025-12-27'
ORDER BY s.nombre;

-- ====================
-- RESTAURAR DESDE BACKUP (si tienes uno)
-- ====================
-- Si hiciste backup antes de borrar, puedes restaurar con:
-- COPY attendance_marks FROM '/path/to/backup.csv' WITH (FORMAT csv, HEADER true);
