import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Legal research knowledge base for RAG context
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

interface Citation {
  id: number;
  citation: string;
  paragraph?: number;
  snippet?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    systemPrompt += `\n\nIMPORTANT: When citing cases, use numbered references like [1], [2], etc. At the end of your response, list all citations with their full details.`;

    // Prepare messages for API call
    const apiMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    console.log(`Processing chat request with ${messages.length} messages in ${mode} mode`);

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

    // Stream the response back
    return new Response(response.body, {
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
