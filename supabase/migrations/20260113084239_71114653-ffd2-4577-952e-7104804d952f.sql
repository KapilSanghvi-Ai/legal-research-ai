-- ===========================================
-- Fix Warn-Level Security Issues Migration
-- ===========================================

-- 1. Fix function search_path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- 2. Fix function search_path for log_case_activity
CREATE OR REPLACE FUNCTION public.log_case_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.case_activities (case_id, activity_type, title, description, actor_id)
        VALUES (NEW.id, 'created', 'Case created', 
                'New case created for ' || NEW.client_name || ' (AY ' || NEW.assessment_year || ')',
                NEW.created_by);
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log stage changes
        IF OLD.stage IS DISTINCT FROM NEW.stage THEN
            INSERT INTO public.case_activities (case_id, activity_type, title, description, metadata)
            VALUES (NEW.id, 'stage_change', 'Stage changed', 
                    'Stage changed from ' || OLD.stage || ' to ' || NEW.stage,
                    jsonb_build_object('old_stage', OLD.stage, 'new_stage', NEW.stage));
        END IF;
        -- Log status changes
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO public.case_activities (case_id, activity_type, title, description, metadata)
            VALUES (NEW.id, 'status_change', 'Status changed', 
                    'Status changed from ' || OLD.status || ' to ' || NEW.status,
                    jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

-- 3. Fix function search_path for get_upcoming_deadlines
CREATE OR REPLACE FUNCTION public.get_upcoming_deadlines(days_ahead integer DEFAULT 14)
RETURNS TABLE(type character varying, case_id uuid, client_name character varying, assessment_year character varying, deadline_date date, description text, days_until integer)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
    RETURN QUERY
    -- Task deadlines
    SELECT 
        'task'::VARCHAR as type,
        t.case_id,
        c.client_name,
        c.assessment_year,
        t.due_date as deadline_date,
        t.title as description,
        (t.due_date - CURRENT_DATE)::INT as days_until
    FROM public.tasks t
    LEFT JOIN public.cases c ON t.case_id = c.id
    WHERE t.due_date IS NOT NULL 
      AND t.due_date <= CURRENT_DATE + days_ahead
      AND t.status NOT IN ('completed', 'cancelled')
    
    UNION ALL
    
    -- Hearing dates
    SELECT 
        'hearing'::VARCHAR as type,
        h.case_id,
        c.client_name,
        c.assessment_year,
        h.hearing_date as deadline_date,
        'Hearing at ' || h.forum as description,
        (h.hearing_date - CURRENT_DATE)::INT as days_until
    FROM public.hearings h
    JOIN public.cases c ON h.case_id = c.id
    WHERE h.hearing_date IS NOT NULL 
      AND h.hearing_date <= CURRENT_DATE + days_ahead
      AND h.status IN ('scheduled', 'adjourned')
    
    UNION ALL
    
    -- Limitation dates
    SELECT 
        'limitation'::VARCHAR as type,
        c.id as case_id,
        c.client_name,
        c.assessment_year,
        c.limitation_date as deadline_date,
        'Appeal limitation expiry' as description,
        (c.limitation_date - CURRENT_DATE)::INT as days_until
    FROM public.cases c
    WHERE c.limitation_date IS NOT NULL 
      AND c.limitation_date <= CURRENT_DATE + days_ahead
      AND c.stage NOT IN ('closed')
    
    ORDER BY deadline_date ASC;
END;
$function$;

-- 4. Move pgvector extension from public to extensions schema
-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage to authenticated and anon roles  
GRANT USAGE ON SCHEMA extensions TO authenticated, anon;

-- Use ALTER EXTENSION to move it without dropping (preserves dependencies)
ALTER EXTENSION vector SET SCHEMA extensions;

-- 5. Fix overly permissive RLS policies
-- These tables are for public legal data that only Edge Functions (via service role) should write to

-- Drop existing permissive INSERT policies on sources
DROP POLICY IF EXISTS "Allow insert on sources" ON public.sources;

-- Drop existing permissive INSERT policy on source_fragments
DROP POLICY IF EXISTS "Allow insert on source_fragments" ON public.source_fragments;

-- Drop existing permissive policies on knowledge_sources
DROP POLICY IF EXISTS "Allow insert on knowledge_sources" ON public.knowledge_sources;
DROP POLICY IF EXISTS "Allow update on knowledge_sources" ON public.knowledge_sources;

-- Drop existing permissive policies on knowledge_fragments
DROP POLICY IF EXISTS "Allow insert on knowledge_fragments" ON public.knowledge_fragments;
DROP POLICY IF EXISTS "Allow delete on knowledge_fragments" ON public.knowledge_fragments;

-- Note: We're NOT creating replacement policies because:
-- 1. These tables should only be writable by Edge Functions using the service role key
-- 2. The service role bypasses RLS entirely
-- 3. SELECT policies remain intact for authenticated users to read the data
-- 4. No regular authenticated user should be able to INSERT/UPDATE/DELETE public legal data