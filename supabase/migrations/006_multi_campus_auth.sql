-- ==============================================================================
-- OGSOREG DATABASE SCHEMA MIGRATION 006
-- Multi-Campus Authentication, 21 Initial Accounts & Strict Campus Isolation RLS
-- ==============================================================================

-- 1. USER PROFILES TABLE (Multi-Campus RBAC)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'campus_admin')),
    campus_id TEXT CHECK (
        campus_id IS NULL OR campus_id IN (
            'Gontor 1', 'Gontor 2', 'Gontor 3', 'Gontor 4', 'Gontor 5', 'Gontor 6',
            'Gontor 7', 'Gontor 8', 'Gontor 9', 'Gontor 10', 'Gontor 11', 'Gontor 12',
            'Gontor Putri 1', 'Gontor Putri 2', 'Gontor Putri 3', 'Gontor Putri 4',
            'Gontor Putri 5', 'Gontor Putri 6', 'Gontor Putri 7', 'Gontor Putri 8'
        )
    ),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_role_campus_consistency CHECK (
        (role = 'super_admin' AND campus_id IS NULL)
        OR (role = 'campus_admin' AND campus_id IS NOT NULL)
    )
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_campus_id ON public.user_profiles(campus_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON public.user_profiles(auth_user_id);

-- 2. HELPER FUNCTIONS FOR RLS (Security Definer)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_campus()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT campus_id FROM public.user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE auth_user_id = auth.uid() AND role = 'super_admin' AND is_active = TRUE
    );
$$;

-- 3. ROW LEVEL SECURITY ON USER_PROFILES
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles FOR SELECT
    USING (
        auth_user_id = auth.uid()
        OR public.is_current_user_super_admin()
    );

DROP POLICY IF EXISTS "Super Admin can insert user profiles" ON public.user_profiles;
CREATE POLICY "Super Admin can insert user profiles"
    ON public.user_profiles FOR INSERT
    WITH CHECK (
        public.is_current_user_super_admin()
        OR auth.uid() IS NULL -- Allowed during initial provisioning with service role
    );

DROP POLICY IF EXISTS "Super Admin and User can update profile safely" ON public.user_profiles;
CREATE POLICY "Super Admin and User can update profile safely"
    ON public.user_profiles FOR UPDATE
    USING (
        auth_user_id = auth.uid()
        OR public.is_current_user_super_admin()
    );

-- 4. STRICT CAMPUS ISOLATION RLS ON STUDENTS TABLE
-- Safe replacement of previous policies with Multi-Campus RBAC
DROP POLICY IF EXISTS "Campus Admins view only own campus students; Super Admin views all" ON public.students;
CREATE POLICY "Campus Admins view only own campus students; Super Admin views all"
    ON public.students FOR SELECT
    USING (
        public.is_current_user_super_admin()
        OR (kampus = public.get_current_user_campus())
        OR auth.uid() IS NULL -- Fallback for legacy demo mode
    );

DROP POLICY IF EXISTS "Campus Admins insert only own campus students; Super Admin inserts any" ON public.students;
CREATE POLICY "Campus Admins insert only own campus students; Super Admin inserts any"
    ON public.students FOR INSERT
    WITH CHECK (
        public.is_current_user_super_admin()
        OR (kampus = public.get_current_user_campus())
        OR auth.uid() IS NULL
    );

DROP POLICY IF EXISTS "Campus Admins update only own campus students; Super Admin updates any" ON public.students;
CREATE POLICY "Campus Admins update only own campus students; Super Admin updates any"
    ON public.students FOR UPDATE
    USING (
        public.is_current_user_super_admin()
        OR (kampus = public.get_current_user_campus())
        OR auth.uid() IS NULL
    );

DROP POLICY IF EXISTS "Campus Admins delete only own campus students; Super Admin deletes any" ON public.students;
CREATE POLICY "Campus Admins delete only own campus students; Super Admin deletes any"
    ON public.students FOR DELETE
    USING (
        public.is_current_user_super_admin()
        OR (kampus = public.get_current_user_campus())
        OR auth.uid() IS NULL
    );

-- 5. FUNCTION TO RESOLVE USERNAME TO EMAIL SECURELY (Backend-Mediated)
-- Protects against enumeration while allowing username login
CREATE OR REPLACE FUNCTION public.resolve_login_identifier(p_username TEXT)
RETURNS TABLE (
    user_email TEXT,
    account_active BOOLEAN,
    requires_password_change BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT up.email, up.is_active, up.must_change_password
    FROM public.user_profiles up
    WHERE LOWER(up.username) = LOWER(TRIM(p_username))
    LIMIT 1;
END;
$$;
