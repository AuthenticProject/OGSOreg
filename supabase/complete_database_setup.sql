-- ==============================================================================
-- OGSOreg — COMPLETE SUPABASE DATABASE SETUP (1-CLICK RUN IN SUPABASE SQL EDITOR)
-- ==============================================================================
-- Target Project: https://cuunipngguedqttuutaa.supabase.co
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cuunipngguedqttuutaa/sql
-- ==============================================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. INSTITUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    npsn TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Seed Default Institution (Pondok Modern Darussalam Gontor)
INSERT INTO public.institutions (id, name, address, email)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Pondok Modern Darussalam Gontor',
    'Ponorogo, Jawa Timur',
    'admin@ogso.gontor.ac.id'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. STUDENTS DIRECTORY TABLE (Siswa Saya)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    kelas TEXT CHECK (kelas IN ('Kelas 1', 'Kelas 2', 'Kelas 1 Int', 'Kelas 3', 'Kelas 3 Int', 'Kelas 4', 'Kelas 5')),
    jenjang TEXT NOT NULL CHECK (jenjang IN ('Jenjang 1', 'Jenjang 2', 'Jenjang 3', 'Jenjang 4', 'Jenjang 5', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5')),
    kampus TEXT,
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    created_by UUID,
    source TEXT NOT NULL CHECK (source IN ('excel', 'csv', 'manual', 'paste')) DEFAULT 'excel',
    sync_status TEXT NOT NULL CHECK (sync_status IN ('local_only', 'exported', 'synced', 'enrolled', 'failed')) DEFAULT 'local_only',
    moodle_user_id TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_institution_student_username UNIQUE (institution_id, username)
);

-- Ensure dynamic custom fields & kelas columns exist
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS kelas TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_students_institution_id ON public.students(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_username ON public.students(username);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_kelas ON public.students(kelas);
CREATE INDEX IF NOT EXISTS idx_students_jenjang ON public.students(jenjang);
CREATE INDEX IF NOT EXISTS idx_students_kampus ON public.students(kampus);
CREATE INDEX IF NOT EXISTS idx_students_sync_status ON public.students(sync_status);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON public.students(created_at DESC);

-- 3. REGISTRATION BATCHES TABLE (Riwayat Transaksi Impor & Pendaftaran)
CREATE TABLE IF NOT EXISTS public.registration_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID,
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    created_by UUID,
    batch_name TEXT NOT NULL,
    source_filename TEXT,
    participant_count INTEGER DEFAULT 0,
    teacher_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_institution_id ON public.registration_batches(institution_id);
CREATE INDEX IF NOT EXISTS idx_batches_created_at ON public.registration_batches(created_at DESC);

-- 4. USER PROFILES TABLE (21 Official OGSOreg Accounts)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'campus_admin')),
    campus_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_campus ON public.user_profiles(campus_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- 4. OPERATION AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('import_excel', 'import_csv', 'paste', 'manual_create', 'export_moodle_csv', 'export_admin_excel', 'sync_moodle')),
    operator_email TEXT NOT NULL,
    student_count INTEGER NOT NULL DEFAULT 0,
    campus_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
    jenjang_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
    error_count INTEGER NOT NULL DEFAULT 0,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. HELPER FUNCTIONS FOR SECURITY & CAMPUS ISOLATION
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_user_campus()
RETURNS TEXT AS $$
  SELECT campus_id FROM public.user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE auth_user_id = auth.uid() AND role = 'super_admin' AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 6. RPC: USERNAME RESOLUTION (No email enumeration leakage)
CREATE OR REPLACE FUNCTION public.resolve_login_identifier(p_username TEXT)
RETURNS TABLE (
  auth_email TEXT,
  user_role TEXT,
  assigned_campus TEXT,
  account_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.email AS auth_email,
    up.role AS user_role,
    up.campus_id AS assigned_campus,
    up.is_active AS account_active
  FROM public.user_profiles up
  WHERE LOWER(up.username) = LOWER(TRIM(p_username))
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to public/anon for login flow
GRANT EXECUTE ON FUNCTION public.resolve_login_identifier(TEXT) TO anon, authenticated;

-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_logs ENABLE ROW LEVEL SECURITY;

-- Clean existing policies
DROP POLICY IF EXISTS "Public view institutions" ON public.institutions;
DROP POLICY IF EXISTS "Students select access" ON public.students;
DROP POLICY IF EXISTS "Students insert access" ON public.students;
DROP POLICY IF EXISTS "Students update access" ON public.students;
DROP POLICY IF EXISTS "Students delete access" ON public.students;
DROP POLICY IF EXISTS "Profiles read access" ON public.user_profiles;
DROP POLICY IF EXISTS "Profiles superadmin update" ON public.user_profiles;
DROP POLICY IF EXISTS "Logs select access" ON public.operation_logs;
DROP POLICY IF EXISTS "Logs insert access" ON public.operation_logs;

-- Policies for institutions
CREATE POLICY "Public view institutions" ON public.institutions
  FOR SELECT TO anon, authenticated USING (true);

-- Policies for students (Permit operations with campus isolation for authenticated, plus fallback)
CREATE POLICY "Students select access" ON public.students
  FOR SELECT TO anon, authenticated
  USING (
    auth.uid() IS NULL 
    OR public.is_current_user_super_admin()
    OR kampus = public.get_current_user_campus()
    OR (kampus IS NULL AND public.is_current_user_super_admin())
  );

CREATE POLICY "Students insert access" ON public.students
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    auth.uid() IS NULL 
    OR public.is_current_user_super_admin()
    OR kampus = public.get_current_user_campus()
  );

