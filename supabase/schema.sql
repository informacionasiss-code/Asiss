-- =============================================
-- ASISS DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- SECTION: PERSONAL
-- =============================================

-- Enum para estado de staff
CREATE TYPE staff_status AS ENUM ('ACTIVO', 'DESVINCULADO');

-- Tabla principal de personal
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  cargo TEXT NOT NULL,
  terminal_code TEXT NOT NULL,
  turno TEXT NOT NULL,
  horario TEXT NOT NULL,
  contacto TEXT NOT NULL,
  status staff_status NOT NULL DEFAULT 'ACTIVO',
  terminated_at TIMESTAMPTZ,
  termination_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para staff
CREATE INDEX idx_staff_rut ON staff(rut);
CREATE INDEX idx_staff_terminal ON staff(terminal_code);
CREATE INDEX idx_staff_cargo ON staff(cargo); 
CREATE INDEX idx_staff_status ON staff(status);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabla de amonestaciones
CREATE TABLE staff_admonitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  admonition_date DATE NOT NULL,
  document_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_admonitions_staff ON staff_admonitions(staff_id, admonition_date DESC);

-- Tabla de cupos máximos
CREATE TABLE staff_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type TEXT NOT NULL CHECK (scope_type IN ('TERMINAL_GROUP', 'TERMINAL', 'COMPANY')),
  scope_code TEXT NOT NULL,
  cargo TEXT NOT NULL,
  max_q INT NOT NULL CHECK (max_q >= 0),
  UNIQUE(scope_type, scope_code, cargo)
);

-- Insertar cupos para ER_LR (El Roble + La Reina)
INSERT INTO staff_caps (scope_type, scope_code, cargo, max_q) VALUES
  ('TERMINAL_GROUP', 'ER_LR', 'conductor', 12),
  ('TERMINAL_GROUP', 'ER_LR', 'inspector_patio', 21),
  ('TERMINAL_GROUP', 'ER_LR', 'cleaner', 36),
  ('TERMINAL_GROUP', 'ER_LR', 'planillero', 9),
  ('TERMINAL_GROUP', 'ER_LR', 'supervisor', 7);

-- Enable Realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE staff;
ALTER PUBLICATION supabase_realtime ADD TABLE staff_admonitions;

-- RLS Policies (permissive for development)
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_admonitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_caps ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust for production)
CREATE POLICY "Allow all for staff" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for admonitions" ON staff_admonitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for caps" ON staff_caps FOR SELECT USING (true);












-- =============================================
-- STORAGE: Create bucket for staff documents
-- Run this separately or create via Supabase Dashboard:
-- Bucket name: staff-docs
-- Public: false
-- =============================================

-- =============================================
-- SECTION: ASISTENCIA
-- =============================================

-- Enum para estado de autorización
CREATE TYPE auth_status_enum AS ENUM ('PENDIENTE', 'AUTORIZADO', 'RECHAZADO');

-- Enum para entrada/salida
CREATE TYPE entry_exit_enum AS ENUM ('ENTRADA', 'SALIDA');

-- Tabla: No Marcaciones
CREATE TABLE attendance_no_marcaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut TEXT NOT NULL,
  nombre TEXT NOT NULL,
  area TEXT,
  cargo TEXT,
  jefe_terminal TEXT,
  terminal_code TEXT NOT NULL,
  cabezal TEXT,
  incident_state TEXT,
  schedule_in_out TEXT,
  date DATE NOT NULL,
  time_range TEXT,
  observations TEXT,
  informed_by TEXT,
  auth_status auth_status_enum NOT NULL DEFAULT 'PENDIENTE',
  authorized_by TEXT,
  authorized_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_by_supervisor TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_no_marcaciones_rut ON attendance_no_marcaciones(rut);
CREATE INDEX idx_no_marcaciones_terminal ON attendance_no_marcaciones(terminal_code);
CREATE INDEX idx_no_marcaciones_status ON attendance_no_marcaciones(auth_status);
CREATE INDEX idx_no_marcaciones_date ON attendance_no_marcaciones(date DESC);

CREATE TRIGGER update_no_marcaciones_updated_at
  BEFORE UPDATE ON attendance_no_marcaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabla: Sin Credenciales
