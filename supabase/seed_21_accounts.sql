-- ==============================================================================
-- OGSOreg — SEED 21 OFFICIAL ACCOUNTS DIRECTLY IN SUPABASE SQL EDITOR
-- ==============================================================================
-- This script safely provisions all 21 approved accounts directly into auth.users 
-- and public.user_profiles without triggering SMTP email rate limits or requiring 
-- mailbox verification links.
--
-- Passwords configured:
-- 1 Super Admin: crypt('OGSOreg_SuperAdmin2026!', gen_salt('bf'))
-- 20 Campus Admins: crypt('OGSO2026', gen_salt('bf'))
-- ==============================================================================

-- Enable pgcrypto if not enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Ensure user_profiles table exists
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

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Helper macro to insert an account into auth.users and public.user_profiles
DO $$
DECLARE
  v_admin_pass TEXT := crypt('OGSOreg_SuperAdmin2026!', gen_salt('bf'));
  v_campus_pass TEXT := crypt('OGSO2026', gen_salt('bf'));
  
  -- Account arrays
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
        now(), -- Mark as confirmed immediately
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
    
    -- Sync into public.user_profiles
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
      CASE WHEN v_role = 'super_admin' THEN false ELSE true END, -- Wajibkan 20 admin kampus ganti password pada login pertama
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

-- Verify results
SELECT id, username, email, role, campus_id, is_active, must_change_password, updated_at 
FROM public.user_profiles 
ORDER BY role DESC, username ASC;
