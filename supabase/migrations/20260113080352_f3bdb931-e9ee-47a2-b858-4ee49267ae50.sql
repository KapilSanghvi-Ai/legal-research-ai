-- =============================================================
-- Fix overly permissive RLS policies for all litigation tables
-- Add missing user_id columns for user-specific tables
-- =============================================================

-- 1. Add user_id column to bookmarks (references auth.users)
ALTER TABLE public.bookmarks 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Add user_id column to research_sessions (references auth.users)
ALTER TABLE public.research_sessions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- =============================================================
-- DROP overly permissive policies
-- =============================================================
DROP POLICY IF EXISTS "Allow all on clients" ON public.clients;
DROP POLICY IF EXISTS "Allow all on cases" ON public.cases;
DROP POLICY IF EXISTS "Allow all on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow all on documents" ON public.documents;
DROP POLICY IF EXISTS "Allow all on hearings" ON public.hearings;
DROP POLICY IF EXISTS "Allow all on case_activities" ON public.case_activities;
DROP POLICY IF EXISTS "Allow all on case_research" ON public.case_research;
DROP POLICY IF EXISTS "Allow all on gdrive_uploads" ON public.gdrive_uploads;
DROP POLICY IF EXISTS "Allow all on chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow all on research_sessions" ON public.research_sessions;
DROP POLICY IF EXISTS "Allow all on search_history" ON public.search_history;
DROP POLICY IF EXISTS "Allow all on bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Allow all on user_preferences" ON public.user_preferences;

-- =============================================================
-- CREATE proper user-scoped RLS policies
-- =============================================================

-- CLIENTS: All authenticated users can manage clients (firm-wide access)
CREATE POLICY "Authenticated users manage clients"
ON public.clients FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- CASES: Users can access cases they own, created, or are on the team
CREATE POLICY "Users access assigned cases"
ON public.cases FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = owner_id OR
    auth.uid() = created_by OR
    auth.uid() = ANY(team_ids)
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    auth.uid() = owner_id OR
    auth.uid() = created_by OR
    auth.uid() = ANY(team_ids)
  )
);

-- TASKS: Users can access tasks assigned to/by them, or related to their cases
CREATE POLICY "Users access related tasks"
ON public.tasks FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = assigned_to OR
    auth.uid() = assigned_by OR
    auth.uid() = created_by OR
    case_id IS NULL OR
    case_id IN (
      SELECT id FROM cases 
      WHERE auth.uid() = owner_id 
         OR auth.uid() = created_by
         OR auth.uid() = ANY(team_ids)
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    case_id IS NULL OR
    case_id IN (
      SELECT id FROM cases 
      WHERE auth.uid() = owner_id 
         OR auth.uid() = created_by
         OR auth.uid() = ANY(team_ids)
    )
  )
);

-- DOCUMENTS: Users can access documents they created or related to their cases
CREATE POLICY "Users access case documents"
ON public.documents FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = created_by OR
    case_id IS NULL OR
    case_id IN (
      SELECT id FROM cases 
      WHERE auth.uid() = owner_id 
         OR auth.uid() = created_by
         OR auth.uid() = ANY(team_ids)
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    case_id IS NULL OR
    case_id IN (
      SELECT id FROM cases 
      WHERE auth.uid() = owner_id 
         OR auth.uid() = created_by
         OR auth.uid() = ANY(team_ids)
    )
  )
);

-- HEARINGS: Users can access hearings for their cases
CREATE POLICY "Users access case hearings"
ON public.hearings FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  case_id IN (
    SELECT id FROM cases 
    WHERE auth.uid() = owner_id 
       OR auth.uid() = created_by
       OR auth.uid() = ANY(team_ids)
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  case_id IN (
    SELECT id FROM cases 
    WHERE auth.uid() = owner_id 
       OR auth.uid() = created_by
       OR auth.uid() = ANY(team_ids)
  )
);

-- CASE_ACTIVITIES: Users can access activities for their cases
CREATE POLICY "Users access case activities"
ON public.case_activities FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  case_id IN (
    SELECT id FROM cases 
    WHERE auth.uid() = owner_id 
       OR auth.uid() = created_by
       OR auth.uid() = ANY(team_ids)
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  case_id IN (
    SELECT id FROM cases 
    WHERE auth.uid() = owner_id 
       OR auth.uid() = created_by
       OR auth.uid() = ANY(team_ids)
  )
);

-- CASE_RESEARCH: Users can access research for their cases
CREATE POLICY "Users access case research"
ON public.case_research FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  case_id IN (
    SELECT id FROM cases 
    WHERE auth.uid() = owner_id 
       OR auth.uid() = created_by
       OR auth.uid() = ANY(team_ids)
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  case_id IN (
    SELECT id FROM cases 
    WHERE auth.uid() = owner_id 
       OR auth.uid() = created_by
       OR auth.uid() = ANY(team_ids)
  )
);

-- GDRIVE_UPLOADS: Users can access uploads they created or related to their cases
CREATE POLICY "Users access their uploads"
ON public.gdrive_uploads FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = uploaded_by OR
    case_id IS NULL OR
    case_id IN (
      SELECT id FROM cases 
      WHERE auth.uid() = owner_id 
         OR auth.uid() = created_by
         OR auth.uid() = ANY(team_ids)
    )
  )
)
WITH CHECK (auth.uid() IS NOT NULL);

-- RESEARCH_SESSIONS: Users can only access their own sessions
CREATE POLICY "Users access own sessions"
ON public.research_sessions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- CHAT_MESSAGES: Users can access messages from their sessions
CREATE POLICY "Users access own chat messages"
ON public.chat_messages FOR ALL
TO authenticated
USING (
  session_id IN (
    SELECT id FROM research_sessions WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  session_id IN (
    SELECT id FROM research_sessions WHERE user_id = auth.uid()
  )
);

-- SEARCH_HISTORY: Users can access history from their sessions
CREATE POLICY "Users access own search history"
ON public.search_history FOR ALL
TO authenticated
USING (
  session_id IS NULL OR
  session_id IN (
    SELECT id FROM research_sessions WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  session_id IS NULL OR
  session_id IN (
    SELECT id FROM research_sessions WHERE user_id = auth.uid()
  )
);

-- BOOKMARKS: Users can only access their own bookmarks
CREATE POLICY "Users access own bookmarks"
ON public.bookmarks FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- USER_PREFERENCES: Users can only access their own preferences
CREATE POLICY "Users access own preferences"
ON public.user_preferences FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);