CREATE TABLE attendance_sin_credenciales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut TEXT NOT NULL,
  nombre TEXT NOT NULL,
  terminal_code TEXT NOT NULL,
  cabezal TEXT,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  cargo TEXT,
  supervisor_autoriza TEXT,
  area TEXT,
  responsable TEXT,
  observacion TEXT,
  auth_status auth_status_enum NOT NULL DEFAULT 'PENDIENTE',
  authorized_by TEXT,
  authorized_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_by_supervisor TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sin_credenciales_rut ON attendance_sin_credenciales(rut);
CREATE INDEX idx_sin_credenciales_terminal ON attendance_sin_credenciales(terminal_code);
CREATE INDEX idx_sin_credenciales_status ON attendance_sin_credenciales(auth_status);
CREATE INDEX idx_sin_credenciales_date ON attendance_sin_credenciales(date DESC);

CREATE TRIGGER update_sin_credenciales_updated_at
  BEFORE UPDATE ON attendance_sin_credenciales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabla: Cambios de Día
CREATE TABLE attendance_cambios_dia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut TEXT NOT NULL,
  nombre TEXT NOT NULL,
  terminal_code TEXT NOT NULL,
  cabezal TEXT,
  date DATE NOT NULL,
  prog_start TIME,
  prog_end TIME,
  reprogram_start TIME,
  reprogram_end TIME,
  day_off_date DATE,
  day_off_start TIME,
  day_off_end TIME,
  day_on_date DATE,
  day_on_start TIME,
  day_on_end TIME,
  document_path TEXT,
  auth_status auth_status_enum NOT NULL DEFAULT 'PENDIENTE',
  authorized_by TEXT,
  authorized_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_by_supervisor TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cambios_dia_rut ON attendance_cambios_dia(rut);
CREATE INDEX idx_cambios_dia_terminal ON attendance_cambios_dia(terminal_code);
CREATE INDEX idx_cambios_dia_status ON attendance_cambios_dia(auth_status);
CREATE INDEX idx_cambios_dia_date ON attendance_cambios_dia(date DESC);

CREATE TRIGGER update_cambios_dia_updated_at
  BEFORE UPDATE ON attendance_cambios_dia
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabla: Autorizaciones (retiro anticipado / llegada tardía)
CREATE TABLE attendance_autorizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut TEXT NOT NULL,
  nombre TEXT NOT NULL,
  cargo TEXT,
  terminal_code TEXT NOT NULL,
  turno TEXT,
  horario TEXT,
  authorization_date DATE NOT NULL,
  entry_or_exit entry_exit_enum NOT NULL,
  motivo TEXT NOT NULL,
  auth_status auth_status_enum NOT NULL DEFAULT 'PENDIENTE',
  authorized_by TEXT,
  authorized_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_by_supervisor TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_autorizaciones_rut ON attendance_autorizaciones(rut);
CREATE INDEX idx_autorizaciones_terminal ON attendance_autorizaciones(terminal_code);
CREATE INDEX idx_autorizaciones_status ON attendance_autorizaciones(auth_status);
CREATE INDEX idx_autorizaciones_date ON attendance_autorizaciones(authorization_date DESC);

CREATE TRIGGER update_autorizaciones_updated_at
  BEFORE UPDATE ON attendance_autorizaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime for attendance tables
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_no_marcaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_sin_credenciales;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_cambios_dia;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_autorizaciones;

-- RLS for attendance tables
ALTER TABLE attendance_no_marcaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sin_credenciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_cambios_dia ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_autorizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for no_marcaciones" ON attendance_no_marcaciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for sin_credenciales" ON attendance_sin_credenciales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for cambios_dia" ON attendance_cambios_dia FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for autorizaciones" ON attendance_autorizaciones FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- STORAGE: Create bucket for attendance documents
-- Bucket name: attendance-docs
-- Public: false
-- =============================================

-- =============================================
-- SECTION: CREDENCIALES DE RESPALDO
-- Control de préstamo de tarjetas de respaldo
-- =============================================

-- Enums para estados
CREATE TYPE backup_card_status_enum AS ENUM ('LIBRE', 'ASIGNADA', 'INACTIVA');
CREATE TYPE backup_loan_status_enum AS ENUM ('ASIGNADA', 'RECUPERADA', 'CERRADA', 'CANCELADA');
CREATE TYPE backup_reason_enum AS ENUM ('PERDIDA', 'DETERIORO');

