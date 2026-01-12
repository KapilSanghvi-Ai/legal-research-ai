-- Migration: Complete Litigation Management Schema
-- This creates all tables needed for a full IT litigation practice management system

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- Update case_stage to include High Court
DO $$ BEGIN
    ALTER TYPE public.case_stage ADD VALUE IF NOT EXISTS 'hc';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create additional enum types
DO $$ BEGIN
    CREATE TYPE public.client_type AS ENUM ('individual', 'huf', 'company', 'firm', 'trust', 'aop', 'government');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'review', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.hearing_status AS ENUM ('scheduled', 'adjourned', 'part_heard', 'heard', 'decided', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('nil', 'partial', 'full', 'refund_pending', 'refund_received');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- CLIENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) NOT NULL,
    pan VARCHAR(10),
    tan VARCHAR(10),
    gstin VARCHAR(15),
    client_type client_type DEFAULT 'individual',
    
    -- Contact info
    contact_person VARCHAR(200),
    email VARCHAR(200),
    phone VARCHAR(20),
    alt_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    
    -- Business info
    nature_of_business TEXT,
    incorporation_date DATE,
    
    -- Integration
    gdrive_folder_id VARCHAR(100),
    
    -- Metadata
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT unique_client_pan UNIQUE (pan)
);

-- =====================================================
-- CASES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Client reference
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    client_name VARCHAR(500) NOT NULL,
    client_pan VARCHAR(10),
    
    -- Opposing party
    opposing_party VARCHAR(500),
    ao_name VARCHAR(200),
    ao_designation VARCHAR(100),
    
    -- Assessment details
    assessment_year VARCHAR(10) NOT NULL,
    financial_year VARCHAR(10),
    section_involved VARCHAR(50),
    
    -- Case identifiers
    ita_number VARCHAR(100),
    appeal_number VARCHAR(100),
    din_number VARCHAR(50),
    
    -- Status tracking
    stage case_stage NOT NULL DEFAULT 'assessment',
    status case_status NOT NULL DEFAULT 'research',
    
    -- Issues (structured JSON array)
    issues JSONB DEFAULT '[]'::jsonb,
    
    -- Financial details
    original_income DECIMAL(15,2),
    assessed_income DECIMAL(15,2),
    addition_amount DECIMAL(15,2),
    disputed_amount DECIMAL(15,2),
    demand_amount DECIMAL(15,2),
    tax_effect DECIMAL(15,2),
    penalty_amount DECIMAL(15,2),
    interest_amount DECIMAL(15,2),
    payment_status payment_status DEFAULT 'nil',
    
    -- Important dates
    notice_date DATE,
    response_due_date DATE,
    order_date DATE,
    appeal_due_date DATE,
    limitation_date DATE,
    next_hearing_date DATE,
    
    -- Assignment
    owner_id UUID,
    team_ids UUID[],
    
    -- Integration
    gdrive_folder_id VARCHAR(100),
    
    -- Outcome (for closed cases)
    outcome VARCHAR(100),
    outcome_summary TEXT,
    relief_amount DECIMAL(15,2),
    
    -- Metadata
    tags TEXT[],
    notes TEXT,
    is_archived BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- TASKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    
    -- Task details
    title VARCHAR(500) NOT NULL,
    description TEXT,
    task_type VARCHAR(50),
    
    -- Scheduling
    due_date DATE,
    due_time TIME,
    reminder_date DATE,
    reminder_time TIME,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    
    -- Status
    priority task_priority DEFAULT 'medium',
    status task_status DEFAULT 'pending',
    
    -- Assignment
    assigned_to UUID,
    assigned_by UUID,
    
    -- Completion
    completed_at TIMESTAMPTZ,
    completed_by UUID,
    completion_notes TEXT,
    
    -- Recurrence (optional)
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB,
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- DOCUMENTS TABLE (DRAFTS)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    
    -- Document info
    title VARCHAR(500) NOT NULL,
    document_type document_type,
    category VARCHAR(100),
    
    -- Content
    content TEXT,
    content_format VARCHAR(20) DEFAULT 'html',
    
    -- Template info (if generated from template)
    template_id VARCHAR(100),
    template_name VARCHAR(200),
    variables JSONB,
    
    -- File info
    gdrive_file_id VARCHAR(100),
    file_url TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- Versioning
    version INTEGER DEFAULT 1,
    parent_version_id UUID REFERENCES public.documents(id),
    is_latest BOOLEAN DEFAULT true,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft',
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    
    -- Metadata
    tags TEXT[],
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- HEARINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.hearings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
    
    -- Hearing details
    hearing_date DATE NOT NULL,
    hearing_time TIME,
    forum VARCHAR(100) NOT NULL,
    bench VARCHAR(300),
    court_room VARCHAR(50),
    
    -- Identifiers
    cause_list_number VARCHAR(50),
    item_number INTEGER,
    
    -- Status
    status hearing_status DEFAULT 'scheduled',
    
    -- Outcome
    outcome TEXT,
    order_date DATE,
    order_summary TEXT,
    next_date DATE,
    adjournment_reason TEXT,
    
    -- Preparation
    appearing_counsel VARCHAR(200),
    preparation_notes TEXT,
    arguments_summary TEXT,
    documents_filed TEXT[],
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- CASE ACTIVITIES (TIMELINE)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.case_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
    
    activity_type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- Related entities (optional)
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    
    -- Additional data
    metadata JSONB,
    
    -- Who did it
    actor_id UUID,
    actor_name VARCHAR(200),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- CASE RESEARCH LINKS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.case_research (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
    source_id UUID REFERENCES public.sources(id) ON DELETE CASCADE NOT NULL,
    
    purpose citation_purpose NOT NULL DEFAULT 'support',
    relevance_score INTEGER,
    
    -- Notes about why this source is relevant
    notes TEXT,
    excerpt TEXT,
    
    -- For specific issues
    issue_index INTEGER,
    
    added_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(case_id, source_id)
);

