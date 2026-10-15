-- ==============================================================================
-- OLYMREG ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Multi-Tenant Security by Institution & User Role
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_competitions ENABLE ROW LEVEL SECURITY;

-- 2. Helper functions for current user context
CREATE OR REPLACE FUNCTION public.get_current_user_institution_id()
RETURNS UUID AS $$
  SELECT institution_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- PROFILES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.get_current_user_role() IN ('admin', 'organizer'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- INSTITUTIONS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Institution users can view their assigned institution"
  ON public.institutions FOR SELECT
  USING (
    id = public.get_current_user_institution_id()
    OR public.get_current_user_role() IN ('admin', 'organizer')
  );

CREATE POLICY "Institution users can update their institution"
  ON public.institutions FOR UPDATE
  USING (
    id = public.get_current_user_institution_id()
    OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Admins and organizers can insert institutions"
  ON public.institutions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- -----------------------------------------------------------------------------
-- COMPETITIONS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "All authenticated users can view open or closed competitions"
  ON public.competitions FOR SELECT
  USING (
    status IN ('open', 'closed', 'archived')
    OR public.get_current_user_role() IN ('admin', 'organizer')
  );

CREATE POLICY "Organizers and admins can manage competitions"
  ON public.competitions FOR ALL
  USING (public.get_current_user_role() IN ('admin', 'organizer'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'organizer'));

-- -----------------------------------------------------------------------------
-- REGISTRATION BATCHES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view their institution registration batches"
  ON public.registration_batches FOR SELECT
  USING (
    institution_id = public.get_current_user_institution_id()
    OR public.get_current_user_role() IN ('admin', 'organizer')
  );

CREATE POLICY "Users can insert registration batches for their institution"
  ON public.registration_batches FOR INSERT
  WITH CHECK (
    (institution_id = public.get_current_user_institution_id() AND auth.uid() = created_by)
    OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can update registration batches for their institution"
  ON public.registration_batches FOR UPDATE
  USING (
    institution_id = public.get_current_user_institution_id()
    OR public.get_current_user_role() IN ('admin', 'organizer')
  );

-- -----------------------------------------------------------------------------
-- TEACHERS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view teachers belonging to their institution"
  ON public.teachers FOR SELECT
  USING (
    institution_id = public.get_current_user_institution_id()
    OR public.get_current_user_role() IN ('admin', 'organizer')
  );

CREATE POLICY "Users can insert/update teachers for their institution"
  ON public.teachers FOR INSERT
  WITH CHECK (
    institution_id = public.get_current_user_institution_id()
    OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can update their institution teachers"
  ON public.teachers FOR UPDATE
  USING (
    institution_id = public.get_current_user_institution_id()
    OR public.get_current_user_role() = 'admin'
  );

-- -----------------------------------------------------------------------------
-- PARTICIPANTS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view participants belonging to their institution"
  ON public.participants FOR SELECT
  USING (
    institution_id = public.get_current_user_institution_id()
    OR public.get_current_user_role() IN ('admin', 'organizer')
  );

CREATE POLICY "Users can insert participants for their institution"
  ON public.participants FOR INSERT
  WITH CHECK (
    institution_id = public.get_current_user_institution_id()
    OR public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can update their institution participants"
  ON public.participants FOR UPDATE
  USING (
    institution_id = public.get_current_user_institution_id()
    OR public.get_current_user_role() = 'admin'
  );

-- -----------------------------------------------------------------------------
-- PARTICIPANT COMPETITIONS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view competition registrations of their institution"
  ON public.participant_competitions FOR SELECT
  USING (
    participant_id IN (
      SELECT id FROM public.participants
      WHERE institution_id = public.get_current_user_institution_id()
    )
    OR public.get_current_user_role() IN ('admin', 'organizer')
  );

CREATE POLICY "Users can insert competition registrations for their participants"
  ON public.participant_competitions FOR INSERT
  WITH CHECK (
    participant_id IN (
      SELECT id FROM public.participants
      WHERE institution_id = public.get_current_user_institution_id()
    )
    OR public.get_current_user_role() = 'admin'
  );
