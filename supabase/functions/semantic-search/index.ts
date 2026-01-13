import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Authentication helper - validates JWT and returns user
async function authenticateRequest(req: Request): Promise<{ user: any; error: Response | null }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      user: null,
      error: new Response(
        JSON.stringify({ error: 'Unauthorized - Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return {
      user: null,
      error: new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  return { user: data.user, error: null };
}

interface SemanticSearchResult {
  id: string;
  sourceId: string;
  paragraphNum: number;
  content: string;
  similarity: number;
  citation: string;
  court: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateRequest(req);
    if (authError) {
      return authError;
    }

    console.log(`Authenticated user: ${user.email}`);

    const { query, matchThreshold = 0.75, matchCount = 10 } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate query length
    if (query.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Query exceeds maximum length of 2000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate matchCount and matchThreshold
    const safeMatchCount = Math.min(Math.max(1, matchCount), 100);
    const safeMatchThreshold = Math.min(Math.max(0, matchThreshold), 1);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials are not configured');
    }

    console.log(`Generating embedding for semantic search: "${query.substring(0, 50)}..."`);

    // Generate embedding for the query using OpenAI
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('OpenAI embedding error:', embeddingResponse.status, errorText);
      throw new Error(`Failed to generate embedding: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    console.log(`Embedding generated, searching ${safeMatchCount} matches with threshold ${safeMatchThreshold}`);

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Call the match_source_fragments function
    const { data: fragments, error: searchError } = await supabase.rpc('match_source_fragments', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: safeMatchThreshold,
      match_count: safeMatchCount,
    });

    if (searchError) {
      console.error('Semantic search error:', searchError);
      throw new Error(`Semantic search failed: ${searchError.message}`);
    }

    console.log(`Found ${fragments?.length || 0} matching fragments`);

    // Transform results
    const results: SemanticSearchResult[] = (fragments || []).map((f: any) => ({
      id: f.id,
      sourceId: f.source_id,
      paragraphNum: f.paragraph_num,
      content: f.content,
      similarity: Math.round(f.similarity * 100),
      citation: f.citation,
      court: f.court || 'Unknown',
    }));

    // Group by source and pick best fragment per source
    const sourceMap = new Map<string, SemanticSearchResult>();
    for (const result of results) {
      const existing = sourceMap.get(result.sourceId);
      if (!existing || result.similarity > existing.similarity) {
        sourceMap.set(result.sourceId, result);
      }
    }

    const groupedResults = Array.from(sourceMap.values()).sort((a, b) => b.similarity - a.similarity);

    return new Response(
      JSON.stringify({
        query,
        results: groupedResults,
        allFragments: results,
        totalResults: groupedResults.length,
        attribution: "Semantic search powered by OpenAI embeddings"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Semantic search error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Semantic search failed',
        results: [],
        totalResults: 0
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
