-- ==============================================================================
-- OGSOREG DATABASE SCHEMA MIGRATION 005
-- Phase 7: Campus Data Model, Enrolment Verification & Operation Audit Trail
-- ==============================================================================

-- 1. ADDITIVE CAMPUS COLUMN TO STUDENTS DIRECTORY
-- Safe additive schema migration: does NOT drop or invalidate existing student records
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS kampus TEXT;

-- 2. ADD CHECK CONSTRAINT FOR OFFICIAL 20 GONTOR CAMPUSES
-- Backward-compatible: allows NULL and empty string for existing records awaiting user completion
ALTER TABLE public.students 
DROP CONSTRAINT IF EXISTS check_campus_validity;

ALTER TABLE public.students 
ADD CONSTRAINT check_campus_validity 
CHECK (
    kampus IS NULL 
    OR kampus = '' 
    OR kampus IN (
        'Gontor 1', 'Gontor 2', 'Gontor 3', 'Gontor 4', 'Gontor 5', 'Gontor 6',
        'Gontor 7', 'Gontor 8', 'Gontor 9', 'Gontor 10', 'Gontor 11', 'Gontor 12',
        'Gontor Putri 1', 'Gontor Putri 2', 'Gontor Putri 3', 'Gontor Putri 4',
        'Gontor Putri 5', 'Gontor Putri 6', 'Gontor Putri 7', 'Gontor Putri 8'
    )
);

-- 3. EXPAND SYNC STATUS CHECK TO INCLUDE 'enrolled'
ALTER TABLE public.students 
DROP CONSTRAINT IF EXISTS students_sync_status_check;

ALTER TABLE public.students 
ADD CONSTRAINT students_sync_status_check 
CHECK (sync_status IN ('local_only', 'exported', 'synced', 'enrolled', 'failed'));

-- 4. CAMPUS INDEX FOR HIGH-PERFORMANCE FILTERING
CREATE INDEX IF NOT EXISTS idx_students_kampus ON public.students(kampus);

-- 5. OPERATION AUDIT LOGS TABLE FOR REPORTING & HISTORY (Phase 7 Requirement 10)
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

CREATE INDEX IF NOT EXISTS idx_operation_logs_institution ON public.operation_logs(institution_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON public.operation_logs(created_at DESC);

-- 6. RLS FOR OPERATION LOGS
ALTER TABLE public.operation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view operation logs of their own institution"
    ON public.operation_logs FOR SELECT
    USING (
        institution_id IN (
            SELECT p.institution_id FROM public.profiles p WHERE p.id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

CREATE POLICY "Users can insert operation logs into their own institution"
    ON public.operation_logs FOR INSERT
    WITH CHECK (
        institution_id IN (
            SELECT p.institution_id FROM public.profiles p WHERE p.id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );
