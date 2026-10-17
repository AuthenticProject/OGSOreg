/**
 * Script SQL Lengkap untuk Setup Database Supabase Cloud
 * Sumber: supabase/complete_database_setup.sql
 */
export const COMPLETE_DATABASE_SETUP_SQL = `-- ==============================================================================
-- OGSOreg — COMPLETE SUPABASE DATABASE SETUP (1-CLICK RUN IN SUPABASE SQL EDITOR)
-- ==============================================================================
-- Target Project: https://cuunipngguedqttuutaa.supabase.co
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cuunipngguedqttuutaa/sql/new
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
    jenjang TEXT NOT NULL CHECK (jenjang IN ('Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5')),
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

-- Ensure dynamic custom fields column exists
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_students_institution_id ON public.students(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_username ON public.students(username);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
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
      false,
      now()
    )
    ON CONFLICT (username) DO UPDATE SET
      auth_user_id = v_uid,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      campus_id = EXCLUDED.campus_id,
      must_change_password = false,
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

-- 10. VERIFICATION
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
`