-- =====================================================
-- NOTIFICATION PREFERENCES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Notification settings
    email_notifications BOOLEAN DEFAULT true,
    deadline_reminders BOOLEAN DEFAULT true,
    hearing_reminders BOOLEAN DEFAULT true,
    research_alerts BOOLEAN DEFAULT true,
    
    -- Reminder timing
    deadline_reminder_days INTEGER DEFAULT 3,
    hearing_reminder_days INTEGER DEFAULT 2,
    
    -- Display preferences
    theme VARCHAR(20) DEFAULT 'dark',
    compact_mode BOOLEAN DEFAULT false,
    default_view VARCHAR(50) DEFAULT 'dashboard',
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(user_id)
);

-- =====================================================
-- GOOGLE DRIVE INTEGRATION TABLES
-- =====================================================

-- Track uploaded files
CREATE TABLE IF NOT EXISTS public.gdrive_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    gdrive_file_id VARCHAR(100) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    file_size INTEGER,
    
    folder_type VARCHAR(50) NOT NULL,
    parent_folder_id VARCHAR(100),
    
    -- References
    case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    
    -- Metadata
    description TEXT,
    tags TEXT[],
    
    uploaded_by UUID,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Knowledge base sources (for semantic search)
CREATE TABLE IF NOT EXISTS public.knowledge_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    gdrive_file_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    file_type VARCHAR(50),
    
    -- Indexing status
    indexed_at TIMESTAMPTZ,
    fragment_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Knowledge base fragments for vector search
CREATE TABLE IF NOT EXISTS public.knowledge_fragments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    source_id UUID REFERENCES public.knowledge_sources(id) ON DELETE CASCADE NOT NULL,
    
    paragraph_num INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    token_count INTEGER,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdrive_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_fragments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Clients
CREATE POLICY "Allow all on clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

-- Cases
CREATE POLICY "Allow all on cases" ON public.cases FOR ALL USING (true) WITH CHECK (true);

-- Tasks
CREATE POLICY "Allow all on tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- Documents
CREATE POLICY "Allow all on documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);

-- Hearings
CREATE POLICY "Allow all on hearings" ON public.hearings FOR ALL USING (true) WITH CHECK (true);

-- Case Activities
CREATE POLICY "Allow all on case_activities" ON public.case_activities FOR ALL USING (true) WITH CHECK (true);

-- Case Research
CREATE POLICY "Allow all on case_research" ON public.case_research FOR ALL USING (true) WITH CHECK (true);

-- User Preferences
CREATE POLICY "Allow all on user_preferences" ON public.user_preferences FOR ALL USING (true) WITH CHECK (true);

-- GDrive Uploads
CREATE POLICY "Allow all on gdrive_uploads" ON public.gdrive_uploads FOR ALL USING (true) WITH CHECK (true);

