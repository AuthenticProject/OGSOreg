-- ==============================================================================
-- OLYMREG SEED DATA MIGRATION 003
-- Safe Synthetic Test Data for Development and Local Validation
-- ==============================================================================

-- 1. Insert Demo Institution
INSERT INTO public.institutions (id, name, npsn, address, phone, email)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'SMA Darussalam Boarding School',
    '20108492',
    'Jl. Raya Pesantren No. 45, Bogor',
    '081288990011',
    'admin@darussalam.sch.id'
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert Demo Competitions
INSERT INTO public.competitions (id, code, name, description, registration_open_at, registration_close_at, status)
VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'OLYM-2026-NAS',
    'Olimpiade Sains Nasional Mandiri 2026',
    'Kompetisi sains terpadu jenjang SMP/MTs dan SMA/MA/Pesantren tingkat nasional.',
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '60 days',
    'open'
),
(
    'c0000000-0000-0000-0000-000000000002',
    'MATH-SMP-2026',
    'Kejuaraan Matematika Terapan Nusantara',
    'Ajang olimpiade matematika komputasi dan pemecahan masalah logika.',
    NOW() - INTERVAL '15 days',
    NOW() + INTERVAL '45 days',
    'open'
) ON CONFLICT (code) DO NOTHING;

-- 3. Insert Demo Teachers
INSERT INTO public.teachers (id, institution_id, full_name, gender, nip_nik, phone, email)
VALUES
(
    't0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Drs. Bambang Sudarsono, M.Si.',
    'L',
    '197608152002121003',
    '081122334455',
    'bambang.s@darussalam.ac.id'
),
(
    't0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Siti Aminah, M.Pd.',
    'P',
    '198504122010012009',
    '081299887766',
    'siti.aminah@darussalam.ac.id'
) ON CONFLICT (id) DO NOTHING;

-- 4. Insert Demo Registration Batch
INSERT INTO public.registration_batches (
    id, competition_id, institution_id, created_by,
    batch_name, source_filename, participant_count, teacher_count, status
)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Kontingen Gelombang 1 - SMA Darussalam',
    'Formulir_Pendaftaran_SMA_Darussalam_Final.xlsx',
    5,
    2,
    'completed'
) ON CONFLICT (id) DO NOTHING;

-- 5. Insert Demo Participants
INSERT INTO public.participants (
    id, institution_id, full_name, nisn, gender, class_name, category, teacher_id
)
VALUES
(
    'p0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Ahmad Faiz Al-Ghifari',
    '0087261524',
    'L',
    'Kelas 8',
    'Olimpiade Matematika',
    't0000000-0000-0000-0000-000000000001'
),
(
    'p0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Nadia Salsabila Putri',
    '0089123847',
    'P',
    'Kelas 9',
    'Olimpiade IPA Terpadu',
    't0000000-0000-0000-0000-000000000002'
),
(
    'p0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Muhammad Rizky Pratama',
    '0078129384',
    'L',
    'Kelas 11',
    'Olimpiade Fisika',
    't0000000-0000-0000-0000-000000000001'
),
(
    'p0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'Zahra Aulia Rahmah',
    '0081298471',
    'P',
    'Kelas 10',
    'Olimpiade Biologi',
    't0000000-0000-0000-0000-000000000002'
),
(
    'p0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'Fikri Haikal Syamsuddin',
    '0092384712',
    'L',
    'Kelas 12',
    'Olimpiade Kimia',
    't0000000-0000-0000-0000-000000000001'
) ON CONFLICT (institution_id, nisn) DO NOTHING;

-- 6. Insert Demo Participant Competitions
INSERT INTO public.participant_competitions (
    participant_id, competition_id, registration_batch_id, category, status
)
VALUES
(
    'p0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Olimpiade Matematika',
    'verified'
),
(
    'p0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Olimpiade IPA Terpadu',
    'verified'
),
(
    'p0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Olimpiade Fisika',
    'verified'
),
(
    'p0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Olimpiade Biologi',
    'verified'
),
(
    'p0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Olimpiade Kimia',
    'verified'
) ON CONFLICT (participant_id, competition_id, category) DO NOTHING;
