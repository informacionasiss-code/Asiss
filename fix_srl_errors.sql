-- 1. Fix missing 'created_at' in srl_email_settings
ALTER TABLE srl_email_settings 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 2. NUCLEAR OPTION for Date Error (Error 22007)
-- This allows empty strings ("") to be stored by changing the column type to TEXT.
-- This bypasses the strict DATE validation that is failing due to cached frontend code sending "".
ALTER TABLE srl_requests 
ALTER COLUMN required_date TYPE TEXT;

-- 3. Ensure it is nullable (it should be already, but ensuring)
ALTER TABLE srl_requests 
ALTER COLUMN required_date DROP NOT NULL;