-- Tabla: Inventario de tarjetas de respaldo
CREATE TABLE backup_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number TEXT UNIQUE NOT NULL,
  inventory_terminal TEXT NOT NULL CHECK (inventory_terminal IN ('El Roble', 'La Reina', 'Maria Angelica')),
  status backup_card_status_enum NOT NULL DEFAULT 'LIBRE',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_backup_cards_terminal_status ON backup_cards(inventory_terminal, status);

CREATE TRIGGER update_backup_cards_updated_at
  BEFORE UPDATE ON backup_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabla: Préstamos de tarjetas de respaldo
CREATE TABLE backup_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES backup_cards(id),
  -- Datos de la persona (independiente de tabla Personal)
  person_rut TEXT NOT NULL,
  person_name TEXT NOT NULL,
  person_cargo TEXT,
  person_terminal TEXT NOT NULL,
  person_turno TEXT,
  person_horario TEXT,
  person_contacto TEXT,
  boss_email TEXT,
  -- Solicitud
  reason backup_reason_enum NOT NULL,
  requested_at DATE NOT NULL DEFAULT CURRENT_DATE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Tiempos esperados y alertas
  expected_return_days INT NOT NULL DEFAULT 3,
  alert_after_days INT NOT NULL DEFAULT 7,
  -- Estado del préstamo
  status backup_loan_status_enum NOT NULL DEFAULT 'ASIGNADA',
  recovered_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  cancel_reason TEXT,
  -- Descuento
  discount_amount INT NOT NULL DEFAULT 5000,
  discount_applied BOOLEAN NOT NULL DEFAULT true,
  discount_evidence_path TEXT,
  -- Auditoría
  created_by_supervisor TEXT NOT NULL,
  emails_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice único parcial: Una tarjeta solo puede tener UN préstamo activo (ASIGNADA)
CREATE UNIQUE INDEX idx_backup_loans_active_card ON backup_loans(card_id) WHERE status = 'ASIGNADA';

-- Índices para consultas frecuentes
CREATE INDEX idx_backup_loans_person_rut ON backup_loans(person_rut);
CREATE INDEX idx_backup_loans_terminal_status ON backup_loans(person_terminal, status, issued_at DESC);
CREATE INDEX idx_backup_loans_status_issued ON backup_loans(status, issued_at DESC);
CREATE INDEX idx_backup_loans_issued ON backup_loans(issued_at DESC);

CREATE TRIGGER update_backup_loans_updated_at
  BEFORE UPDATE ON backup_loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabla: Configuración de correos
CREATE TABLE backup_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type TEXT NOT NULL CHECK (scope_type IN ('GLOBAL', 'TERMINAL')),
  scope_code TEXT NOT NULL,
  manager_email TEXT NOT NULL,
  cc_emails TEXT,
  subject_manager TEXT NOT NULL DEFAULT 'Solicitud de Nueva Credencial',
  subject_boss TEXT NOT NULL DEFAULT 'Notificación de Credencial de Respaldo',
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(scope_type, scope_code)
);

CREATE TRIGGER update_backup_email_settings_updated_at
  BEFORE UPDATE ON backup_email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE backup_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE backup_loans;

-- RLS (permisivo para desarrollo)
ALTER TABLE backup_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for backup_cards" ON backup_cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for backup_loans" ON backup_loans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for backup_email_settings" ON backup_email_settings FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- STORAGE: Create bucket for backup evidence
-- Bucket name: backup-evidence
-- Public: false
-- =============================================

-- =============================================
-- SECTION: SOLICITUDES INTELIGENTES DE INSUMOS
-- Gestion de insumos, solicitudes, y entregas
-- =============================================

-- Tabla: Catalogo de insumos
CREATE TABLE supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  life_days INT,
  min_stock INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_supplies_name ON supplies(name);

-- Tabla: Perfiles de consumo por ubicacion y periodo
CREATE TABLE supply_consumption_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_type TEXT NOT NULL CHECK (location_type IN ('TERMINAL', 'CABEZAL')),
  location_name TEXT NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('DAY', 'NIGHT', 'WEEKEND')),
  supply_id UUID NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(location_type, location_name, period, supply_id)
);

CREATE INDEX idx_consumption_profiles_location ON supply_consumption_profiles(location_type, location_name);

CREATE TRIGGER update_consumption_profiles_updated_at
  BEFORE UPDATE ON supply_consumption_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabla: Solicitudes de insumos
