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

// Legal research knowledge base
const LEGAL_CONTEXT = `
You are a legal research assistant specialized in Indian tax law and litigation. You help legal professionals research case law, analyze judgments, and prepare litigation documents.

KEY PRINCIPLES:
1. Always cite specific judgments with proper citations
2. Use formal legal language appropriate for tribunal/court submissions
3. Distinguish between binding precedents (SC) and persuasive authorities (HC/ITAT)
4. Highlight the ratio decidendi of each cited case
5. Note any conflicting precedents and how to distinguish them

COMMON SECTIONS AND THEIR CONTEXT:
- Section 68: Cash Credits - Addition for unexplained credits
- Section 69: Unexplained investments
- Section 69A: Unexplained money
- Section 69C: Unexplained expenditure
- Section 40A(3): Cash payments exceeding prescribed limit
- Section 148/148A: Reassessment proceedings
- Section 263: Revision by CIT
- Section 154: Rectification of mistakes
- Section 271(1)(c)/270A: Penalty for concealment/misreporting

CITATION FORMAT:
Use proper Indian legal citation format: Party Name [Year] Volume Reporter Page (Court)
Example: CIT vs. Lovely Exports (P) Ltd [2008] 216 CTR 195 (SC)
`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RAGFragment {
  citation: string;
  court: string;
  content: string;
  similarity: number;
  paragraphNum: number;
  sourceId: string;
}

// Retrieve relevant fragments using semantic search
async function retrieveRAGContext(query: string): Promise<RAGFragment[]> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log('RAG context skipped: missing credentials');
    return [];
  }

  try {
    console.log(`Generating embedding for RAG: "${query.substring(0, 50)}..."`);

    // Generate embedding for the query
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
      console.error('Failed to generate embedding for RAG');
      return [];
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Search for similar fragments
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: fragments, error } = await supabase.rpc('match_source_fragments', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.70,
      match_count: 8,
    });

    if (error) {
      console.error('RAG search error:', error);
      return [];
    }

    console.log(`RAG retrieved ${fragments?.length || 0} relevant fragments`);

    return (fragments || []).map((f: any) => ({
      citation: f.citation,
      court: f.court || 'Unknown',
      content: f.content,
      similarity: f.similarity,
      paragraphNum: f.paragraph_num,
      sourceId: f.source_id,
    }));

  } catch (error) {
    console.error('RAG retrieval error:', error);
    return [];
  }
}

// Format RAG context for the prompt
function formatRAGContext(fragments: RAGFragment[]): string {
  if (fragments.length === 0) {
    return '';
  }

  let context = '\n\n--- RELEVANT LEGAL SOURCES FROM DATABASE ---\n';
  context += 'The following are relevant excerpts from legal judgments that may be helpful:\n\n';

  fragments.forEach((fragment, index) => {
    const truncatedContent = fragment.content.length > 800 
      ? fragment.content.substring(0, 800) + '...' 
      : fragment.content;
    
    context += `[${index + 1}] ${fragment.citation} (${fragment.court})\n`;
    context += `Relevance: ${Math.round(fragment.similarity * 100)}%\n`;
    context += `"${truncatedContent}"\n\n`;
  });

  context += '--- END OF SOURCES ---\n';
  context += '\nIMPORTANT: Use these sources to support your response. Cite them using [1], [2], etc. ';
  context += 'If these sources are relevant, prioritize them. You may also cite additional cases from your knowledge.\n';

  return context;
}

// Create a streaming response that includes RAG sources as first event
function createRAGStreamResponse(ragFragments: RAGFragment[], aiStream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  
  return new ReadableStream({
    async start(controller) {
      // Send RAG sources as first SSE event
      if (ragFragments.length > 0) {
        const ragEvent = `data: ${JSON.stringify({ 
          type: 'rag_sources', 
          sources: ragFragments.map((f, i) => ({
            id: i + 1,
            citation: f.citation,
            court: f.court,
            content: f.content.substring(0, 500) + (f.content.length > 500 ? '...' : ''),
            similarity: Math.round(f.similarity * 100),
            sourceId: f.sourceId,
          }))
        })}\n\n`;
        controller.enqueue(encoder.encode(ragEvent));
      }

      // Forward the AI stream
      const reader = aiStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } finally {
        reader.releaseLock();
        controller.close();
      }
    }
  });
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

    const { messages, mode = 'balanced', sessionId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Extract the last user message for RAG retrieval
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const userQuery = lastUserMessage?.content || '';

    // Retrieve relevant context using semantic search
    console.log('Retrieving RAG context...');
    const ragFragments = await retrieveRAGContext(userQuery);
    const ragContext = formatRAGContext(ragFragments);

    // Build system prompt based on mode
    let systemPrompt = LEGAL_CONTEXT;
    
    switch (mode) {
      case 'sources-only':
        systemPrompt += `\n\nMODE: Sources Only - Focus exclusively on citing relevant judgments with minimal analysis. List cases with their ratios.`;
        break;
      case 'balanced':
        systemPrompt += `\n\nMODE: Balanced - Provide thorough analysis with citations. Explain legal principles and their application.`;
        break;
      case 'creative':
        systemPrompt += `\n\nMODE: Creative - Suggest novel legal arguments and analogies. Consider different interpretive approaches.`;
        break;
      case 'tribunal':
        systemPrompt += `\n\nMODE: Tribunal Ready - Format response as if for tribunal submissions. Use formal language, numbered paragraphs, and precise legal terminology.`;
        break;
    }

    // Add RAG context to system prompt
    systemPrompt += ragContext;

    systemPrompt += `\n\nCITATION INSTRUCTIONS: When citing cases, use numbered references like [1], [2], etc. At the end of your response, list all citations with their full details in a "Sources:" section.`;

    // Prepare messages for API call
    const apiMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    console.log(`Processing chat with ${messages.length} messages, ${ragFragments.length} RAG sources, mode: ${mode}`);

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Usage limit reached. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    // Create combined stream with RAG sources
    const combinedStream = createRAGStreamResponse(ragFragments, response.body!);

    // Stream the response back
    return new Response(combinedStream, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
    });

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Chat failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
