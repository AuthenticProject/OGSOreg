-- ==============================================================
-- OGSOreg: COMPETITION RESULTS TABLE AND RLS POLICIES
-- Period-Based Student Competition Results
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.competition_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    period_id TEXT NOT NULL REFERENCES public.competition_periods(id) ON DELETE CASCADE,
    result_status TEXT NOT NULL CHECK (result_status IN ('peserta', 'finalis', 'juara')),
    is_finalist BOOLEAN NOT NULL DEFAULT false,
    is_champion BOOLEAN NOT NULL DEFAULT false,
    champion_rank INTEGER,
    award_category TEXT,
    result_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_by TEXT,
    CONSTRAINT uq_student_period UNIQUE (student_id, period_id)
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_comp_res_period_id ON public.competition_results(period_id);
CREATE INDEX IF NOT EXISTS idx_comp_res_student_id ON public.competition_results(student_id);
CREATE INDEX IF NOT EXISTS idx_comp_res_status ON public.competition_results(result_status);
CREATE INDEX IF NOT EXISTS idx_comp_res_is_champion ON public.competition_results(is_champion);
CREATE INDEX IF NOT EXISTS idx_comp_res_is_finalist ON public.competition_results(is_finalist);

-- Enable Row Level Security (RLS)
ALTER TABLE public.competition_results ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users & anon (public results)
CREATE POLICY "Allow public read access to competition results"
ON public.competition_results
FOR SELECT
USING (true);

-- Allow admins to insert/update/delete results
CREATE POLICY "Allow authenticated users full access to competition results"
ON public.competition_results
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