CREATE TABLE supply_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('SEMANA', 'FIN_SEMANA', 'EXTRA')),
  status TEXT NOT NULL CHECK (status IN ('PENDIENTE', 'RETIRADO')) DEFAULT 'PENDIENTE',
  receipt_path TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  retrieved_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  consumption_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_supply_requests_terminal ON supply_requests(terminal);
CREATE INDEX idx_supply_requests_status ON supply_requests(status);
CREATE INDEX idx_supply_requests_date ON supply_requests(requested_at DESC);

CREATE TRIGGER update_supply_requests_updated_at
  BEFORE UPDATE ON supply_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabla: Items de cada solicitud
CREATE TABLE supply_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES supply_requests(id) ON DELETE CASCADE,
  supply_id UUID NOT NULL REFERENCES supplies(id),
  quantity INT NOT NULL DEFAULT 0,
  is_extra BOOLEAN DEFAULT false
);

CREATE INDEX idx_request_items_request ON supply_request_items(request_id);

-- Tabla: Entregas a personal (cleaners)
CREATE TABLE supply_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_id UUID NOT NULL REFERENCES supplies(id),
  staff_rut TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  quantity INT NOT NULL,
  delivered_at TIMESTAMPTZ DEFAULT now(),
  next_delivery_at TIMESTAMPTZ,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_supply_deliveries_staff ON supply_deliveries(staff_rut);
CREATE INDEX idx_supply_deliveries_supply ON supply_deliveries(supply_id);
CREATE INDEX idx_supply_deliveries_next ON supply_deliveries(next_delivery_at);

-- Tabla: Configuracion de correos automaticos
CREATE TABLE supply_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger TEXT NOT NULL CHECK (trigger IN ('MONDAY', 'FRIDAY', 'MANUAL')),
  recipients TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT 'Solicitud de Insumos',
  body TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trigger)
);

CREATE TRIGGER update_supply_email_settings_updated_at
  BEFORE UPDATE ON supply_email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE supplies;
ALTER PUBLICATION supabase_realtime ADD TABLE supply_consumption_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE supply_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE supply_deliveries;

-- RLS (permisivo para desarrollo)
ALTER TABLE supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_consumption_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for supplies" ON supplies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for supply_consumption_profiles" ON supply_consumption_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for supply_requests" ON supply_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for supply_request_items" ON supply_request_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for supply_deliveries" ON supply_deliveries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for supply_email_settings" ON supply_email_settings FOR ALL USING (true) WITH CHECK (true);

-- Seed: Insumos base
INSERT INTO supplies (name, unit, life_days, min_stock) VALUES
  ('Nova', 'unidad', NULL, 10),
  ('Confort', 'unidad', NULL, 15),
  ('Bolsas chicas', 'paquete', NULL, 5),
  ('Bolsas grandes', 'paquete', NULL, 5),
  ('Traperos', 'unidad', 30, 3),
  ('Escobillones', 'unidad', 60, 2),
  ('Dispensadores', 'unidad', NULL, 1),
  ('Pulverizador', 'unidad', NULL, 2),
  ('Jabon', 'bidon', NULL, 2)
ON CONFLICT DO NOTHING;

-- Seed: Configuracion de correos por defecto
INSERT INTO supply_email_settings (trigger, recipients, subject, body, enabled) VALUES
  ('MONDAY', '', 'Solicitud Semanal de Insumos', 'Adjunto solicitud de insumos para la semana.', true),
  ('FRIDAY', '', 'Solicitud Fin de Semana - Insumos', 'Adjunto solicitud de insumos para el fin de semana.', true),
  ('MANUAL', '', 'Solicitud Manual de Insumos', 'Solicitud manual de insumos.', true)
ON CONFLICT (trigger) DO NOTHING;

-- =============================================
-- STORAGE: Create bucket for supply receipts
-- Bucket name: supply-receipts
-- Public: false
-- Allowed types: pdf, jpg, png
-- =============================================

-- =============================================
-- PERSONAL (ALTER: tallas y correo)
-- Agregado: 2025-12-26
-- Campos NULLables para compatibilidad con registros existentes
-- =============================================

ALTER TABLE staff ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS talla_polera TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS talla_chaqueta TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS talla_pantalon TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS talla_zapato_seguridad TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS talla_chaleco_reflectante TEXT;
