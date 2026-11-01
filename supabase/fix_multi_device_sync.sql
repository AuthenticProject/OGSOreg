-- ==============================================================================
-- OGSOreg — FIX MULTI-DEVICE CLOUD SYNCHRONIZATION (SUPABASE SQL SCRIPT)
-- ==============================================================================
-- Target Project: https://cuunipngguedqttuutaa.supabase.co
-- Dashboard SQL Editor: https://supabase.com/dashboard/project/cuunipngguedqttuutaa/sql
--
-- Jalankan skrip ini SEKALI di Supabase SQL Editor agar:
-- 1. Data peserta (students) tersimpan ke cloud Supabase (bukan hanya di localStorage browser/device).
-- 2. Data juara (competition_winners), periode, dan sertifikat tersimpan ke cloud Supabase.
-- 3. Semua device (laptop admin, HP panitia, komputer lain) langsung tersinkronisasi secara real-time.
-- ==============================================================================

-- 1. UPDATE STUDENTS TABLE (DATA PESERTA)
-- Pastikan kolom kelas & custom_fields ada, dan batasan jenjang menerima baik 'Jenjang 1-5' maupun 'Kelas 1-5'
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS kelas TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_jenjang_check;
ALTER TABLE public.students ADD CONSTRAINT students_jenjang_check 
  CHECK (jenjang IN ('Jenjang 1', 'Jenjang 2', 'Jenjang 3', 'Jenjang 4', 'Jenjang 5', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5'));

-- Pastikan RLS students terbuka untuk sync multi-device
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students select access" ON public.students;
DROP POLICY IF EXISTS "Students insert access" ON public.students;
DROP POLICY IF EXISTS "Students update access" ON public.students;
DROP POLICY IF EXISTS "Students delete access" ON public.students;

CREATE POLICY "Students select access" ON public.students
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Students insert access" ON public.students
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Students update access" ON public.students
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Students delete access" ON public.students
  FOR DELETE TO anon, authenticated USING (true);

-- 2. UNIVERSAL APP SETTINGS TABLE (Penyimpanan Konfigurasi & Data Lintas Device)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Public insert app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Public update app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Public delete app_settings" ON public.app_settings;

CREATE POLICY "Public select app_settings" ON public.app_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert app_settings" ON public.app_settings
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update app_settings" ON public.app_settings
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete app_settings" ON public.app_settings
  FOR DELETE TO anon, authenticated USING (true);

-- 3. COMPETITION PERIODS TABLE (PERIODE LOMBA)
CREATE TABLE IF NOT EXISTS public.competition_periods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    year INTEGER NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_published BOOLEAN DEFAULT true,
    total_winners INTEGER DEFAULT 0,
    total_participants INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.competition_periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select competition_periods" ON public.competition_periods;
DROP POLICY IF EXISTS "Public insert competition_periods" ON public.competition_periods;
DROP POLICY IF EXISTS "Public update competition_periods" ON public.competition_periods;
DROP POLICY IF EXISTS "Public delete competition_periods" ON public.competition_periods;

CREATE POLICY "Public select competition_periods" ON public.competition_periods
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert competition_periods" ON public.competition_periods
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update competition_periods" ON public.competition_periods
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete competition_periods" ON public.competition_periods
  FOR DELETE TO anon, authenticated USING (true);

-- 4. COMPETITION WINNERS TABLE (DATA JUARA LOMBA)
CREATE TABLE IF NOT EXISTS public.competition_winners (
    id TEXT PRIMARY KEY,
    period_id TEXT NOT NULL,
    student_id TEXT,
    student_name TEXT NOT NULL,
    campus TEXT NOT NULL,
    category TEXT NOT NULL,
    award TEXT NOT NULL,
    rank INTEGER NOT NULL DEFAULT 999,
    score NUMERIC(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_winners_period_id ON public.competition_winners(period_id);
CREATE INDEX IF NOT EXISTS idx_winners_campus ON public.competition_winners(campus);
CREATE INDEX IF NOT EXISTS idx_winners_category ON public.competition_winners(category);

ALTER TABLE public.competition_winners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select competition_winners" ON public.competition_winners;
DROP POLICY IF EXISTS "Public insert competition_winners" ON public.competition_winners;
DROP POLICY IF EXISTS "Public update competition_winners" ON public.competition_winners;
DROP POLICY IF EXISTS "Public delete competition_winners" ON public.competition_winners;

CREATE POLICY "Public select competition_winners" ON public.competition_winners
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert competition_winners" ON public.competition_winners
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update competition_winners" ON public.competition_winners
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete competition_winners" ON public.competition_winners
  FOR DELETE TO anon, authenticated USING (true);

-- 5. COMPETITION CERTIFICATES TABLE (SERTIFIKAT RESMI)
CREATE TABLE IF NOT EXISTS public.competition_certificates (
    id TEXT PRIMARY KEY,
    certificate_number TEXT UNIQUE NOT NULL,
    period_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    campus TEXT NOT NULL,
    category TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('participant', 'winner', 'appreciation')),
    award TEXT,
    issued_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.competition_certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select competition_certificates" ON public.competition_certificates;
DROP POLICY IF EXISTS "Public insert competition_certificates" ON public.competition_certificates;
DROP POLICY IF EXISTS "Public update competition_certificates" ON public.competition_certificates;
DROP POLICY IF EXISTS "Public delete competition_certificates" ON public.competition_certificates;

CREATE POLICY "Public select competition_certificates" ON public.competition_certificates
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert competition_certificates" ON public.competition_certificates
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update competition_certificates" ON public.competition_certificates
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete competition_certificates" ON public.competition_certificates
  FOR DELETE TO anon, authenticated USING (true);

-- 6. COMPETITION HISTORICAL AGGREGATES TABLE (REKAP KAMPUS HALL OF FAME)
CREATE TABLE IF NOT EXISTS public.competition_historical_aggregates (
    id TEXT PRIMARY KEY,
    period_id TEXT NOT NULL,
    period_year INTEGER NOT NULL,
    period_name TEXT NOT NULL,
    campus TEXT NOT NULL,
    gold INTEGER NOT NULL DEFAULT 0,
    silver INTEGER NOT NULL DEFAULT 0,
    bronze INTEGER NOT NULL DEFAULT 0,
    honorable_1 INTEGER NOT NULL DEFAULT 0,
    honorable_2 INTEGER NOT NULL DEFAULT 0,
    source TEXT DEFAULT 'imported_aggregate',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hist_aggs_period_id ON public.competition_historical_aggregates(period_id);
CREATE INDEX IF NOT EXISTS idx_hist_aggs_campus ON public.competition_historical_aggregates(campus);
CREATE INDEX IF NOT EXISTS idx_hist_aggs_period_year ON public.competition_historical_aggregates(period_year);

ALTER TABLE public.competition_historical_aggregates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select competition_historical_aggregates" ON public.competition_historical_aggregates;
DROP POLICY IF EXISTS "Public insert competition_historical_aggregates" ON public.competition_historical_aggregates;
DROP POLICY IF EXISTS "Public update competition_historical_aggregates" ON public.competition_historical_aggregates;
DROP POLICY IF EXISTS "Public delete competition_historical_aggregates" ON public.competition_historical_aggregates;

CREATE POLICY "Public select competition_historical_aggregates" ON public.competition_historical_aggregates
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert competition_historical_aggregates" ON public.competition_historical_aggregates
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update competition_historical_aggregates" ON public.competition_historical_aggregates
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete competition_historical_aggregates" ON public.competition_historical_aggregates
  FOR DELETE TO anon, authenticated USING (true);

-- 7. REALTIME REPLICATION (Agar perubahan langsung terlihat di seluruh device tanpa reload)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_periods;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_winners;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_certificates;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_historical_aggregates;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- 8. FIX USER PROFILES & DIRECT PASSWORD UPDATE RPC
-- Mengizinkan update user_profiles (agar status must_change_password = false tersimpan permanen)
-- dan membuat fungsi RPC change_user_password_direct untuk sinkronisasi sandi baru ke auth.users
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles superadmin update" ON public.user_profiles;
DROP POLICY IF EXISTS "Profiles update access" ON public.user_profiles;

CREATE POLICY "Profiles update access" ON public.user_profiles
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.change_user_password_direct(
  p_username TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_uid UUID;
  v_clean_uname TEXT := LOWER(TRIM(p_username));
BEGIN
  -- 1. Update public.user_profiles: must_change_password = false
  UPDATE public.user_profiles
  SET must_change_password = false,
      updated_at = NOW()
  WHERE LOWER(username) = v_clean_uname;

  -- 2. Ambil auth_user_id dari user_profiles
  SELECT auth_user_id INTO v_uid
  FROM public.user_profiles
  WHERE LOWER(username) = v_clean_uname;

  -- 3. Update auth.users password jika ada
  IF v_uid IS NOT NULL THEN
    UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = v_uid;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.change_user_password_direct(TEXT, TEXT) TO anon, authenticated;