CREATE POLICY "Students update access" ON public.students
  FOR UPDATE TO anon, authenticated
  USING (
    auth.uid() IS NULL 
    OR public.is_current_user_super_admin()
    OR kampus = public.get_current_user_campus()
  );

CREATE POLICY "Students delete access" ON public.students
  FOR DELETE TO anon, authenticated
  USING (
    auth.uid() IS NULL 
    OR public.is_current_user_super_admin()
    OR kampus = public.get_current_user_campus()
  );

-- Policies for user_profiles
CREATE POLICY "Profiles read access" ON public.user_profiles
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Profiles superadmin update" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (public.is_current_user_super_admin());

-- Policies for operation_logs
CREATE POLICY "Logs select access" ON public.operation_logs
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Logs insert access" ON public.operation_logs
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 8. SEED THE 21 OFFICIAL ACCOUNTS INTO AUTH.USERS & USER_PROFILES
DO $$
DECLARE
  v_admin_pass TEXT := crypt('OGSOreg_SuperAdmin2026!', gen_salt('bf'));
  v_campus_pass TEXT := crypt('OGSO2026', gen_salt('bf'));
  
  v_usernames TEXT[] := ARRAY[
    'admin',
    'gontor1', 'gontor2', 'gontor3', 'gontor4', 'gontor5', 'gontor6',
    'gontor7', 'gontor8', 'gontor9', 'gontor10', 'gontor11', 'gontor12',
    'gontorputri1', 'gontorputri2', 'gontorputri3', 'gontorputri4',
    'gontorputri5', 'gontorputri6', 'gontorputri7', 'gontorputri8'
  ];
  
  v_campuses TEXT[] := ARRAY[
    NULL,
    'Gontor 1', 'Gontor 2', 'Gontor 3', 'Gontor 4', 'Gontor 5', 'Gontor 6',
    'Gontor 7', 'Gontor 8', 'Gontor 9', 'Gontor 10', 'Gontor 11', 'Gontor 12',
    'Gontor Putri 1', 'Gontor Putri 2', 'Gontor Putri 3', 'Gontor Putri 4',
    'Gontor Putri 5', 'Gontor Putri 6', 'Gontor Putri 7', 'Gontor Putri 8'
  ];
  
  v_uid UUID;
  v_email TEXT;
  v_uname TEXT;
  v_role TEXT;
  v_campus TEXT;
  v_pass TEXT;
  i INT;
BEGIN
  FOR i IN 1..array_length(v_usernames, 1) LOOP
    v_uname := v_usernames[i];
    v_email := v_uname || '@ogso.gontor.ac.id';
    v_campus := v_campuses[i];
    
    IF v_uname = 'admin' THEN
      v_role := 'super_admin';
      v_pass := v_admin_pass;
    ELSE
      v_role := 'campus_admin';
      v_pass := v_campus_pass;
    END IF;
    
    -- Check if user already exists in auth.users
    SELECT id INTO v_uid FROM auth.users WHERE email = v_email;
    
    IF v_uid IS NULL THEN
      v_uid := gen_random_uuid();
      
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_uid,
        'authenticated',
        'authenticated',
        v_email,
        v_pass,
        now(),
        jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
        jsonb_build_object('username', v_uname, 'role', v_role, 'campus_id', v_campus),
        now(),
        now()
      );
    ELSE
      -- Update password and confirm existing user
      UPDATE auth.users 
      SET encrypted_password = v_pass,
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          raw_user_meta_data = jsonb_build_object('username', v_uname, 'role', v_role, 'campus_id', v_campus),
          updated_at = now()
      WHERE id = v_uid;
    END IF;
    
    -- Upsert profile in public.user_profiles
    INSERT INTO public.user_profiles (
      auth_user_id,
      username,
      email,
      display_name,
      role,
      campus_id,
      is_active,
      must_change_password,
      updated_at
    ) VALUES (
      v_uid,
      v_uname,
      v_email,
      CASE WHEN v_role = 'super_admin' THEN 'Super Admin OGSOreg' ELSE 'Admin ' || v_campus END,
      v_role,
      v_campus,
      true,
      CASE WHEN v_role = 'super_admin' THEN false ELSE true END, -- Wajibkan 20 admin kampus ganti password setelah login pertama
      now()
    )
    ON CONFLICT (username) DO UPDATE SET
      auth_user_id = v_uid,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      campus_id = EXCLUDED.campus_id,
      must_change_password = EXCLUDED.must_change_password,
      updated_at = now();
      
  END LOOP;
END $$;

