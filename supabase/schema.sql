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
