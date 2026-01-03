-- Enable pgvector extension FIRST
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum types for the application
CREATE TYPE public.case_stage AS ENUM ('assessment', 'cita', 'itat', 'closed');
CREATE TYPE public.case_status AS ENUM ('drafting', 'research', 'hearing', 'archived');
CREATE TYPE public.document_type AS ENUM ('memo', 'sof', 'goa', 'submission', 'reply', 'brief', 'toa');
CREATE TYPE public.citation_purpose AS ENUM ('support', 'distinguish', 'reference');

-- Create sources table (cached judgments from India Kanoon)
CREATE TABLE public.sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ik_doc_id VARCHAR(50) UNIQUE NOT NULL,
    citation VARCHAR(500) NOT NULL,
    title TEXT NOT NULL,
    court VARCHAR(200),
    bench TEXT,
    judgment_date DATE,
    full_text TEXT,
    headnote TEXT,
    sections_cited TEXT[],
    cached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create source fragments table for embeddings (RAG retrieval)
CREATE TABLE public.source_fragments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.sources(id) ON DELETE CASCADE NOT NULL,
    paragraph_num INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    token_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create research sessions table
CREATE TABLE public.research_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    context_tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.research_sessions(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    citations JSONB,
    confidence VARCHAR(20),
    model_used VARCHAR(50),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create search history table for audit
CREATE TABLE public.search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.research_sessions(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    filters JSONB,
    results_count INTEGER,
    source_ids UUID[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bookmarks table
CREATE TABLE public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.sources(id) ON DELETE CASCADE NOT NULL,
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(source_id)
);

-- Enable RLS on all tables
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_fragments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Create public read policies for sources (judgments are public data)
CREATE POLICY "Sources are publicly readable"
ON public.sources FOR SELECT
USING (true);

CREATE POLICY "Source fragments are publicly readable"
ON public.source_fragments FOR SELECT
USING (true);

-- Allow insert on sources for caching judgments
CREATE POLICY "Allow insert on sources"
ON public.sources FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow insert on source_fragments"
ON public.source_fragments FOR INSERT
WITH CHECK (true);

-- For now, allow all operations on session-based tables (will add auth later)
CREATE POLICY "Allow all on research_sessions"
ON public.research_sessions FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all on chat_messages"
ON public.chat_messages FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all on search_history"
ON public.search_history FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all on bookmarks"
ON public.bookmarks FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_sources_ik_doc_id ON public.sources(ik_doc_id);
CREATE INDEX idx_sources_citation ON public.sources(citation);
CREATE INDEX idx_source_fragments_source_id ON public.source_fragments(source_id);
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_search_history_session_id ON public.search_history(session_id);
CREATE INDEX idx_bookmarks_source_id ON public.bookmarks(source_id);

-- Create similarity search function
CREATE OR REPLACE FUNCTION public.match_source_fragments(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.78,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    source_id UUID,
    paragraph_num INTEGER,
    content TEXT,
    similarity FLOAT,
    citation VARCHAR(500),
    court VARCHAR(200)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        sf.id,
        sf.source_id,
        sf.paragraph_num,
        sf.content,
        1 - (sf.embedding <=> query_embedding) as similarity,
        s.citation,
        s.court
    FROM public.source_fragments sf
    JOIN public.sources s ON sf.source_id = s.id
    WHERE 1 - (sf.embedding <=> query_embedding) > match_threshold
    ORDER BY sf.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_sources_updated_at
    BEFORE UPDATE ON public.sources
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_research_sessions_updated_at
    BEFORE UPDATE ON public.research_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();