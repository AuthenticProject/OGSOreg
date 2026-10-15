-- ==============================================================================
-- OLYMREG DATABASE SCHEMA MIGRATION 001
-- Multi-Institution Olympiad & Competition Bulk Registration Platform
-- ==============================================================================

-- Enable UUID extension if not already available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. INSTITUTIONS (Schools, Madrasah, Pesantren, Organizations)
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    npsn TEXT, -- Must remain TEXT to protect leading zeros
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. USER PROFILES (Linked to Supabase Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'organizer', 'institution')) DEFAULT 'institution',
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. COMPETITIONS & EVENTS
CREATE TABLE IF NOT EXISTS public.competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    registration_open_at TIMESTAMPTZ,
    registration_close_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'closed', 'archived')) DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. REGISTRATION BATCHES (Excel Import Transactions)
CREATE TABLE IF NOT EXISTS public.registration_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE RESTRICT,
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    created_by UUID NOT NULL,
    batch_name TEXT NOT NULL,
    source_filename TEXT,
    participant_count INTEGER DEFAULT 0 NOT NULL,
    teacher_count INTEGER DEFAULT 0 NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('staging', 'processing', 'completed', 'failed')) DEFAULT 'staging',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ
);

-- 5. TEACHERS / PEMBIMBING
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('L', 'P')),
    nip_nik TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. PARTICIPANTS / PESERTA
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    nisn TEXT NOT NULL, -- Must remain TEXT to protect leading zeros
    gender TEXT CHECK (gender IN ('L', 'P')),
    class_name TEXT,
    category TEXT,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Idempotency constraint: Same institution cannot register duplicate NISN
    CONSTRAINT uq_participant_institution_nisn UNIQUE (institution_id, nisn)
);

-- 7. PARTICIPANT COMPETITION REGISTRATIONS
CREATE TABLE IF NOT EXISTS public.participant_competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE RESTRICT,
    registration_batch_id UUID NOT NULL REFERENCES public.registration_batches(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('registered', 'verified', 'disqualified', 'cancelled')) DEFAULT 'registered',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Prevent duplicate registration for same participant in same competition & category
    CONSTRAINT uq_participant_competition_category UNIQUE (participant_id, competition_id, category)
);

-- ==============================================================================
-- INDEXES FOR QUERY OPTIMIZATION
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_institution ON public.profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_teachers_institution ON public.teachers(institution_id);
CREATE INDEX IF NOT EXISTS idx_participants_institution ON public.participants(institution_id);
CREATE INDEX IF NOT EXISTS idx_participants_nisn ON public.participants(nisn);
CREATE INDEX IF NOT EXISTS idx_registration_batches_competition ON public.registration_batches(competition_id);
CREATE INDEX IF NOT EXISTS idx_registration_batches_institution ON public.registration_batches(institution_id);
CREATE INDEX IF NOT EXISTS idx_participant_competitions_comp ON public.participant_competitions(competition_id);
CREATE INDEX IF NOT EXISTS idx_participant_competitions_part ON public.participant_competitions(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_competitions_batch ON public.participant_competitions(registration_batch_id);
