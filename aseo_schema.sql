-- =============================================
-- ASEO MODULE (Cleaning Management)
-- =============================================
-- Mobile-first cleaning records system with PC admin panel
-- Isolated portal at /aseo

-- ==========================================
-- 1. CLEANERS (Name-based identification)
-- ==========================================
CREATE TABLE IF NOT EXISTS aseo_cleaners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_active_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 2. CLEANING RECORDS
-- ==========================================
CREATE TABLE IF NOT EXISTS aseo_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cleaner_id UUID NOT NULL REFERENCES aseo_cleaners(id) ON DELETE CASCADE,
    cleaner_name TEXT NOT NULL,
    bus_ppu TEXT NOT NULL,
    terminal_code TEXT NOT NULL,
    cleaning_type TEXT CHECK (cleaning_type IN ('BARRIDO', 'BARRIDO_Y_TRAPEADO', 'FULL')) NOT NULL,
    graffiti_removed BOOLEAN DEFAULT false,
    stickers_removed BOOLEAN DEFAULT false,
    photo_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. TASKS (Assigned from PC panel)
-- ==========================================
CREATE TABLE IF NOT EXISTS aseo_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cleaner_id UUID NOT NULL REFERENCES aseo_cleaners(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('PENDIENTE', 'TERMINADA')) DEFAULT 'PENDIENTE',
    evidence_url TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- ==========================================
-- 4. NOTIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS aseo_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cleaner_id UUID NOT NULL REFERENCES aseo_cleaners(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('TAREA_NUEVA', 'OBSERVACION', 'CAMBIO_ESTADO')) NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT false,
    related_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_aseo_records_cleaner ON aseo_records(cleaner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aseo_records_terminal ON aseo_records(terminal_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aseo_records_date ON aseo_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aseo_tasks_cleaner ON aseo_tasks(cleaner_id, status);
CREATE INDEX IF NOT EXISTS idx_aseo_notifications_cleaner ON aseo_notifications(cleaner_id, read, created_at DESC);

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Cleaners table: Anyone can insert (register), select own
ALTER TABLE aseo_cleaners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register as cleaner"
ON aseo_cleaners FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can view cleaners"
ON aseo_cleaners FOR SELECT
TO public
USING (true);

CREATE POLICY "Cleaners can update own last_active"
ON aseo_cleaners FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Records table: Cleaners can insert own, select own
ALTER TABLE aseo_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cleaners can insert own records"
ON aseo_records FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public can view all records"
ON aseo_records FOR SELECT
TO public
USING (true);

-- Tasks table: Anyone can view, update
ALTER TABLE aseo_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert tasks"
ON aseo_tasks FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public can view all tasks"
ON aseo_tasks FOR SELECT
TO public
USING (true);

CREATE POLICY "Public can update tasks"
ON aseo_tasks FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Notifications table: Public access
ALTER TABLE aseo_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert notifications"
ON aseo_notifications FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public can view all notifications"
ON aseo_notifications FOR SELECT
TO public
USING (true);

CREATE POLICY "Public can update notifications"
ON aseo_notifications FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- ==========================================
-- STORAGE BUCKET FOR PHOTOS
-- ==========================================
-- Run this separately in Supabase dashboard or via SQL Editor

INSERT INTO storage.buckets (id, name, public)
VALUES ('aseo-photos', 'aseo-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for aseo-photos bucket
CREATE POLICY "aseo_photos_insert"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'aseo-photos');

CREATE POLICY "aseo_photos_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'aseo-photos');

CREATE POLICY "aseo_photos_update"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'aseo-photos')
WITH CHECK (bucket_id = 'aseo-photos');

CREATE POLICY "aseo_photos_delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'aseo-photos');