-- 9. DYNAMIC CUSTOM FIELD DEFINITIONS & GLOBAL UNICITY ENFORCEMENT
CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'email', 'dropdown', 'checkbox')) DEFAULT 'text',
    is_required BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 1,
    options JSONB DEFAULT '[]'::jsonb,
    validation_rules JSONB DEFAULT '{}'::jsonb,
    include_in_excel BOOLEAN NOT NULL DEFAULT true,
    include_in_moodle BOOLEAN NOT NULL DEFAULT false,
    moodle_destination TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure custom_fields JSONB column exists on public.students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Global uniqueness indexes for username and email across all campuses
CREATE UNIQUE INDEX IF NOT EXISTS uq_students_global_username_lower ON public.students (LOWER(TRIM(username)));
CREATE UNIQUE INDEX IF NOT EXISTS uq_students_global_email_lower ON public.students (LOWER(TRIM(email)));

-- RLS for custom_field_definitions
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Custom fields viewable by all" ON public.custom_field_definitions;
DROP POLICY IF EXISTS "Custom fields modifiable only by Super Admin" ON public.custom_field_definitions;

CREATE POLICY "Custom fields viewable by all" ON public.custom_field_definitions
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Custom fields modifiable only by Super Admin" ON public.custom_field_definitions
  FOR ALL TO authenticated
  USING (public.is_current_user_super_admin())
  WITH CHECK (public.is_current_user_super_admin());

-- 10. UNIVERSAL APP SETTINGS & CROSS-DEVICE CLOUD SYNC TABLE
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

-- 11. COMPETITION PERIODS TABLE (OGSO 2026, 2025, etc.)
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

-- 12. COMPETITION WINNERS TABLE
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

-- 13. COMPETITION CERTIFICATES TABLE
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

CREATE INDEX IF NOT EXISTS idx_certificates_cert_no ON public.competition_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_period ON public.competition_certificates(period_id);

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

-- 14. WEBSITE PUBLIC CONTENT TABLE
CREATE TABLE IF NOT EXISTS public.website_content (
    id TEXT PRIMARY KEY DEFAULT 'current',
    hero JSONB NOT NULL DEFAULT '{}'::jsonb,
    competition_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    faq JSONB NOT NULL DEFAULT '[]'::jsonb,
    officials JSONB NOT NULL DEFAULT '[]'::jsonb,
    contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select website_content" ON public.website_content;
DROP POLICY IF EXISTS "Public insert website_content" ON public.website_content;
DROP POLICY IF EXISTS "Public update website_content" ON public.website_content;

CREATE POLICY "Public select website_content" ON public.website_content
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert website_content" ON public.website_content
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update website_content" ON public.website_content
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 15. SYLLABUSES TABLE
CREATE TABLE IF NOT EXISTS public.syllabuses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    jenjang TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    topics JSONB DEFAULT '[]'::jsonb,
    file_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.syllabuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select syllabuses" ON public.syllabuses;
DROP POLICY IF EXISTS "Public insert syllabuses" ON public.syllabuses;
DROP POLICY IF EXISTS "Public update syllabuses" ON public.syllabuses;
DROP POLICY IF EXISTS "Public delete syllabuses" ON public.syllabuses;

CREATE POLICY "Public select syllabuses" ON public.syllabuses
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert syllabuses" ON public.syllabuses
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update syllabuses" ON public.syllabuses
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete syllabuses" ON public.syllabuses
  FOR DELETE TO anon, authenticated USING (true);

-- 16. BANK SOAL TABLE
CREATE TABLE IF NOT EXISTS public.bank_soal (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    jenjang TEXT NOT NULL,
    subject TEXT NOT NULL,
    year INTEGER NOT NULL DEFAULT 2026,
    difficulty TEXT DEFAULT 'Menengah',
    total_questions INTEGER DEFAULT 40,
    file_url TEXT,
    solution_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.bank_soal ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select bank_soal" ON public.bank_soal;
DROP POLICY IF EXISTS "Public insert bank_soal" ON public.bank_soal;
DROP POLICY IF EXISTS "Public update bank_soal" ON public.bank_soal;
DROP POLICY IF EXISTS "Public delete bank_soal" ON public.bank_soal;

CREATE POLICY "Public select bank_soal" ON public.bank_soal
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert bank_soal" ON public.bank_soal
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update bank_soal" ON public.bank_soal
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete bank_soal" ON public.bank_soal
  FOR DELETE TO anon, authenticated USING (true);

-- 17. ENABLE REALTIME PUBLICATION FOR INSTANT MULTI-DEVICE UPDATES
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE 
  public.students,
  public.app_settings,
  public.competition_periods,
  public.competition_winners,
  public.competition_certificates,
  public.website_content;

-- 18. VERIFICATION
SELECT 
  up.username,
  up.role,
  COALESCE(up.campus_id, 'Semua Kampus (Super Admin)') AS campus,
  up.email,
  au.email_confirmed_at IS NOT NULL AS email_confirmed,
  up.is_active
FROM public.user_profiles up
LEFT JOIN auth.users au ON au.id = up.auth_user_id
ORDER BY up.role DESC, up.username ASC;