-- Knowledge Sources (public read)
CREATE POLICY "Knowledge sources readable" ON public.knowledge_sources FOR SELECT USING (true);
CREATE POLICY "Allow insert on knowledge_sources" ON public.knowledge_sources FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on knowledge_sources" ON public.knowledge_sources FOR UPDATE USING (true);

-- Knowledge Fragments (public read)
CREATE POLICY "Knowledge fragments readable" ON public.knowledge_fragments FOR SELECT USING (true);
CREATE POLICY "Allow insert on knowledge_fragments" ON public.knowledge_fragments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete on knowledge_fragments" ON public.knowledge_fragments FOR DELETE USING (true);

-- =====================================================
-- INDEXES
-- =====================================================

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_pan ON public.clients(pan);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_active ON public.clients(is_active);

-- Cases
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON public.cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_client_pan ON public.cases(client_pan);
CREATE INDEX IF NOT EXISTS idx_cases_stage ON public.cases(stage);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_ay ON public.cases(assessment_year);
CREATE INDEX IF NOT EXISTS idx_cases_next_hearing ON public.cases(next_hearing_date);
CREATE INDEX IF NOT EXISTS idx_cases_limitation ON public.cases(limitation_date);
CREATE INDEX IF NOT EXISTS idx_cases_owner ON public.cases(owner_id);
CREATE INDEX IF NOT EXISTS idx_cases_archived ON public.cases(is_archived);

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_case_id ON public.tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_gdrive ON public.documents(gdrive_file_id);

-- Hearings
CREATE INDEX IF NOT EXISTS idx_hearings_case_id ON public.hearings(case_id);
CREATE INDEX IF NOT EXISTS idx_hearings_date ON public.hearings(hearing_date);
CREATE INDEX IF NOT EXISTS idx_hearings_status ON public.hearings(status);
CREATE INDEX IF NOT EXISTS idx_hearings_forum ON public.hearings(forum);

-- Case Activities
CREATE INDEX IF NOT EXISTS idx_activities_case_id ON public.case_activities(case_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON public.case_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.case_activities(activity_type);

-- Case Research
CREATE INDEX IF NOT EXISTS idx_case_research_case ON public.case_research(case_id);
CREATE INDEX IF NOT EXISTS idx_case_research_source ON public.case_research(source_id);

-- GDrive
CREATE INDEX IF NOT EXISTS idx_gdrive_uploads_folder ON public.gdrive_uploads(folder_type);
CREATE INDEX IF NOT EXISTS idx_gdrive_uploads_case ON public.gdrive_uploads(case_id);

-- Knowledge
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_gdrive ON public.knowledge_sources(gdrive_file_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_fragments_source ON public.knowledge_fragments(source_id);

-- Vector index for semantic search
CREATE INDEX IF NOT EXISTS idx_knowledge_fragments_embedding 
ON public.knowledge_fragments 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamps
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON public.cases
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hearings_updated_at
    BEFORE UPDATE ON public.hearings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_sources_updated_at
    BEFORE UPDATE ON public.knowledge_sources
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to create case activity on case changes
CREATE OR REPLACE FUNCTION public.log_case_activity()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER case_activity_trigger
    AFTER INSERT OR UPDATE ON public.cases
    FOR EACH ROW EXECUTE FUNCTION public.log_case_activity();

-- Function to match knowledge fragments (semantic search)
CREATE OR REPLACE FUNCTION public.match_knowledge_fragments(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.75,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    source_id UUID,
    gdrive_file_id VARCHAR(100),
    source_name VARCHAR(500),
    category VARCHAR(100),
    paragraph_num INTEGER,
    content TEXT,
    similarity FLOAT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kf.id,
        kf.source_id,
        ks.gdrive_file_id,
        ks.name as source_name,
        ks.category,
        kf.paragraph_num,
        kf.content,
        1 - (kf.embedding <=> query_embedding) as similarity,
        kf.created_at
    FROM public.knowledge_fragments kf
    JOIN public.knowledge_sources ks ON kf.source_id = ks.id
    WHERE 1 - (kf.embedding <=> query_embedding) > match_threshold
    ORDER BY kf.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to get upcoming deadlines
CREATE OR REPLACE FUNCTION public.get_upcoming_deadlines(days_ahead INT DEFAULT 14)
RETURNS TABLE (
    type VARCHAR,
    case_id UUID,
    client_name VARCHAR,
    assessment_year VARCHAR,
    deadline_date DATE,
    description TEXT,
    days_until INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;