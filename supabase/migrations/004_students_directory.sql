-- ==============================================================================
-- OGSOREG DATABASE SCHEMA MIGRATION 004
-- Phase 5: Siswa Saya (Students Directory & Moodle Bulk Sync Staging)
-- ==============================================================================

-- 1. STUDENTS DIRECTORY TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    jenjang TEXT NOT NULL CHECK (jenjang IN ('Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5')),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    created_by UUID,
    source TEXT NOT NULL CHECK (source IN ('excel', 'csv', 'manual', 'paste')) DEFAULT 'excel',
    sync_status TEXT NOT NULL CHECK (sync_status IN ('local_only', 'exported', 'synced', 'failed')) DEFAULT 'local_only',
    moodle_user_id TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_institution_student_username UNIQUE (institution_id, username)
);

-- 2. INDEXES FOR HIGH-THROUGHPUT SEARCH & FILTERING
CREATE INDEX IF NOT EXISTS idx_students_institution_id ON public.students(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_username ON public.students(username);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_jenjang ON public.students(jenjang);
CREATE INDEX IF NOT EXISTS idx_students_sync_status ON public.students(sync_status);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON public.students(created_at DESC);

-- 3. ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view students of their own institution"
    ON public.students FOR SELECT
    USING (
        institution_id IN (
            SELECT p.institution_id FROM public.profiles p WHERE p.id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "Users can insert students into their own institution"
    ON public.students FOR INSERT
    WITH CHECK (
        institution_id IN (
            SELECT p.institution_id FROM public.profiles p WHERE p.id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "Users can update students of their own institution"
    ON public.students FOR UPDATE
    USING (
        institution_id IN (
            SELECT p.institution_id FROM public.profiles p WHERE p.id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "Users can delete students of their own institution"
    ON public.students FOR DELETE
    USING (
        institution_id IN (
            SELECT p.institution_id FROM public.profiles p WHERE p.id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );
